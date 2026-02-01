-- ============================================================================
-- Migration: Fix Registration RLS Policies
-- Date: February 1, 2026
-- Purpose: Allow unauthenticated users to view active properties and vacant units
--          needed for the registration form
-- ============================================================================

-- Allow public access to active properties for registration
DROP POLICY IF EXISTS "properties_select_public_registration" ON public.properties;

CREATE POLICY "properties_select_public_registration" ON public.properties
  FOR SELECT
  USING (status = 'active' AND auth.uid() IS NULL);

-- Allow public access to vacant units for registration
DROP POLICY IF EXISTS "units_detailed_select_public_registration" ON public.units_detailed;

CREATE POLICY "units_detailed_select_public_registration" ON public.units_detailed
  FOR SELECT
  USING (status = 'vacant' AND auth.uid() IS NULL);

-- Also allow authenticated users to see vacant units
DROP POLICY IF EXISTS "units_detailed_select_any_vacant" ON public.units_detailed;

CREATE POLICY "units_detailed_select_any_vacant" ON public.units_detailed
  FOR SELECT
  USING (status = 'vacant');

-- Also allow authenticated users to see active properties
DROP POLICY IF EXISTS "properties_select_active" ON public.properties;

CREATE POLICY "properties_select_active" ON public.properties
  FOR SELECT
  USING (status = 'active');
