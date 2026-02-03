-- ============================================================================
-- Create Super Admin Profile for Duncan Marshel
-- Date: February 3, 2026
-- Purpose: Insert the super admin user profile into the database
-- ============================================================================

-- Step 1: Insert or update the profile for the super admin user
INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  user_type,
  status,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e',  -- User ID from auth
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'super_admin',
  'super_admin',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = 'duncanmarshel@gmail.com',
  role = 'super_admin',
  user_type = 'super_admin',
  status = 'active',
  is_active = true,
  first_name = 'Duncan',
  last_name = 'Marshel',
  updated_at = NOW();

-- Step 2: Verify the profile was created/updated
SELECT 'Super Admin Profile Created/Updated' as status;
SELECT id, email, role, status, is_active FROM public.profiles 
WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';
