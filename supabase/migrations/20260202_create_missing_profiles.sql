-- ============================================================================
-- Create Missing Profiles for Auth Users
-- Date: February 2, 2026
-- Purpose: Create profiles for users that exist in auth but not in profiles table
-- ============================================================================

-- Insert profiles for auth users that don't have profiles
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, updated_at = NOW();

SELECT 'Profiles created for missing users' as status;

-- Verify
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
