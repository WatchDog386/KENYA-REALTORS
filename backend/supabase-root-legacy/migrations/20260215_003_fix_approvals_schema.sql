-- ============================================================================
-- FIX APPROVALS TABLE SCHEMA
-- Date: February 2026
-- Purpose: Add missing columns to approvals table to support application logic
-- ============================================================================

-- Add request_id if missing (for linking to other entities like refund_requests)
ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS request_id UUID;

-- Add metadata column for flexible data storage
ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add notes column (distinct from rejection_reason)
ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Rename type column if needed? No, we will map in code.

-- Enable Realtime for approvals if needed
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table is already in the publication
END $$;

-- Ensure RLS allows insert for authenticated users
DROP POLICY IF EXISTS "users_can_create_approvals" ON public.approvals;
CREATE POLICY "users_can_create_approvals" ON public.approvals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Ensure RLS allows users to see their own approvals
DROP POLICY IF EXISTS "users_can_view_own_approvals" ON public.approvals;
CREATE POLICY "users_can_view_own_approvals" ON public.approvals
    FOR SELECT
    USING (auth.uid() = user_id);

-- Ensure RLS allows admins and managers to view relevant approvals
DROP POLICY IF EXISTS "admins_can_view_all_approvals" ON public.approvals;
CREATE POLICY "admins_can_view_all_approvals" ON public.approvals
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'super_admin' OR profiles.role = 'property_manager')
        )
    );

-- Ensure admins can update approvals
DROP POLICY IF EXISTS "admins_can_update_approvals" ON public.approvals;
CREATE POLICY "admins_can_update_approvals" ON public.approvals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'super_admin' OR profiles.role = 'property_manager')
        )
    );
