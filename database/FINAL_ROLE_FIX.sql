-- ============================================================================
-- FIX: REGISTRATION ROLE HANDLING AND AUTO-APPROVAL
-- ============================================================================
-- This script fixes the issue where new users (Proprietors, Technicians, etc.)
-- were being forced into the 'tenant' role.
-- It also enables AUTO-APPROVAL for all roles as requested.
-- And ensures strict foreign key constraints don't block registration.
-- ============================================================================

BEGIN;

-- 1. RELAX CONSTRAINTS (To allow self-registration without assignment)
-- ============================================================================

-- Technicians: Allow null category initially
ALTER TABLE public.technicians
ALTER COLUMN category_id DROP NOT NULL;

-- Caretakers: Allow null property and manager initially
ALTER TABLE public.caretakers
ALTER COLUMN property_id DROP NOT NULL,
ALTER COLUMN property_manager_id DROP NOT NULL,
ALTER COLUMN assigned_by DROP NOT NULL;

-- Accountants: Allow null assigned_by
ALTER TABLE public.accountants
ALTER COLUMN assigned_by DROP NOT NULL;


-- 2. UPDATE ROLE CONSTRAINTS
-- ============================================================================
-- Ensure all roles are valid in the profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'technician', 'proprietor', 'caretaker', 'accountant', 'owner'));


-- 3. UPDATE TRIGGER FUNCTION (The Core Fix)
-- ============================================================================
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
  
  -- MAP 'owner' -> 'proprietor' (Fixes frontend mismatch)
  IF v_role = 'owner' THEN
    v_role := 'proprietor';
  END IF;

  -- Validate role / Fallback
  IF v_role NOT IN ('tenant', 'property_manager', 'super_admin', 'technician', 'proprietor', 'caretaker', 'accountant') THEN
    -- If it's still unknown (and not owner which we just mapped), default to tenant
    v_role := 'tenant'; 
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- A. Insert into PROFILES
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

  -- B. Insert into ROLE SPECIFIC TABLES (if needed)
  -- This ensures the user has a record in their respective table for the dashboard to load.
  
  -- Technicians
  IF v_role = 'technician' THEN
    INSERT INTO public.technicians (user_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Proprietors
  IF v_role = 'proprietor' THEN
    INSERT INTO public.proprietors (user_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Caretakers
  IF v_role = 'caretaker' THEN
    INSERT INTO public.caretakers (user_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Accountants
  IF v_role = 'accountant' THEN
    INSERT INTO public.accountants (user_id, status)
    VALUES (NEW.id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- 4. FIX RLS POLICIES (Ensure visibility)
-- ============================================================================

-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/managers/proprietors to see all profiles (for management purposed)
DROP POLICY IF EXISTS "Admins and Managers can see all profiles" ON public.profiles;
CREATE POLICY "Admins and Managers can see all profiles" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('super_admin', 'property_manager', 'proprietor')
        )
    );

COMMIT;
