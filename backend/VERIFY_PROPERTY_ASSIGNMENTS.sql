-- ============================================================================
-- PROPERTY ASSIGNMENT VERIFICATION SCRIPT
-- Purpose: Verify that all proprietors, caretakers, and technicians can see
--          their assigned properties
-- Date: February 13, 2026
-- ============================================================================

-- ============================================================================
-- 0. HELPER QUERIES - Find User IDs
-- ============================================================================

-- Find all proprietors and their user IDs
SELECT 
    p.id as proprietor_id,
    p.user_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    p.status
FROM proprietors p
JOIN profiles pr ON p.user_id = pr.id
ORDER BY pr.first_name;

-- Find all technicians and their user IDs
SELECT 
    t.id as technician_id,
    t.user_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    tc.name as category,
    t.status
FROM technicians t
JOIN profiles pr ON t.user_id = pr.id
LEFT JOIN technician_categories tc ON t.category_id = tc.id
ORDER BY pr.first_name;

-- Find all caretakers and their user IDs
SELECT 
    c.id as caretaker_id,
    c.user_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    c.status
FROM caretakers c
JOIN profiles pr ON c.user_id = pr.id
ORDER BY pr.first_name;

-- ============================================================================
-- 1. PROPRIETOR ASSIGNMENTS VERIFICATION
-- ============================================================================

-- Check proprietor's assigned properties
-- INSTRUCTIONS: Copy a user_id from the helper query above and paste it below
-- Example: SELECT ... WHERE p.user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 
    p.id as proprietor_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    pp.id as assignment_id,
    pp.property_id,
    prop.name as property_name,
    prop.location,
    pp.ownership_percentage,
    pp.is_active,
    pp.assigned_at as assigned_date
FROM proprietors p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN proprietor_properties pp ON p.id = pp.proprietor_id AND pp.is_active = true
LEFT JOIN properties prop ON pp.property_id = prop.id
WHERE p.user_id = '550e8400-e29b-41d4-a716-446655440000'  -- REPLACE WITH ACTUAL USER ID
ORDER BY pp.assigned_at DESC;

-- Check all active proprietor assignments
SELECT 
    pr.first_name || ' ' || pr.last_name as proprietor_name,
    pr.email,
    prop.name as property_name,
    prop.location,
    pp.ownership_percentage,
    pp.assigned_at as assigned_date
FROM proprietor_properties pp
JOIN proprietors p ON pp.proprietor_id = p.id
JOIN profiles pr ON p.user_id = pr.id
JOIN properties prop ON pp.property_id = prop.id
WHERE pp.is_active = true
ORDER BY pp.assigned_at DESC;

-- ============================================================================
-- 2. TECHNICIAN ASSIGNMENTS VERIFICATION
-- ============================================================================

-- Check technician's assigned properties
-- INSTRUCTIONS: Copy a user_id from the helper query above and paste it below
-- Example: SELECT ... WHERE t.user_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 
    t.id as technician_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    tc.name as category,
    tpa.id as assignment_id,
    tpa.property_id,
    prop.name as property_name,
    prop.location,
    tpa.is_active,
    tpa.assigned_at as assigned_date
FROM technicians t
JOIN profiles pr ON t.user_id = pr.id
LEFT JOIN technician_categories tc ON t.category_id = tc.id
LEFT JOIN technician_property_assignments tpa ON t.id = tpa.technician_id AND tpa.is_active = true
LEFT JOIN properties prop ON tpa.property_id = prop.id
WHERE t.user_id = '550e8400-e29b-41d4-a716-446655440001'  -- REPLACE WITH ACTUAL USER ID
ORDER BY tpa.assigned_at DESC;

-- Check all active technician assignments
SELECT 
    pr.first_name || ' ' || pr.last_name as technician_name,
    pr.email,
    tc.name as category,
    prop.name as property_name,
    prop.location,
    tpa.assigned_at as assigned_date
FROM technician_property_assignments tpa
JOIN technicians t ON tpa.technician_id = t.id
JOIN profiles pr ON t.user_id = pr.id
LEFT JOIN technician_categories tc ON t.category_id = tc.id
JOIN properties prop ON tpa.property_id = prop.id
WHERE tpa.is_active = true
ORDER BY tpa.assigned_at DESC;

-- ============================================================================
-- 3. CARETAKER ASSIGNMENTS VERIFICATION
-- ============================================================================

