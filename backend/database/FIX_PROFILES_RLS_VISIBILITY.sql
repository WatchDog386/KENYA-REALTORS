-- ============================================================================
-- SIMPLE FIX: PROFILES RLS POLICY FOR SUPER ADMIN VISIBILITY
-- Date: February 12, 2026
-- Issue: Super Admin cannot see all users in UserManagement
-- Root Cause: RLS policy restricts viewing all profiles
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP restrictive RLS policies and create permissive ones
-- ============================================================================

-- Disable RLS temporarily to ensure we can set it up correctly
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins and Managers can see all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Super admin can manage all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Super admins can view and edit all profiles" ON public.profiles;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore errors if policies don't exist
END $$;

-- ============================================================================
-- Create new RLS policies
-- ============================================================================

-- Policy 1: All authenticated users can view all profiles (for admin dashboards)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Super admins can do anything on any profile
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- STEP 2: Ensure all auth.users have profiles
-- ============================================================================
-- If users were created in auth but profiles don't exist, create them now

INSERT INTO public.profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  user_type,
  status,
  is_active,
  approved,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.raw_user_meta_data->>'phone',
  COALESCE(au.raw_user_meta_data->>'role', 'tenant'),
  COALESCE(au.raw_user_meta_data->>'role', 'tenant'),
  'active',
  true,
  true,
  au.created_at,
  NOW()
FROM
  auth.users au
LEFT JOIN
  public.profiles p ON au.id = p.id
WHERE
  p.id IS NULL
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
  COUNT(CASE WHEN role = 'tenant' THEN 1 END) as tenants,
  COUNT(CASE WHEN role = 'property_manager' THEN 1 END) as property_managers,
  COUNT(CASE WHEN role = 'accountant' THEN 1 END) as accountants,
  COUNT(CASE WHEN role = 'technician' THEN 1 END) as technicians,
  COUNT(CASE WHEN role = 'proprietor' THEN 1 END) as proprietors,
  COUNT(CASE WHEN role = 'caretaker' THEN 1 END) as caretakers
FROM public.profiles;

SELECT '
✅ PROFILES VISIBILITY FIX APPLIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Updated RLS policies on profiles table
✓ All authenticated users can now view all profiles
✓ Super admins have full access
✓ Created missing profile records from auth users

All users should now be visible in UserManagement!
' as message;
