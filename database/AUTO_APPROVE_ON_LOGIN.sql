-- ============================================================================
-- AUTO-APPROVE PENDING USERS ON LOGIN
-- ============================================================================
-- This script removes the pending approval requirement for all users
-- Users will be auto-approved when they login
-- ============================================================================

-- Update all pending users to active status (approved)
UPDATE public.profiles
SET 
    status = 'active',
    approved = true,
    is_active = true,
    updated_at = NOW()
WHERE status = 'pending' AND approved = false;

-- Confirm results
SELECT COUNT(*) as "Approved Users Count"
FROM public.profiles
WHERE status = 'active' AND approved = true;

-- Show all users now
SELECT 
    id,
    email,
    role,
    status,
    approved,
    is_active,
    created_at
FROM public.profiles
ORDER BY created_at DESC;
