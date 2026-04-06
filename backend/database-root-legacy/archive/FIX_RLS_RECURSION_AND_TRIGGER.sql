-- ============================================================================
-- FIX RLS INFINITE RECURSION & REGISTRATION ERROR
-- ============================================================================
-- The "500 Database Error" is caused by Infinite Recursion in RLS policies.
-- When the `profiles` table checks if a user is a 'super_admin', it queries `profiles`.
-- But that query triggers the policy again, creating an infinite loop.
--
-- THIS SCRIPT FIXES IT BY:
-- 1. Creating a secure helper function to check admin status (bypassing RLS).
-- 2. Replacing recursive policies with safe ones.
-- 3. Ensuring the registration trigger is robust.
-- ============================================================================

-- 1. DROP DEPENDENT POLICIES FIRST (Avoid function dependency errors)
-- ============================================================================
DROP POLICY IF EXISTS "super_admins_manage_all" ON public.profiles;

-- 2. CREATE SECURE HELPER FUNCTION TO BREAK RECURSION
-- ============================================================================
-- Explicitly drop with parens to avoid "not unique" error if overloads exist
DROP FUNCTION IF EXISTS public.is_super_admin(); 

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS, breaking the loop
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  );
END;
$$;

-- 3. DROP EXISTING PROBLEM POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "service_role_all_access" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_access" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 4. CREATE NEW SAFE POLICIES
-- ============================================================================
-- Ensure required columns exist (prevents trigger failure on missing columns)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Service Role (Supabase Admin) - Full Access
CREATE POLICY "service_role_all_access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auth Admin (Supabase Auth trigger) - Full Access
DROP POLICY IF EXISTS "auth_admin_all_access" ON public.profiles;
CREATE POLICY "auth_admin_all_access"
  ON public.profiles FOR ALL
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

-- Users can read their OWN profile
DROP POLICY IF EXISTS "users_select_own_profile" ON public.profiles;
CREATE POLICY "users_select_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their OWN profile
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their OWN profile
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their OWN profile
DROP POLICY IF EXISTS "users_delete_own_profile" ON public.profiles;
CREATE POLICY "users_delete_own_profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Super Admins can see/edit ALL profiles (Uses the secure function!)
CREATE POLICY "super_admins_manage_all"
  ON public.profiles FOR ALL
  USING (public.is_super_admin());

-- 5. RE-APPLY THE REGISTRATION TRIGGER (Safety Check)
-- ============================================================================
-- Cleanup old triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value TEXT;
  profile_status TEXT;
  is_approved BOOLEAN;
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_phone TEXT;
BEGIN
  BEGIN
      -- Extract and Sanitize Data
      role_value := COALESCE(
        NEW.raw_user_meta_data->>'role',
        NEW.raw_user_meta_data->>'account_type',
        'tenant'
      );
      IF role_value NOT IN ('tenant', 'property_manager', 'super_admin', 'owner') THEN
        role_value := 'tenant';
      END IF;

      meta_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
      meta_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
      meta_phone := NEW.raw_user_meta_data->>'phone';
      
      -- Determine Status
      IF role_value = 'super_admin' THEN
        profile_status := 'active';
        is_approved := true;
      ELSE
        profile_status := 'pending';
        is_approved := false;
      END IF;

      -- Insert Profile (safe defaults for required fields)
      INSERT INTO public.profiles (
        id, 
        email, 
        first_name,
        last_name,
        phone,
        role,
        user_type,
        status,
        is_active,
        approved,
        created_at, 
        updated_at
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.email, ''), 
        meta_first_name,         
        meta_last_name,          
        meta_phone,              
        role_value,              
        role_value,              
        profile_status,
        (role_value = 'super_admin'),
        is_approved,
        COALESCE(NOW(), CURRENT_TIMESTAMP),
        COALESCE(NOW(), CURRENT_TIMESTAMP)
      )
      ON CONFLICT (id) DO UPDATE
      SET 
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        role = COALESCE(EXCLUDED.role, public.profiles.role),
        updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Profile creation failure: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- Attach Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. GRANT PERMISSIONS FOR THE HELPER FUNCTION
-- ============================================================================
-- Must specify empty parentheses () to avoid "function name is not unique" error
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon, service_role;
