-- ROLE RESTORE VERIFICATION
-- Run after EMERGENCY_RESTORE_USER_ROLES.sql

-- 1) Current profile role distribution
SELECT role, COUNT(*) AS total
FROM public.profiles
GROUP BY role
ORDER BY total DESC, role;

-- 2) Users in role tables but profile role mismatch (if tables exist)
DO $$
BEGIN
  IF to_regclass('public.technicians') IS NOT NULL THEN
    RAISE NOTICE 'Mismatch check: technicians';
  END IF;
END
$$;

SELECT 'technicians' AS source_table, t.user_id AS profile_id, p.email, p.role
FROM public.technicians t
JOIN public.profiles p ON p.id = t.user_id
WHERE p.role <> 'technician'
UNION ALL
SELECT 'proprietors' AS source_table, pr.user_id AS profile_id, p.email, p.role
FROM public.proprietors pr
JOIN public.profiles p ON p.id = pr.user_id
WHERE p.role <> 'proprietor'
UNION ALL
SELECT 'caretakers' AS source_table, c.user_id AS profile_id, p.email, p.role
FROM public.caretakers c
JOIN public.profiles p ON p.id = c.user_id
WHERE p.role <> 'caretaker'
UNION ALL
SELECT 'accountants' AS source_table, a.user_id AS profile_id, p.email, p.role
FROM public.accountants a
JOIN public.profiles p ON p.id = a.user_id
WHERE p.role <> 'accountant'
UNION ALL
SELECT 'property_manager_assignments' AS source_table, pma.property_manager_id AS profile_id, p.email, p.role
FROM public.property_manager_assignments pma
JOIN public.profiles p ON p.id = pma.property_manager_id
WHERE p.role <> 'property_manager'
UNION ALL
SELECT 'tenants' AS source_table, t.user_id AS profile_id, p.email, p.role
FROM public.tenants t
JOIN public.profiles p ON p.id = t.user_id
WHERE p.role <> 'tenant'
ORDER BY source_table, email;

-- 3) Recent restore logs
SELECT run_at, profile_id, old_role, new_role, source, note
FROM public.profiles_role_restore_log
ORDER BY id DESC
LIMIT 200;
