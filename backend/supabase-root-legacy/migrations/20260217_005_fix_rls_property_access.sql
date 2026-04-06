-- ============================================================================
-- FIX RLS POLICIES FOR PROPERTY MANAGER ACCESS
-- Date: February 17, 2026
-- Purpose: Simplify RLS policies to fix 400 Bad Request errors
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP OLD COMPLEX POLICIES THAT CAUSE 400 ERRORS
-- ============================================================================

DROP POLICY IF EXISTS "manager_see_assigned_property" ON public.properties;
DROP POLICY IF EXISTS "manager_see_property" ON public.properties;
DROP POLICY IF EXISTS "manager_see_property_units" ON public.units;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_maintenance_requests" ON public.maintenance_requests;

-- ============================================================================
-- STEP 2: CREATE SIMPLIFIED POLICIES USING JOINS
-- ============================================================================

-- Property manager can see properties they have active assignments for
CREATE POLICY "manager_see_assigned_properties" ON public.properties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_id = properties.id
            AND pma.property_manager_id = auth.uid()
            AND pma.status = 'active'
        )
    );

-- Property manager can see units in properties they manage
CREATE POLICY "manager_view_property_units" ON public.units
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_id = units.property_id
            AND pma.property_manager_id = auth.uid()
            AND pma.status = 'active'
        )
    );

-- Property manager can see tenants in properties they manage
CREATE POLICY "manager_view_property_tenants" ON public.tenants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_id = tenants.property_id
            AND pma.property_manager_id = auth.uid()
            AND pma.status = 'active'
        )
    );

-- Property manager can see maintenance requests for properties they manage
CREATE POLICY "manager_view_maintenance_requests" ON public.maintenance_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_id = maintenance_requests.property_id
            AND pma.property_manager_id = auth.uid()
            AND pma.status = 'active'
        )
    );

-- ============================================================================
-- STEP 3: ENSURE PROPERTY_MANAGER_ASSIGNMENTS TABLE IS READABLE
-- ============================================================================

-- Make sure property managers can see their own assignments
DROP POLICY IF EXISTS "managers_select_own_assignments" ON public.property_manager_assignments;
CREATE POLICY "managers_select_own_assignments" ON public.property_manager_assignments
    FOR SELECT
    USING (property_manager_id = auth.uid());

-- ============================================================================
-- COMMIT CHANGES
-- ============================================================================

COMMIT;

-- ============================================================================
-- OPTIONAL: Run this to verify RLS policies are correctly set
-- ============================================================================
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
