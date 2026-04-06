-- Create trigger to update utility_readings status when rent_payments status changes

BEGIN;

CREATE OR REPLACE FUNCTION update_utility_reading_status_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_unit_id UUID;
  v_reading_month DATE;
BEGIN
  -- Check if this payment is for a utility bill
  IF NEW.remarks LIKE 'Utility Bill for %' THEN
    -- Extract unit_id from remarks or use NEW.unit_id if available
    v_unit_id := NEW.unit_id;
    
    -- If payment is paid, update the corresponding utility reading
    IF NEW.status = 'paid' OR NEW.status = 'completed' THEN
      UPDATE public.utility_readings
      SET status = 'paid',
          updated_at = NOW()
      WHERE unit_id = v_unit_id
        AND status = 'pending'
        -- Match the month from remarks (e.g., "Utility Bill for February 2026")
        AND to_char(reading_month, 'Month YYYY') = substring(NEW.remarks from 'Utility Bill for (.*?) - Unit:');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_utility_reading_status ON public.rent_payments;

CREATE TRIGGER trigger_update_utility_reading_status
AFTER UPDATE ON public.rent_payments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_utility_reading_status_from_payment();

COMMIT;
