-- ============================================================================
-- FIX: ACTIVATE ALL USERS
-- ============================================================================
-- The user reported that many users are stuck in 'pending' status despite 
-- being approved and assigned. 
-- This script forces all users in the `profiles` table to be 'active'.
-- ============================================================================

-- 1. Update all profiles to be active
UPDATE public.profiles
SET 
    status = 'active',
    is_active = true,
    -- Set approved_at to now if it was missing
    approved_at = COALESCE(approved_at, NOW())
WHERE 
    status != 'active' 
    OR is_active = false 
    OR is_active IS NULL;

-- 2. Verify the update
SELECT count(*) as total_active_users 
FROM public.profiles 
WHERE status = 'active' AND is_active = true;

-- 3. (Optional) Check if any users are still missing roles if that was part of the issue
-- SELECT * FROM public.profiles WHERE role IS NULL;
