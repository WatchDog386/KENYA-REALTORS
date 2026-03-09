-- ============================================================================
-- MIGRATION: Fix bills_and_utilities RLS Policies
-- DATE: 2026-02-28
-- PURPOSE: 
--   1. Add missing RLS policies for bills_and_utilities table
--   2. Update grants to allow authenticated users INSERT/UPDATE permissions
--   3. Enable tenants to see and update their own bills
-- ============================================================================

-- ============================================================================
-- PART 1: ADD RLS POLICIES FOR BILLS_AND_UTILITIES
-- ============================================================================

-- Super admin can see all bills_and_utilities
DROP POLICY IF EXISTS "super_admin_bills_all" ON public.bills_and_utilities;
CREATE POLICY "super_admin_bills_all" ON public.bills_and_utilities
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Property manager can see bills for their managed properties
DROP POLICY IF EXISTS "manager_see_property_bills" ON public.bills_and_utilities;
CREATE POLICY "manager_see_property_bills" ON public.bills_and_utilities
    USING (property_id IN (
        SELECT property_id FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() AND status = 'active'
    ));

-- Tenant can see and update their own unit's bills
DROP POLICY IF EXISTS "tenant_see_own_bills" ON public.bills_and_utilities;
CREATE POLICY "tenant_see_own_bills" ON public.bills_and_utilities
    USING (unit_id IN (
        SELECT unit_id FROM public.tenants WHERE user_id = auth.uid()
    ));

-- Allow authenticated users to insert bills_and_utilities (for new payment records)
DROP POLICY IF EXISTS "authenticated_insert_bills" ON public.bills_and_utilities;
CREATE POLICY "authenticated_insert_bills" ON public.bills_and_utilities
    WITH CHECK (
        unit_id IN (
            SELECT unit_id FROM public.tenants WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- PART 2: UPDATE GRANTS FOR BILLS_AND_UTILITIES
-- ============================================================================

-- Remove the old SELECT-only grant and add INSERT, UPDATE
REVOKE SELECT ON public.bills_and_utilities FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bills_and_utilities TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
