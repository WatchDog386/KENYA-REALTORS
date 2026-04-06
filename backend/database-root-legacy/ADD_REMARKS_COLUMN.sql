-- Add remarks column to rent_payments and bills_and_utilities

BEGIN;

-- 1. Add remarks to rent_payments
ALTER TABLE public.rent_payments 
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. Add remarks to bills_and_utilities
ALTER TABLE public.bills_and_utilities 
ADD COLUMN IF NOT EXISTS remarks TEXT;

COMMIT;
