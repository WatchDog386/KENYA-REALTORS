-- ============================================================================
-- FORCE SUPER ADMIN ROLE FOR SPECIFIC USER
-- Run this in your Supabase SQL Editor to guarantee duncanmarshel@gmail.com
-- has complete Super Admin access.
-- ============================================================================

BEGIN;

-- 1. Update the public.profiles table
UPDATE public.profiles
SET 
  role = 'super_admin',
  user_type = 'super_admin',
  status = 'active',
  is_active = true,
  approved = true
WHERE email = 'duncanmarshel@gmail.com';

-- 2. Update the auth metadata just to be absolutely certain
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"super_admin"'
      ),
      '{user_type}',
      '"super_admin"'
    )
WHERE email = 'duncanmarshel@gmail.com';

-- 3. Verify the update
SELECT id, email, role, user_type 
FROM public.profiles 
WHERE email = 'duncanmarshel@gmail.com';

COMMIT;
