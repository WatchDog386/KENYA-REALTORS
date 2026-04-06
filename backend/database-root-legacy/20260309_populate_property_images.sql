-- ============================================================================
-- SCRIPT: Populate Properties with Image URLs
-- Date: March 9, 2026
-- Purpose: Ensure all properties have cover images
-- ============================================================================
-- IMPORTANT: Run this in your Supabase SQL Editor to populate properties with images
-- Then upload your own images to the Supabase storage bucket 'property_images'

BEGIN;

-- Update existing properties with placeholder images (you can replace with your own URLs)
-- Property 1: Ayden Homes Towers (already has an image, keep it)
-- Property 2: Pangani Plaza
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Pangani Plaza' AND image_url IS NULL;

-- Property 3: Westlands Executive
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Westlands Executive' AND image_url IS NULL;

-- Property 4: CBD Commerce Center
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'CBD Commerce Center' AND image_url IS NULL;

-- Property 5: Riverside Gardens
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1500595046891-9a04b02f59a8?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Riverside Gardens' AND image_url IS NULL;

-- Property 6: Kilimani Court
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Kilimani Court' AND image_url IS NULL;

-- Property 7: Karen Heights
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Karen Heights' AND image_url IS NULL;

-- Property 8: Muthaiga Residences
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Muthaiga Residences' AND image_url IS NULL;

-- Property 9: Upper Hill Modern
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Upper Hill Modern' AND image_url IS NULL;

-- Property 10: Roysambu Gateway
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000'
WHERE name = 'Roysambu Gateway' AND image_url IS NULL;

-- For any other properties without images, assign a default image
UPDATE public.properties
SET image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000'
WHERE image_url IS NULL OR image_url = '';

COMMIT;

-- Verification query - see all properties with their images
-- SELECT id, name, location, image_url FROM public.properties ORDER BY created_at DESC;
