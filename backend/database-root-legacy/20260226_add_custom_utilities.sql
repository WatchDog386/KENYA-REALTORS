-- Add JSONB columns for custom utilities

BEGIN;

ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS custom_utilities JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS custom_utilities JSONB DEFAULT '{}'::jsonb;

COMMIT;
