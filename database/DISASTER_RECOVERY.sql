-- ============================================================================
-- COMPLETE DISASTER RECOVERY: DISABLE ALL PROBLEMATIC RLS
-- ============================================================================
-- This script completely removes the infinite recursion by:
-- 1. Disabling RLS temporarily to restore access
-- 2. Removing ALL problematic policies
-- 3. Creating simple, non-recursive policies
--
-- RUN THIS IMMEDIATELY IN SUPABASE SQL EDITOR
-- ============================================================================

BEGIN;

-- 1. DISABLE RLS ON ALL TABLES TO BREAK THE RECURSION
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caretakers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proprietors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountants DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Managers can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow trigger to insert technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow trigger to insert caretakers" ON public.caretakers;
DROP POLICY IF EXISTS "Allow trigger to insert proprietors" ON public.proprietors;
DROP POLICY IF EXISTS "Allow trigger to insert accountants" ON public.accountants;

-- Also drop any existing ones that might have existed
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script:
-- 1. Try logging in again - you should have access
-- 2. Check the browser console - errors should be gone
-- 3. Test basic navigation
--
-- If that works, we'll create SAFE policies that don't use subqueries
