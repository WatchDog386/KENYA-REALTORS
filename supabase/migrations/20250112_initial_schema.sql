-- ============================================
-- INITIAL SCHEMA - Integrated with Super Admin System
-- ============================================

-- ============================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- Now integrated with 'profiles' table from super admin system
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name || ' ' || last_name, first_name, last_name, email)) STORED,
    phone TEXT,
    role TEXT DEFAULT 'tenant' CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'maintenance', 'accountant')),
    user_type TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN role = 'super_admin' THEN 'super_admin'
            WHEN role = 'property_manager' THEN 'property_manager'
            ELSE 'tenant'
        END
    ) STORED,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
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
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- ============================================
-- 2. PROPERTIES (Enhanced with super admin system fields)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    property_name VARCHAR(200) GENERATED ALWAYS AS (name) STORED,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Kenya',
    type VARCHAR(50) DEFAULT 'apartment' CHECK (type IN ('apartment', 'house', 'commercial', 'condo', 'townhouse')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'sold', 'rented')),
    total_units INTEGER DEFAULT 1,
    occupied_units INTEGER DEFAULT 0,
    monthly_rent DECIMAL(10,2) DEFAULT 0,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    super_admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    images TEXT[],
    amenities TEXT[],
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    year_built INTEGER,
    square_feet INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, address)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_super_admin_id ON properties(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- ============================================
-- 3. MANAGER ASSIGNMENTS (for admin approval system)
-- ============================================
CREATE TABLE IF NOT EXISTS manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    permissions JSONB DEFAULT '{
        "can_add_property": false,
        "can_remove_tenant": false,
        "can_approve_maintenance": false,
        "can_view_financials": false,
        "can_manage_units": true
    }',
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index for non-revoked assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment 
ON manager_assignments(property_id, manager_id) 
WHERE status != 'revoked';

-- Indexes for manager_assignments
CREATE INDEX IF NOT EXISTS idx_manager_assignments_status ON manager_assignments(status);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_property_manager ON manager_assignments(property_id, manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager_id ON manager_assignments(manager_id);

-- ============================================
-- 4. UNITS/APARTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(20) NOT NULL,
    unit_type VARCHAR(50) CHECK (unit_type IN ('studio', '1br', '2br', '3br', '4br', 'commercial', 'other')),
    floor_number INTEGER,
    square_feet INTEGER,
    bedrooms INTEGER DEFAULT 1,
    bathrooms DECIMAL(3,1) DEFAULT 1.0,
    rent_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    amenities TEXT[],
    features JSONB,
    status VARCHAR(20) DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance', 'renovation', 'reserved')),
    availability_date DATE,
    photos TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, unit_number)
);

-- Indexes for units
CREATE INDEX IF NOT EXISTS idx_units_property_id ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_rent_amount ON units(rent_amount);
CREATE INDEX IF NOT EXISTS idx_units_availability_date ON units(availability_date);

-- ============================================
-- 5. LEASES
-- ============================================
CREATE TABLE IF NOT EXISTS leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    parking_spaces INTEGER DEFAULT 0,
    utilities_included JSONB DEFAULT '{"water": false, "electricity": false, "gas": false, "internet": false}',
    pets_allowed BOOLEAN DEFAULT false,
    max_pets INTEGER DEFAULT 0,
    pet_deposit DECIMAL(10,2) DEFAULT 0,
    late_fee_percentage DECIMAL(5,2) DEFAULT 5.0,
    grace_period_days INTEGER DEFAULT 5,
    special_terms TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired', 'pending', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT,
    signed_document_url TEXT
);

