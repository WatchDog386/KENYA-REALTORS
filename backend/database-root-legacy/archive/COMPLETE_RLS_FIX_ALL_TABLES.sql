-- ============================================================================
-- COMPREHENSIVE FIX: Diagnostic + Fix ALL RLS issues at once
-- Date: February 9, 2026
-- Run this SINGLE script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: DIAGNOSTICS - Check current state
-- ============================================================================

SELECT '=== DIAGNOSTIC REPORT ===' as section;

-- Check profiles table status
SELECT 
  'profiles table RLS status:' as check,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'profiles';

-- Check existing policies on profiles
SELECT 
  'Existing policies on profiles:' as check,
  policyname
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check if helper function exists
SELECT 
  'Helper function check:' as check,
  CASE WHEN EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_super_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check super_admin user profile
SELECT 
  'Super admin profiles in database:' as check,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM public.profiles
WHERE role = 'super_admin';

-- Check for missing profiles
SELECT 
  'Users without profiles:' as check,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT '=== END DIAGNOSTICS ===' as section;

-- ============================================================================
-- PART 2: CLEANUP - Drop ALL old problematic policies
-- ============================================================================

SELECT '=== CLEANUP PHASE ===' as section;

-- Drop all old policies on profiles
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
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;

-- Drop all old policies on properties
DROP POLICY IF EXISTS "Allow super admins to see all properties" ON public.properties;
DROP POLICY IF EXISTS "Allow managers to see assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their property" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their properties" ON public.properties;
DROP POLICY IF EXISTS "Allow super admins to manage all properties" ON public.properties;
DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_all" ON public.properties;

SELECT 'All old policies dropped' as status;

-- ============================================================================
-- PART 3: SETUP - Create helper function with SECURITY DEFINER
-- ============================================================================

SELECT '=== SETUP PHASE ===' as section;

-- Drop and recreate function
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = user_id LIMIT 1),
    FALSE
  )
$$;

SELECT 'Helper function is_super_admin created' as status;

-- ============================================================================
-- PART 4: PROFILES TABLE - New RLS Policies (NO RECURSION)
-- ============================================================================

SELECT '=== PROFILES TABLE POLICIES ===' as section;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- P1: Service role can do everything
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- P2: Users can insert their own profile
CREATE POLICY "profiles_users_insert_self"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- P3: Users can read their own profile
CREATE POLICY "profiles_users_select_self"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- P4: Users can update their own profile
CREATE POLICY "profiles_users_update_self"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- P5: Super admin can INSERT any profile
CREATE POLICY "profiles_admin_insert_any"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_super_admin(auth.uid()));

-- P6: Super admin can UPDATE any profile
CREATE POLICY "profiles_admin_update_any"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- P7: Super admin can SELECT all profiles
CREATE POLICY "profiles_admin_select_all"
    ON public.profiles FOR SELECT
    USING (public.is_super_admin(auth.uid()));

-- P8: Super admin can DELETE profiles
CREATE POLICY "profiles_admin_delete_any"
    ON public.profiles FOR DELETE
    USING (public.is_super_admin(auth.uid()));

SELECT 'Profiles table RLS policies created' as status;

-- ============================================================================
-- PART 5: PROPERTIES TABLE - New RLS Policies
-- ============================================================================

SELECT '=== PROPERTIES TABLE POLICIES ===' as section;

-- Drop old properties policies first
DROP POLICY IF EXISTS "properties_service_role_all" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_manage_all" ON public.properties;
DROP POLICY IF EXISTS "properties_managers_see_assigned" ON public.properties;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- P1: Service role can do everything
CREATE POLICY "properties_service_role_all"
    ON public.properties FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- P2: Super admin can see all properties
CREATE POLICY "properties_admin_select_all"
    ON public.properties FOR SELECT
    USING (public.is_super_admin(auth.uid()));

-- P3: Super admin can manage all properties (INSERT, UPDATE, DELETE)
CREATE POLICY "properties_admin_manage_all"
    ON public.properties FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- P4: Property managers can see properties where they're assigned
CREATE POLICY "properties_managers_see_assigned"
    ON public.properties FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.property_manager_assignments
        WHERE property_id = id 
        AND property_manager_id = auth.uid()
      )
    );

SELECT 'Properties table RLS policies created' as status;

-- ============================================================================
-- PART 6: OTHER TABLES - Tenants and Manager Assignments
-- ============================================================================

SELECT '=== OTHER TABLES POLICIES ===' as section;

-- Tenants table
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_service_role" ON public.tenants;
DROP POLICY IF EXISTS "tenants_admin_all" ON public.tenants;

CREATE POLICY "tenants_service_role"
    ON public.tenants FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "tenants_admin_all"
    ON public.tenants FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

SELECT 'Tenants table RLS policies created' as status;

-- Property manager assignments table
ALTER TABLE IF EXISTS public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_service_role" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_admin_all" ON public.property_manager_assignments;

CREATE POLICY "assignments_service_role"
    ON public.property_manager_assignments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "assignments_admin_all"
    ON public.property_manager_assignments FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

SELECT 'Property manager assignments RLS policies created' as status;

-- ============================================================================
-- PART 7: FINAL VERIFICATION
-- ============================================================================

SELECT '=== FINAL VERIFICATION ===' as section;

SELECT 
  'Total policies on profiles:' as check,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'profiles';

SELECT 
  'Total policies on properties:' as check,
  COUNT(*) as count
FROM pg_policies
WHERE tablename = 'properties';

SELECT 
  'Super admin user profiles:' as check,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM public.profiles
WHERE role = 'super_admin';

SELECT 
  'Users with profiles:' as check,
  COUNT(*) as count
FROM public.profiles;

SELECT 
  'Users without profiles (SHOULD FIX):' as check,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY' as final_status;
