-- ============================================================================
-- FIX: Allow super_admin to create and manage profiles (NO RECURSION)
-- Date: February 9, 2026
-- Purpose: Fix 401/RLS error when super_admin tries to assign roles to users
-- ============================================================================

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a helper function to check if user is super_admin (avoids recursion in RLS)
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'super_admin'
  )
$$;

-- Policy 1: Service role (backend/auth trigger) can do everything
CREATE POLICY "Service role full access"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can INSERT their own profile (for signup)
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can SELECT their own profile
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy 4: Users can UPDATE their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 5: Super admin can INSERT any profile
-- Uses helper function instead of subquery to avoid recursion
CREATE POLICY "Super admin can create profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 6: Super admin can UPDATE any profile
CREATE POLICY "Super admin can update profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 7: Super admin can SELECT all profiles
CREATE POLICY "Super admin can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_super_admin(auth.uid()));

-- Policy 8: Super admin can DELETE profiles
CREATE POLICY "Super admin can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.is_super_admin(auth.uid()));

-- Verify
SELECT 'Super admin profile policies created successfully (no recursion)' as status;
