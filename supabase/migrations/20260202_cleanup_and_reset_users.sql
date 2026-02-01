-- ============================================================================
-- CLEANUP AND RESET: Delete All Users Except SuperAdmin
-- Date: February 2, 2026
-- Purpose: Clean slate for testing - keeps only superadmin, deletes all other users
-- WARNING: This is a destructive operation. All non-superadmin users will be deleted
-- ============================================================================

-- Step 1: Get superadmin user ID(s) for reference
CREATE TEMP TABLE temp_superadmins AS
SELECT DISTINCT p.id
FROM public.profiles p
WHERE p.role = 'super_admin';

-- Display superadmins being preserved
SELECT 'PRESERVED SUPERADMIN USERS:' as info;
SELECT id, email, role FROM public.profiles WHERE id IN (SELECT id FROM temp_superadmins);

-- Step 2: Delete all dependent records BEFORE deleting profiles
-- This prevents foreign key constraint violations
-- All delete operations are wrapped in error handling for tables that may not exist

-- Delete notifications
DO $$ BEGIN
  DELETE FROM public.notifications
  WHERE recipient_id NOT IN (SELECT id FROM temp_superadmins)
     OR sender_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table notifications does not exist, skipping...';
END $$;

-- Delete messages
DO $$ BEGIN
  DELETE FROM public.messages
  WHERE sender_id NOT IN (SELECT id FROM temp_superadmins)
     OR receiver_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table messages does not exist, skipping...';
END $$;

-- Delete manager approvals
DO $$ BEGIN
  DELETE FROM public.manager_approvals
  WHERE manager_id NOT IN (SELECT id FROM temp_superadmins)
     OR approved_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table manager_approvals does not exist, skipping...';
END $$;

-- Delete tenant verifications
DO $$ BEGIN
  DELETE FROM public.tenant_verifications
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
     OR verified_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenant_verifications does not exist, skipping...';
END $$;

-- Clear occupant references in units_detailed
DO $$ BEGIN
  UPDATE public.units_detailed
  SET occupant_id = NULL
  WHERE occupant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table units_detailed does not exist, skipping...';
END $$;

-- Delete maintenance requests (has tenant_id, reported_by, assigned_to)
DO $$ BEGIN
  DELETE FROM public.maintenance_requests
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
     OR reported_by NOT IN (SELECT id FROM temp_superadmins)
     OR assigned_to NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table maintenance_requests does not exist, skipping...';
END $$;

-- Delete manager assignments
DO $$ BEGIN
  DELETE FROM public.manager_assignments
  WHERE manager_id NOT IN (SELECT id FROM temp_superadmins)
     OR assigned_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table manager_assignments does not exist, skipping...';
END $$;

-- Delete vacation notices (via leases)
DO $$ BEGIN
  DELETE FROM public.vacation_notices
  WHERE lease_id IN (
    SELECT id FROM public.leases 
    WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
  );
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table vacation_notices does not exist, skipping...';
END $$;

-- Delete leases
DO $$ BEGIN
  DELETE FROM public.leases
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table leases does not exist, skipping...';
END $$;

-- Delete rent payments
DO $$ BEGIN
  DELETE FROM public.rent_payments
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table rent_payments does not exist, skipping...';
END $$;

-- Delete payments
DO $$ BEGIN
  DELETE FROM public.payments
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
     OR received_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table payments does not exist, skipping...';
END $$;

-- Delete deposit refunds
DO $$ BEGIN
  DELETE FROM public.deposit_refunds
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
     OR approved_by_manager NOT IN (SELECT id FROM temp_superadmins)
     OR approved_by_admin NOT IN (SELECT id FROM temp_superadmins)
     OR reviewed_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table deposit_refunds does not exist, skipping...';
END $$;

-- Delete approval requests
DO $$ BEGIN
  DELETE FROM public.approval_requests
  WHERE submitted_by NOT IN (SELECT id FROM temp_superadmins)
     OR reviewed_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table approval_requests does not exist, skipping...';
END $$;

-- Delete approval queue
DO $$ BEGIN
  DELETE FROM public.approval_queue
  WHERE requested_by NOT IN (SELECT id FROM temp_superadmins)
     OR reviewed_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table approval_queue does not exist, skipping...';
