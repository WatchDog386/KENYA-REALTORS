-- Clean Slate Migration: Reset Database for New User Assignment Flow
-- This migration:
-- 1. Clears test data while preserving super admin
-- 2. Sets up the new user assignment flow
-- 3. Makes duncanmarshel@gmail.com the super admin
-- 4. Resets all fields to defaults

-- Step 1: Identify and set up super admin
-- First, check if duncanmarshel@gmail.com exists in auth.users
-- If not, you'll need to create it manually in Supabase Auth UI

-- Step 2: Update profiles for the super admin user
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    last_sign_in_at = NOW()
WHERE email = 'duncanmarshel@gmail.com';

-- Step 3: Update or insert profile for super admin
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name,
  role, 
  status, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  id, 
  email, 
  'Duncan', 
  'Marshel',
  'super_admin'::text, 
  'active'::text, 
  true, 
  NOW(), 
  NOW()
FROM auth.users 
WHERE email = 'duncanmarshel@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  is_active = true,
  first_name = 'Duncan',
  last_name = 'Marshel',
  updated_at = NOW();

-- Step 4: Clear all pending approval records
DELETE FROM public.tenant_approvals;
DELETE FROM public.manager_approvals;

-- Step 5: Clear all old assignments
DELETE FROM public.manager_assignments 
WHERE manager_id NOT IN (
  SELECT id FROM public.profiles WHERE role = 'super_admin'
);

-- Step 6: Clear test data from profiles (keep super admin)
DELETE FROM public.profiles 
WHERE role != 'super_admin' OR role IS NULL;

-- Step 7: Reset units to vacant state
UPDATE public.units_detailed 
SET occupant_id = NULL, status = 'vacant'::character varying;

-- Step 8: Clear tenant data
DELETE FROM public.tenant_properties;
DELETE FROM public.tenants;

-- Step 9: Clear test leases
DELETE FROM public.leases;

-- Step 10: Clear old notifications
DELETE FROM public.notifications;

-- Step 11: Create an unassigned users view for super admin dashboard
-- This view shows all pending users that need assignment
CREATE OR REPLACE VIEW unassigned_users_view AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.phone,
  p.user_type as account_type,  -- What they signed up as
  p.status,
  p.created_at,
  NULL::uuid as assigned_by,
  NULL::timestamp as assigned_at
FROM public.profiles p
WHERE p.role IS NULL 
  AND p.status = 'pending'
  AND p.role != 'super_admin'
ORDER BY p.created_at DESC;

-- Step 12: Verify the super admin is set up correctly
SELECT 
  'Super Admin Setup Status' as check_name,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK'
    ELSE 'ERROR'
  END as status,
  COUNT(*) as super_admin_count
FROM public.profiles
WHERE email = 'duncanmarshel@gmail.com'
  AND role = 'super_admin'
  AND status = 'active';

-- Step 13: Log the cleanup
INSERT INTO public.audit_logs (
  user_id,
  action,
  entity_type,
  entity_id,
  details
)
VALUES (
  (SELECT id FROM public.profiles WHERE email = 'duncanmarshel@gmail.com' LIMIT 1),
  'CLEAN_SLATE_MIGRATION',
  'system',
  NULL,
  jsonb_build_object(
    'migration', 'Clean Slate - User Assignment Flow',
    'super_admin', 'duncanmarshel@gmail.com',
    'action', 'Reset database for new assignment workflow'
  )
);

-- Commit and verify
COMMIT;

-- Verification queries (run separately if needed):
-- SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin';
-- SELECT * FROM public.profiles WHERE email = 'duncanmarshel@gmail.com';
-- SELECT COUNT(*) FROM unassigned_users_view;
