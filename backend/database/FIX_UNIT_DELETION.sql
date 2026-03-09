
-- FIX UNIT DELETION CONSTRAINTS
-- This script modifies foreign keys referencing 'units' to allow deletion (ON DELETE SET NULL)
-- This fixes the "400 Bad Request" or "Foreign key violation" when trying to delete a unit.

BEGIN;

-- 1. TENANTS -> UNITS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'tenants' AND constraint_type = 'FOREIGN KEY'
    ) LOOP
        -- Check if this constraint references units(id) - (approximate check not easily done in simple SQL without looping pg_constraint)
        -- Instead, we will blindly drop strict constraints if we know their likely names or just ensure the column has the right constraint
        NULL;
    END LOOP;
    
    -- Try to drop common constraint names for unit_id on tenants
    -- We can query the catalog to find the exact constraint name for unit_id
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'tenants' AND kcu.column_name = 'unit_id' AND ccu.table_name = 'units'
    ) LOOP
        EXECUTE 'ALTER TABLE public.tenants DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Add the correct constraint
    ALTER TABLE public.tenants
    ADD CONSTRAINT tenants_unit_id_fkey_safe
    FOREIGN KEY (unit_id)
    REFERENCES public.units(id)
    ON DELETE SET NULL;
END $$;


-- 2. LEASES -> UNITS
DO $$
DECLARE r RECORD;
BEGIN
    -- Drop existing Foreign Keys on unit_id
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'leases' AND kcu.column_name = 'unit_id' AND ccu.table_name = 'units'
    ) LOOP
        EXECUTE 'ALTER TABLE public.leases DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Add safe constraint
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leases') THEN
        ALTER TABLE public.leases
        ADD CONSTRAINT leases_unit_id_fkey_safe
        FOREIGN KEY (unit_id)
        REFERENCES public.units(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- 3. MAINTENANCE_REQUESTS -> UNITS
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'maintenance_requests' AND kcu.column_name = 'unit_id' AND ccu.table_name = 'units'
    ) LOOP
        EXECUTE 'ALTER TABLE public.maintenance_requests DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    ALTER TABLE public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_unit_id_fkey_safe
    FOREIGN KEY (unit_id)
    REFERENCES public.units(id)
    ON DELETE SET NULL;
END $$;


-- 4. RENT_PAYMENTS -> UNITS
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'rent_payments' AND kcu.column_name = 'unit_id' AND ccu.table_name = 'units'
    ) LOOP
        EXECUTE 'ALTER TABLE public.rent_payments DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rent_payments') THEN
        ALTER TABLE public.rent_payments
        ADD CONSTRAINT rent_payments_unit_id_fkey_safe
        FOREIGN KEY (unit_id)
        REFERENCES public.units(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- 5. VACATION_NOTICES -> UNITS
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'vacation_notices' AND kcu.column_name = 'unit_id' AND ccu.table_name = 'units'
    ) LOOP
        EXECUTE 'ALTER TABLE public.vacation_notices DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vacation_notices') THEN
        ALTER TABLE public.vacation_notices
        ADD CONSTRAINT vacation_notices_unit_id_fkey_safe
        FOREIGN KEY (unit_id)
        REFERENCES public.units(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
