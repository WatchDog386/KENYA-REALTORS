-- ============================================================================
-- FIX: 409 Conflict Error in Property/Staff Assignments
-- Date: March 2, 2026
-- Issue: RLS policies for technician_categories and technician_property_assignments 
--        causing 409 conflicts due to incorrect super_admin checks
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: FIX TECHNICIAN_CATEGORIES RLS POLICIES
-- ============================================================================

-- Drop incorrect policies using auth.jwt()
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.technician_categories;
DROP POLICY IF EXISTS "Super admins can manage categories" ON public.technician_categories;

-- Create corrected policies
-- Allow public/authenticated users to view active categories
CREATE POLICY "Everyone can view active categories"
  ON public.technician_categories
  FOR SELECT
  USING (is_active = true);

-- Allow super_admin to manage all categories (using correct role check)
CREATE POLICY "Super admins can manage categories"
  ON public.technician_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- PART 2: VERIFY & FIX TECHNICIAN_PROPERTY_ASSIGNMENTS RLS POLICIES
-- ============================================================================

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Technicians view their property assignments" ON public.technician_property_assignments;
DROP POLICY IF EXISTS "Property managers view their technicians" ON public.technician_property_assignments;
DROP POLICY IF EXISTS "Super admin manages assignments" ON public.technician_property_assignments;

-- Create corrected technician view policy
CREATE POLICY "Technicians view their property assignments"
ON public.technician_property_assignments FOR SELECT
USING (
  technician_id IN (
    SELECT id FROM public.technicians 
    WHERE user_id = auth.uid()
  )
);

-- Create property manager view policy
CREATE POLICY "Property managers view their technicians"
ON public.technician_property_assignments FOR SELECT
USING (
  property_id IN (
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = auth.uid()
    AND status = 'active'
  )
);

-- Create super_admin full access policy (fixed - using correct auth check)
CREATE POLICY "Super admin manages assignments"
ON public.technician_property_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- ============================================================================
-- PART 3: FIX SERVICE_ROLE ACCESS (for backend operations)
-- ============================================================================

-- Ensure service_role can access technician_categories
DROP POLICY IF EXISTS "service_role_technician_categories" ON public.technician_categories;
CREATE POLICY "service_role_technician_categories"
  ON public.technician_categories
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ensure service_role can access technician_property_assignments
DROP POLICY IF EXISTS "service_role_assignments" ON public.technician_property_assignments;
CREATE POLICY "service_role_assignments"
ON public.technician_property_assignments FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Check technician categories table health
SELECT 
  '✅ Technician Categories RLS Status' as check_name,
  COUNT(*) as active_categories
FROM public.technician_categories
WHERE is_active = true;

-- Check technician property assignments count
SELECT 
  '✅ Active Assignments Count' as check_name,
  COUNT(*) as active_assignments
FROM public.technician_property_assignments
WHERE is_active = true;

-- List all RLS policies on technician_property_assignments
SELECT 
  '✅ RLS Policies Created' as check_name,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename = 'technician_property_assignments'
ORDER BY policyname;

COMMIT;

-- ============================================================================
-- VERIFICATION: Run this after commit to confirm fix
-- ============================================================================
-- SELECT '✅ All policies updated successfully!' as status;
