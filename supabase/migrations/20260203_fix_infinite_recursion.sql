-- ============================================================================
-- FIX: Profile 500 Error - RLS Parameter Recursion (Code 42P17)
-- Date: February 3, 2026
-- Problem: Infinite recursion in RLS policies when querying profiles table to check role
-- Solution: Use a SECURITY DEFINER function to bypass RLS for role checks
-- ============================================================================

-- STEP 1: Create a secure function to check admin status without triggering RLS
-- This function runs as the database owner, bypassing RLS policies
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This key part allows bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$;

-- STEP 2: Drop problematic policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

-- STEP 3: Recreate RLS policies using the secure function
-- Service role (backend/migrations/triggers) has full access
CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can SELECT their own profile
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

-- Super admins full access (using the SECURITY DEFINER function)
-- This avoids the infinite recursion loop
CREATE POLICY "Super admin view all"
  ON public.profiles FOR SELECT
  USING (public.check_is_super_admin());

-- Super admins can update all profiles
CREATE POLICY "Super admin update all"
  ON public.profiles FOR UPDATE
  USING (public.check_is_super_admin())
  WITH CHECK (public.check_is_super_admin());

-- STEP 4: Ensure profile exists for super admin (Idempotent)
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

-- STEP 5: Verify the particular user profile
SELECT id, email, role FROM public.profiles WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';
