-- ============================================================================
-- STEP 3: Create new non-recursive RLS policies for profiles
-- Run this THIRD in Supabase SQL Editor
-- ============================================================================

-- Drop any existing new policies first
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;

-- Policy 1: Service role (backend/auth trigger) can do everything
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can INSERT their own profile (for signup)
CREATE POLICY "profiles_user_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can SELECT their own profile
CREATE POLICY "profiles_user_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy 4: Users can UPDATE their own profile
CREATE POLICY "profiles_user_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 5: Super admin can INSERT any profile
CREATE POLICY "profiles_admin_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 6: Super admin can UPDATE any profile
CREATE POLICY "profiles_admin_update"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 7: Super admin can SELECT all profiles
CREATE POLICY "profiles_admin_select"
    ON public.profiles FOR SELECT
    USING (public.is_super_admin(auth.uid()));

-- Policy 8: Super admin can DELETE profiles
CREATE POLICY "profiles_admin_delete"
    ON public.profiles FOR DELETE
    USING (public.is_super_admin(auth.uid()));

SELECT 'Step 3 Complete: New non-recursive RLS policies created' as status;
