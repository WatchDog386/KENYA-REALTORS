-- ============================================================================
-- FINAL RLS FIX - RUNS AFTER ALL OTHER MIGRATIONS
-- Date: February 6, 2026
-- Purpose: Fix infinite recursion by removing all recursive policies
--          and using SECURITY DEFINER function instead
-- ============================================================================

-- 0. Temporarily disable RLS to clean up policies safely
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals DISABLE ROW LEVEL SECURITY;

-- 1. Create secure function to check admin status (bypasses RLS)
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

-- 2. Drop ALL policies on all affected tables (comprehensive cleanup)
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;

    -- Drop all policies on manager_approvals
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'manager_approvals' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.manager_approvals', pol.policyname);
    END LOOP;

    -- Drop all policies on tenant_approvals
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_approvals' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_approvals', pol.policyname);
    END LOOP;
END
$$;

-- 3. Create clean, non-recursive policies

-- Profiles: Service role has full access
CREATE POLICY "profiles_service_role_all"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Profiles: User can see their own profile
CREATE POLICY "profiles_user_own_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: User can update their own profile
CREATE POLICY "profiles_user_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: Super admin can do everything using safe function
CREATE POLICY "profiles_super_admin_safe"
  ON public.profiles FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Manager Approvals: Service role
CREATE POLICY "manager_approvals_service_role"
  ON public.manager_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Manager Approvals: Super admin using safe function
CREATE POLICY "manager_approvals_super_admin_safe"
  ON public.manager_approvals FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Tenant Approvals: Service role
CREATE POLICY "tenant_approvals_service_role"
  ON public.tenant_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tenant Approvals: Super admin using safe function
CREATE POLICY "tenant_approvals_super_admin_safe"
  ON public.tenant_approvals FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 4. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;

-- 5. Verification
SELECT 'Migration complete!' as status;
