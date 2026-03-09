-- FIX_MISSING_UNIT_TYPE_NAME.sql
-- Fixes the "column property_unit_types.unit_type_name does not exist" error
-- Run this in the Supabase SQL Editor

BEGIN;

-- Check if unit_type_name column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'unit_type_name') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "unit_type_name" TEXT;
    END IF;
    
    -- Ensure 'name' also exists just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'name') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "name" TEXT;
    END IF;
END $$;

-- Populate unit_type_name from name if it's null
UPDATE public.property_unit_types 
SET "unit_type_name" = "name" 
WHERE "unit_type_name" IS NULL AND "name" IS NOT NULL;

-- Populate name from unit_type_name if it's null
UPDATE public.property_unit_types 
SET "name" = "unit_type_name" 
WHERE "name" IS NULL AND "unit_type_name" IS NOT NULL;

COMMIT;
