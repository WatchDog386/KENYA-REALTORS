-- ============================================================================
-- HOTFIX: Add missing RLS policies for users to access their own profiles
-- Date: February 11, 2026
-- Purpose: Allow authenticated users to read/write their own profile data and super admins to manage all profiles
-- ============================================================================

-- CRITICAL: Add policies for regular users (non-super-admin)
CREATE POLICY "profiles_user_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_user_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_user_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_user_delete_own"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

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

-- Verification
SELECT 'Policies created successfully' as status;
