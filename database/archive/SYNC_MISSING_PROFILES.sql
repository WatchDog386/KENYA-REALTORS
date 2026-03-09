-- ============================================================================
-- FIX: Sync all auth.users to profiles table
-- Run this AFTER the main RLS fix script
-- ============================================================================

SELECT '=== SYNCING MISSING PROFILES ===' as section;

-- Create profiles for any auth.users that don't have profiles yet
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
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'tenant'),
  'active',
  true,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verify results
SELECT '=== SYNC RESULTS ===' as section;

SELECT 
  'Profiles synced/created' as check,
  COUNT(*) as total_profiles
FROM public.profiles;

SELECT 
  'Auth users count' as check,
  COUNT(*) as total_users
FROM auth.users;

SELECT 
  'Users still missing profiles' as check,
  COUNT(*) as orphaned_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT 
  'Super admin profiles' as check,
  COUNT(*) as super_admin_count,
  STRING_AGG(email, ', ') as super_admin_emails
FROM public.profiles
WHERE role = 'super_admin';

SELECT '✅ PROFILE SYNC COMPLETE' as final_status;
