-- ============================================================================
-- RLS POLICY VERIFICATION & HARDENING SCRIPT
-- ============================================================================
-- Verifies and fixes Row Level Security policies for Super Admin Dashboard
-- This ensures proper access control for all tables
--
-- Run this AFTER DATABASE_VERIFICATION_AND_FIX.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1: CHECK CURRENT RLS STATUS
-- ============================================================================

-- 1.1: Check which tables have RLS enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ⚠️' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'units', 'leases', 'tenant_properties', 'audit_logs')
ORDER BY tablename;

-- 1.2: List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'YES' ELSE 'NO' END as has_condition,
  CASE WHEN with_check IS NOT NULL THEN 'YES' ELSE 'NO' END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'units', 'leases', 'tenant_properties')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 2: ENSURE PROPER RLS SETUP FOR SUPER ADMIN
-- ============================================================================

-- 2.1: Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2.2: Enable RLS on properties table if not already enabled  
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 3: CREATE/UPDATE SUPER ADMIN POLICIES
-- ============================================================================

-- 3.1: Super Admin can view all profiles
DROP POLICY IF EXISTS "super_admin_view_all_profiles" ON profiles;
CREATE POLICY "super_admin_view_all_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

-- 3.2: Users can view their own profile
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- 3.3: Super Admin can modify profiles
DROP POLICY IF EXISTS "super_admin_modify_profiles" ON profiles;
CREATE POLICY "super_admin_modify_profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- SECTION 4: PROPERTIES TABLE POLICIES
-- ============================================================================

-- 4.1: Super Admin can view all properties
DROP POLICY IF EXISTS "super_admin_view_all_properties" ON properties;
CREATE POLICY "super_admin_view_all_properties" ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

-- 4.2: Property managers can view their assigned properties
DROP POLICY IF EXISTS "manager_view_assigned_properties" ON properties;
CREATE POLICY "manager_view_assigned_properties" ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('property_manager', 'manager')
        AND (properties.manager_id = p.id OR properties.property_manager_id = p.id)
    )
  );

-- 4.3: Super Admin can modify properties
DROP POLICY IF EXISTS "super_admin_modify_properties" ON properties;
CREATE POLICY "super_admin_modify_properties" ON properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'admin')
    )
  );

-- 4.4: Property managers can modify their assigned properties
DROP POLICY IF EXISTS "manager_modify_assigned_properties" ON properties;
CREATE POLICY "manager_modify_assigned_properties" ON properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('property_manager', 'manager')
        AND (properties.manager_id = p.id OR properties.property_manager_id = p.id)
    )
  );

-- ============================================================================
-- SECTION 5: VERIFY POLICIES ARE WORKING
-- ============================================================================

-- 5.1: Test super admin access (run this as super admin user)
-- This should return all profiles if RLS is working correctly
/*
SELECT 'Test: Super Admin viewing profiles' as test_name;
SELECT id, email, role, status FROM profiles LIMIT 5;
*/

-- 5.2: Test super admin property access
-- This should return all properties
/*
SELECT 'Test: Super Admin viewing properties' as test_name;
SELECT id, name, address, manager_id FROM properties LIMIT 5;
*/

-- ============================================================================
-- SECTION 6: PERFORMANCE VERIFICATION
-- ============================================================================

-- 6.1: Check for slow RLS policy queries
SELECT
  schemaname,
  tablename,
  policyname,
  LENGTH(qual::text) as policy_condition_length
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties')
ORDER BY policy_condition_length DESC;

-- ============================================================================
-- SECTION 7: TROUBLESHOOTING GUIDE
-- ============================================================================

/*

If you're still having issues after running this script:

1. VERIFY USER ROLE:
   Run this as your super admin user to check their role:
   
   SELECT id, email, role, status FROM profiles 
   WHERE id = auth.uid();
   
   Expected: role should be 'super_admin' or 'admin'

2. CHECK POLICIES ARE ATTACHED:
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'profiles';
   
   Should see multiple policies listed

3. TEST RLS DIRECTLY:
   -- Temporarily disable RLS to test
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   
   -- Try your query
   SELECT * FROM profiles;
   
   -- Re-enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

4. CHECK AUTH.UID():
   SELECT auth.uid();
   
   Should return your user ID, not NULL

5. IF GETTING "new row violates row-level security policy":
   This means your INSERT/UPDATE doesn't satisfy the policy conditions
   Check that you're:
   - Logged in as super admin
   - Your user ID exists in profiles table
   - Your role is set correctly

*/

-- ============================================================================
-- SECTION 8: FINAL VERIFICATION
-- ============================================================================

SELECT 'RLS POLICY SETUP COMPLETE ✅' as status;

-- Show summary
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'units', 'leases', 'tenant_properties');

-- List all active policies
SELECT 
  tablename,
  policyname,
  CASE WHEN cmd = '*' THEN 'ALL' ELSE cmd END as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties')
ORDER BY tablename, policyname;
