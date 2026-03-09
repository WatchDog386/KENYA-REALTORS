-- ============================================================================
-- TABLE GRANTS & PERMISSIONS FIX
-- Date: March 2, 2026
-- Purpose: Ensure all users have proper database permissions for assignments
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENSURE GRANTS ARE SET FOR ALL ASSIGNMENT TABLES
-- ============================================================================

-- Properties table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated, service_role;

-- Property unit types
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_unit_types TO authenticated, service_role;

-- Units
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated, service_role;

-- Proprietors
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietors TO authenticated, service_role;

-- Proprietor properties
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietor_properties TO authenticated, service_role;

-- Property manager assignments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_manager_assignments TO authenticated, service_role;

-- Technicians
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated, service_role;

-- Technician categories
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_categories TO authenticated, service_role;

-- Technician property assignments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_property_assignments TO authenticated, service_role;

-- Profiles (needed for RLS checks)
GRANT SELECT ON public.profiles TO authenticated, service_role;

-- ============================================================================
-- GRANT SEQUENCE PERMISSIONS
-- ============================================================================

-- This ensures that INSERT operations can generate new IDs if not using UUID defaults
DO $$ 
DECLARE 
    seq RECORD;
BEGIN
    FOR seq IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' 
    LOOP
        EXECUTE format('GRANT ALL ON SEQUENCE %I TO authenticated, service_role', seq.sequence_name);
    END LOOP;
END $$;

-- ============================================================================
-- VERIFY CURRENT PERMISSIONS
-- ============================================================================

-- Check that authenticated role has permissions on key tables
SELECT 
    table_name,
    privilege
FROM information_schema.role_table_grants
WHERE grantee IN ('authenticated', 'service_role')
AND table_name IN (
    'technician_property_assignments',
    'property_manager_assignments',
    'properties',
    'technicians',
    'profiles'
)
ORDER BY table_name, privilege;

COMMIT;

-- ============================================================================
-- CONFIRMATION
-- ============================================================================
-- SELECT '✅ All table grants have been verified!' as status;
