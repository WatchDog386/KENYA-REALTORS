-- FIX_CARETAKER_RLS_ACCESS.sql
-- Ensures caretakers can access the data they need

-- ============================================================================
-- STEP 1: Check existing RLS policies on properties
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: Check existing RLS policies on caretakers
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'caretakers'
ORDER BY policyname;

-- ============================================================================
-- STEP 3: Add/Update caretaker RLS policies
-- ============================================================================

-- 3a. Caretakers can read their own caretaker record
DROP POLICY IF EXISTS "caretakers_select_own" ON public.caretakers;
CREATE POLICY "caretakers_select_own"
ON public.caretakers FOR SELECT
USING (user_id = auth.uid());

-- 3b. Caretakers can update their own caretaker record (for report submissions etc.)
DROP POLICY IF EXISTS "caretakers_update_own" ON public.caretakers;
CREATE POLICY "caretakers_update_own"
ON public.caretakers FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3c. Property managers can view caretakers for properties they manage
-- Using a SECURITY DEFINER function to break the recursion chain
CREATE OR REPLACE FUNCTION public.get_manager_property_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = user_uuid AND status = 'active';
$$;

DROP POLICY IF EXISTS "managers_select_property_caretakers" ON public.caretakers;
CREATE POLICY "managers_select_property_caretakers"
ON public.caretakers FOR SELECT
USING (
    property_id IN (SELECT public.get_manager_property_ids(auth.uid()))
);

-- 3d. Super admins can do everything with caretakers
DROP POLICY IF EXISTS "super_admin_manage_caretakers" ON public.caretakers;
CREATE POLICY "super_admin_manage_caretakers"
ON public.caretakers FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================================================
-- STEP 4: Properties access for caretakers
-- ============================================================================

-- Caretakers can view properties they are assigned to
DROP POLICY IF EXISTS "caretakers_select_assigned_properties" ON public.properties;
CREATE POLICY "caretakers_select_assigned_properties"
ON public.properties FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- ============================================================================
-- STEP 5: Units access for caretakers
-- ============================================================================

-- Caretakers can view units in properties they are assigned to
DROP POLICY IF EXISTS "caretakers_select_assigned_units" ON public.units;
CREATE POLICY "caretakers_select_assigned_units"
ON public.units FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = property_id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- ============================================================================
-- STEP 6: Profiles access (for viewing manager info)
-- ============================================================================

-- All authenticated users can view basic profile info
-- (This should already exist but let's ensure it)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- STEP 6b: Property Manager Assignments access (for viewing actual property manager)
-- ============================================================================

-- First, drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "caretakers_select_manager_assignments" ON public.property_manager_assignments;

-- Property managers can see their own assignments (direct check, no recursion)
DROP POLICY IF EXISTS "managers_select_own_assignments" ON public.property_manager_assignments;
CREATE POLICY "managers_select_own_assignments"
ON public.property_manager_assignments FOR SELECT
USING (property_manager_id = auth.uid());

-- Super admins can see all assignments
DROP POLICY IF EXISTS "super_admin_select_assignments" ON public.property_manager_assignments;
CREATE POLICY "super_admin_select_assignments"
ON public.property_manager_assignments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Caretakers can view property manager assignments for their property
-- Using a SECURITY DEFINER function to break the recursion chain
CREATE OR REPLACE FUNCTION public.get_caretaker_property_id(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT property_id FROM public.caretakers 
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
$$;

DROP POLICY IF EXISTS "caretakers_select_manager_assignments_v2" ON public.property_manager_assignments;
CREATE POLICY "caretakers_select_manager_assignments_v2"
ON public.property_manager_assignments FOR SELECT
USING (
    property_id = public.get_caretaker_property_id(auth.uid())
);

-- ============================================================================
-- STEP 7: Maintenance requests access for caretakers
-- ============================================================================

-- Caretakers can view maintenance requests for their property
DROP POLICY IF EXISTS "caretakers_select_maintenance" ON public.maintenance_requests;
CREATE POLICY "caretakers_select_maintenance"
ON public.maintenance_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = maintenance_requests.property_id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- Caretakers can update maintenance requests for their property
DROP POLICY IF EXISTS "caretakers_update_maintenance" ON public.maintenance_requests;
CREATE POLICY "caretakers_update_maintenance"
ON public.maintenance_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.caretakers c
        WHERE c.property_id = maintenance_requests.property_id
        AND c.user_id = auth.uid()
        AND c.status = 'active'
    )
);

-- ============================================================================
-- VERIFICATION: Test caretaker access
-- ============================================================================

-- Test: Can caretaker see their assigned property?
-- Replace the UUID with the actual caretaker user_id
/*
SET request.jwt.claims TO '{"sub": "429227fe-d13b-4b03-80d0-737ea31ce56e"}';
SELECT * FROM public.caretakers WHERE user_id = '429227fe-d13b-4b03-80d0-737ea31ce56e';
SELECT * FROM public.properties WHERE id IN (SELECT property_id FROM public.caretakers WHERE user_id = '429227fe-d13b-4b03-80d0-737ea31ce56e');
*/

DO $$
BEGIN
    RAISE NOTICE '✅ Caretaker RLS policies created/updated successfully!';
    RAISE NOTICE 'Run the diagnostic queries to verify access.';
END $$;
