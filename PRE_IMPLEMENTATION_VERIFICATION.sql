-- ============================================================================
-- PRE-IMPLEMENTATION VERIFICATION CHECKLIST
-- ============================================================================
-- Run this script BEFORE implementing the fix to understand current state
-- and AFTER to verify everything worked
--
-- Copy each section and run separately, reviewing output after each one
-- ============================================================================

-- ============================================================================
-- SECTION 1: UNDERSTAND CURRENT STATE
-- ============================================================================

SELECT '=== SECTION 1: CURRENT DATABASE STATE ===' as section;

-- 1.1: Check total number of properties
SELECT COUNT(*) as total_properties FROM properties;

-- 1.2: Check total number of profiles (users)
SELECT COUNT(*) as total_profiles FROM profiles;

-- 1.3: Check how many properties have assigned managers
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN manager_id IS NOT NULL OR property_manager_id IS NOT NULL THEN 1 END) as with_manager,
  COUNT(CASE WHEN manager_id IS NULL AND property_manager_id IS NULL THEN 1 END) as without_manager
FROM properties;

-- 1.4: Specifically check Ayden Homes
SELECT 
  id, name, address, city,
  manager_id, property_manager_id,
  CASE 
    WHEN manager_id IS NOT NULL THEN 'manager_id set'
    WHEN property_manager_id IS NOT NULL THEN 'property_manager_id set'
    ELSE 'UNASSIGNED'
  END as assignment_status
FROM properties
WHERE LOWER(name) LIKE '%ayden%homes%'
   OR LOWER(address) LIKE '%ayden%';

-- ============================================================================
-- SECTION 2: CHECK FOR SPECIFIC ISSUES
-- ============================================================================

SELECT '=== SECTION 2: POTENTIAL ISSUES ===' as section;

-- 2.1: Find Ochieng Felix in profiles
SELECT 
  id, email, first_name, last_name, role, status
FROM profiles
WHERE (
  first_name ILIKE '%ochieng%' 
  OR last_name ILIKE '%ochieng%'
  OR first_name ILIKE '%felix%'
  OR last_name ILIKE '%felix%'
  OR email ILIKE '%ochieng%'
  OR email ILIKE '%felix%'
)
ORDER BY created_at DESC;

-- 2.2: Check if there are any orphaned manager references
-- (properties pointing to non-existent managers)
SELECT 
  p.id, p.name, p.manager_id, p.property_manager_id,
  CASE 
    WHEN p.manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.manager_id) 
      THEN '❌ Invalid manager_id'
    WHEN p.property_manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.property_manager_id) 
      THEN '❌ Invalid property_manager_id'
    ELSE '✅ Valid'
  END as status
FROM properties p
WHERE (
  (p.manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.manager_id))
  OR
  (p.property_manager_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM profiles WHERE id = p.property_manager_id))
)
LIMIT 10;

-- 2.3: List all profiles with their roles
SELECT 
  role, 
  COUNT(*) as count,
  STRING_AGG(first_name || ' ' || last_name, ', ') as examples
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- 2.4: Check RLS status on key tables
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'properties', 'units', 'leases', 'tenant_properties')
ORDER BY tablename;

-- ============================================================================
-- SECTION 3: VERIFY YOUR SUPER ADMIN ACCESS
-- ============================================================================

SELECT '=== SECTION 3: YOUR ACCESS ===' as section;

-- 3.1: Check your current user
SELECT auth.uid() as current_user_id;

