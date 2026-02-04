-- ============================================================================
-- COMPREHENSIVE DATABASE SETUP AND REPAIR
-- Date: February 11, 2026
-- Purpose: Ensure all tables, views, and policies exist and are correct
-- ============================================================================

-- ============================================================================
-- STEP 0: DISABLE RLS GLOBALLY AND CLEAN UP ALL POLICIES
-- ============================================================================

-- Disable RLS on all tables to avoid conflicts during policy drops
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_unit_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_manager_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on ALL tables (comprehensive cleanup)
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_super_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_auth_admin_all" ON public.profiles;

DROP POLICY IF EXISTS "properties_public_read" ON public.properties;
DROP POLICY IF EXISTS "properties_super_admin_all" ON public.properties;
DROP POLICY IF EXISTS "properties_service_role_all" ON public.properties;

DROP POLICY IF EXISTS "unit_types_public_read" ON public.property_unit_types;
DROP POLICY IF EXISTS "unit_types_super_admin_all" ON public.property_unit_types;
DROP POLICY IF EXISTS "unit_types_service_role_all" ON public.property_unit_types;

DROP POLICY IF EXISTS "assignments_service_role_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_super_admin_all" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_manager_read_own" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "assignments_public_read" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.property_manager_assignments;
DROP POLICY IF EXISTS "Allow public read" ON public.property_manager_assignments;

DROP POLICY IF EXISTS "tenants_service_role_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_super_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "tenants_user_read_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_public_read" ON public.tenants;
DROP POLICY IF EXISTS "Enable all access for super admins" ON public.tenants;
DROP POLICY IF EXISTS "Allow tenants to read own data" ON public.tenants;
DROP POLICY IF EXISTS "Allow public read" ON public.tenants;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    user_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    email_confirmed BOOLEAN DEFAULT FALSE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    house_number VARCHAR(50),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Add any missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- STEP 2: Ensure properties table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    image_url TEXT,
    type VARCHAR(100),
    description TEXT,
    amenities TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Ensure property_unit_types table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    units_count INTEGER DEFAULT 1,
    price_per_unit DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Ensure property_manager_assignments table exists (NO STATUS COLUMN!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.property_manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(property_manager_id, property_id)
);

-- ============================================================================
-- STEP 5: Ensure tenants table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.property_unit_types(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'moving_out')),
    move_in_date TIMESTAMP WITH TIME ZONE,
    move_out_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- STEP 7: Create all_users_with_profile VIEW if it doesn't exist
-- ============================================================================

-- Drop and recreate the view to ensure it's correct
DROP VIEW IF EXISTS public.all_users_with_profile CASCADE;

CREATE OR REPLACE VIEW public.all_users_with_profile AS
SELECT
    u.id,
    u.email,
    COALESCE(p.first_name, u.raw_user_meta_data->>'first_name', SPLIT_PART(u.email, '@', 1)) AS first_name,
    COALESCE(p.last_name, u.raw_user_meta_data->>'last_name', '') AS last_name,
    COALESCE(p.phone, u.raw_user_meta_data->>'phone', '') AS phone,
    COALESCE(p.role, u.raw_user_meta_data->>'role', 'tenant') AS role,
    COALESCE(p.status, u.raw_user_meta_data->>'status', 'active') AS status,
    COALESCE(p.is_active, true) AS is_active,
    COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', '') AS avatar_url,
    u.created_at,
    COALESCE(p.updated_at, u.created_at) AS updated_at,
    COALESCE(p.last_login_at, u.last_sign_in_at) AS last_login_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL;

-- ============================================================================
-- STEP 8: Re-enable RLS on all tables and create new policies
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 9: Create new RLS policies (clean slate after step 0 cleanup)
-- ============================================================================

-- PROFILES POLICIES
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "profiles_auth_admin_all"
    ON public.profiles FOR ALL
    TO supabase_auth_admin
    USING (true)
    WITH CHECK (true);

-- Allow super admins to create profiles for any user
CREATE POLICY "profiles_super_admin_insert"
    ON public.profiles FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
      )
    );

-- Allow super admins to update profiles
CREATE POLICY "profiles_super_admin_update"
    ON public.profiles FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
      )
    );

-- Allow users to select and update their own profile
CREATE POLICY "profiles_user_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_user_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PROPERTIES POLICIES
CREATE POLICY "properties_public_read"
    ON public.properties FOR SELECT
    USING (true);

CREATE POLICY "properties_service_role_all"
    ON public.properties FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- PROPERTY_UNIT_TYPES POLICIES
CREATE POLICY "unit_types_public_read"
    ON public.property_unit_types FOR SELECT
    USING (true);

CREATE POLICY "unit_types_service_role_all"
    ON public.property_unit_types FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- PROPERTY_MANAGER_ASSIGNMENTS POLICIES
CREATE POLICY "assignments_service_role_all"
    ON public.property_manager_assignments FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "assignments_public_read"
    ON public.property_manager_assignments FOR SELECT
    USING (true);

-- TENANTS POLICIES
CREATE POLICY "tenants_service_role_all"
    ON public.tenants FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "tenants_public_read"
    ON public.tenants FOR SELECT
    USING (true);

-- ============================================================================
-- STEP 10: Verification queries
-- ============================================================================

-- Verify tables exist
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 'properties', COUNT(*) FROM public.properties
UNION ALL
SELECT 'property_unit_types', COUNT(*) FROM public.property_unit_types
UNION ALL
SELECT 'property_manager_assignments', COUNT(*) FROM public.property_manager_assignments
UNION ALL
SELECT 'tenants', COUNT(*) FROM public.tenants;

-- Verify view exists and works
SELECT COUNT(*) as total_users_in_view FROM public.all_users_with_profile;
