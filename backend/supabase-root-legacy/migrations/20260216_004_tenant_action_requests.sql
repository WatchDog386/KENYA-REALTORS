-- ============================================================================
-- TENANT ACTION REQUESTS SUPPORT
-- Date: February 2026
-- Purpose: Enable property managers to request tenant removal/suspension with
--          super admin approval workflow
-- ============================================================================

-- Add tenant_id and action_type columns to approvals table
ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS action_type VARCHAR(50); -- 'tenant_add', 'tenant_remove', 'tenant_suspend'

ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS unit_id UUID;

-- Add foreign key constraints
ALTER TABLE public.approvals
ADD CONSTRAINT fk_approval_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.approvals
ADD CONSTRAINT fk_approval_unit_id 
FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;

-- Update RLS Policy to allow property managers to view approvals related to their properties
DROP POLICY IF EXISTS "managers_can_view_property_approvals" ON public.approvals;
CREATE POLICY "managers_can_view_property_approvals" ON public.approvals
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            JOIN public.approvals a ON a.property_id = pma.property_id
            WHERE pma.property_manager_id = auth.uid()
            AND a.id = approvals.id
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'super_admin' OR profiles.role = 'property_manager')
        )
    );

-- Policy to allow managers to create approvals for tenant actions
DROP POLICY IF EXISTS "managers_can_create_tenant_approvals" ON public.approvals;
CREATE POLICY "managers_can_create_tenant_approvals" ON public.approvals
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments
            WHERE property_manager_id = auth.uid()
            AND property_id = approvals.property_id
        )
    );

-- Index for better query performance
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON public.approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_action_type ON public.approvals(action_type);
CREATE INDEX IF NOT EXISTS idx_approvals_status_type ON public.approvals(status, approval_type);
