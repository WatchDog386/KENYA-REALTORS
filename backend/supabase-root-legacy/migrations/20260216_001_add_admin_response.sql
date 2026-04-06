-- Add admin_response column to approvals table
ALTER TABLE IF EXISTS public.approvals 
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Add title column if not exists (Action they want to execute)
-- Users often use "approval_type" for this, but "title" or "action_details" might be better for free text.
-- We already have 'request_type' (enum/string) and 'notes' (reason).
-- Let's stick to request_type/action_type for the "Action" and notes for "Reason".
