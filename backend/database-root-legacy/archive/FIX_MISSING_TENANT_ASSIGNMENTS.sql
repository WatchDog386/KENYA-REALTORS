-- ============================================================================
-- FIX: MISSING ASSIGNMENTS FOR TENANTS & PROPERTY MANAGERS
-- Run this to identify and fix users missing property/unit assignments
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY AFFECTED TENANTS (NULL PROPERTY/UNIT)
-- ============================================================================

-- Find all tenants with NULL property_id or unit_id
SELECT 
    p.id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    t.id as tenant_record_id,
    t.property_id,
    t.unit_id,
    t.status,
    t.created_at as tenant_assigned_at,
    p.approved_at
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
WHERE p.role = 'tenant' AND t.id IS NOT NULL AND (t.property_id IS NULL OR t.unit_id IS NULL)
ORDER BY p.approved_at DESC;

-- Count of affected tenants
SELECT 
    'TENANTS - MISSING ASSIGNMENTS' as category,
    COUNT(*) as total_tenants_missing_property,
    COUNT(CASE WHEN t.property_id IS NULL THEN 1 END) as missing_property_id,
    COUNT(CASE WHEN t.unit_id IS NULL THEN 1 END) as missing_unit_id,
    COUNT(CASE WHEN t.property_id IS NULL AND t.unit_id IS NULL THEN 1 END) as missing_both
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
WHERE p.role = 'tenant' AND t.id IS NOT NULL;

-- ============================================================================
-- STEP 1B: IDENTIFY AFFECTED PROPERTY MANAGERS (NO ASSIGNMENTS)
-- ============================================================================

-- Find property managers with NO assignments in property_manager_assignments table
SELECT 
    p.id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.status,
    p.approved_at,
    COUNT(pma.id) as property_count
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status, p.approved_at
HAVING COUNT(pma.id) = 0
ORDER BY p.approved_at DESC;

-- Count of property managers without assignments
SELECT 
    'PROPERTY MANAGERS - NO ASSIGNMENTS' as category,
    COUNT(*) as total_managers_without_assignments
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager'
GROUP BY p.id
HAVING COUNT(pma.id) = 0;

-- ============================================================================
-- STEP 2: DELETE INVALID RECORDS & RE-ASSIGN PROPERLY
-- ============================================================================

-- DELETE all tenant records with NULL property_id or unit_id
DELETE FROM public.tenants
WHERE property_id IS NULL OR unit_id IS NULL;

-- NOTE: Property manager assignments don't need deletion - they just need creation
-- We'll have super admin re-assign them via UI

-- Verify tenants cleanup
SELECT 
    'AFTER CLEANUP' as phase,
    COUNT(*) as total_tenant_records,
    COUNT(CASE WHEN property_id IS NOT NULL THEN 1 END) as with_property,
    COUNT(CASE WHEN unit_id IS NOT NULL THEN 1 END) as with_unit,
    COUNT(CASE WHEN property_id IS NULL THEN 1 END) as null_properties,
    COUNT(CASE WHEN unit_id IS NULL THEN 1 END) as null_units
FROM public.tenants;

-- ============================================================================
-- STEP 3: ADD DATABASE CONSTRAINTS TO PREVENT FUTURE NULL VALUES
-- ============================================================================

-- Add constraints to tenants table to prevent NULL property_id and unit_id
ALTER TABLE public.tenants
ADD CONSTRAINT check_tenant_property_required CHECK (property_id IS NOT NULL);

ALTER TABLE public.tenants
ADD CONSTRAINT check_tenant_unit_required CHECK (unit_id IS NOT NULL);

-- Note: property_manager_assignments doesn't need constraints as it's a junction table
-- Just need to ensure assignments are made when approving property managers

-- Verify constraints were added
SELECT 
    'TENANTS CONSTRAINTS' as table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'tenants' AND constraint_type = 'CHECK'
ORDER BY constraint_name;

-- ============================================================================
-- STEP 4: PROPERTY MANAGERS - RE-ASSIGNMENT REQUIRED
-- ============================================================================
-- Property managers without assignments need to be re-assigned via the UI:

-- List all property managers without any assigned properties
SELECT 
    p.id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.status,
    p.approved_at,
    0 as property_count,
    'NEEDS RE-ASSIGNMENT' as action
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.status, p.approved_at
HAVING COUNT(pma.id) = 0
ORDER BY p.approved_at DESC;

-- ============================================================================
-- SUMMARY: RE-ASSIGNMENT WORKFLOW
-- ============================================================================
-- 
-- TENANTS:
--   ✓ Invalid records deleted (with NULL property_id or unit_id)
--   ✓ Database constraints added to prevent NULL values
--   → Super admin must re-assign each tenant to a property + unit via UI
--
-- PROPERTY MANAGERS:
--   ✗ No records to delete (they never had assignments created)
--   → Super admin must assign each manager to at least one property via UI
--
-- UI CHANGES IN UserManagementNew.tsx:
--   ✓ Tenant assignment: Button disabled until property + unit selected
--   ✓ Property manager assignment: Button disabled until ≥1 property selected
--   ✓ Red alert warning shows what's required
--   ✓ Console logs if bypass attempted
--
