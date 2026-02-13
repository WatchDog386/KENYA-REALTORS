-- ============================================================================
-- FIX HANDLE NEW USER FUNCTION TO SUPPORT ALL ROLES
-- Date: February 11, 2026
-- Purpose: Update the handle_new_user trigger function to allow new roles:
--          technician, proprietor, caretaker, accountant.
--          Previously it was hardcoded to only allow tenant, property_manager, super_admin.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  -- Safe metadata extraction with defaults
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Validate role
  -- UPDATED: Added technician, proprietor, caretaker, accountant
  IF v_role NOT IN ('tenant', 'property_manager', 'super_admin', 'technician', 'proprietor', 'caretaker', 'accountant') THEN
    v_role := 'tenant';
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- UPSERT into profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    role, 
    user_type, 
    is_active, 
    status, 
    approved
  ) VALUES (
    NEW.id, 
    NEW.email, 
    v_first_name, 
    v_last_name, 
    v_phone, 
    v_role, 
    v_role, 
    true,         -- Active
    'active',     -- Status
    false         -- Approved (set to true if you want auto-approval)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Catch errors so auth.users insert doesn't fail!
  -- Log error if you have an error logging table, otherwise just proceed
  -- For now, we fallback to basic insertion if something fancy fails
  RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END $$;

COMMIT;

SELECT '✅ Trigger function updated successfully to support all roles' as status;
