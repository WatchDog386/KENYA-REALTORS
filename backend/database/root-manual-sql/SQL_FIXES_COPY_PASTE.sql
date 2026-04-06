-- ============================================================================
-- PAYMENT FLOW FIX - COPY & PASTE IMPLEMENTATION GUIDE
-- ============================================================================
-- This file contains all the SQL you need to fix the payment flow issues.
-- 
-- USAGE:
-- 1. Open Supabase SQL Editor
-- 2. Copy the entire content of this section
-- 3. Paste into SQL Editor
-- 4. Click "Run"
-- 5. Verify no errors appear
--
-- Estimated execution time: 5-10 seconds
-- ============================================================================

-- ============================================================================
-- SECTION 1: FIX INVOICE RLS POLICIES (Complete tenant & manager access)
-- ============================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Property managers can view invoices for their properties" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Managers can view invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can insert invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can update invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Super admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenants can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;

-- Create new policies
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
-- SECTION 2: FIX TENANTS TABLE RLS POLICIES (Allow updates for payment flow)
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "tenant_see_own_assignment" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
DROP POLICY IF EXISTS "super_admin_tenants_all" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view own assignment" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view via tenant_id reference" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view property tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update own assignment" ON public.tenants;

-- New policies with proper UPDATE support
CREATE POLICY "Tenants can view own assignment"
ON public.tenants
FOR SELECT
USING (user_id = auth.uid());

-- Allow tenant to be identified by tenant ID as well (legacy compatibility)
CREATE POLICY "Tenants can view via tenant_id reference"
ON public.tenants
FOR SELECT
USING (id = auth.uid());

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

-- CRITICAL: Allow tenants to update their own assignments
-- This is needed because the RPC calls finalize_tenant_onboarding_invoice
-- which updates the tenants table
CREATE POLICY "Tenants can update own assignment"
ON public.tenants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SECTION 3: FIX LEASE APPLICATIONS RLS POLICIES
-- ============================================================================

ALTER TABLE public.lease_applications ENABLE ROW LEVEL SECURITY;

-- Drop old/legacy policies
DROP POLICY IF EXISTS "Tenants can submit lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can view own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can update own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can view lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can update lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Super admins can manage all lease applications" ON public.lease_applications;

-- Tenant creates and tracks own applications
CREATE POLICY "Tenants can submit lease applications"
ON public.lease_applications
FOR INSERT
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Tenants can view own lease applications"
ON public.lease_applications
FOR SELECT
USING (applicant_id = auth.uid());

CREATE POLICY "Tenants can update own lease applications"
ON public.lease_applications
FOR UPDATE
USING (
  applicant_id = auth.uid()
  AND status IN ('pending', 'under_review')
)
WITH CHECK (
  applicant_id = auth.uid()
  AND status IN ('pending', 'under_review')
);

-- Managers can review applications for their assigned properties
-- Supports property_manager_assignments, manager_assignments, and profile fallback
CREATE POLICY "Managers can view lease applications by assigned property"
ON public.lease_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
);

CREATE POLICY "Managers can update lease applications by assigned property"
ON public.lease_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.property_manager_assignments pma
    WHERE pma.property_id = lease_applications.property_id
      AND pma.property_manager_id = auth.uid()
      AND COALESCE(pma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.manager_assignments ma
    WHERE ma.property_id = lease_applications.property_id
      AND ma.manager_id = auth.uid()
      AND COALESCE(ma.status, 'active') = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.assigned_property_id = lease_applications.property_id
      AND p.role = 'property_manager'
  )
);

CREATE POLICY "Super admins can manage all lease applications"
ON public.lease_applications
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

-- ============================================================================
-- SECTION 4: GRANT PROPER PERMISSIONS
-- ============================================================================

-- Allow authenticated users to interact with invoices, tenants and applications
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lease_applications TO authenticated;

-- Allow service_role for backend operations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lease_applications TO service_role;

-- Ensure RPC can be called by authenticated users
GRANT EXECUTE ON FUNCTION public.finalize_tenant_onboarding_invoice(uuid, text) TO authenticated;

-- ============================================================================
-- SECTION 5: VERIFICATION QUERIES (Run these to confirm fixes are applied)
-- ============================================================================

-- Query 1: List all invoice policies
-- Expected: 6 policies (tenants can view, tenants can update, managers view/insert/update, super admin all)
SELECT 'INVOICE POLICIES:' as check_name, 
       tablename, policyname, qual as policy_definition
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY policyname;

-- Query 2: List all tenant policies
-- Expected: 5 policies (tenants view/update, managers view, super admin all, legacy tenant_id view)
SELECT 'TENANT POLICIES:' as check_name,
       tablename, policyname, qual as policy_definition
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY policyname;

