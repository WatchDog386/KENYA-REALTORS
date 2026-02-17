
-- MAINTENANCE SYSTEM UPDATE
-- 1. Ensure `maintenance_requests` exists with correct structure
-- 2. Create `maintenance_request_messages`
-- 3. Set up secure RLS

BEGIN;

-- ============================================================================
-- 1. MAINTENANCE REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL, -- Unit is optional if general property issue
    
    title TEXT,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    
    images TEXT[], -- Array of image URLs
    
    assigned_vendor_id UUID, -- For future extension
    scheduled_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Requests
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Help function for Maintenance Access (Security Definer to bypass recursion)
CREATE OR REPLACE FUNCTION public.check_maintenance_access(target_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_property_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get details
  SELECT tenant_id, property_id INTO v_tenant_id, v_property_id
  FROM public.maintenance_requests
  WHERE id = target_request_id;
  
  IF v_tenant_id IS NULL THEN RETURN FALSE; END IF;

  -- 1. Tenant (Owner)
  IF v_tenant_id = v_user_id THEN RETURN TRUE; END IF;

  -- 2. Manager (Assigned)
  IF EXISTS (
    SELECT 1 FROM public.property_manager_assignments 
    WHERE property_id = v_property_id 
    AND property_manager_id = v_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Super Admin
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;


-- Policies for REQUESTS
DROP POLICY IF EXISTS "Global Maintenance Access" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants view own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Managers view their property requests" ON public.maintenance_requests;

-- Select: Use function for consistency? Or simple policies. 
-- Simple policies are often faster for lists than calling a function for every row.
CREATE POLICY "Tenants view own requests" ON public.maintenance_requests
FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Managers view their property maintenance" ON public.maintenance_requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments 
    WHERE property_id = public.maintenance_requests.property_id 
    AND property_manager_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Insert: Tenants only
CREATE POLICY "Tenants create requests" ON public.maintenance_requests
FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Update: Managers (Status, Schedule), Tenants (Cancel?)
CREATE POLICY "Managers update requests" ON public.maintenance_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.property_manager_assignments 
    WHERE property_id = public.maintenance_requests.property_id 
    AND property_manager_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);


-- ============================================================================
-- 2. MAINTENANCE MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Messages
ALTER TABLE public.maintenance_request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_request_messages REPLICA IDENTITY FULL; 

-- Policies for Messages (Using the helper function)
DROP POLICY IF EXISTS "Users can view maintenance messages they have access to" ON public.maintenance_request_messages;
DROP POLICY IF EXISTS "Users can insert maintenance messages they have access to" ON public.maintenance_request_messages;

CREATE POLICY "Users can view maintenance messages they have access to"
ON public.maintenance_request_messages FOR SELECT
USING (
  public.check_maintenance_access(maintenance_request_id)
);

CREATE POLICY "Users can insert maintenance messages they have access to"
ON public.maintenance_request_messages FOR INSERT
WITH CHECK (
  public.check_maintenance_access(maintenance_request_id)
  AND sender_id = auth.uid()
);


COMMIT;
