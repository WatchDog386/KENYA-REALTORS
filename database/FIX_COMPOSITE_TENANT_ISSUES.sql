-- MERGED FIX for Tenant Assignment
-- Includes RLS fixes and Trigger fixes.

BEGIN;

-- ============================================================================
-- PART 1: FIX RLS POLICIES (Resolves 409 Conflict)
-- ============================================================================

-- 1. ENABLE RLS (Ensure it's on)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. DROP RESTRICTIVE POLICIES
DROP POLICY IF EXISTS "Manager Manage Tenants" ON public.tenants;
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenants_service_role" ON public.tenants;
DROP POLICY IF EXISTS "tenants_admin_all" ON public.tenants;
DROP POLICY IF EXISTS "Unified View Policy" ON public.tenants;
DROP POLICY IF EXISTS "Managers can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Managers can update tenants to their properties" ON public.tenants;
DROP POLICY IF EXISTS "Managers can insert tenants for their properties" ON public.tenants;

-- DROP NEW POLICIES (If re-running script)
DROP POLICY IF EXISTS "tenants_service_role_full" ON public.tenants;
DROP POLICY IF EXISTS "tenants_super_admin_full" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_select" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_insert" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_update" ON public.tenants;
DROP POLICY IF EXISTS "tenants_manager_delete" ON public.tenants;


-- 3. CREATE NEW POLICIES

-- A. SERVICE ROLE (Full Access)
CREATE POLICY "tenants_service_role_full"
ON public.tenants FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- B. SUPER ADMIN (Full Access)
CREATE POLICY "tenants_super_admin_full"
ON public.tenants FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- C. MANAGER VIEW (Select)
-- Allow managers to see ALL tenant records. This allows checking if a tenant exists before insertion.
CREATE POLICY "tenants_manager_select"
ON public.tenants FOR SELECT
USING (
    -- If user is a manager of ANY active property
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    -- Or user is the tenant themselves
    (auth.uid() = user_id)
);

-- D. MANAGER INSERT (Create)
-- Managers can create new tenant records for their properties
CREATE POLICY "tenants_manager_insert"
ON public.tenants FOR INSERT
WITH CHECK (
    -- The tenant must be assigned to a property the manager manages
    EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = property_id
        AND property_manager_id = auth.uid()
        AND status = 'active'
    )
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- E. MANAGER UPDATE (Move/Edit)
-- Managers can update ANY tenant record, BUT only if they are assigning it to one of THEIR properties.
CREATE POLICY "tenants_manager_update"
ON public.tenants FOR UPDATE
USING (
    -- Must be a manager
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
)
WITH CHECK (
    -- PROPOSED CHANGE must point to a property the manager owns
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = property_id -- usage of the NEW property_id
        AND property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- F. MANAGER DELETE
CREATE POLICY "tenants_manager_delete"
ON public.tenants FOR DELETE
USING (
    -- Can only delete if currently assigned to your property
    (EXISTS (
        SELECT 1 FROM public.property_manager_assignments 
        WHERE property_id = public.tenants.property_id
        AND property_manager_id = auth.uid() 
        AND status = 'active'
    ))
    OR
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'))
);


-- ============================================================================
-- PART 2: FIX TRIGGER (Resolves FK Constraint on Insert)
-- ============================================================================

-- 1. Attempt to identify and drop the broken trigger
DROP TRIGGER IF EXISTS on_tenant_created ON public.tenants;
DROP TRIGGER IF EXISTS tenant_created ON public.tenants;
DROP TRIGGER IF EXISTS create_settings_for_new_tenant ON public.tenants;
DROP TRIGGER IF EXISTS trigger_create_tenant_settings ON public.tenants;

-- 2. Drop the function if exists (CASCADE to remove linked triggers)
DROP FUNCTION IF EXISTS public.handle_new_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.create_tenant_settings() CASCADE;

-- 3. START FRESH with tenant_settings (Schema mismatch fix)
DROP TABLE IF EXISTS public.tenant_settings CASCADE;
CREATE TABLE public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- 4. Create the CORRECT function (Using user_id)
CREATE OR REPLACE FUNCTION public.create_tenant_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tenant_settings (tenant_id, notifications_enabled, created_at, updated_at)
  VALUES (NEW.user_id, true, NOW(), NOW()) -- Crucial: Use NEW.user_id, NOT NEW.id
  ON CONFLICT (tenant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-create the trigger
CREATE TRIGGER on_tenant_created
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.create_tenant_settings();

COMMIT;
