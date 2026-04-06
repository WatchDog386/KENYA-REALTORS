-- ============================================================================
-- FIX: USER CREATION DATABASE ERRORS (RLS + NOT NULL CONSTRAINTS)
-- ============================================================================
-- This script fixes the "Database error saving new user" error by:
-- 1. Adding missing RLS INSERT policy for profiles
-- 2. Ensuring all NOT NULL constraints are dropped from role-specific tables
-- 3. Fixing trigger permissions
--
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. This should be run AFTER FINAL_ROLE_FIX_v2.sql
-- ============================================================================

BEGIN;

-- 1. ENSURE NOT NULL CONSTRAINTS ARE RELAXED ON ALL ROLE TABLES
-- ============================================================================

-- Technicians
ALTER TABLE public.technicians ALTER COLUMN category_id DROP NOT NULL;

-- Caretakers
ALTER TABLE public.caretakers ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN property_manager_id DROP NOT NULL;
ALTER TABLE public.caretakers ALTER COLUMN assigned_by DROP NOT NULL;

-- Accountants
ALTER TABLE public.accountants ALTER COLUMN assigned_by DROP NOT NULL;

-- 2. ADD MISSING RLS INSERT POLICY FOR PROFILES
-- ============================================================================
-- The trigger function needs to be able to insert profiles
-- NOTE: SECURITY DEFINER functions bypass RLS, but we add explicit policies anyway

-- First, ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy (SECURITY DEFINER function will bypass this anyway)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- 3. RELAXED RLS FOR ROLE-SPECIFIC TABLES (ALLOW TRIGGER INSERTS)
-- ============================================================================

-- Technicians - allow service role to insert
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow trigger to insert technicians" ON public.technicians;
CREATE POLICY "Allow trigger to insert technicians"
ON public.technicians FOR INSERT
WITH CHECK (true);

-- Caretakers - allow service role to insert
ALTER TABLE public.caretakers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow trigger to insert caretakers" ON public.caretakers;
CREATE POLICY "Allow trigger to insert caretakers"
ON public.caretakers FOR INSERT
WITH CHECK (true);

-- Proprietors - allow service role to insert
ALTER TABLE public.proprietors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow trigger to insert proprietors" ON public.proprietors;
CREATE POLICY "Allow trigger to insert proprietors"
ON public.proprietors FOR INSERT
WITH CHECK (true);

-- Accountants - allow service role to insert
ALTER TABLE public.accountants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow trigger to insert accountants" ON public.accountants;
CREATE POLICY "Allow trigger to insert accountants"
ON public.accountants FOR INSERT
WITH CHECK (true);

-- 4. UPDATE PROFILES TABLE WITH UPDATE POLICY (OPTIONAL)
-- ============================================================================
-- Only add if needed - comment out if breaking existing functionality
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
-- USING (auth.uid() = id)
-- WITH CHECK (auth.uid() = id);

-- 5. DELETE POLICIES (OPTIONAL)
-- ============================================================================
-- Only add if needed - comment out if breaking existing functionality
-- DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
-- CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE
-- USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the fix:
/*
-- Check profiles policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- Check if NOT NULL constraints were dropped
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name IN ('technicians', 'caretakers', 'accountants', 'proprietors')
AND column_name IN ('category_id', 'property_id', 'property_manager_id', 'assigned_by')
ORDER BY table_name, column_name;
*/
