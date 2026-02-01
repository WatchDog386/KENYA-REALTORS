-- ============================================================================
-- Migration: Comprehensive RLS Fix for Profile Registration
-- Date: February 1, 2026
-- Purpose: Fix "new row violates row-level security policy" on profile insert
--          during user registration
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow signup profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for own record" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own record" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for service role" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;

-- ============================================================================
-- STEP 2: ENSURE RLS IS ENABLED
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE NEW SIMPLIFIED POLICIES
-- ============================================================================

-- Allow service_role (backend) full access - MUST BE FIRST for trusted operations
CREATE POLICY "profiles_service_role_all"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert their own profile during signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to select their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- STEP 4: DROP AND RECREATE TRIGGER FOR AUTO-PROFILE CREATION
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = new.email, updated_at = now();
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: CREATE FUNCTION FOR UPDATING PROFILE WITH FULL DATA
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_profile_on_registration(
  user_id UUID,
  user_phone TEXT,
  user_role TEXT,
  user_status TEXT,
  property_id UUID DEFAULT NULL,
  unit_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    phone = user_phone,
    role = user_role,
    status = user_status,
    property_id = property_id,
    unit_id = unit_id,
    updated_at = now()
  WHERE id = user_id;
END;
$$;

-- ============================================================================
-- STEP 6: VERIFY POLICIES
-- ============================================================================
-- This is just for logging, can be removed
SELECT 'RLS Policies created successfully' as message;
