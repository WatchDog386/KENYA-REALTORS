-- ============================================================================
-- SCRIPT: Fix Ayden Homes Towers Unit Numbering
-- Date: March 17, 2026
-- Purpose: Convert unit numbering from text (One, Two, Three, etc.) to numerical (1, 2, 3, etc.)
-- ============================================================================

BEGIN;

-- Step 1: Get the property ID for Ayden Homes Towers
-- (Run this as a check to ensure we have the right property)
SELECT id, name, location FROM public.properties WHERE name = 'Ayden Homes Towers';

-- Step 2: Update unit numbers from text format to numerical
-- This captures the text number format and converts it

-- Update "One" to "1"
UPDATE public.units 
SET unit_number = '1'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'One';

-- Update "Two" to "2"
UPDATE public.units 
SET unit_number = '2'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Two';

-- Update "Three" to "3"
UPDATE public.units 
SET unit_number = '3'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Three';

-- Update "Four" to "4"
UPDATE public.units 
SET unit_number = '4'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Four';

-- Update "Five" to "5"
UPDATE public.units 
SET unit_number = '5'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Five';

-- Update "Six" to "6"
UPDATE public.units 
SET unit_number = '6'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Six';

-- Update "Seven" to "7"
UPDATE public.units 
SET unit_number = '7'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Seven';

-- Update "Eight" to "8"
UPDATE public.units 
SET unit_number = '8'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Eight';

-- Update "Nine" to "9"
UPDATE public.units 
SET unit_number = '9'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Nine';

-- Update "Ten" to "10"
UPDATE public.units 
SET unit_number = '10'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Ten';

-- Update "Eleven" to "11"
UPDATE public.units 
SET unit_number = '11'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Eleven';

-- Update "Twelve" to "12"
UPDATE public.units 
SET unit_number = '12'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Twelve';

-- Update "Thirteen" to "13"
UPDATE public.units 
SET unit_number = '13'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Thirteen';

-- Update "Fourteen" to "14"
UPDATE public.units 
SET unit_number = '14'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Fourteen';

-- Update "Fifteen" to "15"
UPDATE public.units 
SET unit_number = '15'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Fifteen';

-- Update "Sixteen" to "16"
UPDATE public.units 
SET unit_number = '16'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Sixteen';

-- Update "Seventeen" to "17"
UPDATE public.units 
SET unit_number = '17'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Seventeen';

-- Update "Eighteen" to "18"
UPDATE public.units 
SET unit_number = '18'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Eighteen';

-- Update "Nineteen" to "19"
UPDATE public.units 
SET unit_number = '19'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Nineteen';

-- Update "Twenty" to "20"
UPDATE public.units 
SET unit_number = '20'
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
) AND unit_number = 'Twenty';

-- Step 3: Verify the update
SELECT unit_number, COUNT(*) as count
FROM public.units
WHERE property_id = (
  SELECT id FROM public.properties WHERE name = 'Ayden Homes Towers'
)
GROUP BY unit_number
ORDER BY 
  CASE 
    WHEN unit_number ~ '^\d+$' THEN CAST(unit_number AS INTEGER)
    ELSE 999
  END;

COMMIT;
