-- ============================================================================
-- SIMPLIFIED RLS FIX - Core Auth Access Only
-- Date: February 7, 2026
-- Purpose: Simplest possible RLS that allows profile access without recursion
-- ============================================================================

-- 1. Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'manager_approvals' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.manager_approvals', pol.policyname);
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_approvals' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_approvals', pol.policyname);
    END LOOP;
END
$$;

-- 3. Create super simple policies - NO RECURSION

-- Profiles: Service role (for server-side operations)
CREATE POLICY "profiles_service_role"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Profiles: Authenticated users can read their own
CREATE POLICY "profiles_own_read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Authenticated users can update their own
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: Authenticated users can insert (for registration)
CREATE POLICY "profiles_own_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Manager Approvals: Service role
CREATE POLICY "manager_approvals_service_role"
  ON public.manager_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tenant Approvals: Service role
CREATE POLICY "tenant_approvals_service_role"
  ON public.tenant_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;

-- 5. Done
SELECT 'SIMPLE RLS APPROACH ACTIVATED' as status;
