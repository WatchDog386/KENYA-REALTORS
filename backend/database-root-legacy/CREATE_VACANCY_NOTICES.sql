
-- ============================================================================
-- CREATE VACANCY NOTICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vacancy_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    move_out_date DATE NOT NULL,
    reason TEXT,
    
    -- Status Workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'inspection_scheduled', 'approved', 'rejected', 'completed')),
    
    -- Manager Interaction
    inspection_date TIMESTAMP WITH TIME ZONE,
    manager_response TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vacancy_notices ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- 1. Tenant can VIEW their own notices
CREATE POLICY "Tenants view own notices"
ON public.vacancy_notices FOR SELECT
USING (auth.uid() = tenant_id);

-- 2. Tenant can INSERT their own notices
CREATE POLICY "Tenants create own notices"
ON public.vacancy_notices FOR INSERT
WITH CHECK (auth.uid() = tenant_id);

-- 3. Managers can VIEW notices for their properties
CREATE POLICY "Managers view property notices"
ON public.vacancy_notices FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND property_id = public.vacancy_notices.property_id
        AND status = 'active'
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 4. Managers can UPDATE notices (schedule inspection, approve)
CREATE POLICY "Managers update property notices"
ON public.vacancy_notices FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND property_id = public.vacancy_notices.property_id
        AND status = 'active'
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
