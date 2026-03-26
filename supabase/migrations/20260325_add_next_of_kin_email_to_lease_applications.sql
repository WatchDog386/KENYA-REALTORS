-- Add optional next-of-kin email for richer tenant profile details in manager views.
ALTER TABLE public.lease_applications
ADD COLUMN IF NOT EXISTS next_of_kin_email text;
