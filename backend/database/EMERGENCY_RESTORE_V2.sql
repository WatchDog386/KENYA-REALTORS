-- EMERGENCY RESTORE V2: Fully Schema-Aware
-- Run this in your Supabase SQL Editor.
-- This uses the exact tables you provided (including user_roles and manager_assignments) 
-- to put everyone's role back exactly where it belongs.

BEGIN;

CREATE TEMP TABLE tmp_role_candidates_v2 (
  profile_id UUID NOT NULL,
  candidate_role TEXT NOT NULL,
  priority INTEGER NOT NULL,
  source TEXT NOT NULL
);

-- 1. HIGHEST PRIORITY: If you used the `user_roles` and `roles` tables
DO $$
BEGIN
  IF to_regclass('public.user_roles') IS NOT NULL AND to_regclass('public.roles') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
      SELECT ur.user_id, lower(r.name), 200, ''user_roles_table''
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id IS NOT NULL AND r.name IS NOT NULL
    ';
  END IF;
END
$$;

-- 2. HIGH PRIORITY: Role-specific assignment tables from your schema

-- Accountants
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT user_id, 'accountant', 100, 'accountants_table' 
FROM public.accountants WHERE user_id IS NOT NULL;

-- Caretakers
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT user_id, 'caretaker', 100, 'caretakers_table' 
FROM public.caretakers WHERE user_id IS NOT NULL;

-- Technicians
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT user_id, 'technician', 100, 'technicians_table' 
FROM public.technicians WHERE user_id IS NOT NULL;

-- Proprietors
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT user_id, 'proprietor', 100, 'proprietors_table' 
FROM public.proprietors WHERE user_id IS NOT NULL;

-- Property Managers (from property_manager_assignments)
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT property_manager_id, 'property_manager', 100, 'property_manager_assignments_table' 
FROM public.property_manager_assignments WHERE property_manager_id IS NOT NULL;

-- Property Managers (from manager_assignments)
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT manager_id, 'property_manager', 95, 'manager_assignments_table' 
FROM public.manager_assignments WHERE manager_id IS NOT NULL;

-- Tenants
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT user_id, 'tenant', 80, 'tenants_table' 
FROM public.tenants WHERE user_id IS NOT NULL;

-- 3. MEDIUM PRIORITY: Original roles from before the FIRST emergency script ran (if logged)
DO $$
BEGIN
  IF to_regclass('public.profiles_role_restore_log') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
      SELECT profile_id, old_role, 70, ''previous_backup_log''
      FROM public.profiles_role_restore_log
      WHERE old_role IS NOT NULL AND old_role != ''tenant''
    ';
  END IF;
END
$$;

-- 4. LOW PRIORITY: Auth User Metadata
INSERT INTO tmp_role_candidates_v2 (profile_id, candidate_role, priority, source)
SELECT 
  p.id, 
  CASE 
    WHEN md.normalized_role = 'manager' THEN 'property_manager'
    WHEN md.normalized_role = 'admin' THEN 'super_admin'
    ELSE md.normalized_role
  END,
  50, 
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


-- NOW, APPLY THE HIGHEST PRIORITY VALID ROLE TO EACH PROFILE
DO $$
DECLARE
  v_profile_id UUID;
  rec RECORD;
  v_applied BOOLEAN;
BEGIN
  FOR v_profile_id IN SELECT DISTINCT profile_id FROM tmp_role_candidates_v2 LOOP
    v_applied := FALSE;
    
    FOR rec IN 
      SELECT candidate_role, source 
      FROM tmp_role_candidates_v2 
      WHERE profile_id = v_profile_id 
      ORDER BY priority DESC 
    LOOP
      BEGIN
        -- Some roles from old logs/tables might need mapping (e.g. 'admin' -> 'super_admin')
        IF rec.candidate_role = 'admin' THEN rec.candidate_role := 'super_admin'; END IF;
        IF rec.candidate_role = 'manager' THEN rec.candidate_role := 'property_manager'; END IF;

        UPDATE public.profiles 
        SET 
          role = rec.candidate_role, 
          user_type = rec.candidate_role 
        WHERE id = v_profile_id 
          AND (role != rec.candidate_role OR user_type != rec.candidate_role);
          
        v_applied := TRUE;
        EXIT; -- Stop at the highest priority successful apply
      EXCEPTION WHEN check_violation THEN
        CONTINUE; -- Try next candidate if check constraint fails
      END;
    END LOOP;
  END LOOP;
END
$$;

-- PRINT RECOVERY SUMMARY
SELECT role, COUNT(*) AS total_users
FROM public.profiles
GROUP BY role
ORDER BY total_users DESC;

COMMIT;
