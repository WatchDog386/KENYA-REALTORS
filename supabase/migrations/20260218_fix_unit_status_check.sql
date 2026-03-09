-- FIX UNIT STATUS CONSTRAINT
-- Issue: The units table has a check constraint restricting status to ('available', 'occupied', 'maintenance', 'reserved')
-- Requirement: Change statuses to ('vacant', 'occupied', 'maintenance', 'booked') and set default to 'vacant'

-- 1. Drop the existing check constraint
-- We need to know the name. Usually it's 'units_status_check'.
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_status_check;

-- 2. Update existing data to match new statuses
-- 'available' -> 'vacant'
UPDATE public.units SET status = 'vacant' WHERE status = 'available';
-- 'reserved' -> 'booked'
UPDATE public.units SET status = 'booked' WHERE status = 'reserved';

-- 3. Add new check constraint
ALTER TABLE public.units
ADD CONSTRAINT units_status_check 
CHECK (status IN ('vacant', 'occupied', 'maintenance', 'booked'));

-- 4. Change column default
ALTER TABLE public.units 
ALTER COLUMN status SET DEFAULT 'vacant';
