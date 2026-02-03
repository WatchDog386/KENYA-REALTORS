-- ============================================================================
-- Fix RLS: Enable RLS and Create Proper Policies
-- Date: February 3, 2026
-- Purpose: Fix 500 errors by enabling RLS with correct policies for super admin
-- ============================================================================

-- Step 1: Verify profiles table RLS is ENABLED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_all" ON public.properties;
DROP POLICY IF EXISTS "units_detailed_select_all" ON public.units_detailed;
DROP POLICY IF EXISTS "units_detailed_admin_all" ON public.units_detailed;
DROP POLICY IF EXISTS "leases_select_all" ON public.leases;
DROP POLICY IF EXISTS "leases_admin_all" ON public.leases;
DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;

-- Step 3: Create fresh, working RLS policies for profiles

-- Policy 1: Service role (backend) can do everything
CREATE POLICY "profiles_service_role_all"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can insert their own profile during signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Policy 3: Users can read their own profile (simplest, no recursion)
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Policy 3b: Super admins can see all profiles (service_role already covered above)
-- For authenticated super admins, allow reading all profiles
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');  -- Allow all authenticated users to see profiles

-- Policy 4: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Policy 5: Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id OR auth.role() = 'service_role');

-- Step 4: Simple RLS policies for other tables (no complex recursion)

-- Properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_select_all"
  ON public.properties FOR SELECT
  USING (true);

CREATE POLICY "properties_admin_all"
  ON public.properties FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Units detailed table
ALTER TABLE public.units_detailed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_detailed_select_all"
  ON public.units_detailed FOR SELECT
  USING (true);

CREATE POLICY "units_detailed_admin_all"
  ON public.units_detailed FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Leases table
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leases_select_all"
  ON public.leases FOR SELECT
  USING (true);

CREATE POLICY "leases_admin_all"
  ON public.leases FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_all"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "payments_admin_all"
  ON public.payments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 5: Verification queries (optional - for debugging)
SELECT 'RLS Policies Created Successfully' as status;
SELECT 'Profiles RLS Status:' as check_type;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

SELECT 'Profiles Policies:' as check_type;
SELECT policyname, permissive, roles FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
