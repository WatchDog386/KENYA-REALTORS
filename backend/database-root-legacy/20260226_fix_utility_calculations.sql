-- Fix utility_readings table to support dynamic rates and water readings

BEGIN;

-- 1. Drop the generated columns that hardcode the rate
ALTER TABLE public.utility_readings DROP COLUMN IF EXISTS electricity_usage;
ALTER TABLE public.utility_readings DROP COLUMN IF EXISTS electricity_bill;
ALTER TABLE public.utility_readings DROP COLUMN IF EXISTS total_bill;

-- 2. Add water reading columns
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS water_previous_reading DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS water_current_reading DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS water_rate DECIMAL(10, 2) DEFAULT 0;

-- 3. Re-add the columns as regular columns (not generated) so we can calculate them in the app or via trigger
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS electricity_usage DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS electricity_bill DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS water_usage DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS total_bill DECIMAL(12, 2) DEFAULT 0;

-- 4. Create a trigger to automatically calculate the bills before insert/update
CREATE OR REPLACE FUNCTION calculate_utility_bills()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate Electricity
  NEW.electricity_usage := COALESCE(NEW.current_reading, 0) - COALESCE(NEW.previous_reading, 0);
  NEW.electricity_bill := NEW.electricity_usage * COALESCE(NEW.electricity_rate, 0);
  
  -- Calculate Water
  NEW.water_usage := COALESCE(NEW.water_current_reading, 0) - COALESCE(NEW.water_previous_reading, 0);
  NEW.water_bill := NEW.water_usage * COALESCE(NEW.water_rate, 0);
  
  -- Calculate Total
  NEW.total_bill := NEW.electricity_bill + NEW.water_bill + COALESCE(NEW.garbage_fee, 0) + COALESCE(NEW.security_fee, 0) + COALESCE(NEW.other_charges, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_utility_bills ON public.utility_readings;

CREATE TRIGGER trigger_calculate_utility_bills
BEFORE INSERT OR UPDATE ON public.utility_readings
FOR EACH ROW
EXECUTE FUNCTION calculate_utility_bills();

-- 5. Create a function to dynamically add new utilities
CREATE OR REPLACE FUNCTION add_custom_utility(utility_name TEXT)
RETURNS void AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Convert to lowercase and replace spaces with underscores
  safe_name := lower(regexp_replace(utility_name, '\s+', '_', 'g'));
  
  -- Add to utility_settings if it doesn't exist
  EXECUTE format('ALTER TABLE public.utility_settings ADD COLUMN IF NOT EXISTS %I DECIMAL(10, 2) DEFAULT 0', safe_name || '_fee');
  
  -- Add to utility_readings if it doesn't exist
  EXECUTE format('ALTER TABLE public.utility_readings ADD COLUMN IF NOT EXISTS %I DECIMAL(12, 2) DEFAULT 0', safe_name || '_fee');
  
  -- Update the trigger to include the new column in total_bill
  -- Note: This is complex to do dynamically in a safe way, so we'll rely on the frontend to pass it in 'other_charges' 
  -- OR we can just let the frontend calculate the total_bill and override the trigger.
  -- Actually, let's just add the column. The frontend can sum up all known columns.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
