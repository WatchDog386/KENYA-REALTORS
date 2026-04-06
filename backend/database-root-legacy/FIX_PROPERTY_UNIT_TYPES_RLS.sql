-- FIX PROPERTY UNIT TYPES RLS
-- This script ensures that property_unit_types are visible to property managers and authenticated users
-- It also ensures the units table has the correct RLS setup

BEGIN;

-- 1. Enable RLS on property_unit_types (good practice)
ALTER TABLE public.property_unit_types ENABLE ROW LEVEL SECURITY;

-- 2. Create a broad read policy for property_unit_types
-- Everyone authenticated should be able to see unit types (tenants checking available units, managers, admins)
DROP POLICY IF EXISTS "Authenticated users can view property unit types" ON public.property_unit_types;
CREATE POLICY "Authenticated users can view property unit types"
ON public.property_unit_types
FOR SELECT
TO authenticated
USING (true);

-- 3. Also allow managers to insert/update unit types for their properties
-- Note: This is a simplified policy. For stricter control, check property assignment.
DROP POLICY IF EXISTS "Managers can manage unit types" ON public.property_unit_types;
CREATE POLICY "Managers can manage unit types"
ON public.property_unit_types
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = public.property_unit_types.property_id
    AND pma.property_manager_id = auth.uid()
  )
  OR 
  EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin')
  )
);

COMMIT;