-- Check caretaker's assigned property
-- INSTRUCTIONS: Copy a user_id from the helper query above and paste it below
-- Example: SELECT ... WHERE c.user_id = '550e8400-e29b-41d4-a716-446655440002';
SELECT 
    c.id as caretaker_id,
    pr.first_name,
    pr.last_name,
    pr.email,
    c.property_id,
    prop.name as property_name,
    prop.location,
    c.status,
    c.performance_rating,
    c.hire_date,
    c.is_available
FROM caretakers c
JOIN profiles pr ON c.user_id = pr.id
LEFT JOIN properties prop ON c.property_id = prop.id
WHERE c.user_id = '550e8400-e29b-41d4-a716-446655440002';  -- REPLACE WITH ACTUAL USER ID

-- Check all active caretakers with assigned properties
SELECT 
    pr.first_name || ' ' || pr.last_name as caretaker_name,
    pr.email,
    c.property_id,
    prop.name as property_name,
    prop.location,
    c.performance_rating,
    c.hire_date,
    c.is_available,
    c.assignment_date
FROM caretakers c
JOIN profiles pr ON c.user_id = pr.id
LEFT JOIN properties prop ON c.property_id = prop.id
WHERE c.status = 'active'
ORDER BY c.assignment_date DESC;

-- ============================================================================
-- 4. SUMMARY STATISTICS
-- ============================================================================

-- Count of assignments by role
SELECT 
    'Proprietors with properties' as assignment_type,
    COUNT(DISTINCT p.id) as count
FROM proprietors p
JOIN proprietor_properties pp ON p.id = pp.proprietor_id AND pp.is_active = true
UNION ALL
SELECT 
    'Technicians with properties' as assignment_type,
    COUNT(DISTINCT t.id) as count
FROM technicians t
JOIN technician_property_assignments tpa ON t.id = tpa.technician_id AND tpa.is_active = true
UNION ALL
SELECT 
    'Caretakers with properties' as assignment_type,
    COUNT(*) as count
FROM caretakers c
WHERE c.status = 'active' AND c.property_id IS NOT NULL;

-- ============================================================================
-- 5. TROUBLESHOOTING QUERIES
-- ============================================================================

-- Find proprietors with NO assigned properties
SELECT 
    p.id,
    pr.first_name,
    pr.last_name,
    pr.email,
    'NO PROPERTIES ASSIGNED' as status
FROM proprietors p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.id NOT IN (
    SELECT DISTINCT proprietor_id FROM proprietor_properties WHERE is_active = true
);

-- Find technicians with NO assigned properties
SELECT 
    t.id,
    pr.first_name,
    pr.last_name,
    pr.email,
    'NO PROPERTIES ASSIGNED' as status
FROM technicians t
JOIN profiles pr ON t.user_id = pr.id
WHERE t.id NOT IN (
    SELECT DISTINCT technician_id FROM technician_property_assignments WHERE is_active = true
);

-- Find caretakers with NO assigned properties
SELECT 
    c.id,
    pr.first_name,
    pr.last_name,
    pr.email,
    'NO PROPERTY ASSIGNED' as status
FROM caretakers c
JOIN profiles pr ON c.user_id = pr.id
WHERE c.property_id IS NULL AND c.status = 'active';

-- ============================================================================
-- 6. RLS POLICY TEST (for admins running as specific users)
-- ============================================================================

-- Test proprietor can view their properties
-- RUN THIS: As a proprietor user logged into the app
-- The auth.uid() function automatically gets the current user's ID
SELECT id, name, location FROM public.properties
WHERE id IN (
    SELECT property_id FROM proprietor_properties 
    WHERE proprietor_id = (
        SELECT id FROM proprietors WHERE user_id = auth.uid()
    )
    AND is_active = true
);

-- Test technician can view their properties
-- RUN THIS: As a technician user logged into the app
-- The auth.uid() function automatically gets the current user's ID
SELECT id, name, location FROM public.properties
WHERE id IN (
    SELECT property_id FROM technician_property_assignments 
    WHERE technician_id = (
        SELECT id FROM technicians WHERE user_id = auth.uid()
    )
    AND is_active = true
);

-- Test caretaker can view their property
-- RUN THIS: As a caretaker user logged into the app
-- The auth.uid() function automatically gets the current user's ID
SELECT id, name, location FROM public.properties
WHERE id = (
    SELECT property_id FROM caretakers 
    WHERE user_id = auth.uid()
);
