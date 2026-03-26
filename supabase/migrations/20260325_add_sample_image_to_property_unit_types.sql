-- Add optional representative image per unit type for vacancy marketing fallback.
ALTER TABLE public.property_unit_types
ADD COLUMN IF NOT EXISTS sample_image_url text;
