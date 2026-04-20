-- EMERGENCY ROLE RESTORE SCRIPT
-- Purpose: Recover role/user_type values after unintended mass role changes.
-- Safety features:
--  1) Takes a full snapshot of current role data
--  2) Rebuilds roles from role-specific tables first
--  3) Falls back to auth metadata, then tenant
--  4) Logs every changed profile for audit

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Persistent audit table (created once)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles_role_restore_log (
  id BIGSERIAL PRIMARY KEY,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  profile_id UUID NOT NULL,
  old_role TEXT,
  old_user_type TEXT,
  new_role TEXT,
  new_user_type TEXT,
  source TEXT,
  note TEXT
);

-- ---------------------------------------------------------------------------
-- 1) Snapshot current role state for this run
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE tmp_profiles_before_restore AS
SELECT
  p.id AS profile_id,
  p.email,
  p.role AS old_role,
  p.user_type AS old_user_type
FROM public.profiles p;

-- ---------------------------------------------------------------------------
-- 2) Build candidate roles with priorities
-- Higher priority wins. If a candidate violates current DB check constraints,
-- the script automatically tries the next candidate.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE tmp_role_candidates (
  profile_id UUID NOT NULL,
  candidate_role TEXT NOT NULL,
  priority INTEGER NOT NULL,
  source TEXT NOT NULL
);

-- Keep current role as a low-priority fallback
INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
SELECT p.id, lower(p.role), 10, 'current_profile_role'
FROM public.profiles p
WHERE p.role IS NOT NULL AND p.role <> '';

-- Metadata-derived role fallback
INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
SELECT
  p.id,
  CASE
    WHEN normalized_role = 'manager' THEN 'property_manager'
    WHEN normalized_role = 'admin' THEN 'super_admin'
    ELSE normalized_role
  END AS candidate_role,
  40 AS priority,
  'auth_metadata'
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
CROSS JOIN LATERAL (
  SELECT lower(
    COALESCE(
      NULLIF(trim(au.raw_user_meta_data->>'role'), ''),
      NULLIF(trim(au.raw_user_meta_data->>'user_type'), ''),
      NULLIF(trim(au.raw_user_meta_data->>'account_type'), ''),
      ''
    )
  ) AS normalized_role
) md
WHERE md.normalized_role <> '';

-- Strongest candidates from role tables (if they exist)
DO $$
BEGIN
  IF to_regclass('public.property_managers') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT pm.user_id, ''property_manager'', 100, ''property_managers_table''
      FROM public.property_managers pm
      WHERE pm.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.property_manager_assignments') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT pma.property_manager_id, ''property_manager'', 95, ''property_manager_assignments_table''
      FROM public.property_manager_assignments pma
      WHERE pma.property_manager_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.technicians') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT t.user_id, ''technician'', 90, ''technicians_table''
      FROM public.technicians t
      WHERE t.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.proprietors') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT pr.user_id, ''proprietor'', 90, ''proprietors_table''
      FROM public.proprietors pr
      WHERE pr.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.caretakers') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT c.user_id, ''caretaker'', 90, ''caretakers_table''
      FROM public.caretakers c
      WHERE c.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.accountants') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT a.user_id, ''accountant'', 90, ''accountants_table''
      FROM public.accountants a
      WHERE a.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.suppliers') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT s.user_id, ''supplier'', 90, ''suppliers_table''
      FROM public.suppliers s
      WHERE s.user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
      SELECT DISTINCT t.user_id, ''tenant'', 70, ''tenants_table''
      FROM public.tenants t
      WHERE t.user_id IS NOT NULL
    ';
  END IF;
END
$$;

-- Hard fallback for any profile with no candidates
INSERT INTO tmp_role_candidates (profile_id, candidate_role, priority, source)
SELECT p.id, 'tenant', 1, 'hard_fallback_tenant'
FROM public.profiles p
LEFT JOIN (
  SELECT DISTINCT profile_id FROM tmp_role_candidates
) c ON c.profile_id = p.id
WHERE c.profile_id IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Apply best valid candidate per profile
-- If a candidate fails role check constraints, try the next one.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE tmp_role_restore_result (
  profile_id UUID,
  applied_role TEXT,
  applied_source TEXT,
  note TEXT
);

DO $$
DECLARE
  v_profile_id UUID;
  v_applied BOOLEAN;
  v_role TEXT;
  v_source TEXT;
  v_note TEXT;
  rec RECORD;
BEGIN
  FOR v_profile_id IN
    SELECT DISTINCT profile_id FROM tmp_role_candidates
  LOOP
    v_applied := FALSE;
    v_role := NULL;
    v_source := NULL;
    v_note := NULL;

    FOR rec IN
      SELECT candidate_role, source
      FROM tmp_role_candidates
      WHERE profile_id = v_profile_id
      ORDER BY priority DESC
    LOOP
      BEGIN
        UPDATE public.profiles
        SET
          role = rec.candidate_role,
          user_type = rec.candidate_role
        WHERE id = v_profile_id;

        v_applied := TRUE;
        v_role := rec.candidate_role;
        v_source := rec.source;
        EXIT;
      EXCEPTION
        WHEN check_violation THEN
          -- Candidate not allowed by current role check constraint.
          CONTINUE;
      END;
    END LOOP;

    IF NOT v_applied THEN
      v_note := 'No candidate passed current role check constraints';
    END IF;

    INSERT INTO tmp_role_restore_result (profile_id, applied_role, applied_source, note)
    VALUES (v_profile_id, v_role, v_source, v_note);
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 4) Persist change log for this run
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles_role_restore_log (
  profile_id,
  old_role,
  old_user_type,
  new_role,
  new_user_type,
  source,
  note
)
SELECT
  b.profile_id,
  b.old_role,
  b.old_user_type,
  p.role,
  p.user_type,
  r.applied_source,
  r.note
FROM tmp_profiles_before_restore b
JOIN public.profiles p ON p.id = b.profile_id
LEFT JOIN tmp_role_restore_result r ON r.profile_id = b.profile_id
WHERE b.old_role IS DISTINCT FROM p.role
   OR b.old_user_type IS DISTINCT FROM p.user_type;

-- ---------------------------------------------------------------------------
-- 5) Output summary in SQL editor
-- ---------------------------------------------------------------------------
SELECT
  COUNT(*) AS changed_profiles
FROM public.profiles_role_restore_log
WHERE run_at >= NOW() - INTERVAL '10 minutes';

SELECT
  new_role,
  COUNT(*) AS changed_count
FROM public.profiles_role_restore_log
WHERE run_at >= NOW() - INTERVAL '10 minutes'
GROUP BY new_role
ORDER BY changed_count DESC, new_role;

SELECT
  l.profile_id,
  p.email,
  l.old_role,
  l.new_role,
  l.source,
  l.note
FROM public.profiles_role_restore_log l
JOIN public.profiles p ON p.id = l.profile_id
WHERE l.run_at >= NOW() - INTERVAL '10 minutes'
ORDER BY l.id DESC
LIMIT 200;

COMMIT;
