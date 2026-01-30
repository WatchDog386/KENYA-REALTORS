-- Create Tenants Table
DROP TABLE IF EXISTS public.tenants CASCADE;

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'evicted', 'pending', 'suspended')),
    move_in_date TIMESTAMP WITH TIME ZONE,
    move_out_date TIMESTAMP WITH TIME ZONE,
    emergency_contact TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_email TEXT,
    identity_document_type TEXT,
    identity_document_number TEXT,
    identity_verified BOOLEAN DEFAULT false,
    employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'student', 'retired', 'unemployed', 'other')),
    employer_name TEXT,
    employer_contact TEXT,
    monthly_income DECIMAL(10, 2),
    references JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tenants_user ON public.tenants(user_id);
CREATE INDEX idx_tenants_property ON public.tenants(property_id);
CREATE INDEX idx_tenants_unit ON public.tenants(unit_id);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_move_in_date ON public.tenants(move_in_date);
CREATE INDEX idx_tenants_move_out_date ON public.tenants(move_out_date);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view tenants in their properties" ON public.tenants;
DROP POLICY IF EXISTS "Tenants can view own data" ON public.tenants;

-- Policy: Super admins can manage all tenants
CREATE POLICY "Super admins can manage all tenants" 
ON public.tenants FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Policy: Property managers can view tenants in their properties
CREATE POLICY "Property managers can view tenants in their properties" 
ON public.tenants FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.property_manager_id = auth.uid()
        AND p.id = tenants.property_id
    )
);

-- Policy: Tenants can view their own data
CREATE POLICY "Tenants can view their own data" 
ON public.tenants FOR SELECT 
USING (user_id = auth.uid());

-- Policy: Tenants can update their own data
CREATE POLICY "Tenants can update their own data" 
ON public.tenants FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
