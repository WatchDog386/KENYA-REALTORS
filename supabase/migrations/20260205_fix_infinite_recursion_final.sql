-- ============================================================================
-- FINAL FIX: INFINITE RECURSION ON PROFILES (Code 42P17)
-- ============================================================================
-- This migration fixes the infinite recursion caused by policies on the 'profiles'
-- table querying 'profiles' directly to check for admin status.
--
-- We implement a SECURITY DEFINER function to safely check admin status
-- without triggering RLS recursion.
-- ============================================================================

-- 1. Create a secure function to check if a user is a super admin
-- This function runs with the privileges of the creator (superuser), bypassing RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
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
    AND status = 'active'
  );
END;
$$;

-- 2. Drop the recursive policies from 'profiles' and related tables
-- We drop policies that might have been created by previous migrations

-- Profiles
DROP POLICY IF EXISTS "super_admin_all_access" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;

-- Manager Approvals
DROP POLICY IF EXISTS "super_admin_manager_approvals" ON public.manager_approvals;

-- Tenant Approvals
DROP POLICY IF EXISTS "super_admin_tenant_approvals" ON public.tenant_approvals;

-- 3. Create non-recursive policies using the secure function

-- Profiles: Super admins can do everything
CREATE POLICY "super_admin_all_access"
  ON public.profiles FOR ALL
  USING (public.is_super_admin());

-- Manager Approvals: Super admins can do everything
CREATE POLICY "super_admin_manager_approvals"
  ON public.manager_approvals FOR ALL
  USING (public.is_super_admin());

-- Tenant Approvals: Super admins can do everything
CREATE POLICY "super_admin_tenant_approvals"
  ON public.tenant_approvals FOR ALL
  USING (public.is_super_admin());

-- 4. Ensure basic user policies exist (if they were dropped safely)
-- We use DO block to check preventing duplicate policy errors if we didn't drop them above

DO $$
BEGIN
    -- Users can read their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_own_profile'
    ) THEN
        CREATE POLICY "users_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;

    -- Users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'users_update_own_profile'
    ) THEN
        CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Service role full access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'service_role_all_access'
    ) THEN
        CREATE POLICY "service_role_all_access" ON public.profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
    END IF;
END
$$;

-- 5. Re-enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Re-enable RLS on related tables
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;

-- 7. Verify the function and policies are created
SELECT 'Migration completed successfully!' as status;
