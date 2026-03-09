-- ============================================================================
-- ADD TECHNICIAN VISIBILITY POLICY FOR MAINTENANCE REQUESTS
-- Date: February 19, 2026
-- Purpose: Allow technicians to view both assigned requests and unassigned 
--          requests that match their category (job pool)
-- ============================================================================

BEGIN;

-- 0. ENSURE REQUIRED COLUMNS EXIST FOR TECHNICIAN-MAINTENANCE WORKFLOW
-- Add technician assignment & categorization columns
ALTER TABLE IF EXISTS public.maintenance_requests 
ADD COLUMN IF NOT EXISTS assigned_to_technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.technician_categories(id) ON DELETE SET NULL;

-- Add priority field for request urgency (used by tenant form)
ALTER TABLE IF EXISTS public.maintenance_requests 
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Fix status enum to include 'pending' state (used when unassigned)
ALTER TABLE IF EXISTS public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;

ALTER TABLE IF EXISTS public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_status_check CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

-- 1. DROP old restrictive policies
DROP POLICY IF EXISTS "Technicians view assigned requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technicians view relevant requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technicians view requests" ON public.maintenance_requests;

-- 2. CREATE simplified permissive policy that allows:
--    A. Viewing directly assigned requests 
--    B. Viewing unassigned requests in their assigned properties with matching category
--    C. Viewing unassigned requests in their category (job pool)
--    D. Super admin/manager fallback
CREATE POLICY "Technicians view requests"
ON public.maintenance_requests FOR SELECT
USING (
  -- A. Explicit assignment (Directly assigned to this technician)
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  
  OR

  -- B. Property Pool (Unassigned + In assigned properties + Matching Category)
  (
    assigned_to_technician_id IS NULL 
    AND
    category_id IN (SELECT category_id FROM public.technicians WHERE user_id = auth.uid())
    AND
    property_id IN (
      SELECT property_id FROM public.technician_property_assignments 
      WHERE technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
      AND is_active = true
    )
  )
  
  OR
  
  -- C. Category Pool (Unassigned + Matching Category + No property requirement)
  (
    assigned_to_technician_id IS NULL 
    AND
    category_id IN (SELECT category_id FROM public.technicians WHERE user_id = auth.uid())
  )
  
  OR
  
  -- D. Super Admin / Manager Fallbacks
  (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager'))
  )
);

-- 3. ADD REMAINING RLS POLICIES (if missing)

-- Tenant can INSERT new requests
DROP POLICY IF EXISTS "Tenant can create requests" ON public.maintenance_requests;
CREATE POLICY "Tenant can create requests"
ON public.maintenance_requests FOR INSERT
WITH CHECK (tenant_id = auth.uid());

-- Technicians can UPDATE requests they are assigned to
DROP POLICY IF EXISTS "Technician can update assigned requests" ON public.maintenance_requests;
CREATE POLICY "Technician can update assigned requests"
ON public.maintenance_requests FOR UPDATE
USING (
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
);

-- Property managers can UPDATE requests for their properties
DROP POLICY IF EXISTS "Manager can update property requests" ON public.maintenance_requests;
CREATE POLICY "Manager can update property requests"
ON public.maintenance_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = maintenance_requests.property_id
    AND pma.property_manager_id = auth.uid()
    AND pma.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = maintenance_requests.property_id
    AND pma.property_manager_id = auth.uid()
    AND pma.status = 'active'
  )
);

-- Tenant can SELECT their own requests  
DROP POLICY IF EXISTS "Tenant can view own requests" ON public.maintenance_requests;
CREATE POLICY "Tenant can view own requests"
ON public.maintenance_requests FOR SELECT
USING (tenant_id = auth.uid());

-- Manager can SELECT all requests for properties they manage
DROP POLICY IF EXISTS "Manager can view property requests" ON public.maintenance_requests;
CREATE POLICY "Manager can view property requests"
ON public.maintenance_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments pma
    WHERE pma.property_id = maintenance_requests.property_id
    AND pma.property_manager_id = auth.uid()
    AND pma.status = 'active'
  )
);

-- Super admin can select all requests
DROP POLICY IF EXISTS "Super admin views all requests" ON public.maintenance_requests;
CREATE POLICY "Super admin views all requests"
ON public.maintenance_requests FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- 4. ENSURE TECHNICIAN_PROPERTY_ASSIGNMENTS RLS POLICIES EXIST

-- Technicians can view their own property assignments
DROP POLICY IF EXISTS "Technician view own assignments" ON public.technician_property_assignments;
CREATE POLICY "Technician view own assignments"
ON public.technician_property_assignments FOR SELECT
USING (
  technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
);

-- Super admin can manage all assignments
DROP POLICY IF EXISTS "Super admin manage assignments" ON public.technician_property_assignments;
CREATE POLICY "Super admin manage assignments"
ON public.technician_property_assignments FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- Property managers can view assignments for their properties
DROP POLICY IF EXISTS "Manager view property assignments" ON public.technician_property_assignments;
CREATE POLICY "Manager view property assignments"
ON public.technician_property_assignments FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = auth.uid() AND status = 'active'
  )
);

COMMIT;
