-- Add admin_response column to approvals table for super-admin replies
ALTER TABLE IF EXISTS public.approvals
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Update status enum to include 'in_progress' for sent but not yet reviewed approvals
ALTER TABLE IF EXISTS public.approvals
DROP CONSTRAINT IF EXISTS valid_approval_status;

ALTER TABLE IF EXISTS public.approvals
ADD CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected'));

-- Create an index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

-- Create an index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_approvals_user_id ON public.approvals(user_id);

-- Update RLS policy to allow viewing own approvals
DROP POLICY IF EXISTS "Users can view their own approvals" ON public.approvals;

CREATE POLICY "Users can view their own approvals"
ON public.approvals
FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'super_admin'
));

-- Allow super-admin to update approvals
DROP POLICY IF EXISTS "Super admins can update approvals" ON public.approvals;

CREATE POLICY "Super admins can update approvals"
ON public.approvals
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'super_admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'super_admin'
));
