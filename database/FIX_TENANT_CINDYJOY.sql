-- ============================================================================
-- ACTIVATE TENANT USER IMMEDIATELY
-- This fixes the issue where users remain pending after approval
-- ============================================================================

-- First, check current status
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    is_active,
    approved_at
FROM public.profiles
WHERE email = 'cindyjoy314@gmail.com';

-- Activate the user immediately
UPDATE public.profiles
SET 
    role = 'tenant',
    status = 'active',
    is_active = true,
    approved_at = NOW(),
    approved_by = (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1),
    user_type = 'tenant',
    updated_at = NOW()
WHERE email = 'cindyjoy314@gmail.com';

-- Verify the update worked
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    is_active,
    approved_at
FROM public.profiles
WHERE email = 'cindyjoy314@gmail.com';
