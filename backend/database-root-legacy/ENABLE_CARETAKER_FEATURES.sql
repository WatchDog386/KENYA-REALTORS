-- ENABLE_CARETAKER_FEATURES.sql
-- 1. Updates maintenance_requests to allow caretaker submissions
-- 2. Ensures messages table exists for communication

BEGIN;

-- ============================================================================
-- 1. UPDATE MAINTENANCE REQUESTS
-- ============================================================================

-- Make tenant_id nullable since caretakers aren't tenants
ALTER TABLE public.maintenance_requests ALTER COLUMN tenant_id DROP NOT NULL;

-- Add caretaker_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'caretaker_id') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN caretaker_id UUID REFERENCES public.caretakers(id);
    END IF;
END $$;

-- Update Policies for Maintenance Requests
DROP POLICY IF EXISTS "Caretakers view own requests" ON public.maintenance_requests;
CREATE POLICY "Caretakers view own requests" ON public.maintenance_requests
FOR SELECT USING (
    caretaker_id IN (SELECT id FROM public.caretakers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Caretakers create requests" ON public.maintenance_requests;
CREATE POLICY "Caretakers create requests" ON public.maintenance_requests
FOR INSERT WITH CHECK (
    caretaker_id IN (SELECT id FROM public.caretakers WHERE user_id = auth.uid())
);

-- ============================================================================
-- 2. MESSAGES TABLE (For direct communication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can insert messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages; -- mostly for marking read
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);


COMMIT;
