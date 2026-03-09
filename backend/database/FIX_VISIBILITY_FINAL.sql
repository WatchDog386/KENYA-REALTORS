-- ============================================================================
-- FIX: RELAX TECHNICIAN VISIBILITY (ALLOW VIEWING ALL REQUESTS IN CATEGORY)
-- Date: February 13, 2026
-- Purpose: Allow technicians to view unassigned requests in their category 
--          WITHOUT requiring specific property assignment.
-- ============================================================================

BEGIN;

-- 1. DROP old restrictive policies
DROP POLICY IF EXISTS "Technicians view assigned requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Technicians view relevant requests" ON public.maintenance_requests;

-- 2. CREATE simplified permissive policy
CREATE POLICY "Technicians view requests"
ON public.maintenance_requests FOR SELECT
USING (
  -- A. Explicit assignment (Directly assigned to this technician)
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  
  OR

  -- B. "Job Pool" Logic (Unassigned + Matching Category)
  -- REMOVED: Property Assignment Check (property_id IN ...)
  (
    -- Must be unassigned
    assigned_to_technician_id IS NULL 
    
    AND
    
    -- Request category must match Technician's category
    category_id IN (
        SELECT category_id FROM public.technicians WHERE user_id = auth.uid()
    )
  )
  
  OR
  
  -- C. Super Admin / Manager Fallbacks
  (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager'))
  )
);

COMMIT;
