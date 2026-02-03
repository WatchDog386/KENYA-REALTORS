-- ============================================================================
-- Sync existing auth users to profiles table
-- Date: February 3, 2026
-- Purpose: Create profiles for any existing auth users that don't have profiles
-- ============================================================================

-- Step 1: Create profiles for any auth users missing profiles
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
  COALESCE(u.raw_user_meta_data->>'status', 'active'),
  true,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 2: Verify sync
SELECT 
  'Auth users synced to profiles' as status,
  COUNT(*) as total_profiles
FROM public.profiles;

-- Step 3: List all synced users
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  status,
  is_active,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
