-- ============================================================================
-- FIX: REGISTRATION ROLE HANDLING AND AUTO-APPROVAL (V2 - COMPREHENSIVE)
-- ============================================================================
-- This script fixes the issue where new users were being forced into 'tenant'
-- or causing 500 errors due to strict database constraints.
--
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor.
-- 2. It will drop and recreate the necessary triggers and constraints.
-- ============================================================================

BEGIN;

-- 1. RELAX FOREIGN KEY/NOT NULL CONSTRAINTS
-- ============================================================================
-- These tables likely require fields that we don't have during simple signup.
-- We must make them optional to allow the user to be created first.

-- Technicians: Allow null category
ALTER TABLE public.technicians ALTER COLUMN category_id DROP NOT NULL;

-- Caretakers: Allow null assignments
ALTER TABLE public.caretakers ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN property_manager_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN assigned_by DROP NOT NULL;

-- Accountants: Allow null assignment
ALTER TABLE public.accountants ALTER COLUMN assigned_by DROP NOT NULL;


-- 2. UPDATE ALLOWED ROLES IN PROFILES
-- ============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'technician', 'proprietor', 'caretaker', 'accountant', 'owner'));


-- 3. DEFINE THE HANDLER FUNCTION
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
  v_status TEXT := 'active'; -- Default to active
  v_approved BOOLEAN := true; -- Auto-approve everyone
BEGIN
  -- Extract metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Normalization
  IF v_role = 'owner' THEN v_role := 'proprietor'; END IF;

  -- Validation (Reset to tenant if completely unknown)
  IF v_role NOT IN ('tenant', 'property_manager', 'super_admin', 'technician', 'proprietor', 'caretaker', 'accountant') THEN
    v_role := 'tenant'; 
  END IF;

  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := NEW.raw_user_meta_data->>'phone';

  -- A. Insert into PROFILES
  INSERT INTO public.profiles (
    id, email, first_name, last_name, phone, role, user_type, 
    is_active, status, approved
  ) VALUES (
    NEW.id, NEW.email, v_first_name, v_last_name, v_phone, v_role, 
    CASE 
        WHEN v_role = 'tenant' THEN 'resident'
        WHEN v_role = 'property_manager' THEN 'manager'
        WHEN v_role = 'super_admin' THEN 'admin'
        ELSE v_role 
    END,
    true, v_status, v_approved
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    approved = EXCLUDED.approved,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

  -- B. Auto-create Linked Records (Fail-safe)
  BEGIN
      IF v_role = 'technician' THEN
        INSERT INTO public.technicians (user_id, status) VALUES (NEW.id, 'active') ON CONFLICT DO NOTHING;
      ELSIF v_role = 'proprietor' THEN
        INSERT INTO public.proprietors (user_id, status) VALUES (NEW.id, 'active') ON CONFLICT DO NOTHING;
      ELSIF v_role = 'caretaker' THEN
        INSERT INTO public.caretakers (user_id, status) VALUES (NEW.id, 'active') ON CONFLICT DO NOTHING;
      ELSIF v_role = 'accountant' THEN
        INSERT INTO public.accountants (user_id, status) VALUES (NEW.id, 'active') ON CONFLICT DO NOTHING;
      END IF;
  EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail registration
      RAISE WARNING 'Failed to create role-specific record for %: %', v_role, SQLERRM;
  END;

  RETURN NEW;
END;
$$;


-- 4. RECREATE THE TRIGGER (Crucial Step!)
-- ============================================================================
-- We drop and recreate to ensure it is correctly attached to the new function.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. UPDATE RLS POLICIES (Visibility Rules)
-- ============================================================================

-- Basic profile visibility
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Management visibility
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
