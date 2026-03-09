-- FIX MISSING RELATIONSHIPS FOR MAINTENANCE REQUESTS
-- This script adds the necessary Foreign Keys so the Manager Dashboard can pull Property and Tenant names.

BEGIN;

-- 1. Add Foreign Key for Properties (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_maintenance_properties' AND table_name = 'maintenance_requests'
    ) THEN
        ALTER TABLE public.maintenance_requests 
        ADD CONSTRAINT fk_maintenance_properties 
        FOREIGN KEY (property_id) 
        REFERENCES public.properties(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Add Foreign Key for Units (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_maintenance_units' AND table_name = 'maintenance_requests'
    ) THEN
        ALTER TABLE public.maintenance_requests 
        ADD CONSTRAINT fk_maintenance_units 
        FOREIGN KEY (unit_id) 
        REFERENCES public.units(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add Foreign Key for Tenant Profiles (if missing)
-- This allows us to join `profiles` to get first_name/last_name using tenant_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_maintenance_tenant_profile' AND table_name = 'maintenance_requests'
    ) THEN
        ALTER TABLE public.maintenance_requests 
        ADD CONSTRAINT fk_maintenance_tenant_profile
        FOREIGN KEY (tenant_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;


-- 4. Ensure Messages Table Exists (Just in case)
CREATE TABLE IF NOT EXISTS public.maintenance_request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
