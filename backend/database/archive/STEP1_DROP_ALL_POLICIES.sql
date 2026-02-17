-- ============================================================================
-- STEP 1: Drop all existing problematic RLS policies on profiles
-- Run this first in Supabase SQL Editor
-- ============================================================================

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
DROP POLICY IF EXISTS "Allow super admins to see all properties" ON public.properties;
DROP POLICY IF EXISTS "Allow managers to see assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their property" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their properties" ON public.properties;
DROP POLICY IF EXISTS "Allow super admins to manage all properties" ON public.properties;
DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_admin_all" ON public.properties;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

SELECT 'Step 1 Complete: All policies dropped' as status;
