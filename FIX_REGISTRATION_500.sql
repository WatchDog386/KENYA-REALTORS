-- FIX FOR 500 ERROR ON REGISTRATION PAGE
-- The 500 error is caused by conflicting or recursive RLS policies on properties/units tables.
-- This script resets them to a clean, working state for the registration flow.

-- ============================================================================
-- 1. PROPERTIES RLS FIX
-- ============================================================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop all existing select policies to remove conflicts
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Enable read access for all" ON public.properties;
DROP POLICY IF EXISTS "properties_select_public_registration" ON public.properties;
DROP POLICY IF EXISTS "properties_select_active" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Service role can manage properties" ON public.properties;

-- Create clean policies
CREATE POLICY "Everyone can view active properties" 
ON public.properties FOR SELECT 
USING (status = 'active');

CREATE POLICY "Service role full access properties" 
ON public.properties FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. UNITS RLS FIX
-- ============================================================================
ALTER TABLE public.units_detailed ENABLE ROW LEVEL SECURITY;

-- Drop all existing select policies to remove conflicts
DROP POLICY IF EXISTS "Public can view vacant units" ON public.units_detailed;
DROP POLICY IF EXISTS "Enable read access for all" ON public.units_detailed;
DROP POLICY IF EXISTS "units_detailed_select_public_registration" ON public.units_detailed;
DROP POLICY IF EXISTS "units_detailed_select_any_vacant" ON public.units_detailed;
DROP POLICY IF EXISTS "Anyone can view vacant units" ON public.units_detailed;
DROP POLICY IF EXISTS "Service role can manage units" ON public.units_detailed;

-- Create clean policies
CREATE POLICY "Everyone can view vacant units" 
ON public.units_detailed FOR SELECT 
USING (status = 'vacant');

-- Also allow viewing if status is reserved (might be needed for the user who just reserved it, though on registration they are anon)
-- Ideally we just need vacant for the dropdown.

CREATE POLICY "Service role full access units" 
ON public.units_detailed FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 3. UNIT SPECIFICATIONS RLS FIX (Referenced table)
-- ============================================================================
ALTER TABLE public.unit_specifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view specs" ON public.unit_specifications;

CREATE POLICY "Everyone can view specs" 
ON public.unit_specifications FOR SELECT 
USING (true);

-- ============================================================================
-- 4. PROFILES RLS (Just in case, ensure it's not blocking if referenced)
-- ============================================================================
-- Note: Some other fixes disable RLS on profiles. If enabled, we need public, non-recursive access if used in joins.
-- But standard properties query doesn't join profiles unless explicitly asked.

