
-- Migration to add details to units table (Updated)
BEGIN;

ALTER TABLE units ADD COLUMN IF NOT EXISTS floor_number INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS square_footage NUMERIC;
ALTER TABLE units ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE units ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;
ALTER TABLE units ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Add unit_type_id if it likely doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'unit_type_id') THEN
        ALTER TABLE units ADD COLUMN unit_type_id UUID REFERENCES public.property_unit_types(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
