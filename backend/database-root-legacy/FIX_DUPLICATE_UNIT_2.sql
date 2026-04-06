-- Fix Duplicate Unit Numbers
-- This script finds units with the same property and identifies which ones should be renumbered

-- Step 1: Identify duplicate unit numbers by property
-- View all units and their count
SELECT 
  property_id,
  unit_number,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as unit_ids,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM public.units
GROUP BY property_id, unit_number
HAVING COUNT(*) > 1
ORDER BY property_id, unit_number;

-- Step 2: IF YOU HAVE DUPLICATES with unit_number = '2':
-- This will help identify which one to keep and which to change
-- The older one (lower created_at) will typically be the original

-- Step 3: Manually update the incorrect duplicate
-- EXAMPLE: If you have two units with unit_number = '2' and the first one should be '1':
-- Uncomment and modify this line based on your duplicate unit IDs:
-- UPDATE public.units SET unit_number = '1' WHERE id = 'PASTE_THE_UUID_OF_THE_FIRST_2_HERE';

-- Step 4: After fixing, verify no duplicates remain
SELECT 
  property_id,
  unit_number,
  COUNT(*) as count
FROM public.units
GROUP BY property_id, unit_number
HAVING COUNT(*) > 1;

-- This should return 0 rows if all duplicates are fixed.
