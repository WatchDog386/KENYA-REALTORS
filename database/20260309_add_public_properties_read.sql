-- ============================================================================
-- MIGRATION: Add Public Read Access to Properties
-- Date: March 9, 2026
-- Purpose: Allow unauthenticated/public users to view properties for the homepage
-- ============================================================================

BEGIN;

-- Add public read policy for properties section
-- This allows anyone (authenticated or not) to view properties for the main website
CREATE POLICY "public_properties_select"
  ON public.properties
  FOR SELECT
  USING (true);

COMMIT;
