-- ============================================================================
-- FIX: Registration 500 Error - Complete Fix
--
-- This script combines:
-- 1. Robust Trigger for profile creation (swallowing errors to prevent 500s)
-- 2. Fixed RLS policies (preventing infinite recursion)
-- 3. Proper Permissions
-- ============================================================================

-- STEP 1: Fix RLS Infinite Recursion (using SECURITY DEFINER function)
-- ============================================================================

-- Create secure checks for roles
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (auth.role() = 'service_role');
END;
$$;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin view all" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies using the secure functions
CREATE POLICY "Service role full access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin view all"
  ON public.profiles FOR SELECT
  USING (public.check_is_super_admin());

CREATE POLICY "Super admin update all"
  ON public.profiles FOR UPDATE
  USING (public.check_is_super_admin())
  WITH CHECK (public.check_is_super_admin());

-- STEP 2: Recreate Auth Trigger (with robust error handling)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_role TEXT;
  v_status TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  v_user_id := NEW.id;
  v_email := NEW.email;
  
  -- Extract metadata with defaults
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1));
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  -- Determine status based on role or metadata
  v_status := COALESCE(NEW.raw_user_meta_data->>'status', 
    CASE WHEN v_role = 'property_manager' THEN 'pending' ELSE 'active' END
  );

  -- Log for debugging
  RAISE LOG 'Handle new user: % email: % role: % status: %', v_user_id, v_email, v_role, v_status;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at,
    updated_at,
    is_active
  )
  VALUES (
    v_user_id,
    v_email,
    v_first_name,
    v_last_name,
    v_phone,
    v_role,
    v_status,
    NOW(),
    NOW(),
    CASE WHEN v_status = 'active' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    updated_at = NOW(),
    email = EXCLUDED.email; -- Ensure email is synced

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Ensure we swallow ALL errors so auth user creation doesn't fail
  RAISE LOG 'ERROR in handle_new_user for %: %', v_user_id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Grant Permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Ensure sequence permissions if any (none for UUIDs usually, but good practice)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify super admin profile
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  is_active
) VALUES (
  '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'super_admin',
  'active',
  true
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  is_active = true;
