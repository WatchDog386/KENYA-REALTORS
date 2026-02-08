-- ============================================================================
-- UPDATE AUTH USERS AND PROFILES SYNC
-- ============================================================================
-- This script updates the database to ensure all user fields from registration
-- are correctly stored and synchronized between auth.users and public.profiles.
--
-- Fields covered: Full Name (First/Last), Email, Account Type (Role/User Type), Phone
-- ============================================================================

-- 1. Ensure public.profiles has all necessary columns and valid types
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT; -- Stores 'tenant' or 'property_manager' as selected during signup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false; -- Used by AuthContext
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add constraints to ensure only valid account types are stored
-- Includes 'owner' for backward compatibility if needed, but focuses on the core 3 types
DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
    ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
    CHECK (role IN ('tenant', 'property_manager', 'super_admin', 'owner'));
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if constraint issues exist with current data
END $$;

-- 2. Update the handle_new_user trigger to capture all these fields
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
  -- Extract values from metadata
  -- Default to 'tenant' if role is missing/invalid to prevent errors
  role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  
  -- Ensure role is valid (fallback to tenant)
  IF role_value NOT IN ('tenant', 'property_manager', 'super_admin', 'owner') THEN
    role_value := 'tenant';
  END IF;

  meta_first_name := NEW.raw_user_meta_data->>'first_name';
  meta_last_name := NEW.raw_user_meta_data->>'last_name';
  meta_phone := NEW.raw_user_meta_data->>'phone';
  
  -- Default status logic
  -- SUPER ADMINS detected here are auto-approved (e.g. created by another admin)
  IF role_value = 'super_admin' THEN
    profile_status := 'active';
    is_approved := true;
  ELSE
    -- Tenants and Property Managers must be approved
    profile_status := 'pending';
    is_approved := false;
  END IF;

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
    (role_value = 'super_admin'), -- is_active true only if super_admin initially
    is_approved,                 -- approved
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
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill/Sync existing users (fix inconsistency between auth.users and profiles)
-- ============================================================================

-- Update profiles with data from auth.users (if profile data is missing)
-- CRITICAL: Ensures EXISTING Super Admins are not negatively affected and are marked Active/Approved
UPDATE public.profiles p
SET
  email = COALESCE(p.email, u.email),
  first_name = COALESCE(p.first_name, (u.raw_user_meta_data->>'first_name')::text),
  last_name = COALESCE(p.last_name, (u.raw_user_meta_data->>'last_name')::text),
  phone = COALESCE(p.phone, (u.raw_user_meta_data->>'phone')::text),
  -- If role is missing in profile, try to get it from metadata or default to tenant
  role = COALESCE(p.role, (u.raw_user_meta_data->>'role')::text),
  user_type = COALESCE(p.user_type, (u.raw_user_meta_data->>'role')::text),
  -- Set approved based on existing status or role - SAFEGUARD for super_admin
  approved = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE 
    ELSE COALESCE(p.approved, (p.status = 'active')) 
  END,
  -- Ensure super_admin status is active
  status = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN 'active' 
    ELSE COALESCE(p.status, 'pending') 
  END,
  -- Ensure super_admin is_active is true
  is_active = CASE 
    WHEN p.role = 'super_admin' OR (u.raw_user_meta_data->>'role')::text = 'super_admin' THEN TRUE 
    ELSE COALESCE(p.is_active, FALSE) 
  END
FROM auth.users u
WHERE p.id = u.id;

-- Insert missing profiles for any auth users that don't have one
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

