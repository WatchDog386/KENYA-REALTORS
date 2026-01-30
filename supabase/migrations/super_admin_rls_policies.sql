-- Row Level Security Policies for Super Admin System

-- User Profiles Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Super admins can see all profiles
CREATE POLICY "Super admins can view all user profiles" 
ON user_profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- Super admins can insert user profiles
CREATE POLICY "Super admins can insert user profiles" 
ON user_profiles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Super admins can update user profiles
CREATE POLICY "Super admins can update user profiles" 
ON user_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Properties Policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Everyone can view properties
CREATE POLICY "Everyone can view properties" 
ON properties FOR SELECT 
USING (true);

-- Only super admins and property managers can modify properties
CREATE POLICY "Admins and managers can manage properties" 
ON properties FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND (up.role = 'super_admin' OR up.role = 'property_manager')
  )
);

-- Property Units Policies
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;

-- Everyone can view property units
CREATE POLICY "Everyone can view property units" 
ON property_units FOR SELECT 
USING (true);

-- Only admins and managers can modify units
CREATE POLICY "Admins and managers can manage units" 
ON property_units FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND (up.role = 'super_admin' OR up.role = 'property_manager')
  )
);

-- Tenants Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can view all tenants
CREATE POLICY "Super admins can view all tenants" 
ON tenants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Property managers can view tenants in their properties
CREATE POLICY "Managers can view tenants in their properties" 
ON tenants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM properties p
    JOIN user_profiles up ON up.id = p.manager_id
    WHERE up.user_id = auth.uid()
    AND p.id = tenants.property_id
  )
);

-- Tenants can view their own data
CREATE POLICY "Tenants can view own data" 
ON tenants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.id = tenants.user_id
  )
);

-- Leases Policies
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all leases" 
ON leases FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Rent Payments Policies
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all payments" 
ON rent_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

CREATE POLICY "Tenants can view own payments" 
ON rent_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM tenants t
    JOIN user_profiles up ON up.id = t.user_id
    WHERE up.user_id = auth.uid()
    AND t.id = rent_payments.tenant_id
  )
);

-- Maintenance Requests Policies
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all maintenance" 
ON maintenance_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Audit Logs Policies (only super admins)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can view audit logs" 
ON audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- System Settings Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can manage system settings" 
ON system_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'super_admin'
  )
);

-- Approval Queue Policies
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage approval queue" 
ON public.approval_queue FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Function to log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE TG_OP 
      WHEN 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    CASE TG_OP 
      WHEN 'INSERT' THEN NULL 
      ELSE row_to_json(OLD) 
    END,
    CASE TG_OP 
      WHEN 'DELETE' THEN NULL 
      ELSE row_to_json(NEW) 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for important tables
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_properties
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_tenants
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_leases
  AFTER INSERT OR UPDATE OR DELETE ON leases
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();