-- Adds configurable move-in charge templates per property.
-- Used to auto-fill first-payment invoices with named deposits/fees.

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS initial_charge_templates JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.initial_charge_templates IS
'Array of per-property default move-in charges. Each item: {id, name, charge_type: deposit|fee, amount}';
