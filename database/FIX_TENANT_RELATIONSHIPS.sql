-- FIX MISSING RELATIONSHIPS FOR TENANTS
-- This script adds the necessary Foreign Keys so the Leases Management can pull Property and Unit details.

BEGIN;

-- 1. Add Foreign Key for Properties (tenants -> properties)
DO $$
BEGIN
    -- Drop it first to ensure it points to the correct table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_property_id_fkey' AND table_name = 'tenants'
    ) THEN
        ALTER TABLE public.tenants DROP CONSTRAINT tenants_property_id_fkey;
    END IF;

    -- Add the constraint
    ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_property_id_fkey
    FOREIGN KEY (property_id)
    REFERENCES public.properties(id)
    ON DELETE SET NULL;
END $$;

-- 2. Add Foreign Key for Units (tenants -> units)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_unit_id_fkey' AND table_name = 'tenants'
    ) THEN
        ALTER TABLE public.tenants DROP CONSTRAINT tenants_unit_id_fkey;
    END IF;

    ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_unit_id_fkey
    FOREIGN KEY (unit_id)
    REFERENCES public.units(id)
    ON DELETE SET NULL;
END $$;

COMMIT;