-- Query 3: Check grants on invoices table
-- Expected: SELECT, INSERT, UPDATE for 'authenticated'
SELECT 'INVOICE GRANTS:' as check_name,
       privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_name = 'invoices'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Query 4: Check grants on tenants table
-- Expected: SELECT, INSERT, UPDATE for 'authenticated'
SELECT 'TENANT GRANTS:' as check_name,
       privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_name = 'tenants'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Query 5: List all lease application policies
-- Expected: 6 policies (tenant insert/select/update, manager select/update, super admin all)
SELECT 'LEASE APPLICATION POLICIES:' as check_name,
       tablename, policyname, qual as policy_definition
FROM pg_policies
WHERE tablename = 'lease_applications'
ORDER BY policyname;

-- Query 6: Check grants on lease_applications table
-- Expected: SELECT, INSERT, UPDATE for 'authenticated'
SELECT 'LEASE APPLICATION GRANTS:' as check_name,
       privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_name = 'lease_applications'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Query 7: Verify RPC exists
-- Expected: finalize_tenant_onboarding_invoice function
SELECT 'RPC FUNCTION:' as check_name,
       routine_name, routine_type, 
       CASE WHEN routine_definition ILIKE '%SECURITY DEFINER%' THEN 'SECURITY DEFINER' ELSE 'Regular' END as security_type
FROM information_schema.routines
WHERE routine_name = 'finalize_tenant_onboarding_invoice'
  AND routine_schema = 'public';

-- ============================================================================
-- SECTION 6: IF YOU NEED TO ROLLBACK
-- ============================================================================

-- Uncomment and run below if you need to undo these changes:
/*

-- Drop problematic policies
DROP POLICY IF EXISTS "Tenants can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Managers can view invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can insert invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Managers can update invoices by assigned property" ON public.invoices;
DROP POLICY IF EXISTS "Super admins can manage all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenants can update their own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Tenants can view own assignment" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view via tenant_id reference" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view property tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can update own assignment" ON public.tenants;

DROP POLICY IF EXISTS "Tenants can submit lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can view own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Tenants can update own lease applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can view lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Managers can update lease applications by assigned property" ON public.lease_applications;
DROP POLICY IF EXISTS "Super admins can manage all lease applications" ON public.lease_applications;

-- Revoke grants
REVOKE SELECT, INSERT, UPDATE ON public.invoices FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.tenants FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.lease_applications FROM authenticated;

*/

-- ============================================================================
-- SECTION 7: DOCUMENTATION
-- ============================================================================

/*

WHAT THIS FIXES:
================

1. 403 Error on /rest/v1/tenants
   Cause: RLS policies were too restrictive
   Fix: Added "Tenants can view own assignment" SELECT policy
   
2. Tenant can't update own record after payment
   Cause: No UPDATE policy for tenants
   Fix: Added "Tenants can update own assignment" UPDATE policy
   
3. RPC fails when updating tenant records
   Cause: Missing permissions
   Fix: Added GRANT EXECUTE on RPC to authenticated role

4. Invoice payment not marking as paid
   Cause: Tenant couldn't UPDATE invoices table
   Fix: Added "Tenants can update their own invoices" UPDATE policy

5. Manager can't create invoices for property
   Cause: No INSERT/UPDATE policies for managers
   Fix: Added manager INSERT/UPDATE policies on invoices

6. Tenant applications don't appear on the right manager dashboard
  Cause: lease_applications access rules did not account for real assignment sources
  Fix: Added manager SELECT/UPDATE policies on lease_applications with support for
      property_manager_assignments, manager_assignments, and profiles.assigned_property_id

HOW IT WORKS:
=============

When a tenant makes a payment:

1. MakePayment.tsx calls reconcileInitialAllocationInvoicesForTenant()
   - Queries invoices table (RLS: "Tenants can view their own invoices")
   - Updates invoices to status='paid' (RLS: "Tenants can update their own invoices")

2. Then calls finalizeTenantAssignmentFromInvoice()
   - Calls finalize_tenant_onboarding_invoice RPC
   - RPC extracts invoice metadata (UNIT_ID, PROPERTY_ID, etc.)
   - RPC updates tenants table (SECURITY DEFINER bypasses RLS)
   - RPC creates tenant_leases record
   - Returns success

3. TenantDashboard queries tenants table
   - RLS: "Tenants can view own assignment"
   - Finds active tenant record
   - hasActiveAssignment = true
   - Portal unlocks ✅

SECURITY:
=========

- Tenants can only access/modify their own data
- Managers can only access properties they're assigned to
- Super admins have full access to audit
- RPC is SECURITY DEFINER but validates user ownership before proceeding
- All operations are logged in invoice.notes

*/

-- End of implementation guide
-- All fixes are now applied!
-- Next step: Test the payment flow with a test tenant account
