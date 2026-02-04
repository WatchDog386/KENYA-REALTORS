-- ============================================================================
-- FIX: Restore Super Admin RLS Policy for property_manager_assignments
-- Date: February 4, 2026
-- Purpose: Allow super_admin users to insert/update property_manager_assignments
-- Issue: 401 error "new row violates row-level security policy"
-- Root Cause: Migration 20260211 dropped all policies but didn't re-add super_admin policy
-- ============================================================================

-- Step 1: First ensure the is_super_admin function exists
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

-- Step 2: Drop the overly restrictive policies
DROP POLICY IF EXISTS "assignments_service_role_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_public_read" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_super_admin_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_manager_read_own" ON public.property_manager_assignments;

-- Step 3: Create proper RLS policies that allow super_admin full access
-- Policy 1: Service role full access (for backend operations)
CREATE POLICY "assignments_service_role_all"
    ON public.property_manager_assignments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Super admins have full access (INSERT, UPDATE, DELETE, SELECT)
-- This is the CRITICAL policy that was missing
CREATE POLICY "assignments_super_admin_all"
    ON public.property_manager_assignments FOR ALL
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));

-- Policy 3: Property managers can read their own assignments
CREATE POLICY "assignments_manager_read_own"
    ON public.property_manager_assignments FOR SELECT
    USING (auth.uid() = property_manager_id);

-- Policy 4: Public read access for visibility
CREATE POLICY "assignments_public_read"
    ON public.property_manager_assignments FOR SELECT
    USING (true);

-- Step 4: Verify the fix
SELECT 'RLS Policies for property_manager_assignments restored' as status;

-- List all policies on property_manager_assignments
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'property_manager_assignments'
ORDER BY policyname;
