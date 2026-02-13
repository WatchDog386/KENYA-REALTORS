-- ============================================================================
-- FIX: REGISTRATION ROLE HANDLING AND AUTO-APPROVAL
-- ============================================================================
-- This script fixes the issue where new users (Proprietors, Technicians, etc.)
-- were being forced into the 'tenant' role.
-- It also enables AUTO-APPROVAL for all roles as requested.
-- ============================================================================

BEGIN;

-- 1. Update the Profiles Check Constraint to include ALL roles (including 'owner' if needed)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'technician', 'proprietor', 'caretaker', 'accountant', 'owner'));

-- 2. Update the handle_new_user function to correctly handle all roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
  v_status TEXT := 'active';
  v_approved BOOLEAN := true; -- AUTO-APPROVE ALL USERS
BEGIN
  -- Safe metadata extraction
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Map 'owner' to 'proprietor' if you want to consolidate, OR keep both.
  -- For now, we allow 'owner' as it is in the frontend.
  
  -- Validate role (Allowing all known types)
  IF v_role NOT IN ('tenant', 'property_manager', 'super_admin', 'technician', 'proprietor', 'caretaker', 'accountant', 'owner') THEN
    v_role := 'tenant'; -- Fallback only for truly unknown values
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
    CASE 
        WHEN v_role = 'tenant' THEN 'resident'
        WHEN v_role = 'property_manager' THEN 'manager'
        WHEN v_role = 'super_admin' THEN 'admin'
        ELSE v_role -- technician, proprietor, etc.
    END,
    true, -- is_active
    v_status,
    v_approved
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone;

  RETURN NEW;
END;
$$;

-- 3. Fix RLS Policies for the Profiles table to ensure new roles can be read
-- (Ensure specific roles can see their own profile or relevant profiles)

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/managers to see all profiles (expanded to include new roles if they have management duties)
DROP POLICY IF EXISTS "Admins and Managers can see all profiles" ON public.profiles;
CREATE POLICY "Admins and Managers can see all profiles" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('super_admin', 'property_manager', 'proprietor')
        )
    );

-- 4. Create missing tables/types if they don't exist (Quick check safe-guards)
-- Ensure 'technicians', 'proprietors' tables exist if the architecture requires them
-- (Assuming they are created by 20260211_...sql, but simply ensuring RLS)

COMMIT;
