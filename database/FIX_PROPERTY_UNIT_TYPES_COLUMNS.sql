-- FIX PROPERTY UNIT TYPES COLUMNS
-- This script standardize columns in property_unit_types to match application expectations
-- It ensures 'name' exists (copying from unit_type_name if needed) and vice versa.

BEGIN;

-- 1. Check if 'name' exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'name') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "name" TEXT;
        -- If unit_type_name exists, populate name from it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'unit_type_name') THEN
             UPDATE public.property_unit_types SET "name" = unit_type_name WHERE "name" IS NULL;
        END IF;
    END IF;

    -- 2. Check if 'unit_type_name' exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'unit_type_name') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "unit_type_name" TEXT;
        -- If name exists, populate unit_type_name from it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'name') THEN
             UPDATE public.property_unit_types SET "unit_type_name" = "name" WHERE "unit_type_name" IS NULL;
        END IF;
    END IF;

    -- 3. Ensure price_per_unit exists
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'price_per_unit') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN price_per_unit DECIMAL(12,2) DEFAULT 0;
    END IF;

    -- 4. Ensure unit_category exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'unit_category') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN unit_category VARCHAR(50) DEFAULT 'residential';
    END IF;

END $$;

-- 5. Force update of nulls to defaults
UPDATE public.property_unit_types SET "name" = 'Standard' WHERE "name" IS NULL;
UPDATE public.property_unit_types SET "unit_type_name" = 'Standard' WHERE "unit_type_name" IS NULL;
UPDATE public.property_unit_types SET "price_per_unit" = 0 WHERE "price_per_unit" IS NULL;
UPDATE public.property_unit_types SET "unit_category" = 'residential' WHERE "unit_category" IS NULL;

COMMIT;
