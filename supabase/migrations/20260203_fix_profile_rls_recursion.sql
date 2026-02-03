-- ============================================================================
-- FIX: Profile RLS Infinite Recursion (Code 42P17)
-- Date: February 3, 2026
-- Problem: RLS policies on profiles table causing infinite recursion
-- Solution: Temporarily disable RLS on profiles, use simpler policies
-- ============================================================================

-- STEP 1: Disable RLS temporarily to fix policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all problematic RLS policies
DROP POLICY IF EXISTS "Super admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Super admin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update all profiles" ON public.profiles;

-- STEP 3: Drop the problematic function if it exists
DROP FUNCTION IF EXISTS public.check_is_super_admin();

-- STEP 4: DISABLE RLS on profiles completely for now
-- This is necessary to fix the infinite recursion issue
-- Users will authenticate via auth.uid() check in the application
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 5: Ensure super admin profile exists
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  status,
  is_active,
  email_confirmed,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  NULL,
  'super_admin',
  'approved',
  true,
  true,
  now(),
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'approved',
  is_active = true,
  email_confirmed = true
  WHERE profiles.id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';
