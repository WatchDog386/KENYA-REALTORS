-- Comprehensive fixes for tenant payment and portal access flow
-- Fixes RLS for invoices, tenants, grants, and Edge Function

-- ============================================================================
-- SECTION 1: FIX INVOICE RLS POLICIES
-- ============================================================================

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
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;

-- Ensure tenant read policy works for both legacy tenant rows and profile-id tenant_id usage.
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

-- ============================================================================
-- SECTION 2: FIX TENANTS TABLE RLS POLICIES
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Remove conflicting policies
DROP POLICY IF EXISTS "tenant_see_own_assignment" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
DROP POLICY IF EXISTS "super_admin_tenants_all" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view own assignment" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view via tenant_id reference" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view property tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update own assignment" ON public.tenants;

-- Tenant can select/reference own tenant record AND query by user_id
CREATE POLICY "Tenants can view own assignment"
ON public.tenants
FOR SELECT
USING (user_id = auth.uid());

-- Tenant can read tenant rows when their id is stored (legacy compatibility)
CREATE POLICY "Tenants can view via tenant_id reference"
ON public.tenants
FOR SELECT
USING (id = auth.uid());

-- Manager can see tenants in their assigned properties
CREATE POLICY "Managers can view property tenants"
ON public.tenants
FOR SELECT
USING (
  property_id IN (
    SELECT property_id
    FROM public.property_manager_assignments
    WHERE property_manager_id = auth.uid()
      AND COALESCE(status, 'active') = 'active'
  )
);

-- Super admin can see all tenants
CREATE POLICY "Super admins can manage all tenants"
ON public.tenants
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

-- Tenants can update own assignments (needed for payment finalization)
CREATE POLICY "Tenants can update own assignment"
ON public.tenants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- SECURITY DEFINER functions can update tenants (for RPC finalization)
-- This is handled by SECURITY DEFINER in the RPC itself

-- ============================================================================
-- SECTION 3: PROPER GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;

-- Allow service role to work with both tables (needed by backend services)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;

-- ============================================================================
-- SECTION 4: ENSURE RPC IS PROPERLY SET UP
-- ============================================================================

-- The finalize_tenant_onboarding_invoice RPC uses SECURITY DEFINER
-- and has already been created in migration 20260328_finalize_tenant_onboarding_invoice_rpc.sql
-- Ensure it can be called by authenticated users
GRANT EXECUTE ON FUNCTION public.finalize_tenant_onboarding_invoice(uuid, text) TO authenticated;

-- ============================================================================
-- SECTION 5: ENSURE EDGE FUNCTION ACCESS
-- ============================================================================

-- Edge functions are handled through supabase.functions.invoke() 
-- CORS must be configured in supabase/config.toml
-- Ensure the verify-paystack-transaction edge function has proper CORS headers
