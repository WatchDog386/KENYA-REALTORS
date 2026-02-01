-- ============================================================================
-- Complete Database Reset: Keep Only Super Admin
-- Date: February 2, 2026
-- Purpose: Delete all users/profiles except dancunmarshel@gmail.com super admin
-- ============================================================================

-- Step 1: Temporarily disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete all profiles EXCEPT the super admin
DELETE FROM public.profiles 
WHERE email != 'dancunmarshel@gmail.com';

-- Step 3: Delete all auth users EXCEPT the super admin
DELETE FROM auth.users 
WHERE email != 'dancunmarshel@gmail.com';

-- Step 4: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify final state
SELECT 'Reset completed!' as status;
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT id, email, role FROM public.profiles;
