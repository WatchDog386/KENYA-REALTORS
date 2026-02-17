-- FIX_RECURSION_IMMEDIATE.sql
-- RUN THIS FIRST to fix the infinite recursion error

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "caretakers_select_manager_assignments" ON public.property_manager_assignments;

-- Property managers can see their own assignments (direct check, no recursion)
DROP POLICY IF EXISTS "managers_select_own_assignments" ON public.property_manager_assignments;
CREATE POLICY "managers_select_own_assignments"
ON public.property_manager_assignments FOR SELECT
USING (property_manager_id = auth.uid());

-- Super admins can see all assignments
DROP POLICY IF EXISTS "super_admin_select_assignments" ON public.property_manager_assignments;
CREATE POLICY "super_admin_select_assignments"
ON public.property_manager_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Recursion fix applied! Property managers can now access their assignments.';
END $$;
