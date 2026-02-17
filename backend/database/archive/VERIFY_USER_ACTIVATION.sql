-- ============================================================================
-- VERIFY USER ACTIVATION STATUS
-- Run this to check if users are properly activated after approval
-- ============================================================================

-- Check all users and their current status
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
ORDER BY updated_at DESC
LIMIT 20;

-- Check pending users specifically
SELECT 
    COUNT(*) as pending_count,
    status
FROM public.profiles
WHERE status = 'pending'
GROUP BY status;

-- Check recently updated users
SELECT 
    id,
    email,
    role,
    status,
    is_active,
    updated_at
FROM public.profiles
WHERE updated_at >= NOW() - INTERVAL '30 minutes'
ORDER BY updated_at DESC;

-- Check property manager assignments
SELECT 
    pma.id,
    pma.property_manager_id,
    p.email,
    p.first_name,
    p.last_name,
    p.status,
    p.is_active,
    pma.property_id,
    pr.name as property_name,
    pma.status as assignment_status
FROM public.property_manager_assignments pma
JOIN public.profiles p ON pma.property_manager_id = p.id
LEFT JOIN public.properties pr ON pma.property_id = pr.id
ORDER BY pma.created_at DESC
LIMIT 10;
