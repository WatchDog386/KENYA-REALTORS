-- Stores reusable first-payment defaults configured by Super Admin billing.
-- Currently used for security deposit month multiplier in move-in invoicing.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS first_payment_defaults JSONB NOT NULL DEFAULT '{"security_deposit_months": 1}'::jsonb;

COMMENT ON COLUMN public.properties.first_payment_defaults IS
'Property-level first payment defaults. Example: {"security_deposit_months": 2}';
