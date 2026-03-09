-- URGENT FIX: PROPERTY MANAGER ASSIGNMENTS AND RLS
-- This script repairs RLS policies that might be preventing assignments from being saved.

BEGIN;

-- 1. Create robust role checking functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.custom_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'admin') -- Allow both super_admin and admin
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.custom_is_property_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'property_manager'
    );
END;
$$;

-- 2. Fix property_manager_assignments table permissions
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "super_admin_assignments_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "manager_see_own_assignment" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "managers_select_own_assignments" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "admin_manage_assignments" ON public.property_manager_assignments;

-- Create comprehensive Admin Policy (Insert, Update, Delete, Select)
CREATE POLICY "admin_manage_assignments" ON public.property_manager_assignments
    FOR ALL
    USING (public.custom_is_admin())
    WITH CHECK (public.custom_is_admin());

-- Create Property Manager Policy (Select Only - to see their own assignments)
CREATE POLICY "manager_view_own_assignments" ON public.property_manager_assignments
    FOR SELECT
    USING (property_manager_id = auth.uid());


-- 3. Ensure Profiles can be updated by Admins (for assigned_property_id)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    USING (public.custom_is_admin())
    WITH CHECK (public.custom_is_admin());

-- Ensure Profiles are readable
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (public.custom_is_admin());


-- 4. Verify/Fix Table Constraints (in case they are too restrictive)
-- Ensure the property_manager_id links continuously to auth.users
-- (This part is just schema validation, usually handled by initial migration)


-- 5. Fix Properties Table Access (so managers can see their assigned properties)
DROP POLICY IF EXISTS "manager_see_assigned_properties" ON public.properties;
CREATE POLICY "manager_see_assigned_properties" ON public.properties
    FOR SELECT
    USING (
        public.custom_is_admin() 
        OR 
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_id = properties.id
            AND pma.property_manager_id = auth.uid()
        )
    );

COMMIT;
