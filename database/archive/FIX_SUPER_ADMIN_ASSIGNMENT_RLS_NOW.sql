-- ============================================================================
-- 🚀 QUICK FIX: Property Manager Assignment RLS
-- ============================================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- This fixes the 401 error when assigning properties to managers
-- ============================================================================

-- Step 1: Recreate the is_super_admin function to ensure it exists
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id 
        AND role = 'super_admin' 
        AND (is_active = true OR is_active IS NULL)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "assignments_service_role_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_public_read" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_super_admin_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_manager_read_own" ON public.property_manager_assignments;

-- Step 3: Create NEW policies with super_admin support
-- Policy 1: Service role (backend operations)
CREATE POLICY "assignments_service_role_all"
    ON public.property_manager_assignments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: SUPER ADMIN - Full access (this was missing!)
CREATE POLICY "assignments_super_admin_all"
    ON public.property_manager_assignments FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 3: Managers can read their own assignments
CREATE POLICY "assignments_manager_read_own"
    ON public.property_manager_assignments FOR SELECT
    USING (auth.uid() = property_manager_id);

-- Policy 4: Public read
CREATE POLICY "assignments_public_read"
    ON public.property_manager_assignments FOR SELECT
    USING (true);

-- Step 4: Verification - Run these to confirm the fix
SELECT '✅ Policies recreated. Checking current policies...' as message;

SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'property_manager_assignments'
ORDER BY policyname;

-- Step 5: Verify super_admin can access
SELECT '✅ Verifying super_admin access...' as message;

-- This query will show if your super_admin user can insert into property_manager_assignments
-- Replace 'duncanmarshel@gmail.com' with the actual super_admin email if different
SELECT 
    p.email,
    p.role,
    public.is_super_admin(p.id) as is_super_admin_check,
    '✅ Super admin verified' as status
FROM public.profiles p
WHERE p.role = 'super_admin' AND p.email = 'duncanmarshel@gmail.com'
LIMIT 1;

-- Step 6: All done!
SELECT '🎉 RLS fix complete! Try assigning properties again in the UI.' as message;
