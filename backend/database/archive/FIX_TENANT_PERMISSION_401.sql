-- ============================================================================
-- FIX 401 UNAUTHORIZED ERROR ON TENANTS TABLE
-- ============================================================================
-- The Super Admin portal 401 error happens because there is no RLS policy
-- allowing 'super_admin' users to INSERT into the 'tenants' table.
-- ============================================================================

-- 1. Ensure the is_super_admin() helper exists (Safe to re-run)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'super_admin' 
    AND is_active = true
  );
END;
$$;

-- 2. Verify RLS is enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy for Super Admins to Full Access on Tenants
DROP POLICY IF EXISTS "Super Admins full access to tenants" ON public.tenants;

CREATE POLICY "Super Admins full access to tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
)
WITH CHECK (
  public.is_super_admin()
);

-- 4. Create Policy for Property Managers
--    Allows managers to INSERT/UPDATE/DELETE tenants for properties they strictly manage.
--    This prevents 401 errors when a Property Manager tries to assign a tenant.
DROP POLICY IF EXISTS "Property Managers manage their tenants" ON public.tenants;

CREATE POLICY "Property Managers manage their tenants"
ON public.tenants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_manager_id = auth.uid()
    AND pma.property_id = tenants.property_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_manager_id = auth.uid()
    AND pma.property_id = property_id  -- Check the property_id of the new tenant row
  )
);

-- 5. Helper Policy: Ensure Property Managers can View Properties
--    (They need to see the property to assign a tenant to it)
DROP POLICY IF EXISTS "Property Managers view own properties" ON public.properties;

CREATE POLICY "Property Managers view own properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_manager_id = auth.uid()
    AND pma.property_id = properties.id
  )
);

