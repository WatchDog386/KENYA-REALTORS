-- ============================================================================
-- Migration: Add Tenant and Property Manager Specific Fields
-- Date: January 31, 2026
-- Purpose: Support tenant-specific fields (property, house number) and 
--          property manager fields for registration and approval workflow
-- ============================================================================

-- ===================== CREATE HELPER FUNCTIONS ==========================

-- Create helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is property manager
CREATE OR REPLACE FUNCTION public.is_property_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'property_manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is tenant
CREATE OR REPLACE FUNCTION public.is_tenant()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================== ADD COLUMNS TO PROFILES TABLE ==========================

-- Add new columns to profiles table for tenant-specific information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS house_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL;

-- Add index for tenant property lookups
CREATE INDEX IF NOT EXISTS idx_profiles_property_id ON public.profiles(property_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON public.profiles(unit_id);

-- Create a tenant_verifications table for tracking tenant approval workflow
CREATE TABLE IF NOT EXISTS public.tenant_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    house_number VARCHAR(50),
    unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL,
    
    -- Verification Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'processing')),
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and Metadata
    verification_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for verifications
CREATE INDEX IF NOT EXISTS idx_tenant_verifications_status ON public.tenant_verifications(status);
CREATE INDEX IF NOT EXISTS idx_tenant_verifications_property ON public.tenant_verifications(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_verifications_tenant ON public.tenant_verifications(tenant_id);

-- Enable RLS on tenant_verifications
ALTER TABLE public.tenant_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Tenants can view their own verifications" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Property managers can view verifications for their properties" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Super admins can view all verifications" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Tenants can insert their own verification requests" ON public.tenant_verifications;
DROP POLICY IF EXISTS "Property managers can update verifications for their properties" ON public.tenant_verifications;

-- RLS Policies for tenant_verifications
CREATE POLICY "Tenants can view their own verifications"
ON public.tenant_verifications FOR SELECT
USING (tenant_id = auth.uid());

CREATE POLICY "Property managers can view verifications for their properties"
ON public.tenant_verifications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id 
        AND p.property_manager_id = auth.uid()
    )
);

CREATE POLICY "Super admins can view all verifications"
ON public.tenant_verifications FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Tenants can insert their own verification requests"
ON public.tenant_verifications FOR INSERT
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Property managers can update verifications for their properties"
ON public.tenant_verifications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id 
        AND p.property_manager_id = auth.uid()
    )
);

-- Create a manager_approvals table for tracking manager approval workflow
CREATE TABLE IF NOT EXISTS public.manager_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Manager Details (can be different from profile)
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    managed_properties TEXT[] DEFAULT '{}', -- Array of property names/ids managed by this manager
    
    -- Approval Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and Metadata
    approval_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for manager approvals
CREATE INDEX IF NOT EXISTS idx_manager_approvals_status ON public.manager_approvals(status);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_manager ON public.manager_approvals(manager_id);

-- Enable RLS on manager_approvals
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Managers can view their own approval request" ON public.manager_approvals;
DROP POLICY IF EXISTS "Super admins can view all manager approvals" ON public.manager_approvals;
DROP POLICY IF EXISTS "Managers can insert their own approval request" ON public.manager_approvals;
DROP POLICY IF EXISTS "Super admins can update manager approvals" ON public.manager_approvals;

-- RLS Policies for manager_approvals
CREATE POLICY "Managers can view their own approval request"
ON public.manager_approvals FOR SELECT
USING (manager_id = auth.uid());

CREATE POLICY "Super admins can view all manager approvals"
ON public.manager_approvals FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Managers can insert their own approval request"
ON public.manager_approvals FOR INSERT
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Super admins can update manager approvals"
ON public.manager_approvals FOR UPDATE
USING (public.is_super_admin());

-- Drop notifications table if it exists to ensure clean state
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table for tracking approvals
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tenant_verification', 'manager_approval', 'verification_approved', 'verification_rejected', 'approval_approved', 'approval_rejected')),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (recipient_id = auth.uid());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_property_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION is_tenant() TO authenticated;
