-- ============================================================================
-- MIGRATION: Fix Utility Bill Total Calculation
-- DATE: 2026-02-28
-- PURPOSE: 
--   1. Fix total_bill calculation trigger in utility_readings table
--   2. Ensure total_bill = electricity_bill + water_bill + garbage_fee + security_fee + service_fee + other_charges
--   3. Update all existing records with correct calculations
--   4. Fix trigger to include service_fee in total_bill calculation
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: UPDATE THE TRIGGER FUNCTION TO INCLUDE SERVICE_FEE
-- ============================================================================

-- Drop the old trigger that doesn't include service_fee
DROP TRIGGER IF EXISTS trigger_calculate_utility_bills ON public.utility_readings;

-- Update the trigger function to correctly calculate total_bill with service_fee
CREATE OR REPLACE FUNCTION calculate_utility_bills()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate Electricity Usage (get the range/magnitude between readings)
  NEW.electricity_usage := ABS(COALESCE(NEW.current_reading, 0) - COALESCE(NEW.previous_reading, 0));
  
  -- Calculate Electricity Bill using the electricity_rate field (usage amount × rate)
  NEW.electricity_bill := NEW.electricity_usage * COALESCE(NEW.electricity_rate, 0);
  
  -- Calculate Water usage (get the range/magnitude between readings)
  NEW.water_usage := ABS(COALESCE(NEW.water_current_reading, 0) - COALESCE(NEW.water_previous_reading, 0));
  
  -- Water bill is already provided, but if zero, calculate from rate (fallback)
  IF NEW.water_bill IS NULL OR NEW.water_bill = 0 THEN
    NEW.water_bill := NEW.water_usage * COALESCE(NEW.water_rate, 0);
  END IF;
  
  -- Ensure all fee values are positive (no negative fees)
  NEW.garbage_fee := ABS(COALESCE(NEW.garbage_fee, 0));
  NEW.security_fee := ABS(COALESCE(NEW.security_fee, 0));
  NEW.service_fee := ABS(COALESCE(NEW.service_fee, 0));
  NEW.other_charges := ABS(COALESCE(NEW.other_charges, 0));
  
  -- Calculate Total Bill: (usage × rate) + all fees
  NEW.total_bill := COALESCE(NEW.electricity_bill, 0) + 
                    COALESCE(NEW.water_bill, 0) + 
                    COALESCE(NEW.garbage_fee, 0) + 
                    COALESCE(NEW.security_fee, 0) + 
                    COALESCE(NEW.service_fee, 0) + 
                    COALESCE(NEW.other_charges, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the updated function
CREATE TRIGGER trigger_calculate_utility_bills
BEFORE INSERT OR UPDATE ON public.utility_readings
FOR EACH ROW
EXECUTE FUNCTION calculate_utility_bills();

-- ============================================================================
-- PART 2: UPDATE EXISTING UTILITY READINGS WITH CORRECT INPUT VALUES
-- ============================================================================

-- Update all utility_readings input values only
-- The trigger will automatically recalculate electricity_bill, water_usage, and total_bill
UPDATE public.utility_readings
SET 
  -- Update the base readings (input columns)
  water_bill = ABS(COALESCE(water_bill, 0)),
  garbage_fee = ABS(COALESCE(garbage_fee, 0)),
  security_fee = ABS(COALESCE(security_fee, 0)),
  service_fee = ABS(COALESCE(service_fee, 0)),
  other_charges = ABS(COALESCE(other_charges, 0)),
  updated_at = NOW()
WHERE TRUE;
-- Note: electricity_bill, water_usage, and total_bill are generated columns
-- and will be automatically recalculated by the trigger function

-- ============================================================================
-- PART 3: ADD COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON COLUMN public.utility_readings.electricity_bill IS 'Calculated as: ABS(current_reading - previous_reading) × electricity_rate. Uses absolute value to get the range/magnitude of usage between readings.';
COMMENT ON COLUMN public.utility_readings.total_bill IS 'Total bill = electricity_bill + water_bill + garbage_fee + security_fee + service_fee + other_charges. Each component represents the actual consumption range or fixed charges.';

COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
