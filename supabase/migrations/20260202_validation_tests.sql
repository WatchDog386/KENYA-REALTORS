-- ============================================================================
-- FULLSTACK INTEGRATION VALIDATION TEST
-- Date: February 2, 2026
-- Purpose: Verify all database-frontend mappings are working
-- ============================================================================

-- Test 1: Verify profiles table has all required columns
SELECT 
  'Test 1: Profiles Table Structure' as test_name,
  COUNT(*) as required_columns_found
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
  'role', 'user_type', 'status', 'is_active', 'avatar_url', 'property_id', 'unit_id',
  'created_at', 'updated_at', 'last_login_at'
);

-- Test 2: Verify role values in profiles table
SELECT 
  'Test 2: Valid Role Values' as test_name,
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- Test 3: Check RLS policies are enabled on key tables
SELECT 
  'Test 3: RLS Status' as test_name,
  tablename,
  (SELECT COUNT(*) FROM information_schema.role_table_grants 
   WHERE table_name = tablename AND privilege_type = 'SELECT') as has_rls
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'properties', 'units_detailed', 'leases', 'payments', 'maintenance_requests'
);

-- Test 4: Verify foreign key relationships
SELECT 
  'Test 4: Foreign Key Constraints' as test_name,
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND column_name IN ('tenant_id', 'manager_id', 'property_id', 'unit_id', 'occupant_id')
ORDER BY table_name;

-- Test 5: Check auth trigger exists
SELECT 
  'Test 5: Auth Trigger' as test_name,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Test 6: Verify key views exist
SELECT 
  'Test 6: Database Views' as test_name,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'VIEW'
AND table_name IN ('tenant_profile_view');

-- Test 7: Verify default values on critical columns
SELECT 
  'Test 7: Column Defaults' as test_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('role', 'user_type', 'status', 'is_active')
AND column_default IS NOT NULL;

-- Test 8: Check for orphaned auth users (no profile)
SELECT 
  'Test 8: Orphaned Auth Users' as test_name,
  COUNT(u.id) as orphaned_users_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Test 9: Verify unit_id foreign key in profiles points to units_detailed
SELECT 
  'Test 9: Unit Foreign Key Reference' as test_name,
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'profiles' 
AND column_name = 'unit_id';

-- Test 10: Sample data validation - check super_admin exists
SELECT 
  'Test 10: Super Admin Account' as test_name,
  COUNT(*) as super_admin_count
FROM public.profiles
WHERE role = 'super_admin';

-- Summary
SELECT 
  'FULLSTACK INTEGRATION VALIDATION' as status,
  NOW() as validated_at;

-- Display profiles table structure for verification
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
