-- Add columns to support partial payments and tracking for Rent and Utilities

BEGIN;

-- 1. Update rent_payments table
-- Add amount_paid to track actual payment received
ALTER TABLE public.rent_payments 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0;

-- 2. Update bills_and_utilities table
-- Add paid_amount to track payments against specific bills
ALTER TABLE public.bills_and_utilities 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12, 2) DEFAULT 0;

-- Ensure status check includes 'partial' if not already
-- (Postgres CHECK constraints are immutable, so we drop and recreate if needed, 
-- but simpler is just to ensure application logic handles it first. 
-- The migration file 001 already had 'partial' for rent_payments but bills_and_utilities missed it).

DO $$ 
BEGIN
    -- Drop old constraint for bills_and_utilities status if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bills_and_utilities_status_check' AND table_name = 'bills_and_utilities'
    ) THEN
        ALTER TABLE public.bills_and_utilities DROP CONSTRAINT bills_and_utilities_status_check;
    END IF;

    -- Add new constraint including 'partial'
    ALTER TABLE public.bills_and_utilities
    ADD CONSTRAINT bills_and_utilities_status_check 
    CHECK (status IN ('open', 'paid', 'overdue', 'partial'));
END $$;

COMMIT;
