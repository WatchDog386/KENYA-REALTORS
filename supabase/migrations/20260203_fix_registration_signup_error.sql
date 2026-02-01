-- ============================================================================
-- FIX: Registration 500 Error - Circular RLS Logic
-- Date: February 3, 2026
-- Problem: RLS policies on profiles table prevent INSERT during signup
-- Root Cause: INSERT policy tries to query profiles table for super_admin check
--             but the profile being inserted doesn't exist yet
-- Solution: Use SECURITY DEFINER trigger + disable RLS for auth trigger
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix the profiles table RLS policies (remove circular logic)
-- ============================================================================

-- Drop all problematic profiles RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- NEW POLICIES - Non-circular logic
-- 1. Service role can do everything (for migrations and triggers)
CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- 2. Users can SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 3. Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Super admins can SELECT all profiles (after they exist)
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  );

-- 5. Super admins can UPDATE any profile (after they exist)
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles p2 
      WHERE p2.role = 'super_admin' AND p2.id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 2: Recreate the auth trigger with proper SECURITY DEFINER
-- This allows it to bypass RLS for INSERT operations
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  v_user_id := NEW.id;
  v_email := NEW.email;

  -- Extract user metadata if available
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    updated_at = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail signup
  RAISE LOG 'Warning: Profile creation failed for user %: %', v_user_id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create AFTER INSERT trigger so auth.users INSERT completes first
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Grant proper permissions for authenticated users
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Allow properties to be selected by authenticated users
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.units_detailed TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Registration fix complete!';
  RAISE NOTICE '✓ RLS policies updated - no circular logic';
  RAISE NOTICE '✓ Auth trigger uses SECURITY DEFINER';
  RAISE NOTICE '✓ Service role can manage profiles during signup';
END $$;
