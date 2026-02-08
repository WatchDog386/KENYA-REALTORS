-- ============================================================================
-- STEP 2: Create non-recursive helper function
-- Run this SECOND in Supabase SQL Editor
-- ============================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS public.is_super_admin(uuid);

-- Create helper function with SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = user_id LIMIT 1),
    FALSE
  )
$$;

-- Test it
SELECT 'Step 2 Complete: Helper function created' as status;
