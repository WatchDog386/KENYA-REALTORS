-- Fix infinite recursion in profiles policies

BEGIN;

-- 1. Helper function to check super admin status securely
-- SECURITY DEFINER bypasses RLS on the tables accessed inside the function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- 2. Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "super_admin_profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_users_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert_any" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_any" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete_any" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;


-- 3. Create new clean policies

-- A. Service Role Full Access
CREATE POLICY "service_role_profiles_all" ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- B. Super Admin Full Access (using the non-recursive function)
CREATE POLICY "super_admin_profiles_full_access" ON public.profiles
FOR ALL
TO authenticated
USING ( public.is_super_admin() )
WITH CHECK ( public.is_super_admin() );

-- C. Users can VIEW all profiles (required for some UI features like messaging)
-- Or at least view their own. Let's allowing viewing all for now as per "Profiles are viewable by everyone"
CREATE POLICY "profiles_view_all" ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- D. Users can UPDATE their own profile
CREATE POLICY "users_update_own_profile" ON public.profiles
FOR UPDATE
TO authenticated
USING ( id = auth.uid() )
WITH CHECK ( id = auth.uid() );

-- E. Users can INSERT their own profile (during sign up)
CREATE POLICY "users_insert_own_profile" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( id = auth.uid() );

COMMIT;
