-- Create tables for Super Admin Dashboard - UPDATED VERSION

-- First, ensure we have the proper profiles table (this should match your useUserManagement.ts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'property_manager', 'tenant')) DEFAULT 'tenant',
  status TEXT CHECK (status IN ('active', 'inactive', 'pending', 'suspended')) DEFAULT 'active',
  suspension_reason TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table (if not exists)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Kenya',
  zip_code TEXT,
  property_type TEXT DEFAULT 'apartment',
  total_units INTEGER DEFAULT 1,
  monthly_rent DECIMAL(10, 2) DEFAULT 0,
  price DECIMAL(10, 2), -- For sale properties
  status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  manager_id UUID REFERENCES public.profiles(id),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Removed the "users" table since we're using "profiles" table

-- Approvals table
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  entity_id UUID, -- The ID of the entity being approved
  related_entity_id UUID, -- Additional related entity if needed
  requested_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (for revenue calculation)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_manager ON public.properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);

-- ========== CRITICAL: AUTH TRIGGER SETUP ==========
-- This trigger automatically creates a profile when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- ========== END CRITICAL AUTH TRIGGER ==========

-- Create RPC functions
CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  total_properties INT;
  active_users INT;
  pending_approvals INT;
  total_revenue DECIMAL(10, 2);
  result JSON;
