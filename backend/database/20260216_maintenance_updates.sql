-- Add category_id to maintenance_requests to link request type to technician category
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.technician_categories(id);

-- Add technician_id to explicitly track the assigned technician (once they accept or are assigned)
ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES public.technicians(id);

-- Add completed_at for historical tracking
ALTER TABLE public.maintenance_requests
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update RLS Function to include Technicians
-- Technicians can view requests if:
-- 1. They are assigned to the property (via technician_property_assignments)
-- 2. The request category matches their category

CREATE OR REPLACE FUNCTION public.check_maintenance_access(target_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_user_id UUID;
  v_tech_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get request details
  SELECT * INTO v_request
  FROM public.maintenance_requests
  WHERE id = target_request_id;
  
  IF v_request.tenant_id IS NULL THEN RETURN FALSE; END IF;

  -- 1. Tenant (Owner)
  IF v_request.tenant_id = v_user_id THEN RETURN TRUE; END IF;

  -- 2. Manager (Assigned to Property)
  IF EXISTS (
    SELECT 1 FROM public.property_manager_assignments 
    WHERE property_id = v_request.property_id 
    AND property_manager_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Super Admin
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;

  -- 4. Technician Access
  -- Check if user is a technician
  SELECT id INTO v_tech_id FROM public.technicians WHERE user_id = v_user_id;
  
  IF v_tech_id IS NOT NULL THEN
    -- Check if technician is assigned to this property
    IF EXISTS (
        SELECT 1 FROM public.technician_property_assignments 
        WHERE technician_id = v_tech_id 
        AND property_id = v_request.property_id
    ) THEN
        -- Check if categories match (if category is set on request)
        -- If request has no category, maybe all property techs can see it? 
        -- Or strictly enforced? user said "technician in that category".
        -- Let's enforce category match if request has one.
        IF v_request.category_id IS NOT NULL THEN
            IF EXISTS (
                SELECT 1 FROM public.technicians 
                WHERE id = v_tech_id 
                AND category_id = v_request.category_id
            ) THEN
                RETURN TRUE;
            END IF;
        ELSE
            -- If no category assigned yet, maybe allow all assigned techs?
            -- For safety, let's say yes, or the Manager needs to categorize it.
            RETURN TRUE;
        END IF;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

-- Ensure Policies use this function (re-apply if needed)
DROP POLICY IF EXISTS "Global Maintenance Access" ON public.maintenance_requests;
CREATE POLICY "Global Maintenance Access" ON public.maintenance_requests
FOR ALL USING (public.check_maintenance_access(id));
