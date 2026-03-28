-- Fix invoice RLS to use property_manager_assignments and support tenant self-service payment updates.

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Remove legacy policies that depend on property_managers table metadata assumptions.
DROP POLICY IF EXISTS "Property managers can view invoices for their properties" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Managers can view invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can insert invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can update invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Super admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenants can update their own invoices" ON public.invoices;

-- Ensure tenant read policy works for both legacy tenant rows and profile-id tenant_id usage.
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;
CREATE POLICY "Tenants can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  tenant_id = auth.uid()
  OR auth.uid() = (
    SELECT t.user_id
    FROM public.tenants t
    WHERE t.id = invoices.tenant_id
    LIMIT 1
  )
);

-- Manager access via property_manager_assignments (the active mapping table in this codebase).
DROP POLICY IF EXISTS "Managers can view invoices by assigned property" ON public.invoices;
CREATE POLICY "Managers can view invoices by assigned property"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = invoices.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
);

DROP POLICY IF EXISTS "Managers can insert invoices by assigned property" ON public.invoices;
CREATE POLICY "Managers can insert invoices by assigned property"
ON public.invoices
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = invoices.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
);

DROP POLICY IF EXISTS "Managers can update invoices by assigned property" ON public.invoices;
CREATE POLICY "Managers can update invoices by assigned property"
ON public.invoices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = invoices.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = invoices.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
);

-- Super admin full invoice access from profiles role.
DROP POLICY IF EXISTS "Super admins can manage all invoices" ON public.invoices;
CREATE POLICY "Super admins can manage all invoices"
ON public.invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  )
);

-- Allow tenants to mark only their own invoices paid/partial during checkout flow.
DROP POLICY IF EXISTS "Tenants can update their own invoices" ON public.invoices;
CREATE POLICY "Tenants can update their own invoices"
ON public.invoices
FOR UPDATE
USING (
  tenant_id = auth.uid()
  OR auth.uid() = (
    SELECT t.user_id
    FROM public.tenants t
    WHERE t.id = invoices.tenant_id
    LIMIT 1
  )
)
WITH CHECK (
  tenant_id = auth.uid()
  OR auth.uid() = (
    SELECT t.user_id
    FROM public.tenants t
    WHERE t.id = invoices.tenant_id
    LIMIT 1
  )
);

GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