BEGIN
  -- Get total active properties
  SELECT COUNT(*) INTO total_properties 
  FROM public.properties 
  WHERE is_active = true;

  -- Get active users (excluding super_admin for dashboard count)
  SELECT COUNT(*) INTO active_users 
  FROM public.profiles 
  WHERE status = 'active' 
    AND role != 'super_admin';

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
    'totalProperties', COALESCE(total_properties, 0),
    'activeUsers', COALESCE(active_users, 0),
    'pendingApprovals', COALESCE(pending_approvals, 0),
    'totalRevenue', COALESCE(total_revenue, 0)
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return default values if any table doesn't exist
  RETURN json_build_object(
    'totalProperties', 0,
    'activeUsers', 0,
    'pendingApprovals', 0,
    'totalRevenue', 0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create a user (for admin user creation)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT DEFAULT '',
  p_last_name TEXT DEFAULT '',
  p_phone TEXT DEFAULT '',
  p_role TEXT DEFAULT 'tenant'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  result JSON;
BEGIN
  -- Note: This function is for reference. In practice, user creation
  -- should be done through the Supabase Auth admin API with service role key.
  -- This function won't work without proper auth setup.
  
  result := json_build_object(
    'success', false,
    'message', 'User creation should be done through Supabase Auth admin API',
    'note', 'Use service role key with supabase.auth.admin.createUser()'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Simple system health check function
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSON AS $$
DECLARE
  result JSON;
  profiles_count INT;
  properties_count INT;
BEGIN
  -- Check if profiles table exists and has data
  BEGIN
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  EXCEPTION WHEN OTHERS THEN
    profiles_count := -1;
  END;
  
  -- Check if properties table exists and has data
  BEGIN
    SELECT COUNT(*) INTO properties_count FROM public.properties;
  EXCEPTION WHEN OTHERS THEN
    properties_count := -1;
  END;
  
  -- Build health check result
  result := json_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'checks', json_build_object(
      'database', 'connected',
      'profiles_table', CASE WHEN profiles_count >= 0 THEN 'exists' ELSE 'missing' END,
      'properties_table', CASE WHEN properties_count >= 0 THEN 'exists' ELSE 'missing' END,
      'auth_trigger', 'exists'
    ),
    'counts', json_build_object(
      'profiles', COALESCE(profiles_count, 0),
      'properties', COALESCE(properties_count, 0)
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS JSON AS $$
DECLARE
  total_users INT;
  super_admins INT;
  admins INT;
  property_managers INT;
  tenants INT;
  active_users INT;
  suspended_users INT;
BEGIN
  -- Get counts by role
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO super_admins FROM public.profiles WHERE role = 'super_admin';
  SELECT COUNT(*) INTO admins FROM public.profiles WHERE role = 'admin';
  SELECT COUNT(*) INTO property_managers FROM public.profiles WHERE role = 'property_manager';
  SELECT COUNT(*) INTO tenants FROM public.profiles WHERE role = 'tenant';
  SELECT COUNT(*) INTO active_users FROM public.profiles WHERE status = 'active';
  SELECT COUNT(*) INTO suspended_users FROM public.profiles WHERE status = 'suspended';
  
  RETURN json_build_object(
    'total', COALESCE(total_users, 0),
    'superAdmins', COALESCE(super_admins, 0),
    'admins', COALESCE(admins, 0),
    'managers', COALESCE(property_managers, 0),
    'tenants', COALESCE(tenants, 0),
    'active', COALESCE(active_users, 0),
    'suspended', COALESCE(suspended_users, 0),
    'inactive', COALESCE(total_users - active_users - suspended_users, 0)
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ========== IMPORTANT: TEMPORARILY DISABLE RLS FOR TESTING ==========
-- Comment out the policies below and run this first:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.properties DISABLE ROW LEVEL SECURITY;
-- ========== END TEMPORARY FIX ==========

-- Create policies for Super Admin (can access everything)
CREATE POLICY "Super admins can do everything on profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can do everything on properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can do everything on approvals" ON public.approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can do everything on audit_logs" ON public.audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can do everything on security_logs" ON public.security_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can do everything on payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Public read access for some tables (optional)
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Insert/update the super admin profile
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  first_name,
  last_name,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '374d7910-06ca-477b-b1af-617c46159bf1',
  '374d7910-06ca-477b-b1af-617c46159bf1',
  'duncanmarshel@gmail.com',
  'Duncan',
  'Marshel',
  'super_admin',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin',
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- Insert sample properties (optional)
INSERT INTO public.properties (
  title,
  name,
  address,
  city,
  country,
  property_type,
  total_units,
  monthly_rent,
  status,
  manager_id
) VALUES 
  ('Modern Apartment in Nairobi', 'Nairobi Apartments', 'Westlands, Nairobi', 'Nairobi', 'Kenya', 'apartment', 10, 50000, 'active', '374d7910-06ca-477b-b1af-617c46159bf1'),
  ('Luxury Villa in Mombasa', 'Mombasa Villa', 'Nyali, Mombasa', 'Mombasa', 'Kenya', 'villa', 1, 150000, 'active', '374d7910-06ca-477b-b1af-617c46159bf1'),
  ('Office Space in CBD', 'CBD Office Tower', 'Kenyatta Avenue, Nairobi', 'Nairobi', 'Kenya', 'commercial', 50, 25000, 'active', '374d7910-06ca-477b-b1af-617c46159bf1')
ON CONFLICT DO NOTHING;

-- Insert sample users for testing (optional)
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  first_name,
  last_name,
  role,
  status
) VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'manager1@example.com', 'John', 'Manager', 'property_manager', 'active'),
  (gen_random_uuid(), gen_random_uuid(), 'tenant1@example.com', 'Jane', 'Tenant', 'tenant', 'active'),
  (gen_random_uuid(), gen_random_uuid(), 'admin1@example.com', 'Admin', 'User', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Create a view for dashboard stats
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.properties WHERE is_active = true) as total_properties,
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'active' AND role != 'super_admin') as active_users,
  (SELECT COUNT(*) FROM public.approvals WHERE status = 'pending') as pending_approvals,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed' AND payment_date >= NOW() - INTERVAL '30 days') as total_revenue;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET 
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    phone = COALESCE(p_phone, phone),
    role = COALESCE(p_role, role),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Test the setup with a simple query
SELECT 'Database setup completed successfully' as message,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.properties) as properties_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin') as super_admin_count;