-- ============================================================================
-- FIX MISSING PROPERTY VIEW POLICIES
-- Date: February 2026
-- Purpose: Allow Proprietors, Caretakers, and Technicians to VIEW properties
--          they are assigned to.
-- ============================================================================

BEGIN;

-- 1. Proprietors View Policy
-- Allow proprietors to see properties they own (via proprietor_properties)
DROP POLICY IF EXISTS "proprietors_select_assigned_properties" ON public.properties;
CREATE POLICY "proprietors_select_assigned_properties"
ON public.properties FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.proprietor_properties pp
        JOIN public.proprietors p ON p.id = pp.proprietor_id
        WHERE pp.property_id = public.properties.id
        AND p.user_id = auth.uid()
        AND pp.is_active = true
    )
);

-- 2. Caretakers View Policy
-- Allow caretakers to see properties they are employed at (via caretakers table)
DROP POLICY IF EXISTS "caretakers_select_assigned_properties" ON public.properties;
CREATE POLICY "caretakers_select_assigned_properties"
ON public.properties FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = public.properties.id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- 3. Technicians View Policy
-- Allow technicians to see properties they are assigned to (via technician_property_assignments)
DROP POLICY IF EXISTS "technicians_select_assigned_properties" ON public.properties;
CREATE POLICY "technicians_select_assigned_properties"
ON public.properties FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.technician_property_assignments tpa
        JOIN public.technicians t ON t.id = tpa.technician_id
        WHERE tpa.property_id = public.properties.id
        AND t.user_id = auth.uid()
        AND tpa.is_active = true
    )
);

-- ============================================================================
-- PART 2: UNITS VIEW POLICIES
-- ============================================================================

-- 4. Proprietors View Units
DROP POLICY IF EXISTS "proprietors_select_assigned_units" ON public.units;
CREATE POLICY "proprietors_select_assigned_units"
ON public.units FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.proprietor_properties pp
        JOIN public.proprietors p ON p.id = pp.proprietor_id
        WHERE pp.property_id = public.units.property_id
        AND p.user_id = auth.uid()
        AND pp.is_active = true
    )
);

-- 5. Caretakers View Units
DROP POLICY IF EXISTS "caretakers_select_assigned_units" ON public.units;
CREATE POLICY "caretakers_select_assigned_units"
ON public.units FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = public.units.property_id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- 6. Technicians View Units
DROP POLICY IF EXISTS "technicians_select_assigned_units" ON public.units;
CREATE POLICY "technicians_select_assigned_units"
ON public.units FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.technician_property_assignments tpa
        JOIN public.technicians t ON t.id = tpa.technician_id
        WHERE tpa.property_id = public.units.property_id
        AND t.user_id = auth.uid()
        AND tpa.is_active = true
    )
);

COMMIT;

SELECT '✅ Successfully added PROPERTY and UNIT visibility policies for Proprietors, Caretakers, and Technicians.' as status;
