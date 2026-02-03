-- ============================================================================
-- IMMEDIATE ACTION REQUIRED: Fix Infinite Recursion RLS Error
-- Error Code: 42P17 - "infinite recursion detected in policy for relation 'profiles'"
-- ============================================================================
-- This script MUST be run in Supabase SQL Editor IMMEDIATELY
-- It will:
-- 1. Disable RLS temporarily to modify policies
-- 2. Drop all recursive/problematic policies
-- 3. Create new non-recursive policies
-- 4. Re-enable RLS with safe policies
-- ============================================================================

-- STEP 1: Check current state (for debugging)
SELECT 'BEFORE FIX:' as status;
SELECT schemaname, tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 2: Disable RLS to modify policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: Drop ALL problematic policies (these have recursive subqueries)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for own record" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own record" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for service role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow signup profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;

-- STEP 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create NEW non-recursive policies
-- These use ONLY auth.uid() and auth.role() - NO subqueries

-- Policy 1: Service role (backend) can do everything
CREATE POLICY "Service role full access"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can SELECT their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 3: Users can INSERT their own profile (for auth trigger)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- STEP 6: Verify the fix
SELECT 'AFTER FIX - Current Policies:' as status;
SELECT schemaname, tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- STEP 7: Test that user can be queried
SELECT 'Testing user query:' as status;
SELECT id, email, role, status, is_active 
FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';

-- STEP 8: Verify RLS is enabled
SELECT 'RLS Status:' as status;
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';
