-- ============================================================================
-- COMPLETE AUDIT & FIX FOR ALL USER ASSIGNMENTS
-- Run Step by Step to verify and fix all data integrity issues
-- ============================================================================

-- ============================================================================
-- STEP 1: AUDIT - CURRENT STATE
-- ============================================================================

-- Check users with NULL approved_at
SELECT 
    COUNT(*) as users_without_approval_tracking
FROM public.profiles
WHERE role IS NOT NULL AND approved_at IS NULL;

-- Check property manager assignments
SELECT 
    COUNT(*) as total_manager_assignments,
    COUNT(DISTINCT property_manager_id) as unique_managers
FROM public.property_manager_assignments;

-- Check tenant assignments
SELECT 
    COUNT(*) as total_tenant_assignments,
    COUNT(DISTINCT user_id) as unique_tenants
FROM public.tenants;

-- ============================================================================
-- STEP 2: VERIFY DATA CONSISTENCY
-- ============================================================================

-- Find property managers without any assignments recorded
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.approved_at
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager' AND pma.id IS NULL;

-- Find tenants without any assignments recorded
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.approved_at
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
WHERE p.role = 'tenant' AND t.id IS NULL;

-- ============================================================================
-- STEP 3: FIX - UPDATE ALL USERS WITH NULL approved_at
-- ============================================================================

UPDATE public.profiles
SET 
    approved_at = COALESCE(approved_at, updated_at, created_at),
    is_active = true,
    status = 'active'
WHERE role IS NOT NULL AND approved_at IS NULL
RETURNING 
    id,
    email,
    role,
    status,
    approved_at;

-- ============================================================================
-- STEP 4: VERIFY FIX
-- ============================================================================

-- Count of fixed users
SELECT 
    COUNT(*) as total_users_with_roles,
    COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) as users_with_approval_tracking,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as users_active,
    COUNT(CASE WHEN is_active = true THEN 1 END) as users_is_active_true
FROM public.profiles
WHERE role IS NOT NULL;

-- Show all assignments with their tracking
SELECT 
    'Property Managers' as type,
    COUNT(DISTINCT p.id) as total,
    COUNT(DISTINCT CASE WHEN pma.id IS NOT NULL THEN p.id END) as with_assignments,
    COUNT(DISTINCT CASE WHEN p.approved_at IS NOT NULL THEN p.id END) as with_approval_tracking
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager'
UNION ALL
SELECT 
    'Tenants',
    COUNT(DISTINCT p.id),
    COUNT(DISTINCT CASE WHEN t.id IS NOT NULL THEN p.id END),
    COUNT(DISTINCT CASE WHEN p.approved_at IS NOT NULL THEN p.id END)
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
WHERE p.role = 'tenant';

-- ============================================================================
-- STEP 5: DETAILED VIEW OF ALL ASSIGNMENTS
-- ============================================================================

-- All property managers with their assignments
SELECT 
    p.id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.status,
    p.is_active,
    p.approved_at,
    COUNT(pma.id) as property_count,
    STRING_AGG(pr.name, ', ' ORDER BY pr.name) as properties
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
LEFT JOIN public.properties pr ON pma.property_id = pr.id
WHERE p.role = 'property_manager'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status, p.is_active, p.approved_at
ORDER BY p.created_at DESC;

-- All tenants with their assignments
SELECT 
    p.id,
    p.email,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.status,
    p.is_active,
    p.approved_at,
    COUNT(t.id) as assignment_count,
    STRING_AGG(CONCAT(pr.name, ' - ', put.name), ' | ' ORDER BY pr.name) as property_and_unit
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
LEFT JOIN public.properties pr ON t.property_id = pr.id
LEFT JOIN public.property_unit_types put ON t.unit_id = put.id
WHERE p.role = 'tenant'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status, p.is_active, p.approved_at
ORDER BY p.created_at DESC;
