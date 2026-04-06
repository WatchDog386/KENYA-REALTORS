-- FIX UNITS SCHEMA
-- Add missing unit_type_id column to units table and establish relationship

BEGIN;

-- 1. Add unit_type_id to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS unit_type_id UUID REFERENCES public.property_unit_types(id) ON DELETE SET NULL;

-- 2. Add description if missing (Component uses it)
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add price if missing (Component uses it)
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- 4. Add floor_number if missing (Component uses it)
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 0;

-- 5. Ensure status column exists
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

COMMIT;

-- VERIFICATION
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units';
