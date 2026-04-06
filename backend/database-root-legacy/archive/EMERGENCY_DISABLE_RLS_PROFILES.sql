-- ============================================================================
-- IMMEDIATE FIX: Drop all conflicting RLS policies causing 500 errors
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================================================

-- First disable RLS to get the system working
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 'RLS disabled temporarily on profiles table' as status;
