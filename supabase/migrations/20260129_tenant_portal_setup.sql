-- Migration: Add Mock Data for Tenant Portal
-- This migration creates mock tenants, properties, and payments for testing

-- First, check if maintenance_requests table exists, if not create it
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID REFERENCES public.properties(id),
    user_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_user ON public.maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created ON public.maintenance_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage all maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can view own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Managers can view property maintenance requests" ON public.maintenance_requests;

-- Add RLS Policies
CREATE POLICY "Super admins can manage all maintenance requests" 
ON public.maintenance_requests FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
);

CREATE POLICY "Tenants can view own maintenance requests" 
ON public.maintenance_requests FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view property maintenance requests" 
ON public.maintenance_requests FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.properties pr
        WHERE pr.property_manager_id = auth.uid()
        AND pr.id = maintenance_requests.property_id
    )
);

-- Ensure rent_payments table exists (it should from earlier migrations)
-- Just adding the missing column if it doesn't exist
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for rent_payments
CREATE INDEX IF NOT EXISTS idx_rent_payments_user ON public.rent_payments(user_id);