-- 3.2: Check your profile details (if you're in the system)
SELECT 
  id, email, role, first_name, last_name, status
FROM profiles
WHERE id = auth.uid();

-- 3.3: Verify you have super_admin or admin role (required for this fix)
SELECT 
  CASE 
    WHEN role IN ('super_admin', 'admin') THEN '✅ You have admin access'
    ELSE '❌ You need admin access for this fix'
  END as access_status
FROM profiles
WHERE id = auth.uid();

-- ============================================================================
-- SECTION 4: CHECK FOR MISSING TABLES/COLUMNS
-- ============================================================================

SELECT '=== SECTION 4: TABLE STRUCTURE ===' as section;

-- 4.1: Verify properties table has required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'properties'
  AND column_name IN ('id', 'name', 'manager_id', 'property_manager_id')
ORDER BY ordinal_position;

-- 4.2: Verify profiles table has required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('id', 'email', 'first_name', 'last_name', 'role')
ORDER BY ordinal_position;

-- 4.3: Check for existing helpful view
SELECT EXISTS(
  SELECT 1 FROM information_schema.views 
  WHERE table_schema = 'public' AND table_name = 'v_properties_with_managers'
) as view_exists;

-- ============================================================================
-- SECTION 5: QUICK DIAGNOSTICS
-- ============================================================================

SELECT '=== SECTION 5: QUICK DIAGNOSTICS ===' as section;

-- 5.1: Show property distribution by manager
SELECT 
  COALESCE(pr.first_name || ' ' || pr.last_name, 'UNASSIGNED') as manager_name,
  COUNT(*) as property_count,
  STRING_AGG(p.name, ', ' ORDER BY p.name) as properties
FROM properties p
LEFT JOIN profiles pr ON (p.manager_id = pr.id OR p.property_manager_id = pr.id)
GROUP BY pr.id, pr.first_name, pr.last_name
ORDER BY property_count DESC;

-- 5.2: Show recent property updates
SELECT 
  name, address, city,
  CASE 
    WHEN manager_id IS NOT NULL THEN 'Has manager_id'
    WHEN property_manager_id IS NOT NULL THEN 'Has property_manager_id'
    ELSE 'Unassigned'
  END as manager_status,
  updated_at
FROM properties
ORDER BY updated_at DESC
LIMIT 10;

-- 5.3: Show recent profile changes
SELECT 
  email, role, status, 
  first_name, last_name,
  created_at, updated_at
FROM profiles
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- SECTION 6: PERFORMANCE CHECK
-- ============================================================================

SELECT '=== SECTION 6: DATABASE PERFORMANCE ===' as section;

-- 6.1: Check if indexes exist (this helps with performance)
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'profiles')
  AND indexname LIKE '%manager%' OR indexname LIKE '%properties%'
ORDER BY tablename, indexname;

-- 6.2: Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'profiles', 'units', 'leases')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- SECTION 7: VERIFICATION SUMMARY
-- ============================================================================

SELECT '=== SECTION 7: VERIFICATION SUMMARY ===' as section;

WITH checks AS (
  -- Check 1: Profiles table exists
  SELECT 'Profiles table exists' as check_name, 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')::text as result
  UNION
  -- Check 2: Properties table exists
  SELECT 'Properties table exists', 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='properties')::text
  UNION
  -- Check 3: Has manager_id column
  SELECT 'Properties.manager_id column exists',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='manager_id')::text
  UNION
  -- Check 4: Has property_manager_id column
  SELECT 'Properties.property_manager_id column exists',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='properties' AND column_name='property_manager_id')::text
  UNION
  -- Check 5: Profiles has role column
  SELECT 'Profiles.role column exists',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role')::text
  UNION
  -- Check 6: RLS enabled on profiles
  SELECT 'RLS enabled on profiles',
    (SELECT rowsecurity FROM pg_tables WHERE table_name='profiles')::text
  UNION
  -- Check 7: RLS enabled on properties
  SELECT 'RLS enabled on properties',
    (SELECT rowsecurity FROM pg_tables WHERE table_name='properties')::text
  UNION
  -- Check 8: Has Ochieng Felix
  SELECT 'Ochieng Felix exists',
    EXISTS(
      SELECT 1 FROM profiles 
      WHERE first_name ILIKE '%ochieng%' OR last_name ILIKE '%ochieng%'
    )::text
  UNION
  -- Check 9: Has Ayden Homes
  SELECT 'Ayden Homes property exists',
    EXISTS(
      SELECT 1 FROM properties 
      WHERE LOWER(name) LIKE '%ayden%homes%'
    )::text
)
SELECT check_name, result,
  CASE WHEN result = 't' THEN '✅' ELSE '❌' END as status
FROM checks
ORDER BY check_name;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '=== READY FOR IMPLEMENTATION ===' as status;

SELECT
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE role IN ('property_manager', 'super_admin', 'admin')) as managers,
  (SELECT COUNT(*) FROM properties WHERE manager_id IS NOT NULL OR property_manager_id IS NOT NULL) as assigned_properties,
  (SELECT COUNT(*) FROM properties WHERE manager_id IS NULL AND property_manager_id IS NULL) as unassigned_properties
FROM profiles LIMIT 1;

SELECT '✅ Run all sections above to get a complete understanding of your database state' as next_step;
SELECT '✅ Then follow QUICK_IMPLEMENTATION_CHECKLIST.md to implement the fix' as implementation_guide;
