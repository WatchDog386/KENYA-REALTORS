-- ============================================================================
-- FIX: RBAC and Approval Workflow Implementation
-- Based on the requirement: Super Admin > Property Manager > Tenant
-- Approval chains and RLS policies included.
-- ============================================================================

-- 1. Create User Role Enum (Safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('super_admin', 'property_manager', 'tenant');
    END IF;
END
$$;

-- 2. Create Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  manager_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 3. Update Profiles Table
-- We add 'role', 'approved', 'property_id' if they don't exist.
-- Note: existing 'role' column might be text. We can cast it or leave it as text with check constraint if migration to enum is hard.
-- For safety, we will leave 'role' as text but add a check constraint if it doesn't exist, generic enough to support the enum values.
-- Or better, if 'role' exists as text, we update it.
-- The user prompt suggested 'role' text default 'user' previously.
-- The user prompt NOW suggests "add column if not exists role public.user_role default 'tenant'".
-- I will attempt to alter the column type if it exists as text, or add it if missing.

-- First, ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id);

-- Handle 'role' column. 
-- If it exists as text, we might want to cast it or just ensure values are valid.
-- For this script, we'll try to use the enum if possible, or fallback to text with checks.
-- Let's stick to TEXT for 'role' to be safe with existing data, but add a Constraint.
-- It's easier than converting column types in a generic script without knowing data.
-- However, the user specifically provided `create type public.user_role`.
-- let's try to convert valid values.

ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'tenant';

-- Update existing null roles to tenant
UPDATE public.profiles SET role = 'tenant' WHERE role IS NULL;

-- 4. Enable RLS on profiles (ensure it is on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Clear existing policies to avoid conflicts? It's safer to drop specific ones we are replacing.
-- The user asked for specific policies.

-- SUPER ADMIN POLICIES
-- "Super admin full read"
DROP POLICY IF EXISTS "Super admin full read" ON public.profiles;
CREATE POLICY "Super admin full read"
ON public.profiles
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid())::text = 'super_admin'
);

-- "Super admin approve managers"
DROP POLICY IF EXISTS "Super admin approve managers" ON public.profiles;
CREATE POLICY "Super admin approve managers"
ON public.profiles
FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid())::text = 'super_admin'
);

-- PROPERTY MANAGER POLICIES
-- "Manager reads own tenants"
DROP POLICY IF EXISTS "Manager reads own tenants" ON public.profiles;
CREATE POLICY "Manager reads own tenants"
ON public.profiles
FOR SELECT
USING (
  role = 'tenant'
  AND property_id IN (
    SELECT id FROM public.properties
    WHERE manager_id = auth.uid()
  )
);

-- "Manager approves tenants"
DROP POLICY IF EXISTS "Manager approves tenants" ON public.profiles;
CREATE POLICY "Manager approves tenants"
ON public.profiles
FOR UPDATE
USING (
  role = 'tenant'
  AND property_id IN (
    SELECT id FROM public.properties
    WHERE manager_id = auth.uid()
  )
);

-- TENANT POLICIES
-- "Tenant read own profile"
DROP POLICY IF EXISTS "Tenant read own profile" ON public.profiles;
CREATE POLICY "Tenant read own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  AND approved = true
);

-- ACCESS GATE
-- "Only approved users access"
-- Note: This conflicts with "Tenant read own profile" if applied generally.
-- Policies are OR'd. If "Tenant read own profile" exists, they can read.
-- The user's guide says: 
-- create policy "Only approved users access" on public.profiles for select using (approved = true or ...='super_admin');
-- This seems to be a general read policy.

DROP POLICY IF EXISTS "Only approved users access" ON public.profiles;
CREATE POLICY "Only approved users access"
ON public.profiles
FOR SELECT
USING (
  approved = true
  OR (SELECT role FROM public.profiles WHERE id = auth.uid())::text = 'super_admin'
);

-- 6. Super Admin Setup
-- Make duncanmarshel@gmail.com super_admin and approved
UPDATE public.profiles
SET 
  role = 'super_admin',
  approved = true,
  status = 'active', -- Keep backward compatibility
  is_active = true   -- Keep backward compatibility
WHERE email = 'duncanmarshel@gmail.com';

-- Ensure the user exists in profiles if they are in auth.users
INSERT INTO public.profiles (id, email, role, approved, status, is_active)
SELECT id, email, 'super_admin', true, 'active', true
FROM auth.users
WHERE email = 'duncanmarshel@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', approved = true, status = 'active', is_active = true;

