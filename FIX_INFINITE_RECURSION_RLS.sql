-- ============================================================================
-- CRITICAL FIX: Infinite Recursion in RLS Policies
-- Error: "infinite recursion detected in policy for relation 'profiles'"
-- Date: February 3, 2026
-- ============================================================================

-- The issue: Policies that reference the profiles table within themselves
-- cause infinite recursion. This happens when a policy uses a subquery that
-- tries to read from the same table being protected by the policy.

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY (to make changes)
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ============================================================================
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
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow signup profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for all" ON public.profiles;

-- ============================================================================
-- STEP 3: RE-ENABLE RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE NEW NON-RECURSIVE POLICIES
-- ============================================================================

-- Policy 1: Service role can do everything (no recursion - uses auth.role())
CREATE POLICY "Service role full access"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can read their own profile (no subquery)
CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for auth trigger)
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own profile (no subquery)
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 5: VERIFY THE FIX
-- ============================================================================
SELECT 'RLS Policies Fixed:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT 'Current profiles:' as check;
SELECT id, email, role, status, is_active FROM public.profiles LIMIT 10;
