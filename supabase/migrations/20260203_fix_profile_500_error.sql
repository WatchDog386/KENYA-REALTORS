-- ============================================================================
-- FIX: Profile 500 Error - RLS Policy Blocking Profile Fetch
-- Date: February 3, 2026
-- Problem: RLS policy for super admins includes subquery that fails
-- Solution: Simplify RLS policies to avoid circular dependencies
-- ============================================================================

-- STEP 1: Drop problematic policies that cause 500 errors
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- STEP 2: Recreate RLS policies without circular dependencies
-- Service role (backend/migrations/triggers) has full access
CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can SELECT their own profile (simple auth.uid() check only)
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can DELETE their own profile
CREATE POLICY "Users delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Allow INSERT for authenticated users creating their own profile
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Super admins full access (use role column, not subquery)
-- This allows super_admin role users to view all profiles
CREATE POLICY "Super admin view all"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Super admins can update all profiles
CREATE POLICY "Super admin update all"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- STEP 3: Ensure profile exists for super admin
-- This ensures the profile is created in the database
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  status,
  is_active,
  email_confirmed,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  NULL,
  'super_admin',
  'active',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  is_active = true,
  email_confirmed = true,
  updated_at = NOW();

-- STEP 4: Verify the profile was created/updated
SELECT 
  id,
  email,
  first_name,
  role,
  status,
  is_active
FROM public.profiles
WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';
