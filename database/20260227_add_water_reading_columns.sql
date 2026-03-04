-- Add water reading columns to utility_readings table
-- These columns are needed for tracking water usage similar to electricity

BEGIN;

-- Add water-related columns if they don't exist
ALTER TABLE public.utility_readings 
ADD COLUMN IF NOT EXISTS water_previous_reading DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.utility_readings 
ADD COLUMN IF NOT EXISTS water_current_reading DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.utility_readings 
ADD COLUMN IF NOT EXISTS water_rate DECIMAL(10, 2) DEFAULT 0;

-- Optionally add a generated column for water usage (like electricity_usage)
ALTER TABLE public.utility_readings 
ADD COLUMN IF NOT EXISTS water_usage DECIMAL(10, 2) GENERATED ALWAYS AS (water_current_reading - water_previous_reading) STORED;

COMMIT;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    