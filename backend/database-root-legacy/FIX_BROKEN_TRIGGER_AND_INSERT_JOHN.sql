
-- ============================================================================
-- FIX BROKEN TENANT SETTINGS TRIGGER & INSERT MISSING TENANT
-- ============================================================================

-- 1. Attempt to identify and drop the broken trigger
-- We drop common names, and generic names.
DROP TRIGGER IF EXISTS on_tenant_created ON public.tenants;
DROP TRIGGER IF EXISTS tenant_created ON public.tenants;
DROP TRIGGER IF EXISTS create_settings_for_new_tenant ON public.tenants;
DROP TRIGGER IF EXISTS trigger_create_tenant_settings ON public.tenants;

-- 2. Drop the function if exists
DROP FUNCTION IF EXISTS public.handle_new_tenant();
DROP FUNCTION IF EXISTS public.create_tenant_settings();

-- 3. Create table if not exists (just in case)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
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

-- 6. Insert the missing tenant record for John Kamau
-- Using IDs found from debug script
DO $$
DECLARE
    target_user_id UUID := 'f5b2f858-9319-4bd4-9e9d-8cd421ba1829';
    target_unit_id UUID := '8efa5090-8964-4512-91b9-ece452de2eec'; -- F101
    target_property_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE user_id = target_user_id) THEN
        INSERT INTO public.tenants (user_id, property_id, unit_id, status, move_in_date)
        VALUES (target_user_id, target_property_id, target_unit_id, 'active', NOW());
        RAISE NOTICE 'Inserted missing tenant record for John Kamau';
    ELSE
        RAISE NOTICE 'Tenant record already exists for John Kamau';
        -- Update it just in case status is wrong
        UPDATE public.tenants 
        SET status = 'active', 
            unit_id = target_unit_id,
            property_id = target_property_id
        WHERE user_id = target_user_id;
    END IF;
END $$;
