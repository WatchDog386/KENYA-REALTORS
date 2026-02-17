
-- Migration to support anonymous lease applications
-- 1. Make applicant_id nullable
ALTER TABLE public.lease_applications ALTER COLUMN applicant_id DROP NOT NULL;

-- 2. Add columns for anonymous applicant details
ALTER TABLE public.lease_applications ADD COLUMN IF NOT EXISTS applicant_first_name TEXT;
ALTER TABLE public.lease_applications ADD COLUMN IF NOT EXISTS applicant_last_name TEXT;
ALTER TABLE public.lease_applications ADD COLUMN IF NOT EXISTS applicant_email TEXT;
ALTER TABLE public.lease_applications ADD COLUMN IF NOT EXISTS applicant_phone TEXT;

-- 3. Update RLS policies to allow public inserts
-- Check if policy exists and drop it to recreate or just create if not exists
DROP POLICY IF EXISTS "Allow public insert to lease_applications" ON public.lease_applications;

CREATE POLICY "Allow public insert to lease_applications"
ON public.lease_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure public can select their own applications? 
-- Usually anonymous users can't see them after submission unless we use a session or token.
-- But managers need to see them.
-- Managers policy should already cover "view all for my property".

-- Grant permissions
GRANT INSERT ON public.lease_applications TO anon;
GRANT INSERT ON public.lease_applications TO authenticated;
