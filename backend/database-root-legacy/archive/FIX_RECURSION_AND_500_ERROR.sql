-- FIX: 500 Error / Infinite Recursion on Profiles Table
-- This script replaces recursive policies with safe ones using a specific function.

BEGIN;

--------------------------------------------------------------------------------
-- 1. HELPER FUNCTION (Breaks Infinite Recursion)
--------------------------------------------------------------------------------
-- This function runs with SECURITY DEFINER, meaning it bypasses RLS on 'profiles'
-- when checking the role. This prevents the "Check Policy -> Query Table -> Check Policy" loop.

CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER 
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

--------------------------------------------------------------------------------
-- 2. RESET POLICIES ON PROFILES
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all potentially conflicting/recursive policies mentioned in recent fixes
DROP POLICY IF EXISTS "Super Admins Full Access" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;

-- Create Safe Policies

-- A. VIEW: Everyone can view profiles (needed for team lists, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- B. SUPER ADMIN: Full access using the helper function (No Recursion)
CREATE POLICY "Super Admins Full Access"
  ON public.profiles
  FOR ALL
  USING (check_is_super_admin());

-- C. SELF: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- D. INSERT: Users can insert their own profile (Signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);


--------------------------------------------------------------------------------
-- 3. ENSURE ASSIGNMENT POLICIES ARE SAFE
--------------------------------------------------------------------------------
-- Just in case assignments are also erroring
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage assignments" ON property_manager_assignments;
DROP POLICY IF EXISTS "Assignments viewable by everyone" ON property_manager_assignments;

CREATE POLICY "Assignments viewable by everyone" 
  ON public.property_manager_assignments FOR SELECT 
  USING (true);

CREATE POLICY "Super admins manage assignments" 
  ON public.property_manager_assignments 
  FOR ALL 
  USING (check_is_super_admin());


COMMIT;
