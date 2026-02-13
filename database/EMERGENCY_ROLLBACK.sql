-- ============================================================================
-- EMERGENCY ROLLBACK: REVERT ALL RLS POLICY CHANGES
-- ============================================================================
-- This removes all the problematic policies I added
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- 1. DROP ALL THE INSERT POLICIES I ADDED
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger to insert technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow trigger to insert caretakers" ON public.caretakers;
DROP POLICY IF EXISTS "Allow trigger to insert proprietors" ON public.proprietors;
DROP POLICY IF EXISTS "Allow trigger to insert accountants" ON public.accountants;

-- 2. RESTORE CONSTRAINTS IF YOU HAD THEM BEFORE
-- ============================================================================
-- Note: If these cause issues, comment them out
-- ALTER TABLE public.technicians ALTER COLUMN category_id SET NOT NULL;
-- ALTER TABLE public.caretakers ALTER COLUMN property_id SET NOT NULL;
-- ALTER TABLE public.caretakers ALTER COLUMN property_manager_id SET NOT NULL;
-- ALTER TABLE public.caretakers ALTER COLUMN assigned_by SET NOT NULL;
-- ALTER TABLE public.accountants ALTER COLUMN assigned_by SET NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFY THE SYSTEM IS WORKING
-- ============================================================================
-- After running this, try logging in as super admin
-- If still broken, go to Supabase Dashboard > Auth > Users
-- and check if your super admin user still exists
