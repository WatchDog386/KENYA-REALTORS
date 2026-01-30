-- Create Approval Queue Table
-- This table manages all approval requests in the system

CREATE TABLE IF NOT EXISTS public.approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL CHECK (request_type IN ('manager_assignment', 'deposit_refund', 'property_addition', 'user_creation', 'lease_termination')),
    request_id TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for approval_queue
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON public.approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_request_type ON public.approval_queue(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_queue_requested_by ON public.approval_queue(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_queue_created_at ON public.approval_queue(created_at DESC);

-- Row Level Security
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

-- Super admins can manage approval queue
CREATE POLICY "Super admins can manage approval queue" 
ON public.approval_queue FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests" 
ON public.approval_queue FOR SELECT 
USING (auth.uid() = requested_by);
