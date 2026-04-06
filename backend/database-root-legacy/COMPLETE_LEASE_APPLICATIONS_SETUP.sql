-- Complete Lease Applications Table Setup
-- Run this entire script in Supabase SQL Editor to fix the unit application form

-- Step 1: Ensure lease_applications table exists with all necessary columns
ALTER TABLE public.lease_applications 
ADD COLUMN IF NOT EXISTS applicant_name TEXT,
ADD COLUMN IF NOT EXISTS applicant_email TEXT,
ADD COLUMN IF NOT EXISTS physical_address TEXT,
ADD COLUMN IF NOT EXISTS po_box TEXT,
ADD COLUMN IF NOT EXISTS employer_details TEXT,
ADD COLUMN IF NOT EXISTS telephone_numbers TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS age_bracket TEXT,
ADD COLUMN IF NOT EXISTS occupants_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_of_kin TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS house_staff BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS sub_location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 2: Make applicant_id nullable (if not already) and drop restrictive constraints
ALTER TABLE public.lease_applications 
ALTER COLUMN applicant_id DROP NOT NULL;

-- Drop foreign key constraint on unit_id if it mistakenly points to property_unit_types
-- This allows unitId to belong to property_units or be loosely coupled
ALTER TABLE public.lease_applications 
DROP CONSTRAINT IF EXISTS lease_applications_unit_id_fkey;

-- Step 3: Set up Row Level Security (RLS)
-- Enable RLS if not already enabled
ALTER TABLE public.lease_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public insert to lease_applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Allow authenticated insert to lease_applications" ON public.lease_applications;
DROP POLICY IF EXISTS "Allow managers view applications for their properties" ON public.lease_applications;
DROP POLICY IF EXISTS "Public can view their own applications" ON public.lease_applications;

-- Create policies
-- 1. Allow anyone (anonymous or authenticated) to insert
CREATE POLICY "Allow public insert to lease_applications"
ON public.lease_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow managers to view applications for their properties
CREATE POLICY "Allow managers view applications for their properties"
ON public.lease_applications
FOR SELECT
USING (
  property_id IN (
    SELECT property_id 
    FROM property_manager_assignments 
    WHERE property_manager_id = auth.uid()
  )
  OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin')
);

-- Step 4: Grant permissions
GRANT INSERT ON public.lease_applications TO anon;
GRANT INSERT ON public.lease_applications TO authenticated;
GRANT SELECT ON public.lease_applications TO authenticated;
GRANT UPDATE ON public.lease_applications TO authenticated;

-- Step 5: Ensure profiles table exists and has necessary columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify by checking column count
SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lease_applications'
GROUP BY table_name;
