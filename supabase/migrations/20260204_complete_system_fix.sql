-- ============================================================================
-- COMPLETE SYSTEM FIX AND CLEANUP
-- Unified Registration & Approval Workflow - FINAL WORKING VERSION
-- ============================================================================

-- STEP 0: Clean up OLD broken tables and policies
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP POLICY IF EXISTS "service_role_unrestricted_access" ON public.profiles;
DROP POLICY IF EXISTS "users_can_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "service_role_all_access" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_access" ON public.profiles;
DROP POLICY IF EXISTS "service_role_manager_approvals" ON public.manager_approvals;
DROP POLICY IF EXISTS "super_admin_manager_approvals" ON public.manager_approvals;
DROP POLICY IF EXISTS "user_own_approval" ON public.manager_approvals;
DROP POLICY IF EXISTS "service_role_tenant_approvals" ON public.tenant_approvals;
DROP POLICY IF EXISTS "super_admin_tenant_approvals" ON public.tenant_approvals;
DROP POLICY IF EXISTS "user_own_tenant_approval" ON public.tenant_approvals;
DROP POLICY IF EXISTS "service_role_notifications" ON public.notifications;
DROP POLICY IF EXISTS "user_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "user_update_own_notifications" ON public.notifications;

-- STEP 1: CLEAN UP PROFILES TABLE - Remove conflicting columns
-- ============================================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS emergency_contact_name CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS emergency_contact_phone CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS house_number CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS property_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS unit_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS approved CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS approval_notes CASCADE;

-- Ensure essential columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Drop NOT NULL constraint if needed on email for flexibility
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- STEP 2: ENSURE APPROVAL TABLES EXIST (Clean versions)
-- ============================================================================

-- Manager Approvals Table
DROP TABLE IF EXISTS public.manager_approvals CASCADE;

CREATE TABLE public.manager_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    profile_id UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    managed_properties UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_manager_approvals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_manager_approvals_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_manager_approvals_status ON public.manager_approvals(status);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_user_id ON public.manager_approvals(user_id);

-- Tenant Approvals Table
DROP TABLE IF EXISTS public.tenant_approvals CASCADE;

CREATE TABLE public.tenant_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    profile_id UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    unit_id UUID REFERENCES public.units_detailed(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_tenant_approvals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_approvals_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_approvals_status ON public.tenant_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tenant_approvals_user_id ON public.tenant_approvals(user_id);

-- STEP 3: NOTIFICATIONS TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- ============================================================================

-- Disable RLS temporarily to set up policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_service_role_all" 
    ON public.profiles FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "profiles_user_own" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "profiles_super_admin_all" 
    ON public.profiles FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
    ));

-- Manager Approvals Policies
CREATE POLICY "manager_approvals_service_role" 
    ON public.manager_approvals FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "manager_approvals_super_admin" 
    ON public.manager_approvals FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
    ));

CREATE POLICY "manager_approvals_user_own" 
    ON public.manager_approvals FOR SELECT 
    USING (user_id = auth.uid());

-- Tenant Approvals Policies
CREATE POLICY "tenant_approvals_service_role" 
    ON public.tenant_approvals FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "tenant_approvals_super_admin" 
    ON public.tenant_approvals FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
    ));

CREATE POLICY "tenant_approvals_user_own" 
    ON public.tenant_approvals FOR SELECT 
    USING (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "notifications_service_role" 
    ON public.notifications FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "notifications_user_own" 
    ON public.notifications FOR SELECT 
    USING (recipient_id = auth.uid());

CREATE POLICY "notifications_user_update_own" 
    ON public.notifications FOR UPDATE 
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- STEP 5: CREATE AUTH TRIGGER (FIXED VERSION)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_phone TEXT;
    v_status TEXT;
BEGIN
    -- Extract data from raw_user_meta_data
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    
    -- Set status based on role
    v_status := CASE 
        WHEN v_role = 'super_admin' THEN 'active'
        ELSE 'pending'
    END;
    
    -- Insert profile
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name,
        last_name,
        phone,
        role,
        user_type,
        status,
        is_active,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_phone,
        v_role,
        v_role,
        v_status,
        v_role = 'super_admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW();
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.manager_approvals TO authenticated;
GRANT SELECT ON public.tenant_approvals TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.manager_approvals TO service_role;
GRANT ALL ON public.tenant_approvals TO service_role;
GRANT ALL ON public.notifications TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- STEP 7: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE public.manager_approvals IS 'Tracks property manager registrations awaiting approval and property assignments';
COMMENT ON TABLE public.tenant_approvals IS 'Tracks tenant registrations awaiting approval and unit assignments';
COMMENT ON TABLE public.notifications IS 'System-wide notifications for users';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created';

-- ============================================================================
-- Migration Complete - System Ready for Testing
-- ============================================================================
