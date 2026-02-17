-- UPGRADE UNIT MANAGEMENT FEATURES

-- 1. Create Unit Images Table
CREATE TABLE IF NOT EXISTS public.unit_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add features to units (and sync possibility to types if needed)
-- Using text array for flexibility
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS description TEXT; -- Ensure exists

-- 3. Add same fields to property_unit_types for inheritance
ALTER TABLE public.property_unit_types
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Enable RLS for unit_images
ALTER TABLE public.unit_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read unit_images" ON public.unit_images
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/Managers manage unit_images" ON public.unit_images
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'property_manager')
        )
    );

-- 5. Tenant Assignments
-- We need to ensure we can link units to tenants. 
-- Usually this is done via a 'leases' table or direct link.
-- Checking current 'tenant_unit_assignments' or similar table existence
-- If not present, create one.

CREATE TABLE IF NOT EXISTS public.tenant_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    rent_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for leases
ALTER TABLE public.tenant_leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own leases" ON public.tenant_leases
    FOR SELECT TO authenticated USING (
        tenant_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'property_manager')
        )
    );

CREATE POLICY "Admins manage leases" ON public.tenant_leases
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'property_manager')
        )
    );

