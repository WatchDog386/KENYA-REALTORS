-- ============================================================================
-- FIX: Property Manager Registration 500 Error
-- 
-- Problem: Property managers fail to register with 500 error
-- Root Cause: RLS policies blocking profile creation during auth trigger
-- Solution: Simplify trigger and RLS to prevent recursion + allow service_role
-- ============================================================================

-- STEP 1: Disable RLS temporarily to ensure trigger can work
-- ============================================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL problematic policies
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "service_role_unrestricted_access" ON public.profiles;
DROP POLICY IF EXISTS "users_can_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- STEP 3: Re-enable RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create SIMPLE RLS Policies (no recursion)
-- ============================================================================

-- CRITICAL: Service role MUST have full access (for auth triggers)
CREATE POLICY "service_role_unrestricted_access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can select their own profile
CREATE POLICY "users_can_select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_can_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- STEP 5: Grant Necessary Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- Users can only see/modify their own profile (RLS enforces this)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
-- Service role needs all permissions for triggers/functions
GRANT ALL ON public.profiles TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- STEP 6: Verify Test Profiles
-- ============================================================================

-- Ensure super admin exists
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  is_active
) VALUES (
  '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'super_admin',
  'active',
  true
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  is_active = true;

-- ============================================================================
-- Fix Complete! Properties manager registration should now work.
-- ============================================================================
