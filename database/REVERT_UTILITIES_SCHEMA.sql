-- Revert utility_bills table to original simple schema
-- Remove extended columns that were added for payment tracking

ALTER TABLE public.utility_bills 
DROP COLUMN IF EXISTS penalty_fee,
DROP COLUMN IF EXISTS total_paid,
DROP COLUMN IF EXISTS arrears,
DROP COLUMN IF EXISTS advance_rent,
DROP COLUMN IF EXISTS transaction_date,
DROP COLUMN IF EXISTS reference_code;

-- Verify the table structure is back to original
-- Original columns: id, tenant_id, property_id, water_bill, electricity_bill, garbage_bill, security_bill, service_fee, billing_date, due_date, status, created_at, updated_at
