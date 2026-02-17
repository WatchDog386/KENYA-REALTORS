-- ============================================================================
-- DIAGNOSTIC QUERY - Check if Registration Fix is Working
-- ============================================================================
-- Run this in Supabase SQL Editor to identify what's broken

-- 1. Check if trigger exists
SELECT 
  'TRIGGER CHECK' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = 'users' 
      AND trigger_name = 'on_auth_user_created'
    ) THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as status;

-- 2. Check if function exists and is SECURITY DEFINER
SELECT 
  'FUNCTION CHECK' as check_name,
  proname as routine_name,
  prosecdef as "Has_SECURITY_DEFINER"
FROM pg_proc
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Check RLS on profiles table
SELECT 
  'RLS CHECK' as check_name,
  tablename,
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Check service_role policy exists
SELECT 
  'SERVICE ROLE POLICY' as check_name,
  policyname,
  cmd as "Policy_Type",
  roles
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Service role full access';

-- 5. Check all policies on profiles
SELECT 
  policyname,
  cmd as "policy_type",
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Check profiles table structure
SELECT 
  'COLUMN CHECK' as check_name,
  COUNT(*) as total_columns,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 7. Try to get function definition
SELECT 
  'FUNCTION DEFINITION' as check_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public'
LIMIT 1;
