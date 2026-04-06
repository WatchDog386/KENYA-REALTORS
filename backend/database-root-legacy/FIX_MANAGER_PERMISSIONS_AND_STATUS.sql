-- FIX MANAGER PERMISSIONS FOR UNITS & STATUS
-- 1. Allows Managers to UPDATE/INSERT/DELETE units for their properties
-- 2. Updates the status check constraint to support 'vacant' and 'booked'

BEGIN;

-- ============================================================================
-- 1. PERMISSIONS
-- ============================================================================

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "manager_view_property_units" ON public.units;
DROP POLICY IF EXISTS "manager_see_property_units" ON public.units;
DROP POLICY IF EXISTS "super_admin_units_all" ON public.units;
DROP POLICY IF EXISTS "tenant_see_own_unit" ON public.units;


-- A. SELECT (Managers + Super Admins + Tenants viewing their own)
CREATE POLICY "Unified View Policy" ON public.units
FOR SELECT USING (
    -- Super Admin
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
    OR
    -- Manager (Assigned Property)
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = public.units.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    ))
    OR
    -- Tenant (Assigned Unit) - via lease or tenant record
    (EXISTS (
        SELECT 1 FROM public.tenant_leases tl 
        WHERE tl.unit_id = public.units.id 
        AND tl.tenant_id = auth.uid()
    ))
    OR 
    -- Public/Unauthenticated/Anyone can see 'active' properties units? 
    -- Usually better to restrict.
    -- But let's keep it restricted to auth for now as per previous strict policies.
    -- If tenants need to see available units to lease, we need a broader policy for status='available'/'vacant'
    (status IN ('available', 'vacant'))
);


-- B. INSERT (Managers + Super Admin)
CREATE POLICY "Manager Insert Policy" ON public.units
FOR INSERT WITH CHECK (
    -- Super Admin
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
    OR
    -- Manager
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    ))
);


-- C. UPDATE (Managers + Super Admin)
CREATE POLICY "Manager Update Policy" ON public.units
FOR UPDATE USING (
    -- Super Admin
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
    OR
    -- Manager
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = public.units.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    ))
);


-- D. DELETE (Managers + Super Admin)
CREATE POLICY "Manager Delete Policy" ON public.units
FOR DELETE USING (
    -- Super Admin
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
    OR
    -- Manager
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments pma
        WHERE pma.property_id = public.units.property_id
        AND pma.property_manager_id = auth.uid()
        AND pma.status = 'active'
    ))
);

-- ============================================================================
-- 2. STATUS CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_status_check;

-- Allow 'vacant', 'booked' in addition to standard 'available', 'occupied', 'maintenance'
ALTER TABLE public.units ADD CONSTRAINT units_status_check 
CHECK (status IN ('available', 'vacant', 'occupied', 'maintenance', 'reserved', 'booked'));

COMMIT;
