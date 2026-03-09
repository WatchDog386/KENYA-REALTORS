-- ============================================================================
-- FIX: TECHNICIAN RLS VISIBILITY FOR ASSIGNED JOB POOL
-- Date: February 13, 2026
-- Purpose: Allow technicians to view unassigned requests in their category and property
-- ============================================================================

BEGIN;

-- 1. DROP old restrictive policy
DROP POLICY IF EXISTS "Technicians view assigned requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technicians view relevant requests" ON public.maintenance_requests;

-- 2. CREATE robust policy
CREATE POLICY "Technicians view relevant requests"
ON public.maintenance_requests FOR SELECT
USING (
  -- A. Explicit assignment (Directly assigned to this technician)
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  
  OR

  -- B. "Job Pool" Logic (Unassigned + Matching Category + Matching Property)
  (
    -- Must be unassigned
    assigned_to_technician_id IS NULL 
    
    AND
    
    -- Request category must match Technician's category
    category_id IN (
        SELECT category_id FROM public.technicians WHERE user_id = auth.uid()
    )
    
    AND
    
    -- Request property must be in Technician's assigned list
    property_id IN (
        SELECT property_id FROM public.technician_property_assignments 
        WHERE technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
        AND is_active = true
    )
  )
  
  OR
  
  -- C. Super Admin (Always include for debugging/admin views if they use this endpoint)
  (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
  )
);

COMMIT;
