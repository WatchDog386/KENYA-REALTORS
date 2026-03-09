-- FIX ALL REPORTED ISSUES
-- Date: 2026-02-19
-- 1. Fix property_unit_types columns (total_units_of_type, unit_type_name)
-- 2. Fix messages foreign keys (sender, recipient)
-- 3. Fix property_manager_assignments foreign keys
-- 4. Create maintenance-images storage bucket

BEGIN;

--------------------------------------------------------------------------------
-- 1. FIX PROPERTY UNIT TYPES
--------------------------------------------------------------------------------

-- Ensure total_units_of_type exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'total_units_of_type') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "total_units_of_type" INTEGER DEFAULT 0;
    END IF;

    -- If units_count exists, copy data to total_units_of_type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'units_count') THEN
        UPDATE public.property_unit_types SET total_units_of_type = units_count WHERE total_units_of_type = 0 OR total_units_of_type IS NULL;
    END IF;

    -- Ensure unit_type_name exists and is populated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'unit_type_name') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "unit_type_name" TEXT;
    END IF;
    
    -- Sync name and unit_type_name
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'name') THEN
        UPDATE public.property_unit_types SET unit_type_name = name WHERE unit_type_name IS NULL;
        UPDATE public.property_unit_types SET name = unit_type_name WHERE name IS NULL;
    END IF;
    
    -- Ensure price_per_unit exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_unit_types' AND column_name = 'price_per_unit') THEN
        ALTER TABLE public.property_unit_types ADD COLUMN "price_per_unit" DECIMAL(10,2) DEFAULT 0;
    END IF;

END $$;

--------------------------------------------------------------------------------
-- 2. FIX MESSAGES RELATIONSHIPS
--------------------------------------------------------------------------------

-- Drop existing constraints if they are broken or executed with wrong names
DO $$
BEGIN
    -- We'll try to add them if missing, safe to ignore "already exists" errors usually, 
    -- but explicit check is better.
    
    -- Ensure sender_id FK exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_sender_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Ensure recipient_id FK exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_recipient_id_fkey') THEN
        ALTER TABLE public.messages ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

END $$;

-- Also verify RLS policies for messages to ensure they are viewable
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id
);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id
);

--------------------------------------------------------------------------------
-- 3. FIX PROPERTY MANAGER ASSIGNMENTS RELATIONSHIPS
--------------------------------------------------------------------------------

-- Ensure foreign keys for property_manager_assignments
DO $$
BEGIN
    -- property_manager_id -> profiles.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_manager_assignments_property_manager_id_fkey') THEN
        ALTER TABLE public.property_manager_assignments 
        ADD CONSTRAINT property_manager_assignments_property_manager_id_fkey 
        FOREIGN KEY (property_manager_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- property_id -> properties.id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_manager_assignments_property_id_fkey') THEN
        ALTER TABLE public.property_manager_assignments 
        ADD CONSTRAINT property_manager_assignments_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- 4. CREATE MAINTENANCE-IMAGES BUCKET
--------------------------------------------------------------------------------

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-images', 'maintenance-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Maintenance Images Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Maintenance Images Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Maintenance Images Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Maintenance Images Owner Delete" ON storage.objects;

-- ALLOW PUBLIC READ ACCESS
CREATE POLICY "Maintenance Images Public Read" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'maintenance-images' );

-- ALLOW AUTHENTICATED UPLOAD
CREATE POLICY "Maintenance Images Auth Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
    bucket_id = 'maintenance-images' 
    AND auth.role() = 'authenticated'
);

-- ALLOW USERS TO UPDATE THEIR OWN UPLOADS
CREATE POLICY "Maintenance Images Owner Update" 
ON storage.objects FOR UPDATE
USING ( 
    bucket_id = 'maintenance-images' 
    AND auth.uid() = owner
);

-- ALLOW USERS TO DELETE THEIR OWN UPLOADS
CREATE POLICY "Maintenance Images Owner Delete" 
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'maintenance-images' 
    AND auth.uid() = owner
);

COMMIT;
