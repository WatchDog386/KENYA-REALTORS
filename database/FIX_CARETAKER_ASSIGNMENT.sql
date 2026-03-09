-- FIX_CARETAKER_ASSIGNMENT.sql
-- This script checks for and fixes unassigned caretakers

-- ============================================================================
-- STEP 0: FIX USER ROLE (if role is null or empty)
-- ============================================================================

-- Check the user's current role
SELECT id, email, role, first_name, last_name 
FROM public.profiles 
WHERE email = 'finidygorge01@gmail.com';

-- Update the role to 'caretaker' if needed
UPDATE public.profiles 
SET role = 'caretaker'
WHERE email = 'finidygorge01@gmail.com'
AND (role IS NULL OR role = '');

-- ============================================================================
-- STEP 0b: FIX CARETAKER'S PROPERTY_MANAGER_ID
-- The property_manager_id should be the ACTUAL property manager, not the person who assigned them
-- ============================================================================

-- View caretakers with their current property_manager vs actual property manager
SELECT 
    c.id AS caretaker_id,
    p.first_name || ' ' || p.last_name AS caretaker_name,
    prop.name AS property_name,
    pm_assigned.first_name || ' ' || pm_assigned.last_name AS currently_assigned_pm,
    pm_actual.first_name || ' ' || pm_actual.last_name AS actual_property_manager,
    CASE WHEN c.property_manager_id = pma.property_manager_id THEN '✅ Correct' ELSE '❌ Mismatch' END AS status
FROM public.caretakers c
JOIN public.profiles p ON p.id = c.user_id
LEFT JOIN public.properties prop ON prop.id = c.property_id
LEFT JOIN public.profiles pm_assigned ON pm_assigned.id = c.property_manager_id
LEFT JOIN public.property_manager_assignments pma ON pma.property_id = c.property_id AND pma.status = 'active'
LEFT JOIN public.profiles pm_actual ON pm_actual.id = pma.property_manager_id;

-- Fix all caretakers to have the correct property_manager_id
UPDATE public.caretakers c
SET property_manager_id = pma.property_manager_id
FROM public.property_manager_assignments pma
WHERE c.property_id = pma.property_id
AND pma.status = 'active'
AND c.property_manager_id != pma.property_manager_id;

-- ============================================================================
-- STEP 1: DIAGNOSE - Find users with role 'caretaker' but no caretakers table entry
-- ============================================================================
SELECT 
    p.id AS user_id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    p.role,
    c.id AS caretaker_record_id,
    c.property_id,
    CASE WHEN c.id IS NULL THEN '❌ MISSING CARETAKER RECORD' ELSE '✅ Has caretaker record' END AS status
FROM public.profiles p
LEFT JOIN public.caretakers c ON c.user_id = p.id
WHERE p.role = 'caretaker';

-- ============================================================================
-- STEP 2: View available properties
-- ============================================================================
SELECT 
    id AS property_id,
    name AS property_name,
    location,
    type
FROM public.properties
ORDER BY name;

-- ============================================================================
-- STEP 3: View super admins/managers who can be assigned as property_manager_id
-- ============================================================================
SELECT 
    id AS user_id,
    first_name || ' ' || last_name AS full_name,
    email,
    role
FROM public.profiles
WHERE role IN ('super_admin', 'property_manager')
ORDER BY role, first_name;

-- ============================================================================
-- STEP 4: MANUAL FIX - Insert caretaker record (UNCOMMENT AND MODIFY TO USE)
-- Replace the UUIDs with actual values from above queries
-- ============================================================================

/*
-- Get user ID for the caretaker (finidy George)
DO $$
DECLARE
    v_user_id UUID;
    v_property_id UUID;
    v_manager_id UUID;
BEGIN
    -- Find the user
    SELECT id INTO v_user_id 
    FROM public.profiles 
    WHERE email = 'finidygorge01@gmail.com';
    
    -- Get a property (replace with actual property name or ID)
    SELECT id INTO v_property_id 
    FROM public.properties 
    LIMIT 1;  -- Or use: WHERE name = 'Your Property Name'
    
    -- Get a manager/super admin
    SELECT id INTO v_manager_id 
    FROM public.profiles 
    WHERE role IN ('super_admin', 'property_manager') 
    LIMIT 1;
    
    -- Insert caretaker record
    INSERT INTO public.caretakers (user_id, property_id, property_manager_id, status, assignment_date)
    VALUES (v_user_id, v_property_id, v_manager_id, 'active', NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        property_id = EXCLUDED.property_id,
        property_manager_id = EXCLUDED.property_manager_id,
        status = 'active',
        assignment_date = NOW();
    
    RAISE NOTICE 'Caretaker assigned successfully!';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Property ID: %', v_property_id;
END $$;
*/

-- ============================================================================
-- STEP 5: AUTO-FIX - Assign first unassigned caretaker to first available property
-- WARNING: Only use if you have just one property and one unassigned caretaker
-- ============================================================================

/*
INSERT INTO public.caretakers (user_id, property_id, property_manager_id, status, assignment_date)
SELECT 
    p.id AS user_id,
    (SELECT id FROM public.properties ORDER BY name LIMIT 1) AS property_id,
    (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager') ORDER BY role LIMIT 1) AS property_manager_id,
    'active' AS status,
    NOW() AS assignment_date
FROM public.profiles p
LEFT JOIN public.caretakers c ON c.user_id = p.id
WHERE p.role = 'caretaker' AND c.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================================================
-- STEP 6: VERIFY - Check the fix worked
-- ============================================================================
SELECT 
    p.id AS user_id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    c.id AS caretaker_record_id,
    c.property_id,
    prop.name AS property_name,
    c.status AS assignment_status
FROM public.profiles p
LEFT JOIN public.caretakers c ON c.user_id = p.id
LEFT JOIN public.properties prop ON prop.id = c.property_id
WHERE p.role = 'caretaker';
