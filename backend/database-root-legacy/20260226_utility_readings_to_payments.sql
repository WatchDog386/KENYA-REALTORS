-- Create trigger to automatically generate payment records from utility readings
-- This script runs when a new utility reading is inserted

BEGIN;

-- 1. Create a function to generate payment from utility reading
CREATE OR REPLACE FUNCTION generate_payment_from_utility_reading()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_payment_id UUID;
BEGIN
  -- Get the tenant for this unit
  SELECT user_id INTO v_tenant_id
  FROM public.tenants
  WHERE unit_id = NEW.unit_id
  LIMIT 1;

  -- Only create payment if tenant exists
  IF v_tenant_id IS NOT NULL THEN
    -- Create a new rent_payments record for the utility reading
    INSERT INTO public.rent_payments (
      tenant_id,
      property_id,
      unit_id,
      amount,
      due_date,
      status,
      remarks,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      NEW.property_id,
      NEW.unit_id,
      -- Total bill: electricity + water + garbage + security + other
      (NEW.current_reading - NEW.previous_reading) * NEW.electricity_rate 
        + NEW.water_bill 
        + NEW.garbage_fee 
        + NEW.security_fee 
        + NEW.other_charges,
      (NEW.reading_month + INTERVAL '7 days')::date, -- Due 7 days after reading month
      CASE WHEN NEW.status = 'approved' THEN 'pending' ELSE 'pending' END,
      'Utility Bill for ' || to_char(NEW.reading_month, 'Month YYYY') 
        || ' - Unit: ' || (SELECT unit_number FROM public.units WHERE id = NEW.unit_id),
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_generate_payment_from_reading ON public.utility_readings;

-- 3. Create trigger on utility_readings INSERT
CREATE TRIGGER trigger_generate_payment_from_reading
AFTER INSERT ON public.utility_readings
FOR EACH ROW
EXECUTE FUNCTION generate_payment_from_utility_reading();

-- 4. Create function to update payment status when reading status changes
CREATE OR REPLACE FUNCTION update_payment_from_reading_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update corresponding payment record if reading status changes
  UPDATE public.rent_payments
  SET status = CASE 
    WHEN NEW.status = 'approved' THEN 'pending'
    WHEN NEW.status = 'rejected' THEN 'cancelled'
    ELSE status
  END,
  updated_at = NOW()
  WHERE remarks LIKE '%Unit: ' || (SELECT unit_number FROM public.units WHERE id = NEW.unit_id) || '%'
    AND created_at >= (NEW.reading_month - INTERVAL '1 day')
    AND created_at <= (NEW.reading_month + INTERVAL '1 day');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger on status update
DROP TRIGGER IF EXISTS trigger_update_payment_from_reading ON public.utility_readings;

CREATE TRIGGER trigger_update_payment_from_reading
AFTER UPDATE ON public.utility_readings
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_payment_from_reading_status();

COMMIT;

-- VERIFICATION
SELECT 'Triggers created successfully' as status;
