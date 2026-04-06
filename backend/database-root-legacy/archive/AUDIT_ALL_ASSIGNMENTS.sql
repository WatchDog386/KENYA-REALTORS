-- ============================================================================
-- AUDIT: CHECK ALL USER ASSIGNMENTS AND TRACKING
-- ============================================================================

-- 1. CHECK USERS WITH NULL APPROVED_AT (Not tracked as approved)
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    is_active,
    approved_at,
    approved_by,
    created_at,
    updated_at
FROM public.profiles
WHERE role IS NOT NULL AND approved_at IS NULL
ORDER BY created_at DESC;

-- 2. CHECK PROPERTY MANAGERS - Should have entries in property_manager_assignments
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    COUNT(pma.id) as assigned_properties_count,
    STRING_AGG(pr.name, ', ') as property_names
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
LEFT JOIN public.properties pr ON pma.property_id = pr.id
WHERE p.role = 'property_manager'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status
ORDER BY p.created_at DESC;

-- 3. CHECK TENANTS - Should have entries in tenants table
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    COUNT(t.id) as tenant_assignments,
    STRING_AGG(CONCAT(pr.name, ' - Unit: ', put.name), ' | ') as assignments
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
LEFT JOIN public.properties pr ON t.property_id = pr.id
LEFT JOIN public.property_unit_types put ON t.unit_id = put.id
WHERE p.role = 'tenant'
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status
ORDER BY p.created_at DESC;

-- 4. SUMMARY STATISTICS
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 'Users with Role', COUNT(*) FROM public.profiles WHERE role IS NOT NULL
UNION ALL
SELECT 'Users Active', COUNT(*) FROM public.profiles WHERE status = 'active'
UNION ALL
SELECT 'Users Pending', COUNT(*) FROM public.profiles WHERE status = 'pending'
UNION ALL
SELECT 'Users with Null Approval', COUNT(*) FROM public.profiles WHERE role IS NOT NULL AND approved_at IS NULL
UNION ALL
SELECT 'Property Managers', COUNT(*) FROM public.profiles WHERE role = 'property_manager'
UNION ALL
SELECT 'Tenants', COUNT(*) FROM public.profiles WHERE role = 'tenant'
UNION ALL
SELECT 'Property Manager Assignments', COUNT(*) FROM public.property_manager_assignments
UNION ALL
SELECT 'Tenant Assignments', COUNT(*) FROM public.tenants;

-- 5. ORPHANED ASSIGNMENTS (Managers/Tenants without user in profiles)
SELECT 'Orphaned Manager Assignments' as type, COUNT(*) as count
FROM public.property_manager_assignments pma
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pma.property_manager_id)
UNION ALL
SELECT 'Orphaned Tenant Records', COUNT(*)
FROM public.tenants t
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.user_id);
