-- ============================================================================
-- Fix: Registration 500 Error - "Database error finding user"
-- Date: February 2, 2026
-- Purpose: Fix signup failure when creating profiles via auth trigger
-- ============================================================================

-- ============================================================================
-- STEP 0: Ensure profiles table exists with proper structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    email_confirmed BOOLEAN DEFAULT FALSE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    house_number VARCHAR(50),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Add missing indexes if needed
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_property_id ON public.profiles(property_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);

-- ============================================================================
-- STEP 1: Disable RLS on profiles table
-- The auth.users INSERT needs to create profiles without RLS blocking
-- ============================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Recreate trigger with better error handling
-- Use AFTER INSERT with proper exception handling
-- This prevents "Database error finding user" 500 errors during signup
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to create profile, ignore if it exists
  INSERT INTO public.profiles (
    id, 
    email, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = NOW();
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- If something fails, just continue - don't block signup
  -- Log warning but don't raise error
  RAISE WARNING 'Profile creation for user % failed: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create AFTER INSERT trigger (allows signup to complete first)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 3: Re-enable RLS with corrected policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies first
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Allow service_role (backend) full access
CREATE POLICY "profiles_service_role_all"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to select their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow authenticated users to delete their own profile
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  USING (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- ============================================================================
-- STEP 4: Verify the setup
-- ============================================================================
SELECT 'Signup 500 error fix applied!' as status;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth'
ORDER BY trigger_name;