-- Indexes for leases
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit_id ON leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_dates ON leases(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leases_active ON leases(status) WHERE status = 'active';

-- ============================================
-- 6. VACATION NOTICES & DEPOSIT REFUNDS
-- ============================================
CREATE TABLE IF NOT EXISTS vacation_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    notice_date DATE NOT NULL,
    intended_vacate_date DATE NOT NULL,
    actual_vacate_date DATE,
    reason_for_leaving TEXT CHECK (reason_for_leaving IN ('end_of_lease', 'purchase', 'relocation', 'dissatisfaction', 'financial', 'other')),
    forwarding_address TEXT,
    forwarding_phone TEXT,
    handover_to_manager BOOLEAN DEFAULT FALSE,
    handover_date TIMESTAMP WITH TIME ZONE,
    handover_notes TEXT,
    unit_condition JSONB,
    keys_returned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposit_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacation_notice_id UUID REFERENCES vacation_notices(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    original_deposit DECIMAL(10,2),
    deductions JSONB,
    total_deductions DECIMAL(10,2),
    refund_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'refunded')),
    manager_notes TEXT,
    admin_notes TEXT,
    admin_approval_required BOOLEAN DEFAULT TRUE,
    approved_by_manager UUID REFERENCES profiles(id),
    approved_by_admin UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    refund_method VARCHAR(30) CHECK (refund_method IN ('bank_transfer', 'check', 'cash', 'credit_balance')),
    refund_date TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vacation and deposit tables
