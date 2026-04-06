-- ============================================================================
-- APPLY SUPER ADMIN RLS POLICIES FOR PROFILE MANAGEMENT
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "profiles_super_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;

-- Allow super admins to create profiles for any user
CREATE POLICY "profiles_super_admin_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
      )
    );

-- Allow super admins to update profiles
CREATE POLICY "profiles_super_admin_update"
    ON public.profiles FOR UPDATE
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

-- Allow users to select their own profile
CREATE POLICY "profiles_user_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Verify policies created
SELECT 'Super admin policies applied successfully' as status;
