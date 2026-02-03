-- ============================================================================
-- Ensure profiles are created and RLS works for registration
-- Date: February 3, 2026
-- Purpose: Make sure registration creates profiles with all fields
-- ============================================================================

-- Step 1: Ensure RLS is enabled and policies are correct
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop problematic policies and recreate clean ones
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Service role can do everything (for backend operations)
CREATE POLICY "profiles_service_role_all"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can insert their own profile (signup)
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- All authenticated users can view all profiles (for UI purposes)
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- Step 2: Verify the structure
SELECT 'Profiles table RLS configured' as status;
SELECT policyname, permissive FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
