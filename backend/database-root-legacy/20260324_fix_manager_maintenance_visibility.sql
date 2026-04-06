-- MIGRATION: Fix Property Manager Maintenance Request Visibility
-- Ensures property managers can only see maintenance requests for properties they are explicitly assigned to.

BEGIN;

-- 1. Ensure RLS is active on the table
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- 2. Drop *all* existing SELECT and UPDATE policies that might be giving overly broad access to property managers
DROP POLICY IF EXISTS "Global Maintenance Access" ON public.maintenance_requests;
DROP POLICY IF EXISTS "manager_view_maintenance_requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "manager_see_maintenance_requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Manager can update maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Manager can update property requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Manager can view property requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Managers view their property maintenance" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Managers update requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technicians view requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technician can update assigned requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants view own requests" ON public.maintenance_requests;

-- If there are any stray permissive policies for all auth users, drop them
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maintenance_requests;

-- 3. Re-create the strict policy for Property Managers to VIEW ONLY their assigned properties
CREATE POLICY "Managers view their property maintenance"
ON public.maintenance_requests
FOR SELECT
USING (
  -- Property Managers can see if they manage the property
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = maintenance_requests.property_id
      AND pma.property_manager_id = auth.uid()
      AND pma.status = 'active'
  )
  -- Super Admins see everything
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  -- Proprietors see own properties maintenance
  OR EXISTS (
    SELECT 1 FROM public.proprietor_properties pp
    JOIN public.proprietors pr ON pp.proprietor_id = pr.id
    WHERE pp.property_id = maintenance_requests.property_id AND pr.user_id = auth.uid() AND pp.is_active = true
  )
);

-- Tenants view
CREATE POLICY "Tenants view own requests" ON public.maintenance_requests
FOR SELECT
USING (tenant_id = auth.uid());

-- Technicians view
CREATE POLICY "Technicians view assigned requests" ON public.maintenance_requests
FOR SELECT 
USING (technician_id = auth.uid());

-- 4. Re-create the strict policy for Property Managers to UPDATE ONLY their assigned properties
CREATE POLICY "Managers update requests" 
ON public.maintenance_requests
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = public.maintenance_requests.property_id 
      AND pma.property_manager_id = auth.uid()
      AND pma.status = 'active'
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Technician can update assigned requests" 
ON public.maintenance_requests
FOR UPDATE 
USING (technician_id = auth.uid());

COMMIT;