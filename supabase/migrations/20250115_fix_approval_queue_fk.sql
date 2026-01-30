-- Drop and recreate approval_queue with properly named foreign keys
DROP TABLE IF EXISTS public.approval_queue CASCADE;

CREATE TABLE public.approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL CHECK (request_type IN ('manager_assignment', 'deposit_refund', 'property_addition', 'user_creation', 'lease_termination')),
    request_id TEXT NOT NULL,
    requested_by UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Explicitly named foreign keys for Supabase relationship detection
    CONSTRAINT approval_queue_requested_by FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT approval_queue_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_approval_queue_status ON public.approval_queue(status);
CREATE INDEX idx_approval_queue_request_type ON public.approval_queue(request_type);
CREATE INDEX idx_approval_queue_requested_by ON public.approval_queue(requested_by);
CREATE INDEX idx_approval_queue_created_at ON public.approval_queue(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage approval queue" ON public.approval_queue;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.approval_queue;

-- Policy: Super admins can manage approval queue
CREATE POLICY "Super admins can manage approval queue" 
ON public.approval_queue FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests" 
ON public.approval_queue FOR SELECT 
USING (auth.uid() = requested_by);
