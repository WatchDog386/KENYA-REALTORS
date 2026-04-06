-- ============================================================================
-- FIX: PROFILES ROLE CHECK CONSTRAINT
-- Date: February 12, 2026
-- Issue: Check constraint "profiles_role_check" doesn't allow new roles
--        (proprietor, technician, caretaker, accountant)
-- ============================================================================

BEGIN;

-- Drop the old restrictive check constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint that allows all roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'technician', 'proprietor', 'caretaker', 'accountant'));

COMMIT;

SELECT '✅ Check constraint updated to allow all roles' as status;