END $$;

-- Delete approvals
DO $$ BEGIN
  DELETE FROM public.approvals
  WHERE requested_by NOT IN (SELECT id FROM temp_superadmins)
     OR reviewed_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table approvals does not exist, skipping...';
END $$;

-- Delete tenant documents
DO $$ BEGIN
  DELETE FROM public.tenant_documents
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenant_documents does not exist, skipping...';
END $$;

-- Delete tenant events
DO $$ BEGIN
  DELETE FROM public.tenant_events
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenant_events does not exist, skipping...';
END $$;

-- Delete tenant properties
DO $$ BEGIN
  DELETE FROM public.tenant_properties
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenant_properties does not exist, skipping...';
END $$;

-- Delete tenant settings
DO $$ BEGIN
  DELETE FROM public.tenant_settings
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenant_settings does not exist, skipping...';
END $$;

-- Delete tenants
DO $$ BEGIN
  DELETE FROM public.tenants
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table tenants does not exist, skipping...';
END $$;

-- Delete emergency contacts
DO $$ BEGIN
  DELETE FROM public.emergency_contacts
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table emergency_contacts does not exist, skipping...';
END $$;

-- Delete support tickets
DO $$ BEGIN
  DELETE FROM public.support_tickets
  WHERE tenant_id NOT IN (SELECT id FROM temp_superadmins)
     OR assigned_to NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table support_tickets does not exist, skipping...';
END $$;

-- Delete announcements
DO $$ BEGIN
  DELETE FROM public.announcements
  WHERE created_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table announcements does not exist, skipping...';
END $$;

-- Delete property managers
DO $$ BEGIN
  DELETE FROM public.property_managers
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table property_managers does not exist, skipping...';
END $$;

-- Delete user roles
DO $$ BEGIN
  DELETE FROM public.user_roles
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins)
     OR assigned_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table user_roles does not exist, skipping...';
END $$;

-- Delete user preferences
DO $$ BEGIN
  DELETE FROM public.user_preferences
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table user_preferences does not exist, skipping...';
END $$;

-- Delete user profiles
DO $$ BEGIN
  DELETE FROM public.user_profiles
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table user_profiles does not exist, skipping...';
END $$;

-- Delete audit logs
DO $$ BEGIN
  DELETE FROM public.audit_logs
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table audit_logs does not exist, skipping...';
END $$;

-- Delete security logs
DO $$ BEGIN
  DELETE FROM public.security_logs
  WHERE user_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table security_logs does not exist, skipping...';
END $$;

-- Step 3: Clear foreign key references in properties table
DO $$ BEGIN
  UPDATE public.properties
  SET property_manager_id = NULL,
      manager_id = NULL,
      owner_id = NULL
  WHERE property_manager_id NOT IN (SELECT id FROM temp_superadmins)
     OR manager_id NOT IN (SELECT id FROM temp_superadmins)
     OR owner_id NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Table properties does not exist, skipping...';
END $$;

-- Clear foreign key references in profiles table
DO $$ BEGIN
  UPDATE public.profiles
  SET created_by = NULL,
      property_id = NULL,
      unit_id = NULL
  WHERE created_by NOT IN (SELECT id FROM temp_superadmins);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Problem updating profiles foreign keys, continuing...';
END $$;

-- Step 4: Now safe to delete non-superadmin profiles
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM temp_superadmins)
AND role != 'super_admin';

-- Step 5: Display remaining users (should only be superadmins)
SELECT 'REMAINING USERS IN SYSTEM:' as info;
SELECT COUNT(*) as remaining_users FROM public.profiles;
SELECT id, email, role FROM public.profiles ORDER BY created_at DESC;

-- Step 6: Clear temp table
DROP TABLE temp_superadmins;

SELECT 'Database cleanup complete. Superadmin(s) preserved. All non-admin users and their data removed.' as status;

-- ============================================================================
-- IMPORTANT MANUAL STEPS IN SUPABASE DASHBOARD:
-- ============================================================================
-- 1. Go to Authentication > Users
-- 2. Delete all users EXCEPT the superadmin (identified by email or role)
-- 3. This ensures auth.users and profiles stay in sync
-- 4. Clear browser localStorage/sessionStorage to force logout on client
-- ============================================================================
