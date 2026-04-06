-- DIAGNOSTIC: Check RLS policies on utility_constants
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'utility_constants'
ORDER BY policyname;

-- Check if current user is superadmin
SELECT 
    id,
    email,
    role
FROM public.profiles
WHERE id = auth.uid();

-- Verify table exists and has data
SELECT COUNT(*) as total_utilities FROM public.utility_constants;

-- Try to update a test constant (replace UUID with actual ID)
-- UPDATE public.utility_constants 
-- SET constant = 140 
-- WHERE id = 'your-uuid-here'
-- RETURNING *;
