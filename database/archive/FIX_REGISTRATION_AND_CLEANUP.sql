-- ============================================================================
-- FIX DB 500 ERROR ON REGISTRATION & CLEANUP OLD TRIGGERS
-- ============================================================================

-- 1. CLEANUP: Drop POTENTIAL conflicting triggers
-- We drop by name. These are common names used in previous migrations.
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS public_users_trigger ON auth.users;

-- Drop the function to ensure we start fresh
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ENSURE COLUMNS & CONSTRAINTS
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Re-apply constraint to ensure it matches our logic
DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
    ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
    CHECK (role IN ('tenant', 'property_manager', 'super_admin', 'owner'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. CREATE ROBUST TRIGGER FUNCTION
-- This one includes EXCEPTION HANDLING to prevent 500 Errors
-- ============================================================================
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
  -- Log the attempt (visible in Supabase Logs)
  RAISE LOG 'Handling new user creation for ID: %, Email: %', NEW.id, NEW.email;

  -- Extract values from metadata
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Validate Role
  IF role_value NOT IN ('tenant', 'property_manager', 'super_admin', 'owner') THEN
    role_value := 'tenant';
  END IF;

  meta_first_name := NEW.raw_user_meta_data->>'first_name';
  meta_last_name := NEW.raw_user_meta_data->>'last_name';
  meta_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Determine Status
  IF role_value = 'super_admin' THEN
    profile_status := 'active';
    is_approved := true;
  ELSE
    profile_status := 'pending';
    is_approved := false;
  END IF;

  BEGIN
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
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      user_type = COALESCE(EXCLUDED.user_type, public.profiles.user_type),
      role = COALESCE(EXCLUDED.role, public.profiles.role),
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Capture error but DO NOT FAIL the transaction
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    -- We deliberately return NEW so the Auth User is still created.
    -- The frontend will detect the missing profile and alert the user/admin.
  END;

  RETURN NEW;
END;
$$;

-- 4. RE-ATTACH TRIGGER
-- ============================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFY & SYNC EXISTING USERS
-- ============================================================================
UPDATE public.profiles p
SET
  email = COALESCE(p.email, u.email),
  first_name = COALESCE(p.first_name, (u.raw_user_meta_data->>'first_name')::text),
  last_name = COALESCE(p.last_name, (u.raw_user_meta_data->>'last_name')::text),
  phone = COALESCE(p.phone, (u.raw_user_meta_data->>'phone')::text),
  role = COALESCE(p.role, (u.raw_user_meta_data->>'role')::text),
  user_type = COALESCE(p.user_type, (u.raw_user_meta_data->>'role')::text),
  approved = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE 
    ELSE COALESCE(p.approved, (p.status = 'active')) 
  END,
  status = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN 'active' 
    ELSE COALESCE(p.status, 'pending') 
  END,
  is_active = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE 
    ELSE COALESCE(p.is_active, FALSE) 
  END
FROM auth.users u
WHERE p.id = u.id;

INSERT INTO public.profiles (
  id, email, first_name, last_name, phone, role, user_type, status, is_active, approved, created_at, updated_at
)
SELECT 
  u.id, 
  u.email, 
  (u.raw_user_meta_data->>'first_name')::text,
  (u.raw_user_meta_data->>'last_name')::text,
  (u.raw_user_meta_data->>'phone')::text,
  COALESCE((u.raw_user_meta_data->>'role')::text, 'tenant'),
  COALESCE((u.raw_user_meta_data->>'role')::text, 'tenant'),
  CASE WHEN (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN 'active' ELSE 'pending' END,
  CASE WHEN (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE ELSE FALSE END,
  CASE WHEN (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE ELSE FALSE END,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);