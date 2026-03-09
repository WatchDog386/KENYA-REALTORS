-- Add utility constants table to store metering configuration
CREATE TABLE IF NOT EXISTS public.utility_constants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utility_name VARCHAR(100) NOT NULL UNIQUE,
    constant DECIMAL(10, 4) DEFAULT 1,
    is_metered BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for utility_constants
ALTER TABLE public.utility_constants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select utility constants"
    ON public.utility_constants FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can insert utility constants"
    ON public.utility_constants FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can update utility constants"
    ON public.utility_constants FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Superadmin can delete utility constants"
    ON public.utility_constants FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Everyone can view utility constants"
    ON public.utility_constants FOR SELECT
    USING (TRUE);

-- Add fields to utility_settings for backward compatibility
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS water_constant DECIMAL(10, 4) DEFAULT 1;
ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS electricity_constant DECIMAL(10, 4) DEFAULT 1;

-- Insert default utility constants
INSERT INTO public.utility_constants (utility_name, constant, is_metered, description)
VALUES 
    ('Electricity', 1, TRUE, 'Metered utility - rate per unit'),
    ('Water', 1, TRUE, 'Metered utility - rate per unit'),
    ('Garbage', 1, FALSE, 'Fixed fee - not metered'),
    ('Security', 1, FALSE, 'Fixed fee - not metered'),
    ('Service', 1, FALSE, 'Fixed fee - not metered')
ON CONFLICT (utility_name) DO NOTHING;

-- Add dynamic utilities JSONB column if not exists
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
