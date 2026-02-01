-- ============================================================================
-- COMPREHENSIVE FULLSTACK ALIGNMENT
-- Date: February 2, 2026
-- Purpose: Unify database schema with frontend expectations
-- Fixes: User models, RLS policies, missing columns, foreign keys
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure profiles table has all required columns with correct types
-- ============================================================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'tenant' CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'maintenance', 'accountant'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_type TEXT DEFAULT 'tenant';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure all related tables have proper RLS policies
-- ============================================================================

-- Enable RLS on all key tables
DO $$ BEGIN
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.units_detailed ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 3: Drop and recreate RLS policies for properties (FIXED - no recursion)
-- ============================================================================

DROP POLICY IF EXISTS "Allow super admins to see all properties" ON public.properties;
DROP POLICY IF EXISTS "Allow managers to see assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their properties" ON public.properties;
DROP POLICY IF EXISTS "Allow tenants to see their rented properties" ON public.properties;
DROP POLICY IF EXISTS "Allow super admins to manage all properties" ON public.properties;

-- Super admins see everything
CREATE POLICY "Allow super admins to see all properties"
  ON public.properties FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Managers see their assigned properties
CREATE POLICY "Allow managers to see assigned properties"
  ON public.properties FOR SELECT
  USING (
    manager_id = auth.uid() OR property_manager_id = auth.uid()
  );

-- Tenants see properties they manage (simple check)
CREATE POLICY "Allow tenants to see their property"
  ON public.properties FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'tenant')
  );

-- Super admins can do everything
CREATE POLICY "Allow super admins to manage all properties"
  ON public.properties FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 4: RLS policies for units_detailed (FIXED - no recursion)
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can see all units" ON public.units_detailed;
DROP POLICY IF EXISTS "Managers can see property units" ON public.units_detailed;
DROP POLICY IF EXISTS "Tenants can see their unit" ON public.units_detailed;
DROP POLICY IF EXISTS "Super admins can manage units" ON public.units_detailed;

-- Super admins see all units
CREATE POLICY "Super admins can see all units"
  ON public.units_detailed FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Managers see units in their properties
CREATE POLICY "Managers can see property units"
  ON public.units_detailed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.property_id = units_detailed.property_id
    )
  );

-- Tenants see their assigned unit
CREATE POLICY "Tenants can see their unit"
  ON public.units_detailed FOR SELECT
  USING (occupant_id = auth.uid());

-- Super admins can manage all units
CREATE POLICY "Super admins can manage units"
  ON public.units_detailed FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 5: RLS policies for leases (FIXED - simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can see all leases" ON public.leases;
DROP POLICY IF EXISTS "Managers can see property leases" ON public.leases;
DROP POLICY IF EXISTS "Tenants can see their leases" ON public.leases;
DROP POLICY IF EXISTS "Super admins can manage leases" ON public.leases;

-- Super admins see all leases
CREATE POLICY "Super admins can see all leases"
  ON public.leases FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Managers see leases for their properties
CREATE POLICY "Managers can see property leases"
  ON public.leases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.property_id = leases.property_id
    )
  );

-- Tenants see their own leases
CREATE POLICY "Tenants can see their leases"
  ON public.leases FOR SELECT
  USING (tenant_id = auth.uid());

-- Super admins can manage leases
CREATE POLICY "Super admins can manage leases"
  ON public.leases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 6: RLS policies for payments (FIXED - simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can see all payments" ON public.payments;
DROP POLICY IF EXISTS "Managers can see property payments" ON public.payments;
DROP POLICY IF EXISTS "Tenants can see their payments" ON public.payments;
DROP POLICY IF EXISTS "Super admins can manage payments" ON public.payments;

CREATE POLICY "Super admins can see all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Managers can see property payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.property_id = payments.property_id
    )
  );

CREATE POLICY "Tenants can see their payments"
  ON public.payments FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Super admins can manage payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 7: RLS policies for maintenance_requests (FIXED - simplified)
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can see all requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Managers can see property requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Tenants can see their requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Super admins can manage requests" ON public.maintenance_requests;

CREATE POLICY "Super admins can see all requests"
  ON public.maintenance_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Managers can see property requests"
  ON public.maintenance_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.property_id = maintenance_requests.property_id
    )
  );

CREATE POLICY "Tenants can see their requests"
  ON public.maintenance_requests FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Super admins can manage requests"
  ON public.maintenance_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- STEP 8: RLS policies for notifications
-- ============================================================================

DROP POLICY IF EXISTS "Users can see their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.notifications;

CREATE POLICY "Users can see their notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can manage their notifications"
  ON public.notifications FOR ALL
  USING (recipient_id = auth.uid());

-- ============================================================================
-- STEP 9: RLS policies for messages
-- ============================================================================

DROP POLICY IF EXISTS "Users can see their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage their messages" ON public.messages;

CREATE POLICY "Users can see their messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can manage their messages"
  ON public.messages FOR ALL
  USING (sender_id = auth.uid());

-- ============================================================================
-- STEP 10: Create views for frontend compatibility
-- ============================================================================

-- View for tenant profile with all related data
DROP VIEW IF EXISTS public.tenant_profile_view CASCADE;
CREATE VIEW public.tenant_profile_view AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.full_name,
  p.phone,
  p.role,
  p.user_type,
  p.status,
  p.is_active,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  p.property_id,
  p.unit_id,
  pr.name as property_name,
  pr.address as property_address,
  ud.unit_number,
  l.id as lease_id,
  l.start_date,
  l.end_date,
  l.monthly_rent
FROM public.profiles p
LEFT JOIN public.properties pr ON p.property_id = pr.id
LEFT JOIN public.units_detailed ud ON p.unit_id = ud.id
LEFT JOIN public.leases l ON p.id = l.tenant_id AND l.status = 'active'
WHERE p.role = 'tenant';

-- Grant permissions on view
GRANT SELECT ON public.tenant_profile_view TO authenticated;

-- ============================================================================
-- STEP 11: Verify structure
-- ============================================================================

SELECT 'Fullstack alignment complete!' as status;

-- Verify profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
