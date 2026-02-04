-- Reset Properties and create new schema
DROP TABLE IF EXISTS public.property_income_projections CASCADE;
DROP TABLE IF EXISTS public.units_detailed CASCADE;
DROP TABLE IF EXISTS public.unit_specifications CASCADE;
DROP TABLE IF EXISTS public.units CASCADE; -- Old units table
DROP TABLE IF EXISTS public.properties CASCADE;

-- Re-create properties table to ensure clean slate
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    image_url TEXT,
    type TEXT, -- e.g. Apartment, Commercial, Villa
    description TEXT,
    amenities TEXT, -- Comma separated list
    status TEXT DEFAULT 'Active', -- Active, Maintenance, Inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Delete all existing properties to start fresh as requested
DELETE FROM public.properties;

-- Create table for unit types
CREATE TABLE IF NOT EXISTS public.property_unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Bedsitter", "One Bedroom", "Rental Shop"
    units_count INTEGER NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_unit_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.properties;
DROP POLICY IF EXISTS "Allow public read access" ON public.properties;
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.property_unit_types;
DROP POLICY IF EXISTS "Allow public read access" ON public.property_unit_types;

-- Policies
CREATE POLICY "Enable all access for super admins" ON public.properties
    FOR ALL USING (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'super_admin'
        )
    );

CREATE POLICY "Allow public read access" ON public.properties FOR SELECT USING (true);

CREATE POLICY "Enable all access for super admins" ON public.property_unit_types
    FOR ALL USING (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'super_admin'
        )
    );

CREATE POLICY "Allow public read access" ON public.property_unit_types FOR SELECT USING (true);


-- Mock Data Creation
DO $$
DECLARE
    prop1_id UUID;
    prop2_id UUID;
    prop3_id UUID;
BEGIN
    -- Property 1
    INSERT INTO public.properties (name, location, image_url)
    VALUES 
    ('Sunrise Apartments', 'Westlands, Nairobi', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60')
    RETURNING id INTO prop1_id;

    INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
    VALUES 
    (prop1_id, 'Bedsitter', 15, 12000),
    (prop1_id, 'One Bedroom', 10, 25000),
    (prop1_id, 'Two Bedroom', 5, 45000);

    -- Property 2
    INSERT INTO public.properties (name, location, image_url)
    VALUES 
    ('Green Valley Estate', 'Kiambu Road', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60')
    RETURNING id INTO prop2_id;

    INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
    VALUES 
    (prop2_id, 'Two Bedroom', 20, 55000),
    (prop2_id, 'Three Bedroom', 10, 85000),
    (prop2_id, 'Rental Shop', 5, 30000);

    -- Property 3
    INSERT INTO public.properties (name, location, image_url)
    VALUES 
    ('Urban Living', 'Kilimani', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=60')
    RETURNING id INTO prop3_id;

    INSERT INTO public.property_unit_types (property_id, name, units_count, price_per_unit)
    VALUES 
    (prop3_id, 'Studio', 30, 22000),
    (prop3_id, 'One Bedroom', 15, 35000);

END $$;
