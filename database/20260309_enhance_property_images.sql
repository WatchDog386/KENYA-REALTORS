-- ============================================================================
-- MIGRATION: Add Image URL Support to Properties Table
-- Date: March 9, 2026
-- Purpose: Ensure properties table properly supports image URLs for all properties
-- ============================================================================

BEGIN;

-- Ensure image_url column exists and can store URLs
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.image_url IS 'Public URL to the property cover image (either from Supabase storage or external source)';

-- Update public read policy to include image_url in the response
DROP POLICY IF EXISTS "public_properties_select" ON public.properties;

CREATE POLICY "public_properties_select"
  ON public.properties
  FOR SELECT
  USING (true);

-- Create storage bucket for property images if it doesn't exist through SQL
-- Note: Buckets are usually created via dashboard, but we can ensure RLS on existing buckets

-- Ensure service role can always access properties for image serving
DROP POLICY IF EXISTS "service_role_read_all_properties" ON public.properties;

CREATE POLICY "service_role_read_all_properties"
  ON public.properties
  FOR SELECT
  USING (auth.role() = 'service_role');

COMMIT;
