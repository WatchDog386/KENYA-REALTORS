-- Create property manager assignments table
CREATE TABLE IF NOT EXISTS public.property_manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(property_manager_id, property_id)
);

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.property_unit_types(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'moving_out')),
    move_in_date TIMESTAMP WITH TIME ZONE,
    move_out_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "Allow public read" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.tenants;
DROP POLICY IF EXISTS "Allow public read" ON public.tenants;

-- Policies for property_manager_assignments
CREATE POLICY "Enable all access for super admins" ON public.property_manager_assignments
    FOR ALL USING (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'super_admin'
        )
    );

CREATE POLICY "Allow public read" ON public.property_manager_assignments FOR SELECT USING (true);

-- Policies for tenants
CREATE POLICY "Enable all access for super admins" ON public.tenants
    FOR ALL USING (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'super_admin'
        )
    );

CREATE POLICY "Allow tenants to read own data" ON public.tenants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow public read" ON public.tenants FOR SELECT USING (true);
