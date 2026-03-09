-- FIX FULL MANAGER ACCESS (UNITS, TENANTS, LEASES)
-- This comprehensive script ensures managers have full control over the lifecycle of units and tenants.
-- INCLUDES SECURITY DEFINER FUNCTION TO PREVENT RLS RECURSION

BEGIN;

-- ============================================================================
-- 0. HELPER FUNCTION (BREAKS INFINITE RECURSION)
-- ============================================================================
-- Checks if the current user is a manager for the given unit's property.
-- SECURITY DEFINER bypasses RLS on 'units' and 'property_manager_assignments' inside the function,
-- preventing the 'units -> tenant_leases -> units' infinite loop.

CREATE OR REPLACE FUNCTION public.check_manager_access_to_unit(target_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.units u
        JOIN public.property_manager_assignments pma ON u.property_id = pma.property_id
        WHERE u.id = target_unit_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_manager_access_to_unit(UUID) TO authenticated;

-- ============================================================================
-- 1. UNITS (RE-APPLYING FOR SAFETY)
-- ============================================================================

-- Ensure status check allows all needed values
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_status_check;
ALTER TABLE public.units ADD CONSTRAINT units_status_check 
CHECK (status IN ('available', 'vacant', 'occupied', 'maintenance', 'reserved', 'booked'));

-- Drop old policies on units
DROP POLICY IF EXISTS "Unified View Policy" ON public.units;
DROP POLICY IF EXISTS "Manager Insert Policy" ON public.units;
DROP POLICY IF EXISTS "Manager Update Policy" ON public.units;
DROP POLICY IF EXISTS "Manager Delete Policy" ON public.units;
DROP POLICY IF EXISTS "manager_view_property_units" ON public.units;
DROP POLICY IF EXISTS "Manager Full Unit Access" ON public.units;
DROP POLICY IF EXISTS "Tenant View Own Unit" ON public.units;

-- Unified ALL (Select, Insert, Update, Delete) Policy for Managers
CREATE POLICY "Manager Full Unit Access" ON public.units
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = public.units.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Basic Select for Tenants (View their own unit)
CREATE POLICY "Tenant View Own Unit" ON public.units
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tenant_leases tl 
        WHERE tl.unit_id = public.units.id 
        AND tl.tenant_id = auth.uid()
    )
);

-- ============================================================================
-- 2. TENANTS TABLE (USER RECORDS)
-- ============================================================================

DROP POLICY IF EXISTS "Manager Manage Tenants" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;

CREATE POLICY "Manager Manage Tenants" ON public.tenants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = public.tenants.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- ============================================================================
-- 3. TENANT LEASES (JOIN TABLE)
-- ============================================================================

DROP POLICY IF EXISTS "Manager Manage Leases" ON public.tenant_leases;
DROP POLICY IF EXISTS "Users view their own leases" ON public.tenant_leases;

-- View own leases
CREATE POLICY "Users view their own leases" ON public.tenant_leases
FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

-- Manager Full Access - USES HELPER FUNCTION TO AVOID RECURSION
CREATE POLICY "Manager Manage Leases" ON public.tenant_leases
FOR ALL
TO authenticated
USING (
    public.check_manager_access_to_unit(unit_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
    public.check_manager_access_to_unit(unit_id)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

COMMIT;
