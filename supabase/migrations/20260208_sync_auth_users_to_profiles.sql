-- ============================================================================
-- Sync existing auth users to profiles table (missing only)
-- Date: February 8, 2026
-- Purpose: Insert profiles for any auth.users without a profile
-- ============================================================================

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

-- Verification
SELECT 
  'Auth users synced to profiles' as status,
  COUNT(*) as total_profiles
FROM public.profiles;


-- View: all users from auth.users with profile data (fallback to auth metadata if profile missing)
CREATE OR REPLACE VIEW public.all_users_with_profile AS
SELECT
  u.id,
  u.email,
  COALESCE(p.first_name, u.raw_user_meta_data->>'first_name', SPLIT_PART(u.email, '@', 1)) AS first_name,
  COALESCE(p.last_name, u.raw_user_meta_data->>'last_name', '') AS last_name,
  COALESCE(p.role, u.raw_user_meta_data->>'role', 'tenant') AS role,
  COALESCE(p.status, u.raw_user_meta_data->>'status', 'active') AS status,
  COALESCE(p.is_active, true) AS is_active,
  u.created_at,
  COALESCE(p.updated_at, u.created_at) AS updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- To fetch all users, use:
-- SELECT * FROM public.all_users_with_profile ORDER BY created_at DESC;
