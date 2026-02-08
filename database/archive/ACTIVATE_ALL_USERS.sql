-- ============================================================================
-- ACTIVATE ALL PENDING USERS
-- Sets all users with status='pending' to status='active'
-- This unblocks all approved and assigned users
-- ============================================================================

BEGIN;

-- Step 1: Check current status distribution
SELECT 
    status,
    COUNT(*) as count
FROM public.profiles
GROUP BY status
ORDER BY status;

-- Step 2: Update all pending users to active
UPDATE public.profiles
SET 
    status = 'active',
    is_active = true,
    updated_at = NOW()
WHERE status = 'pending';

-- Step 3: Verify the update
SELECT 
    status,
    COUNT(*) as count
FROM public.profiles
GROUP BY status
ORDER BY status;

-- Step 4: Show first 10 activated users
SELECT 
    id,
    email,
    role,
    status,
    is_active,
    created_at
FROM public.profiles
WHERE status = 'active'
ORDER BY updated_at DESC
LIMIT 10;

COMMIT;
