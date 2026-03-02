CREATE TABLE IF NOT EXISTS public.utility_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    reading_month DATE NOT NULL, -- e.g., '2026-02-01' for Feb 2026
    previous_reading DECIMAL(10, 2) DEFAULT 0,
    current_reading DECIMAL(10, 2) DEFAULT 0,
    electricity_usage DECIMAL(10, 2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    electricity_rate DECIMAL(10, 2) DEFAULT 140,
    electricity_bill DECIMAL(12, 2) GENERATED ALWAYS AS ((current_reading - previous_reading) * 140) STORED,
    water_bill DECIMAL(12, 2) DEFAULT 0,
    garbage_fee DECIMAL(12, 2) DEFAULT 0,
    security_fee DECIMAL(12, 2) DEFAULT 0,
    other_charges DECIMAL(12, 2) DEFAULT 0,
    total_bill DECIMAL(12, 2) GENERATED ALWAYS AS (((current_reading - previous_reading) * 140) + water_bill + garbage_fee + security_fee + other_charges) STORED,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, reading_month)
);

-- RLS Policies
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;

-- Superadmin can do everything
CREATE POLICY "Superadmin can manage utility readings"
    ON public.utility_readings FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Property Manager can manage readings for their properties
CREATE POLICY "Manager can manage utility readings"
    ON public.utility_readings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'manager'
        )
    );

-- Tenants can view their own readings
CREATE POLICY "Tenants can view their own utility readings"
    ON public.utility_readings FOR SELECT
    USING (tenant_id = auth.uid());
