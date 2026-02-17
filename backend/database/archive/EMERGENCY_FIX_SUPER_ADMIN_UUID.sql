-- DIRECT FIX: Super Admin Login Issue
-- UUID: 0cef7b99-69ab-4a16-ba5b-b76fb0295e7e

-- Step 1: Verify current state
SELECT id, email, role, status, is_active 
FROM public.profiles 
WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';

-- Step 2: Update super admin profile with ALL required fields
UPDATE public.profiles
SET 
  role = 'super_admin',
  status = 'active',
  is_active = true,
  first_name = 'Duncan',
  last_name = 'Marshel',
  email = 'duncanmarshel@gmail.com',
  updated_at = NOW()
WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';

-- Step 3: Verify the update worked
SELECT id, email, role, status, is_active, first_name, last_name
FROM public.profiles 
WHERE id = '0cef7b99-69ab-4a16-ba5b-b76fb0295e7e';

-- Step 4: Check RLS policies on profiles table (this is likely the issue)
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 5: If RLS is blocking, temporarily disable to test
-- UNCOMMENT ONLY IF NEEDED - this disables all RLS on profiles table temporarily
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- After testing, re-enable with: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Test that super admin can now be queried
SELECT * FROM public.profiles WHERE email = 'duncanmarshel@gmail.com';
