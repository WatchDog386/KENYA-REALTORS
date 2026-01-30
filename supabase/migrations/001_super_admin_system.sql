-- Super Admin System Tables
-- This migration creates all tables needed for the Super Admin dashboard

-- ============================================================================
-- 1. PROFILES TABLE (Extended users table to match our components)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'tenant',
  status TEXT DEFAULT 'active',
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. PROPERTIES TABLE (Matches our Property interface) - UPDATED
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  -- REMOVED: property_name column as it doesn't exist in this schema
  -- property_name TEXT NOT NULL, -- This was causing the error
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Kenya',
  type TEXT DEFAULT 'apartment',
  status TEXT DEFAULT 'available',
  total_units INTEGER DEFAULT 1,
  occupied_units INTEGER DEFAULT 0,
  monthly_rent DECIMAL(10, 2) DEFAULT 0,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  images TEXT[],
  amenities TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_manager ON properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- ============================================================================
-- 3. APPROVAL_REQUESTS TABLE (Matches our ApprovalContext expectations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  attachments JSONB,
  review_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted_by ON approval_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON approval_requests(created_at DESC);

-- ============================================================================
-- 4. AUDIT_LOGS TABLE (For tracking activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 5. SYSTEM_SETTINGS TABLE (For system configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, key)
);

-- ============================================================================
-- 6. ROLES TABLE (For role-based permissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. USER_ROLES TABLE (For assigning roles to users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- ============================================================================
-- 8. MAINTENANCE_REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  images TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. LEASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number TEXT,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  terms JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 10. PAYMENTS TABLE (Updated to match our components)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT DEFAULT 'rent',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  payment_date DATE,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. MESSAGES TABLE (For communication between users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE NOT is_read;

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(timeframe TEXT DEFAULT 'month')
RETURNS JSON AS $$
DECLARE
  total_revenue DECIMAL(10, 2);
  total_properties INT;
  total_users INT;
  occupancy_rate DECIMAL(5, 2);
  pending_approvals INT;
  unread_messages INT;
  start_date TIMESTAMP;
BEGIN
  -- Determine start date based on timeframe
  CASE timeframe
    WHEN 'today' THEN start_date := NOW() - INTERVAL '1 day';
    WHEN 'week' THEN start_date := NOW() - INTERVAL '7 days';
    WHEN 'month' THEN start_date := NOW() - INTERVAL '30 days';
    WHEN 'quarter' THEN start_date := NOW() - INTERVAL '90 days';
    WHEN 'year' THEN start_date := NOW() - INTERVAL '365 days';
    ELSE start_date := NOW() - INTERVAL '30 days';
  END CASE;

  -- Calculate statistics
  SELECT COUNT(*) INTO total_properties FROM properties;
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO pending_approvals FROM approval_requests WHERE status = 'pending';
  SELECT COUNT(*) INTO unread_messages FROM messages WHERE is_read = FALSE;
  
  SELECT COALESCE(SUM(p.amount), 0) INTO total_revenue 
  FROM payments p
  WHERE p.status = 'completed' 
    AND p.created_at >= start_date;
  
  SELECT 
    CASE WHEN SUM(total_units) > 0 
      THEN ROUND((SUM(occupied_units)::DECIMAL / SUM(total_units)) * 100, 2)
      ELSE 0 
    END INTO occupancy_rate
  FROM properties;

  RETURN json_build_object(
    'totalProperties', total_properties,
    'totalUsers', total_users,
    'pendingApprovals', pending_approvals,
    'unreadMessages', unread_messages,
    'totalRevenue', total_revenue,
    'occupancyRate', occupancy_rate,
    'timeframe', timeframe
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  user_role TEXT;
  permissions TEXT[];
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- Map roles to permissions
  CASE user_role
    WHEN 'super_admin' THEN
      permissions := ARRAY[
        'manage_properties',
        'manage_users', 
        'manage_approvals',
        'manage_messages',
        'view_analytics',
        'manage_system_settings',
        'view_reports',
        'export_data',
        'manage_roles',
        'manage_notifications',
        'manage_payments'
      ];
    WHEN 'property_manager' THEN
      permissions := ARRAY[
        'manage_properties',
        'manage_approvals',
        'manage_messages',
        'view_analytics',
        'view_reports'
      ];
    WHEN 'tenant' THEN
      permissions := ARRAY['view_reports', 'send_messages', 'view_messages'];
    ELSE
      permissions := ARRAY[]::TEXT[];
  END CASE;
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to search properties
CREATE OR REPLACE FUNCTION search_properties(search_query TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  type TEXT,
  status TEXT,
  relevance INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.type,
    p.status,
    CASE 
      WHEN p.name ILIKE '%' || search_query || '%' THEN 3
      WHEN p.address ILIKE '%' || search_query || '%' THEN 2
      WHEN p.city ILIKE '%' || search_query || '%' THEN 1
      ELSE 0
    END as relevance
  FROM properties p
  WHERE p.name ILIKE '%' || search_query || '%'
     OR p.address ILIKE '%' || search_query || '%'
     OR p.city ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC, p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to send message
CREATE OR REPLACE FUNCTION send_message(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_property_id UUID DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_body TEXT
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO messages (
    sender_id,
    receiver_id,
    property_id,
    subject,
    body,
    is_read,
    created_at
  ) VALUES (
    p_sender_id,
    p_receiver_id,
    p_property_id,
    COALESCE(p_subject, 'New Message'),
    p_body,
    FALSE,
    NOW()
  ) RETURNING id INTO v_message_id;
  
  -- Log the message sent
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_sender_id,
    'send_message',
    'messages',
    v_message_id,
    json_build_object(
      'receiver_id', p_receiver_id,
      'property_id', p_property_id,
      'subject', COALESCE(p_subject, 'New Message')
    )
  );
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user messages
CREATE OR REPLACE FUNCTION get_user_messages(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
) RETURNS TABLE(
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  property_id UUID,
  subject TEXT,
  body TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  receiver_name TEXT,
  property_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.property_id,
    m.subject,
    m.body,
    m.is_read,
    m.created_at,
    CONCAT(sender.first_name, ' ', sender.last_name) as sender_name,
    CONCAT(receiver.first_name, ' ', receiver.last_name) as receiver_name,
    p.name as property_name
  FROM messages m
  LEFT JOIN profiles sender ON m.sender_id = sender.id
  LEFT JOIN profiles receiver ON m.receiver_id = receiver.id
  LEFT JOIN properties p ON m.property_id = p.id
  WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    AND (NOT p_unread_only OR m.is_read = FALSE)
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) - UPDATED FOR USER CREATION
-- ============================================================================

-- Profiles table - UPDATED POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Super admins can manage all profiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
  FOR ALL USING (is_super_admin(auth.uid()));

-- NEW: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (true);
CREATE POLICY "Super admins and property managers can manage properties" ON properties
  FOR ALL USING (
    is_super_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'property_manager')
  );

-- Approval requests table
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own approval requests" ON approval_requests
  FOR SELECT USING (submitted_by = auth.uid());
CREATE POLICY "Super admins and property managers can manage approval requests" ON approval_requests
  FOR ALL USING (
    is_super_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'property_manager')
  );

-- Audit logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only super admins can view audit logs" ON audit_logs
  FOR ALL USING (is_super_admin(auth.uid()));

-- System settings table
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only super admins can manage system settings" ON system_settings
  FOR ALL USING (is_super_admin(auth.uid()));

-- Messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can insert messages they send" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (receiver_id = auth.uid());
CREATE POLICY "Super admins can manage all messages" ON messages
  FOR ALL USING (is_super_admin(auth.uid()));

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_default) VALUES
(
  'super_admin',
  'Full system access with all permissions',
  ARRAY[
    'manage_properties',
    'manage_users', 
    'manage_approvals',
    'manage_messages',
    'view_analytics',
    'manage_system_settings',
    'view_reports',
    'export_data',
    'manage_roles',
    'manage_notifications',
    'manage_payments'
  ],
  false
),
(
  'property_manager',
  'Manage properties and tenant applications',
  ARRAY[
    'manage_properties',
    'manage_approvals',
    'manage_messages',
    'view_analytics',
    'view_reports'
  ],
  false
),
(
  'tenant',
  'Tenant access for viewing their information',
  ARRAY['view_reports', 'send_messages', 'view_messages'],
  true
)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (category, key, value, description) VALUES
('general', 'site_name', '"Property Management System"', 'Site name'),
('general', 'site_url', '"https://property-management.example.com"', 'Site URL'),
('general', 'admin_email', '"admin@example.com"', 'Admin email'),
('security', 'require_two_factor', 'false', 'Require two-factor authentication'),
('security', 'session_timeout', '30', 'Session timeout in minutes'),
('notifications', 'email_notifications', 'true', 'Enable email notifications'),
('messaging', 'enable_messaging', 'true', 'Enable messaging system'),
('messaging', 'notify_on_message', 'true', 'Notify users on new messages')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Create a trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at 
  BEFORE UPDATE ON approval_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at 
  BEFORE UPDATE ON maintenance_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leases_updated_at 
  BEFORE UPDATE ON leases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CREATE VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW property_analytics AS
SELECT 
  p.id,
  p.name,
  p.type,
  p.status,
  p.monthly_rent,
  p.total_units,
  p.occupied_units,
  CASE 
    WHEN p.total_units > 0 
    THEN ROUND((p.occupied_units::DECIMAL / p.total_units) * 100, 2)
    ELSE 0 
  END as occupancy_rate,
  p.manager_id,
  pr.first_name as manager_first_name,
  pr.last_name as manager_last_name,
  COUNT(DISTINCT l.id) as active_leases,
  COALESCE(SUM(CASE WHEN pm.status = 'completed' THEN pm.amount ELSE 0 END), 0) as total_revenue
FROM properties p
LEFT JOIN profiles pr ON p.manager_id = pr.id
LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
LEFT JOIN payments pm ON p.id = pm.property_id AND pm.status = 'completed'
GROUP BY p.id, p.name, p.type, p.status, p.monthly_rent, p.total_units, 
         p.occupied_units, p.manager_id, pr.first_name, pr.last_name;

CREATE OR REPLACE VIEW user_analytics AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.status,
  p.created_at,
  p.last_login_at,
  COUNT(DISTINCT CASE WHEN ar.submitted_by = p.id THEN ar.id END) as approval_requests,
  COUNT(DISTINCT CASE WHEN l.tenant_id = p.id THEN l.id END) as active_leases,
  COUNT(DISTINCT CASE WHEN m.reported_by = p.id THEN m.id END) as maintenance_requests,
  COUNT(DISTINCT CASE WHEN msg.sender_id = p.id THEN msg.id END) as sent_messages,
  COUNT(DISTINCT CASE WHEN msg.receiver_id = p.id AND NOT msg.is_read THEN msg.id END) as unread_messages
FROM profiles p
LEFT JOIN approval_requests ar ON p.id = ar.submitted_by
LEFT JOIN leases l ON p.id = l.tenant_id AND l.status = 'active'
LEFT JOIN maintenance_requests m ON p.id = m.reported_by
LEFT JOIN messages msg ON p.id = msg.sender_id OR p.id = msg.receiver_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.status, p.created_at, p.last_login_at;

-- Message analytics view
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN NOT is_read THEN 1 END) as unread_messages,
  COUNT(DISTINCT sender_id) as unique_senders,
  COUNT(DISTINCT receiver_id) as unique_receivers
FROM messages
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================================================
-- ADDITIONAL FIXES FOR USER CREATION ISSUE
-- ============================================================================

-- Create a function to handle user creation from admin
CREATE OR REPLACE FUNCTION create_user_from_admin(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- First create auth user (this would typically be done via Supabase Auth)
  -- For now, we'll create a placeholder and assume the auth user exists
  -- In reality, you should call the Supabase Auth API first
  
  -- Insert into profiles
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_email,
    p_first_name,
    p_last_name,
    COALESCE(p_role, 'tenant'),
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_user_id;
  
  -- Log the creation
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_created_by,
    'create_user',
    'profiles',
    v_user_id::TEXT,
    json_build_object(
      'email', p_email,
      'role', COALESCE(p_role, 'tenant'),
      'created_by', p_created_by
    )
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-create profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, NOW(), NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- This trigger should be created on auth.users table
-- Note: You need to run this in the Supabase dashboard SQL editor
/*
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
*/