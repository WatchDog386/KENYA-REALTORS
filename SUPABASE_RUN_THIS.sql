-- COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
-- This adds the missing columns required by the Unit Manager

BEGIN;

-- 1. Add unit_type_id foreign key (Links Unit -> Unit Type)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS unit_type_id UUID REFERENCES public.property_unit_types(id) ON DELETE SET NULL;

-- 2. Add price column (For overriding unit prices)
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- 3. Add structural details
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 0;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS square_footage NUMERIC;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;

-- 4. Ensure status column exists
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

COMMIT;

-- Verify the changes
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units';