CREATE INDEX IF NOT EXISTS idx_vacation_notices_lease_id ON vacation_notices(lease_id);
CREATE INDEX IF NOT EXISTS idx_vacation_notices_intended_date ON vacation_notices(intended_vacate_date);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_vacation_id ON deposit_refunds(vacation_notice_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_lease_id ON deposit_refunds(lease_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_status ON deposit_refunds(status);

-- ============================================
-- 7. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(30) CHECK (payment_type IN ('rent', 'deposit', 'late_fee', 'pet_fee', 'maintenance', 'utility', 'other')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('bank_transfer', 'credit_card', 'debit_card', 'cash', 'check', 'mobile_money')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
    payment_date DATE,
    due_date DATE,
    period_start DATE,
    period_end DATE,
    reference_number TEXT,
    transaction_id TEXT,
    receipt_url TEXT,
    notes TEXT,
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ============================================
-- 8. MESSAGES TABLE (from super admin system)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    subject TEXT,
    body TEXT NOT NULL,
    message_type VARCHAR(30) DEFAULT 'general' CHECK (message_type IN ('general', 'maintenance', 'payment', 'vacation', 'complaint', 'announcement')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- ============================================
-- 9. MAINTENANCE_REQUESTS TABLE (from super admin system)
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
    category TEXT CHECK (category IN ('plumbing', 'electrical', 'appliance', 'structural', 'heating', 'cooling', 'pest', 'other')),
    images TEXT[],
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    scheduled_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_property_id ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reported_by ON maintenance_requests(reported_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance_requests(scheduled_date);

-- ============================================
-- 10. APPROVAL_REQUESTS TABLE (from super admin system)
-- ============================================
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('manager_assignment', 'deposit_refund', 'property_addition', 'rent_adjustment', 'lease_termination', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
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

-- ============================================
-- 11. AUDIT_LOGS TABLE (from super admin system)
-- ============================================
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

-- ============================================
-- 12. SYSTEM_SETTINGS TABLE (from super admin system)
-- ============================================
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

-- ============================================
-- 13. ROLES TABLE (from super admin system)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. USER_ROLES TABLE (from super admin system)
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 15. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'maintenance', 'approval')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 16. INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties(city, type, status);
CREATE INDEX IF NOT EXISTS idx_units_available ON units(property_id, status, availability_date) WHERE status = 'vacant';
CREATE INDEX IF NOT EXISTS idx_leases_current ON leases(status, end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payments_current ON payments(status, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read, created_at) WHERE NOT is_read;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties USING GIN(
    to_tsvector('english', name || ' ' || address || ' ' || city || ' ' || description)
);

CREATE INDEX IF NOT EXISTS idx_profiles_fts ON profiles USING GIN(
    to_tsvector('english', first_name || ' ' || last_name || ' ' || email || ' ' || phone)
);

-- ============================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Property managers can view tenant profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'property_manager'
        ) AND (
            profiles.role = 'tenant' OR
            profiles.id = auth.uid()
        )
    );

-- Policies for properties
CREATE POLICY "Properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Super admins can manage all properties" ON properties
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Property managers can view assigned properties" ON properties
    FOR SELECT USING (
        manager_id = auth.uid() OR
        id IN (
            SELECT property_id FROM manager_assignments 
            WHERE manager_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- Policies for messages
CREATE POLICY "Users can view messages they sent or received" ON messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert messages they send" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received" ON messages
    FOR UPDATE USING (receiver_id = auth.uid());

-- Policies for maintenance requests
CREATE POLICY "Users can view their own maintenance requests" ON maintenance_requests
    FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "Users can create maintenance requests" ON maintenance_requests
    FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 18. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'last_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
                'manage_payments',
                'manage_maintenance',
                'manage_leases',
                'manage_units'
            ];
        WHEN 'property_manager' THEN
            permissions := ARRAY[
                'manage_properties',
                'manage_approvals',
                'manage_messages',
                'view_analytics',
                'view_reports',
                'manage_maintenance',
                'manage_leases',
                'manage_units'
            ];
        WHEN 'tenant' THEN
            permissions := ARRAY['view_reports', 'send_messages', 'view_messages', 'create_maintenance'];
        ELSE
            permissions := ARRAY[]::TEXT[];
    END CASE;
    
    RETURN permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate occupancy rate
CREATE OR REPLACE FUNCTION calculate_property_occupancy(property_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_units INT;
    occupied_units INT;
    occupancy_rate DECIMAL(5,2);
BEGIN
    SELECT total_units, occupied_units 
    INTO total_units, occupied_units
    FROM properties 
    WHERE id = property_uuid;
    
    IF total_units > 0 THEN
        occupancy_rate := ROUND((occupied_units::DECIMAL / total_units) * 100, 2);
    ELSE
        occupancy_rate := 0;
    END IF;
    
    RETURN occupancy_rate;
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
    
    -- Create notification for receiver
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        action_url,
        metadata
    ) VALUES (
        p_receiver_id,
        'New Message',
        COALESCE(p_subject, 'New Message'),
        'info',
        '/messages/' || v_message_id,
        json_build_object('message_id', v_message_id, 'sender_id', p_sender_id)
    );
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_assignments_updated_at 
    BEFORE UPDATE ON manager_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at 
    BEFORE UPDATE ON units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leases_updated_at 
    BEFORE UPDATE ON leases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_notices_updated_at 
    BEFORE UPDATE ON vacation_notices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_refunds_updated_at 
    BEFORE UPDATE ON deposit_refunds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at 
    BEFORE UPDATE ON maintenance_requests 
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

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 19. VIEWS FOR ANALYTICS
-- ============================================

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
    COALESCE(SUM(CASE WHEN pm.status = 'completed' THEN pm.amount ELSE 0 END), 0) as total_revenue,
    COUNT(DISTINCT mr.id) as maintenance_requests,
    COUNT(DISTINCT ar.id) as pending_approvals
FROM properties p
LEFT JOIN profiles pr ON p.manager_id = pr.id
LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
LEFT JOIN payments pm ON p.id = pm.property_id AND pm.status = 'completed'
LEFT JOIN maintenance_requests mr ON p.id = mr.property_id
LEFT JOIN approval_requests ar ON p.id = ar.property_id AND ar.status = 'pending'
GROUP BY p.id, p.name, p.type, p.status, p.monthly_rent, p.total_units, 
         p.occupied_units, p.manager_id, pr.first_name, pr.last_name;

CREATE OR REPLACE VIEW financial_overview AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_payments,
    COUNT(DISTINCT tenant_id) as paying_tenants,
    COUNT(DISTINCT property_id) as active_properties
FROM payments
WHERE payment_date IS NOT NULL
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

CREATE OR REPLACE VIEW tenant_overview AS
SELECT 
    p.id as tenant_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    COUNT(DISTINCT l.id) as active_leases,
    COUNT(DISTINCT mr.id) as maintenance_requests,
    COUNT(DISTINCT msg.id) as unread_messages,
    SUM(CASE WHEN pm.status = 'pending' AND pm.due_date < CURRENT_DATE THEN pm.amount ELSE 0 END) as overdue_amount,
    MAX(l.end_date) as latest_lease_end
FROM profiles p
LEFT JOIN leases l ON p.id = l.tenant_id AND l.status = 'active'
LEFT JOIN maintenance_requests mr ON p.id = mr.reported_by AND mr.status != 'completed'
LEFT JOIN messages msg ON p.id = msg.receiver_id AND NOT msg.is_read
LEFT JOIN payments pm ON p.id = pm.tenant_id AND pm.status = 'pending'
WHERE p.role = 'tenant'
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone;

-- ============================================
-- 20. INSERT DEFAULT DATA
-- ============================================

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
        'manage_payments',
        'manage_maintenance',
        'manage_leases',
        'manage_units'
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
        'view_reports',
        'manage_maintenance',
        'manage_leases',
        'manage_units'
    ],
    false
),
(
    'tenant',
    'Tenant access for viewing their information',
    ARRAY['view_reports', 'send_messages', 'view_messages', 'create_maintenance'],
    true
)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (category, key, value, description) VALUES
('general', 'site_name', '"Property Management System"', 'Site name'),
('general', 'site_url', '"https://property-management.example.com"', 'Site URL'),
('general', 'admin_email', '"admin@example.com"', 'Admin email'),
('general', 'currency', '"KES"', 'Default currency'),
('general', 'timezone', '"Africa/Nairobi"', 'System timezone'),
('security', 'require_two_factor', 'false', 'Require two-factor authentication'),
('security', 'session_timeout', '30', 'Session timeout in minutes'),
('notifications', 'email_notifications', 'true', 'Enable email notifications'),
('notifications', 'push_notifications', 'true', 'Enable push notifications'),
('messaging', 'enable_messaging', 'true', 'Enable messaging system'),
('messaging', 'notify_on_message', 'true', 'Notify users on new messages'),
('rental', 'default_lease_term_months', '12', 'Default lease term in months'),
('rental', 'grace_period_days', '5', 'Rent payment grace period'),
('rental', 'late_fee_percentage', '5', 'Late fee percentage'),
('rental', 'security_deposit_months', '1', 'Security deposit in months of rent')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================
-- 21. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to service role (for server-side operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- 22. COMMENT ON TABLES
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth with custom roles and user types';
COMMENT ON TABLE properties IS 'Properties with detailed information and management';
COMMENT ON TABLE manager_assignments IS 'Manager assignments with permissions and approval workflow';
COMMENT ON TABLE units IS 'Individual units within properties with detailed specifications';
COMMENT ON TABLE leases IS 'Lease agreements between tenants and property owners';
COMMENT ON TABLE vacation_notices IS 'Vacation notices and move-out procedures';
COMMENT ON TABLE deposit_refunds IS 'Security deposit refunds and deductions';
COMMENT ON TABLE payments IS 'Payment transactions including rent and deposits';
COMMENT ON TABLE messages IS 'Internal messaging system between users';
COMMENT ON TABLE maintenance_requests IS 'Maintenance and repair requests';
COMMENT ON TABLE approval_requests IS 'Approval requests for various actions';
COMMENT ON TABLE audit_logs IS 'Audit trail for system activities';
COMMENT ON TABLE system_settings IS 'System configuration settings';
COMMENT ON TABLE roles IS 'User roles with permission sets';
COMMENT ON TABLE user_roles IS 'Assignment of roles to users';
COMMENT ON TABLE notifications IS 'User notifications system';

-- ============================================
-- END OF INITIAL SCHEMA
-- ============================================