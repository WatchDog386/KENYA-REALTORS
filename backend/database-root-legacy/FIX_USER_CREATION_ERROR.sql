-- ============================================================================
-- COMPREHENSIVE FIX: USER CREATION ERROR (Database error saving new user)
-- ============================================================================
-- Error ID: 4a16-ba5b-b76fb0295e7e
-- Issue: When creating users with roles (technician, caretaker, accountant, proprietor),
--        the trigger fails because role-specific tables have NOT NULL constraints
--        on fields that aren't provided during signup (e.g., category_id, property_id, assigned_by)
--
-- Solution:
--   1. Drop NOT NULL constraints on optional fields in role-specific tables
--   2. Add error handling to the trigger to prevent auth.users insert from failing
--   3. Ensure all role tables have required columns
--
-- Run this in: Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: ADD MISSING COLUMNS (if they don't exist yet)
-- ==============================================================================

-- Add assigned_by to proprietors if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proprietors' AND column_name = 'assigned_by') THEN
        ALTER TABLE public.proprietors ADD COLUMN assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- STEP 2: DROP NOT NULL CONSTRAINTS ON OPTIONAL FIELDS
-- ==============================================================================

-- Technicians: category_id is optional (assigned later)
ALTER TABLE public.technicians ALTER COLUMN category_id DROP NOT NULL;

-- Caretakers: property_id and manager assignments are optional
ALTER TABLE public.caretakers ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN property_manager_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN assigned_by DROP NOT NULL;

-- Accountants: assigned_by is optional, employee fields are optional
ALTER TABLE public.accountants ALTER COLUMN assigned_by DROP NOT NULL;
ALTER TABLE public.accountants ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE public.accountants ALTER COLUMN hire_date DROP NOT NULL;

-- Proprietors: assigned_by is optional
ALTER TABLE public.proprietors ALTER COLUMN assigned_by DROP NOT NULL;

-- ==============================================================================
-- STEP 3: UPDATE TRIGGER WITH ERROR HANDLING
-- ==============================================================================
-- This trigger creates role-specific records but gracefully handles errors
-- to prevent the entire user creation from failing

DROP FUNCTION IF EXISTS public.create_role_specific_record() CASCADE;

CREATE OR REPLACE FUNCTION public.create_role_specific_record()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin_id UUID;
BEGIN
  -- Get the current authenticated user (if available)
  current_admin_id := auth.uid();
  
  -- Only process if role is set
  IF NEW.role IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Logic for INSERT or UPDATE where role is set/changed
  IF (TG_OP = 'INSERT' AND NEW.role IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NEW.role IS NOT NULL) THEN
     
    -- Delete existing role-specific records if switching roles (only for UPDATE)
    IF TG_OP = 'UPDATE' THEN
      BEGIN
        DELETE FROM accountants WHERE user_id = NEW.id;
        DELETE FROM technicians WHERE user_id = NEW.id;
        DELETE FROM proprietors WHERE user_id = NEW.id;
        DELETE FROM caretakers WHERE user_id = NEW.id;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Warning: Could not delete old role records for user %: %', NEW.id, SQLERRM;
      END;
    END IF;

    -- Create new role-specific record based on role
    BEGIN
      CASE NEW.role
        WHEN 'accountant' THEN
          INSERT INTO accountants (user_id, assigned_by, status, transactions_processed)
          VALUES (NEW.id, current_admin_id, 'active', 0)
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            updated_at = NOW();

        WHEN 'technician' THEN
          INSERT INTO technicians (user_id, status, is_available, total_jobs_completed)
          VALUES (NEW.id, 'active', true, 0)
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            is_available = true,
            updated_at = NOW();

        WHEN 'proprietor' THEN
          INSERT INTO proprietors (user_id, assigned_by, status)
          VALUES (NEW.id, current_admin_id, 'active')
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            updated_at = NOW();

        WHEN 'caretaker' THEN
          INSERT INTO caretakers (user_id, assigned_by, status)
          VALUES (NEW.id, current_admin_id, 'active')
          ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            updated_at = NOW();
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the entire user creation
      RAISE NOTICE 'Error creating role-specific record for user % with role %: %', NEW.id, NEW.role, SQLERRM;
      -- Continue anyway - the record can be created manually later
    END;
  END IF;

  RETURN NEW;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_role_specific_record ON profiles;

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_create_role_specific_record
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_role_specific_record();

-- ==============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ==============================================================================
-- Run these to confirm the fix is working:

-- Check NOT NULL constraints have been dropped
SELECT 
  column_name, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('technicians', 'caretakers', 'accountants', 'proprietors')
AND column_name IN ('category_id', 'property_id', 'property_manager_id', 'assigned_by', 'employee_id', 'hire_date')
ORDER BY table_name, column_name;

-- Verify trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_role_specific_record';

COMMIT;

SELECT '✅ User creation fix applied successfully! You can now create users with all roles.' as status;

-- ==============================================================================
-- TROUBLESHOOTING
-- ==============================================================================
-- If you still get errors after running this:
--
-- 1. Check if NEW_USER_ID is being created in profiles:
--    SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
--
-- 2. Check if role-specific record was created:
--    SELECT * FROM technicians WHERE user_id = 'USER_UUID_HERE';
--    SELECT * FROM caretakers WHERE user_id = 'USER_UUID_HERE';
--    SELECT * FROM accountants WHERE user_id = 'USER_UUID_HERE';
--    SELECT * FROM proprietors WHERE user_id = 'USER_UUID_HERE';
--
-- 3. Check error logs:
--    View Database Logs in Supabase Dashboard
-- ==============================================================================
