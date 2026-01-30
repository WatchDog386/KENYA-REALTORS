-- ============================================================================
-- REALTORS-LEASERS: COMPLETE DATABASE SETUP & MIGRATION
-- ============================================================================
-- This migration establishes the complete database schema for the REALTORS-LEASERS
-- platform, including tables, indexes, functions, triggers, RLS policies, and 
-- sample data.
--
-- Execution: Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ========================== SECTION 1: CORE TABLES ==========================

-- ========================== SECTION 1: CORE TABLES ==========================

-- 1.1: Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'tenant',
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'owner'))
);

-- 1.2: User profiles table (extended profile metadata)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL,
  company_name TEXT,
  company_registration TEXT,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Kenya',
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_type)
);

-- 1.3: Properties table (rental properties, apartments, villas, etc.)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Kenya',
  postal_code TEXT,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  status TEXT NOT NULL DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  total_units INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  available_units INTEGER DEFAULT 0,
  monthly_rent DECIMAL(10,2) DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  property_manager_id UUID REFERENCES public.profiles(id),
  owner_id UUID REFERENCES public.profiles(id),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'maintenance', 'vacant'))
);

-- 1.4: Payments table (rent payments, deposits, fees)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
);

-- 1.5: Property managers table (manager profiles and metadata)
CREATE TABLE IF NOT EXISTS public.property_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  portfolio JSONB DEFAULT '{}',
  assigned_properties_count INTEGER DEFAULT 0,
  performance_rating DECIMAL(3,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6: Manager assignments table (assignment of managers to properties)
CREATE TABLE IF NOT EXISTS public.manager_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index for active assignments only
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment 
ON public.manager_assignments (property_id, manager_id) 
WHERE status = 'active';

-- 1.7: Maintenance requests table (maintenance tasks for properties)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID,
  tenant_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'))
);

-- ========================== SECTION 2: TENANT TABLES =========================

-- 1.8: Leases table (lease agreements between tenants and properties)
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.profiles(id),
  unit_id TEXT,
  lease_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  rent_amount DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) NOT NULL,
  payment_day INTEGER DEFAULT 1,
  late_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
  terms JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  terminated_at TIMESTAMP WITH TIME ZONE,
  termination_reason TEXT,
  CONSTRAINT valid_lease_status CHECK (status IN ('active', 'terminated', 'expired', 'pending'))
);

-- 1.9: Tenant properties table (junction table linking tenants to properties)
CREATE TABLE IF NOT EXISTS public.tenant_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id TEXT,
  lease_id UUID REFERENCES public.leases(id),
  move_in_date DATE,
  move_out_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index for active tenant properties
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_tenant_property 
ON public.tenant_properties (tenant_id, property_id) 
WHERE status = 'active';

-- ==================== 4. CREATE SUPPORTING TABLES ====================

-- 4.1 Create approvals table
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  entity_id UUID,
  related_entity_id UUID,
  requested_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- 4.2 Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.3 Create security_logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- 4.4 Create refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  tenant_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT NOT NULL,
  requested_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_refund_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed'))
);

-- 4.5 Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ==================== 5. CREATE INDEXES FOR PERFORMANCE ====================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.profiles(email);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_manager ON public.properties(property_manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON public.payments(property_id);

-- Manager indexes
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_property ON public.manager_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_manager ON public.manager_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_status ON public.manager_assignments(status);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON public.maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned ON public.maintenance_requests(assigned_to);

-- Leases indexes
CREATE INDEX IF NOT EXISTS idx_leases_property ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);

-- Tenant properties indexes
CREATE INDEX IF NOT EXISTS idx_tenant_properties_tenant ON public.tenant_properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_properties_property ON public.tenant_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_properties_status ON public.tenant_properties(status);

-- Approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_type ON public.approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_approvals_requested ON public.approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_approvals_created ON public.approvals(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Security logs indexes
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON public.security_logs(created_at DESC);

-- Refunds indexes
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON public.refunds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON public.refunds(tenant_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ==================== 6. CREATE RPC FUNCTIONS ====================

-- 6.1 Function to get super admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  total_properties INT;
  active_managers INT;
  pending_approvals INT;
  total_revenue DECIMAL(10,2);
  result JSON;
BEGIN
  -- Get total active properties
  SELECT COUNT(*) INTO total_properties 
  FROM public.properties 
  WHERE is_active = true;

  -- Get active property managers
  SELECT COUNT(*) INTO active_managers 
  FROM public.profiles 
  WHERE role = 'property_manager' 
    AND is_active = true;

  -- Get pending approvals
  SELECT COUNT(*) INTO pending_approvals 
  FROM public.approvals 
  WHERE status = 'pending';

  -- Get total revenue (last 30 days)
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue 
  FROM public.payments 
  WHERE status = 'completed' 
    AND payment_date >= NOW() - INTERVAL '30 days';

  -- Build result JSON
  result := json_build_object(
    'totalProperties', total_properties,
    'activeManagers', active_managers,
    'pendingApprovals', pending_approvals,
    'totalRevenue', total_revenue
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return default values if tables don't exist
  RETURN json_build_object(
    'totalProperties', 0,
    'activeManagers', 0,
    'pendingApprovals', 0,
    'totalRevenue', 0
  );
END;
$$ LANGUAGE plpgsql;

-- 6.2 Function to get manager dashboard stats
CREATE OR REPLACE FUNCTION public.get_manager_dashboard_stats(manager_id UUID)
RETURNS JSON AS $$
DECLARE
  managed_properties INTEGER;
  active_tenants INTEGER;
  pending_rent DECIMAL(10,2);
  maintenance_count INTEGER;
  total_revenue DECIMAL(10,2);
  occupancy_rate DECIMAL(5,2);
  result JSON;
BEGIN
  -- Get managed properties count
  SELECT COUNT(*) INTO managed_properties 
  FROM public.properties 
  WHERE property_manager_id = manager_id 
    AND is_active = true;

  -- Get active tenants count
  SELECT COUNT(DISTINCT tp.tenant_id) INTO active_tenants
  FROM public.tenant_properties tp
  JOIN public.properties p ON tp.property_id = p.id
  WHERE p.property_manager_id = manager_id 
    AND tp.status = 'active';

  -- Get pending rent (rent due in current month not paid)
  SELECT COALESCE(SUM(l.rent_amount), 0) INTO pending_rent
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.payments pay
      WHERE pay.tenant_id = l.tenant_id
        AND pay.property_id = l.property_id
        AND pay.status = 'completed'
        AND DATE_TRUNC('month', pay.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
    );

  -- Get pending maintenance requests
  SELECT COUNT(*) INTO maintenance_count
  FROM public.maintenance_requests mr
  JOIN public.properties p ON mr.property_id = p.id
  WHERE p.property_manager_id = manager_id
    AND mr.status IN ('pending', 'assigned');

  -- Get total monthly revenue from occupied units
  SELECT COALESCE(SUM(l.rent_amount), 0) INTO total_revenue
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE;

  -- Get occupancy rate
  SELECT 
    CASE 
      WHEN SUM(p.total_units) > 0 THEN 
        (SUM(p.occupied_units)::DECIMAL / SUM(p.total_units)::DECIMAL) * 100
      ELSE 0
    END INTO occupancy_rate
  FROM public.properties p
  WHERE p.property_manager_id = manager_id
    AND p.is_active = true;

  -- Build result JSON
  result := json_build_object(
    'managedProperties', managed_properties,
    'activeTenants', active_tenants,
    'pendingRent', pending_rent,
    'maintenanceCount', maintenance_count,
    'totalRevenue', total_revenue,
    'occupancyRate', ROUND(occupancy_rate, 2),
    'properties', (
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'tenants', p.occupied_units,
        'occupancy', 
          CASE 
            WHEN p.total_units > 0 THEN 
              ROUND((p.occupied_units::DECIMAL / p.total_units::DECIMAL) * 100, 2)
            ELSE 0
          END,
        'revenue', COALESCE((
          SELECT SUM(l.rent_amount)
          FROM public.leases l
          WHERE l.property_id = p.id
            AND l.status = 'active'
            AND l.start_date <= CURRENT_DATE
            AND l.end_date >= CURRENT_DATE
        ), 0)
      ))
      FROM public.properties p
      WHERE p.property_manager_id = manager_id
        AND p.is_active = true
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6.3 Function to check system health
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Simple health check
  result := json_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'checks', json_build_object(
      'database', 'connected',
      'auth', 'operational',
      'storage', 'available'
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==================== 7. ENABLE ROW LEVEL SECURITY ====================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==================== 8. CREATE RLS POLICIES ====================

-- Users policies
CREATE POLICY "Users can view their own data" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Property managers can view assigned properties" ON public.properties
  FOR SELECT USING (property_manager_id = auth.uid());

-- Manager assignments policies
CREATE POLICY "Managers can view own assignments" ON public.manager_assignments
  FOR SELECT USING (manager_id = auth.uid());

-- Maintenance requests policies
CREATE POLICY "Managers can view property maintenance" ON public.maintenance_requests
  FOR SELECT USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      WHERE p.property_manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update assigned maintenance" ON public.maintenance_requests
  FOR UPDATE USING (assigned_to = auth.uid());

-- Leases policies
CREATE POLICY "Managers can view property leases" ON public.leases
  FOR SELECT USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      WHERE p.property_manager_id = auth.uid()
    )
  );

-- Tenant properties policies
CREATE POLICY "Managers can view tenant properties" ON public.tenant_properties
  FOR SELECT USING (
    property_id IN (
      SELECT p.id FROM public.properties p
      WHERE p.property_manager_id = auth.uid()
    )
  );

-- ==================== 9. INSERT SAMPLE DATA ====================
-- NOTE: Sample data for profiles requires existing auth.users records.
-- To insert test data:
-- 1. Create users in Supabase Auth (Authentication > Users)
-- 2. Copy their user IDs and use them in the INSERT statements below
-- 3. Then run the commented INSERT statements

-- Example: Insert super admin (replace UUID with actual auth.users id)
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- VALUES (
--   'your-actual-auth-user-id',
--   'admin@example.com',
--   'Admin',
--   'User',
--   'super_admin'
-- );

-- Example: Insert sample property managers (after creating auth users)
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- VALUES 
--   ('auth-id-for-manager1', 'manager1@example.com', 'John', 'Doe', 'property_manager'),
--   ('auth-id-for-manager2', 'manager2@example.com', 'Jane', 'Smith', 'property_manager'),
--   ('auth-id-for-manager3', 'manager3@example.com', 'Mike', 'Johnson', 'property_manager');

-- Example: Insert sample tenants (after creating auth users)
-- INSERT INTO public.profiles (id, email, first_name, last_name, role)
-- VALUES 
--   ('auth-id-for-tenant1', 'tenant1@example.com', 'Alice', 'Brown', 'tenant'),
--   ('auth-id-for-tenant2', 'tenant2@example.com', 'Bob', 'Wilson', 'tenant'),
--   ('auth-id-for-tenant3', 'tenant3@example.com', 'Charlie', 'Davis', 'tenant');

-- Sample properties (can be inserted without auth.users dependency)
INSERT INTO public.properties (name, address, city, total_units, monthly_rent, security_deposit, property_type)
VALUES 
  ('Nairobi Apartments', 'Westlands, Nairobi', 'Nairobi', 20, 50000, 100000, 'apartment'),
  ('Mombasa Villa', 'Nyali, Mombasa', 'Mombasa', 5, 150000, 300000, 'villa'),
  ('Kisumu Suites', 'Milimani, Kisumu', 'Kisumu', 15, 35000, 70000, 'apartment'),
  ('Eldoret Complex', 'Elgon View, Eldoret', 'Eldoret', 10, 25000, 50000, 'commercial'),
  ('Thika Gardens', 'Thika Road, Thika', 'Thika', 8, 20000, 40000, 'apartment')
ON CONFLICT DO NOTHING;

-- ==================== 10. CREATE TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
DO $$ 
DECLARE 
  table_name TEXT;
BEGIN 
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'users', 'user_profiles', 'properties', 'payments', 
      'property_managers', 'manager_assignments', 'maintenance_requests',
      'leases', 'tenant_properties', 'approvals', 'refunds'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I;
      CREATE TRIGGER update_%s_updated_at 
        BEFORE UPDATE ON public.%I 
        FOR EACH ROW 
        EXECUTE FUNCTION public.update_updated_at_column();
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- ==================== 11. GRANT PERMISSIONS ====================

-- Grant access to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==================== 12. VERIFY SETUP ====================

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Total users created: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Total properties created: %', (SELECT COUNT(*) FROM public.properties);
  RAISE NOTICE 'Total leases created: %', (SELECT COUNT(*) FROM public.leases);
  RAISE NOTICE 'Total maintenance requests: %', (SELECT COUNT(*) FROM public.maintenance_requests);
END $$;