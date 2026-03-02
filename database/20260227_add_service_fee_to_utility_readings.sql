-- Add service_fee column to utility_readings table and update total_bill calculation
-- This migration adds the missing service_fee column that the application is trying to use

BEGIN;

-- Add service_fee column if it doesn't exist
ALTER TABLE public.utility_readings 
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(12, 2) DEFAULT 0;

-- Drop the existing total_bill calculated column to recreate it with service_fee included
ALTER TABLE public.utility_readings 
DROP COLUMN IF EXISTS total_bill CASCADE;

-- Recreate the total_bill as a generated column that includes service_fee
ALTER TABLE public.utility_readings 
ADD COLUMN total_bill DECIMAL(12, 2) GENERATED ALWAYS AS (
    ((current_reading - previous_reading) * electricity_rate) + 
    water_bill + 
    garbage_fee + 
    security_fee + 
    service_fee + 
    other_charges
) STORED;

COMMIT;
