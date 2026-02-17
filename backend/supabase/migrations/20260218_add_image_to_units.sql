-- Add image_url to units table
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS image_url TEXT;
