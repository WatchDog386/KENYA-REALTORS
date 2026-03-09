-- FIX: Super Admin Profile Creation & RLS Issues
-- Run these commands in Supabase SQL Editor if the migration failed

-- Step 1: Check if super admin auth user exists
SELECT id, email FROM auth.users WHERE email = 'duncanmarshel@gmail.com';

-- Step 2: Check if profile exists
SELECT id, email, role, status FROM public.profiles WHERE email = 'duncanmarshel@gmail.com';

-- Step 3: If profile doesn't exist, create it manually
-- Get the user ID from auth.users first, then insert into profiles
WITH admin_user AS (
  SELECT id, email FROM auth.users WHERE email = 'duncanmarshel@gmail.com'
)
INSERT INTO public.profiles (
  id, 
  email, 
  first_name, 
  last_name,
  role, 
  status, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  au.id, 
  au.email, 
  'Duncan', 
  'Marshel',
  'super_admin'::text, 
  'active'::text, 
  true, 
  NOW(), 
  NOW()
FROM admin_user au
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  status = 'active',
  is_active = true,
  first_name = 'Duncan',
  last_name = 'Marshel',
  updated_at = NOW();

-- Step 4: Verify super admin is now set up
SELECT id, email, role, status, is_active FROM public.profiles WHERE email = 'duncanmarshel@gmail.com';

-- Step 5: Check RLS policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Step 6: If there are RLS issues, you may need to disable RLS temporarily to check
-- DO NOT RUN unless you understand RLS implications:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- Then test login, then re-enable:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Check if there's an issue with the view
SELECT COUNT(*) FROM unassigned_users_view;

-- Step 8: Verify by querying profiles directly
SELECT id, email, role, status FROM public.profiles LIMIT 10;
