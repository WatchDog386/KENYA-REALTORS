-- COMPLETE SETUP FOR FIXED UTILITY PRICING
-- Run all these scripts in Supabase Dashboard in this order

-- STEP 1: Add price column to utility_constants
ALTER TABLE public.utility_constants ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- STEP 2: Set default prices for fixed utilities (adjust values as needed)
UPDATE public.utility_constants 
SET price = 500 
WHERE is_metered = FALSE AND utility_name = 'Garbage';

UPDATE public.utility_constants 
SET price = 1000 
WHERE is_metered = FALSE AND utility_name = 'Security';

UPDATE public.utility_constants 
SET price = 500 
WHERE is_metered = FALSE AND utility_name = 'Service';

-- STEP 3: Verify all utilities and their prices
SELECT 
    utility_name, 
    is_metered,
    constant,
    price,
    description 
FROM public.utility_constants 
ORDER BY utility_name;

-- STEP 4: Verify RLS policies exist
SELECT 
    policyname,
    cmd,
    CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause,
    CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as with_check_clause
FROM pg_policies
WHERE tablename = 'utility_constants'
ORDER BY policyname;

-- STEP 5: Check that current user is superadmin
SELECT 
    auth.uid() as user_id,
    (SELECT role FROM public.profiles WHERE id = auth.uid()) as user_role;

-- If you want to test an update manually, replace the UUID with an actual utility record ID:
-- UPDATE public.utility_constants 
-- SET price = 750 
-- WHERE id = 'actual-uuid-here' AND is_metered = FALSE
-- RETURNING *;
