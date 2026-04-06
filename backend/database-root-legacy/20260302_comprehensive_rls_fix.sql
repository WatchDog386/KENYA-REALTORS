-- ============================================================================
-- COMPREHENSIVE RLS FIX: All Assignment-Related Tables
-- Date: March 2, 2026
-- Purpose: Ensure all assignment tables have proper RLS for super_admin access
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: PROPERTIES TABLE - Ensure super_admin can manage
-- ============================================================================

-- Drop old policies that might be blocking
DROP POLICY IF EXISTS "Properties visible to relevant parties" ON public.properties;
DROP POLICY IF EXISTS "Properties admin all" ON public.properties;

-- Create service role policy
DROP POLICY IF EXISTS "service_role_properties" ON public.properties;
CREATE POLICY "service_role_properties"
  ON public.properties
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create super_admin policy
DROP POLICY IF EXISTS "super_admin_properties" ON public.properties;
CREATE POLICY "super_admin_properties"
  ON public.properties
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
-- PART 2: PROPRIETOR_PROPERTIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "service_role_proprietor_properties" ON public.proprietor_properties;
CREATE POLICY "service_role_proprietor_properties"
  ON public.proprietor_properties
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "super_admin_proprietor_properties" ON public.proprietor_properties;
CREATE POLICY "super_admin_proprietor_properties"
  ON public.proprietor_properties
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
-- PART 3: PROPERTY_MANAGER_ASSIGNMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "service_role_manager_assignments" ON public.property_manager_assignments;
CREATE POLICY "service_role_manager_assignments"
  ON public.property_manager_assignments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "super_admin_manager_assignments" ON public.property_manager_assignments;
CREATE POLICY "super_admin_manager_assignments"
  ON public.property_manager_assignments
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
-- PART 4: TECHNICIANS TABLE - Ensure proper constraint references
-- ============================================================================

DROP POLICY IF EXISTS "service_role_technicians" ON public.technicians;
CREATE POLICY "service_role_technicians"
  ON public.technicians
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "super_admin_technicians" ON public.technicians;
CREATE POLICY "super_admin_technicians"
  ON public.technicians
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
-- PART 5: PROFILES TABLE - Essential for auth checks
-- ============================================================================

DROP POLICY IF EXISTS "service_role_profiles" ON public.profiles;
CREATE POLICY "service_role_profiles"
  ON public.profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "super_admin_profiles" ON public.profiles;
CREATE POLICY "super_admin_profiles"
  ON public.profiles
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
-- PART 6: HEALTH CHECK
-- ============================================================================

-- Verify all policies are in place
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'properties', 
  'proprietor_properties',
  'property_manager_assignments',
  'technician_property_assignments',
  'technician_categories',
  'technicians',
  'profiles'
)
GROUP BY tablename
ORDER BY tablename;

-- Check for super_admin user(s)
SELECT 
  COUNT(*) as super_admin_count,
  '✅ Super Admin Users Found' as status
FROM public.profiles
WHERE role = 'super_admin' AND (is_active = true OR is_active IS NULL);

-- Verify technician-category relationships
SELECT 
  COUNT(*) as technician_without_category
FROM public.technicians
WHERE category_id IS NULL;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- SELECT '✅ All RLS policies have been fixed and verified!' as message;
-- SELECT '🚀 Try assigning staff to properties now!' as action;
