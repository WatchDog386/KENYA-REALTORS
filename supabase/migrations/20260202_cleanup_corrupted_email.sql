-- ============================================================================
-- Cleanup: Remove Corrupted/Invalid Email Entries
-- Date: February 2, 2026
-- Purpose: Remove korrifantes36gmail.com and similar invalid entries
-- ============================================================================

-- Step 1: Temporarily disable RLS to allow deletion
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete from profiles first (no foreign key issues)
DELETE FROM public.profiles 
WHERE email LIKE '%korrifantes36%' 
   OR email = 'korrifantes36gmail.com'
   OR email IS NULL 
   OR email = '';

-- Step 3: Delete from auth.users
-- Note: These will cascade delete related profiles
DELETE FROM auth.users 
WHERE email LIKE '%korrifantes36%' 
   OR email = 'korrifantes36gmail.com'
   OR email IS NULL 
   OR email = '';

-- Step 4: Re-enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify cleanup
SELECT 'Cleanup completed!' as status;
SELECT COUNT(*) as remaining_auth_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
SELECT COUNT(*) as null_or_empty_emails FROM public.profiles WHERE email IS NULL OR email = '';

-- Step 6: List any remaining suspicious entries
SELECT id, email, created_at FROM public.profiles 
WHERE email NOT LIKE '%@%' 
   AND email IS NOT NULL 
   AND email != '' 
LIMIT 10;
