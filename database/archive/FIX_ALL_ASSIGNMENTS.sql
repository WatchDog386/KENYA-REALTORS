-- ============================================================================
-- COMPREHENSIVE FIX: ENSURE ALL ASSIGNMENTS ARE PROPERLY TRACKED
-- ============================================================================

-- Step 1: Ensure all users with roles have approved_at set
UPDATE public.profiles
SET 
    approved_at = COALESCE(approved_at, updated_at, created_at),
    is_active = CASE 
        WHEN role IS NOT NULL THEN true 
        ELSE is_active 
    END,
    status = CASE 
        WHEN role IS NOT NULL AND status = 'pending' THEN 'active'
        ELSE status 
    END
WHERE role IS NOT NULL AND approved_at IS NULL;

-- Step 2: Verify property managers are tracked
-- Get all property managers who don't have assignments yet
-- (They may need to be assigned properties by admin later, but the data should be consistent)
SELECT 
    p.id,
    p.email,
    p.first_name,
    COUNT(pma.id) as existing_assignments
FROM public.profiles p
LEFT JOIN public.property_manager_assignments pma ON p.id = pma.property_manager_id
WHERE p.role = 'property_manager'
GROUP BY p.id, p.email, p.first_name
HAVING COUNT(pma.id) = 0;

-- Step 3: Verify tenants are tracked
SELECT 
    p.id,
    p.email,
    p.first_name,
    COUNT(t.id) as tenant_records
FROM public.profiles p
LEFT JOIN public.tenants t ON p.id = t.user_id
WHERE p.role = 'tenant'
GROUP BY p.id, p.email, p.first_name
HAVING COUNT(t.id) = 0;

-- Step 4: Ensure all assignments have valid user references (no orphans)
DELETE FROM public.property_manager_assignments
WHERE property_manager_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.tenants
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Step 5: Final verification - Show all properly tracked assignments
SELECT 
    'Property Manager Assignments' as assignment_type,
    COUNT(*) as count,
    COUNT(DISTINCT property_manager_id) as unique_managers
FROM public.property_manager_assignments
UNION ALL
SELECT 
    'Tenant Assignments',
    COUNT(*),
    COUNT(DISTINCT user_id)
FROM public.tenants;

-- Step 6: Show users with complete tracking
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.status,
    p.is_active,
    p.approved_at,
    CASE 
        WHEN p.role = 'property_manager' THEN (SELECT COUNT(*) FROM property_manager_assignments WHERE property_manager_id = p.id)::text
        WHEN p.role = 'tenant' THEN (SELECT COUNT(*) FROM tenants WHERE user_id = p.id)::text
        ELSE 'N/A'
    END as assignment_count
FROM public.profiles
WHERE role IS NOT NULL
ORDER BY p.updated_at DESC;
