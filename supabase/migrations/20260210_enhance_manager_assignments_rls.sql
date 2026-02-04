-- ============================================================================
-- Enhance Manager Assignments Table RLS
-- Date: February 10, 2026
-- Purpose: Ensure property managers can see their own assignments
-- and super admins can manage all assignments
-- ============================================================================

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "Allow public read" ON public.property_manager_assignments;

-- Policy 1: Service role full access
CREATE POLICY "assignments_service_role_all"
    ON public.property_manager_assignments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Super admins full access
CREATE POLICY "assignments_super_admin_all"
    ON public.property_manager_assignments FOR ALL
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

-- Policy 3: Property managers can read their own assignments
CREATE POLICY "assignments_manager_read_own"
    ON public.property_manager_assignments FOR SELECT
    USING (auth.uid() = property_manager_id);

-- Policy 4: Public read access (for now, can be restricted later)
CREATE POLICY "assignments_public_read"
    ON public.property_manager_assignments FOR SELECT
    USING (true);

-- Verification query
-- SELECT COUNT(*) as total_assignments FROM public.property_manager_assignments;
