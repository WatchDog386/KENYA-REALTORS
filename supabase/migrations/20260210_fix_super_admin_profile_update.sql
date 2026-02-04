-- ============================================================================
-- Fix Super Admin Profile Update Permissions
-- Date: February 10, 2026
-- Purpose: Allow super admins to update any profile (for approvals/assignments)
-- ============================================================================

-- Drop the old insufficient policy
DROP POLICY IF EXISTS "profiles_auth_admin_all" ON public.profiles;

-- Create new comprehensive policies for profiles table
-- Policy 1: Service role has full access (for backend/migrations)
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Authenticated users can read their own profile
CREATE POLICY "profiles_user_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy 3: Super admins can read any profile
CREATE POLICY "profiles_super_admin_select_all"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Policy 4: Authenticated users can update their own profile
CREATE POLICY "profiles_user_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 5: Super admins can update ANY profile (CRITICAL FOR APPROVALS)
CREATE POLICY "profiles_super_admin_update_all"
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

-- Policy 6: Authenticated users can insert their own profile
CREATE POLICY "profiles_user_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 7: Authenticated users can delete their own profile
CREATE POLICY "profiles_user_delete_own"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- Policy 8: Auth admin role can do anything (for Supabase internals)
CREATE POLICY "profiles_auth_admin_all"
    ON public.profiles FOR ALL
    TO supabase_auth_admin
    USING (true)
    WITH CHECK (true);

-- Verification query
-- SELECT role, status, COUNT(*) FROM public.profiles GROUP BY role, status;
