-- ============================================================================
-- Unified Registration and Approval Workflow
-- 
-- Purpose: Create a single, consistent approval/assignment workflow for 
--          both property managers and tenants in the super admin dashboard.
--
-- Flow:
-- 1. User registers (property manager OR tenant) via RegisterPage
-- 2. Auth user created → profile created with role + status='pending'
-- 3. Profile appears in Super Admin UserManagement dashboard
-- 4. Super admin reviews and assigns properties/approves
-- 5. On approval: status='active' → user can login
-- 6. After login: role-based routing to their portal
-- ============================================================================

-- STEP 1: Ensure profiles table has all required columns
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- STEP 2: Create manager_approvals table for tracking manager assignments
-- ============================================================================

DROP TABLE IF EXISTS public.manager_approvals CASCADE;

CREATE TABLE public.manager_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    profile_id UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID,
    approval_notes TEXT,
    managed_properties UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.manager_approvals ADD CONSTRAINT fk_manager_approvals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.manager_approvals ADD CONSTRAINT fk_manager_approvals_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.manager_approvals ADD CONSTRAINT fk_manager_approvals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.manager_approvals ADD CONSTRAINT check_manager_approvals_status CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_manager_approvals_status ON public.manager_approvals(status);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_user_id ON public.manager_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_manager_approvals_reviewed_by ON public.manager_approvals(reviewed_by);

-- STEP 3: Create tenant_approvals table for tracking tenant assignments
-- ============================================================================

DROP TABLE IF EXISTS public.tenant_approvals CASCADE;

CREATE TABLE public.tenant_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    profile_id UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by UUID,
    approval_notes TEXT,
    unit_id UUID,
    property_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tenant_approvals ADD CONSTRAINT fk_tenant_approvals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tenant_approvals ADD CONSTRAINT fk_tenant_approvals_profile_id FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.tenant_approvals ADD CONSTRAINT fk_tenant_approvals_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.tenant_approvals ADD CONSTRAINT fk_tenant_approvals_unit_id FOREIGN KEY (unit_id) REFERENCES public.units_detailed(id);
ALTER TABLE public.tenant_approvals ADD CONSTRAINT fk_tenant_approvals_property_id FOREIGN KEY (property_id) REFERENCES public.properties(id);
ALTER TABLE public.tenant_approvals ADD CONSTRAINT check_tenant_approvals_status CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_tenant_approvals_status ON public.tenant_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tenant_approvals_user_id ON public.tenant_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_approvals_property_id ON public.tenant_approvals(property_id);

-- STEP 4: Create notifications table for approval alerts
-- ============================================================================

DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    sender_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_recipient_id FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_sender_id FOREIGN KEY (sender_id) REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- STEP 5: Update RLS Policies
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "service_role_unrestricted_access" ON public.profiles;
DROP POLICY IF EXISTS "users_can_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "service_role_all_access"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "users_own_profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "super_admin_all_access"
  ON public.profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  ));

-- Manager Approvals Policies
CREATE POLICY "service_role_manager_approvals"
  ON public.manager_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "super_admin_manager_approvals"
  ON public.manager_approvals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  ));

CREATE POLICY "user_own_approval"
  ON public.manager_approvals FOR SELECT
  USING (user_id = auth.uid());

-- Tenant Approvals Policies
CREATE POLICY "service_role_tenant_approvals"
  ON public.tenant_approvals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "super_admin_tenant_approvals"
  ON public.tenant_approvals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  ));

CREATE POLICY "user_own_tenant_approval"
  ON public.tenant_approvals FOR SELECT
  USING (user_id = auth.uid());

-- Notifications Policies
CREATE POLICY "service_role_notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_own_notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "user_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- STEP 6: Update auth trigger to create approval records
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value TEXT;
  profile_status TEXT;
BEGIN
  role_value := NEW.raw_user_meta_data->>'role' OR 'tenant';
  profile_status := CASE 
    WHEN role_value = 'super_admin' THEN 'active'
    WHEN role_value = 'property_manager' THEN 'pending'
    ELSE 'pending'
  END;

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
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    role_value,
    role_value,
    profile_status,
    role_value = 'super_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    status = COALESCE(EXCLUDED.status, public.profiles.status),
    updated_at = NOW();
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation for user % failed: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 7: Grant permissions
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

-- ============================================================================
-- Migration Complete!
-- ============================================================================
COMMENT ON TABLE public.manager_approvals IS 'Tracks property manager registration approvals and property assignments';
COMMENT ON TABLE public.tenant_approvals IS 'Tracks tenant registration approvals and unit assignments';
COMMENT ON TABLE public.notifications IS 'System notifications for approval status updates';
