-- Create utility_settings table for global utility and service fees
CREATE TABLE IF NOT EXISTS public.utility_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    water_fee DECIMAL(12, 2) DEFAULT 0,
    electricity_fee DECIMAL(12, 2) DEFAULT 0,
    garbage_fee DECIMAL(12, 2) DEFAULT 0,
    security_fee DECIMAL(12, 2) DEFAULT 0,
    service_fee DECIMAL(12, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert a default row if it doesn't exist
INSERT INTO public.utility_settings (water_fee, electricity_fee, garbage_fee, security_fee, service_fee)
SELECT 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.utility_settings);

-- Enable RLS
ALTER TABLE public.utility_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read (tenants need to see it)
CREATE POLICY "Anyone can view utility settings"
    ON public.utility_settings FOR SELECT
    USING (true);

-- Only superadmins can update
CREATE POLICY "Superadmins can update utility settings"
    ON public.utility_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
        )
    );

-- Only superadmins can insert (though we only need one row)
CREATE POLICY "Superadmins can insert utility settings"
    ON public.utility_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'superadmin'
        )
    );
