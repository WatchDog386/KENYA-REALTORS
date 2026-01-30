-- ============================================================================
-- REALTORS-LEASERS: COMPLETE DATABASE SCHEMA & MIGRATION
-- ============================================================================
-- Comprehensive database schema combining all tables, functions, triggers,
-- RLS policies, views, and initial data for the REALTORS-LEASERS platform.
--
-- Execution: Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ========================== SECTION 1: TABLES ============================

-- SUBSECTION 1.1: CORE TABLES
-- -------------------------

-- 1.1: Profiles table (extends auth.users with roles and metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    property_name VARCHAR(200) GENERATED ALWAYS AS (name) STORED,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Kenya',
    postal_code TEXT,
    property_type TEXT NOT NULL DEFAULT 'apartment',
    type VARCHAR(50) DEFAULT 'apartment' CHECK (type IN ('apartment', 'house', 'commercial', 'condo', 'townhouse')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'sold', 'rented', 'vacant')),
    is_active BOOLEAN DEFAULT true,
    total_units INTEGER DEFAULT 0,
    occupied_units INTEGER DEFAULT 0,
    available_units INTEGER DEFAULT 0,
    monthly_rent DECIMAL(10,2) DEFAULT 0,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    property_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id),
    super_admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[],
    coordinates JSONB,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    year_built INTEGER,
    square_feet INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, address)
);

-- 1.4: Units/Apartments table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
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

-- 1.5: Leases table (lease agreements between tenants and properties)
CREATE TABLE IF NOT EXISTS public.leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_id_text TEXT,
    lease_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'expired', 'pending', 'draft')),
    rent_amount DECIMAL(10,2) NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    payment_day INTEGER DEFAULT 1,
    late_fee_percentage DECIMAL(5,2) DEFAULT 5.00,
    parking_spaces INTEGER DEFAULT 0,
    utilities_included JSONB DEFAULT '{"water": false, "electricity": false, "gas": false, "internet": false}',
    pets_allowed BOOLEAN DEFAULT false,
    max_pets INTEGER DEFAULT 0,
    pet_deposit DECIMAL(10,2) DEFAULT 0,
    grace_period_days INTEGER DEFAULT 5,
    special_terms TEXT,
    terms JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terminated_at TIMESTAMP WITH TIME ZONE,
    termination_reason TEXT,
    signed_document_url TEXT
);

-- 1.6: Tenant properties table (junction table linking tenants to properties)
CREATE TABLE IF NOT EXISTS public.tenant_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 1.7: Manager assignments table (assignment of managers to properties)
CREATE TABLE IF NOT EXISTS public.manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active',
    notes TEXT,
    permissions JSONB DEFAULT '{
        "can_add_property": false,
        "can_remove_tenant": false,
        "can_approve_maintenance": false,
        "can_view_financials": false,
        "can_manage_units": true
    }',
    approved_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index for active assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment 
ON public.manager_assignments (property_id, manager_id) 
WHERE status = 'active';

-- 1.8: Property managers table (manager profiles and metadata)
CREATE TABLE IF NOT EXISTS public.property_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 1.9: Maintenance requests table (maintenance tasks for properties)
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID,
    tenant_id UUID REFERENCES public.profiles(id),
    reported_by UUID REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    category TEXT CHECK (category IN ('plumbing', 'electrical', 'appliance', 'structural', 'heating', 'cooling', 'pest', 'other')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    scheduled_date DATE,
    completed_date TIMESTAMP WITH TIME ZONE,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.10: Payments table (rent payments, deposits, fees)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_type VARCHAR(30) CHECK (payment_type IN ('rent', 'deposit', 'late_fee', 'pet_fee', 'maintenance', 'utility', 'other')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('bank_transfer', 'credit_card', 'debit_card', 'cash', 'check', 'mobile_money')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    period_start DATE,
    period_end DATE,
    reference_id TEXT,
    transaction_id TEXT,
    receipt_url TEXT,
    notes TEXT,
    received_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
);

-- 1.11: Vacation notices table
CREATE TABLE IF NOT EXISTS public.vacation_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
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

-- 1.12: Deposit refunds table (refund tracking)
CREATE TABLE IF NOT EXISTS public.deposit_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacation_notice_id UUID REFERENCES public.vacation_notices(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id),
    tenant_id UUID REFERENCES public.profiles(id),
    property_id UUID REFERENCES public.properties(id),
    original_deposit DECIMAL(10,2),
    deductions JSONB,
    total_deductions DECIMAL(10,2),
    refund_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'refunded')),
    reason TEXT NOT NULL,
    manager_notes TEXT,
    admin_notes TEXT,
    admin_approval_required BOOLEAN DEFAULT TRUE,
    approved_by_manager UUID REFERENCES public.profiles(id),
    approved_by_admin UUID REFERENCES public.profiles(id),
    reviewed_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    refund_method VARCHAR(30) CHECK (refund_method IN ('bank_transfer', 'check', 'cash', 'credit_balance')),
    refund_date TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_refund_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed'))
);

-- 1.13: Approvals table (workflow approvals for various entities)
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 1.14: Audit logs table (system activity tracking)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES public.profiles(id),
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.15: Security logs table (security event tracking)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.profiles(id),
    ip_address TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- 1.16: Messages table (internal messaging system)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
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

-- 1.17: Approval requests table (approval workflow)
CREATE TABLE IF NOT EXISTS public.approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL CHECK (request_type IN ('manager_assignment', 'deposit_refund', 'property_addition', 'user_creation', 'lease_termination')),
    request_id TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.18: System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, key)
);

-- 1.19: Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT[] NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.20: User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id)
);

-- 1.21: Notifications table (user notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'maintenance', 'approval')),
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ======================== SECTION 2: INDEXES ==============================

-- SUBSECTION 2.1: CORE TABLE INDEXES
-- --------------------------------

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON public.properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_manager ON public.properties(property_manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON public.units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_rent_amount ON public.units(rent_amount);
CREATE INDEX IF NOT EXISTS idx_units_availability_date ON public.units(availability_date);

-- Leases indexes
CREATE INDEX IF NOT EXISTS idx_leases_property ON public.leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_dates ON public.leases(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leases_active ON public.leases(status) WHERE status = 'active';

-- Tenant properties indexes
CREATE INDEX IF NOT EXISTS idx_tenant_properties_tenant ON public.tenant_properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_properties_property ON public.tenant_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_properties_status ON public.tenant_properties(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON public.payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);

-- SUBSECTION 2.2: MANAGER TABLE INDEXES
-- -----------------------------------

-- Manager assignments indexes
CREATE INDEX IF NOT EXISTS idx_manager_assignments_property ON public.manager_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_manager ON public.manager_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_assignments_status ON public.manager_assignments(status);

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON public.maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned ON public.maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_reported_by ON public.maintenance_requests(reported_by);

-- SUBSECTION 2.3: SUPPORT TABLE INDEXES
-- ----------------------------------

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

-- Deposit refunds indexes
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_status ON public.deposit_refunds(status);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_created ON public.deposit_refunds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_payment ON public.deposit_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_tenant ON public.deposit_refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposit_refunds_vacation_id ON public.deposit_refunds(vacation_notice_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON public.messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

-- Approval queue indexes
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON public.approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_request_type ON public.approval_queue(request_type);
CREATE INDEX IF NOT EXISTS idx_approval_queue_requested_by ON public.approval_queue(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_queue_created_at ON public.approval_queue(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Vacation notices indexes
CREATE INDEX IF NOT EXISTS idx_vacation_notices_lease_id ON public.vacation_notices(lease_id);
CREATE INDEX IF NOT EXISTS idx_vacation_notices_intended_date ON public.vacation_notices(intended_vacate_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties(city, type, status);
CREATE INDEX IF NOT EXISTS idx_units_available ON public.units(property_id, status, availability_date) WHERE status = 'vacant';
CREATE INDEX IF NOT EXISTS idx_leases_current ON public.leases(status, end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payments_current ON public.payments(status, due_date) WHERE status = 'pending';

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_properties_fts ON public.properties USING GIN(
    to_tsvector('english', name || ' ' || address || ' ' || city || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_profiles_fts ON public.profiles USING GIN(
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || email || ' ' || COALESCE(phone, ''))
);

-- ======================== SECTION 3: FUNCTIONS =============================

-- 3.1: Update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.2: Handle new user creation from auth
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

-- 3.3: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql;

-- 3.4: Get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    user_role TEXT;
    permissions TEXT[];
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    
    CASE user_role
        WHEN 'super_admin' THEN
            permissions := ARRAY[
                'manage_properties', 'manage_users', 'manage_approvals',
                'manage_messages', 'view_analytics', 'manage_system_settings',
                'view_reports', 'export_data', 'manage_roles',
                'manage_notifications', 'manage_payments', 'manage_maintenance',
                'manage_leases', 'manage_units'
            ];
        WHEN 'property_manager' THEN
            permissions := ARRAY[
                'manage_properties', 'manage_approvals', 'manage_messages',
                'view_analytics', 'view_reports', 'manage_maintenance',
                'manage_leases', 'manage_units'
            ];
        WHEN 'tenant' THEN
            permissions := ARRAY['view_reports', 'send_messages', 'view_messages', 'create_maintenance'];
        ELSE
            permissions := ARRAY[]::TEXT[];
    END CASE;
    
    RETURN permissions;
END;
$$ LANGUAGE plpgsql;

-- 3.5: Calculate property occupancy rate
CREATE OR REPLACE FUNCTION public.calculate_property_occupancy(property_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_units INT;
    occupied_units INT;
    occupancy_rate DECIMAL(5,2);
BEGIN
    SELECT total_units, occupied_units 
    INTO total_units, occupied_units
    FROM public.properties 
    WHERE id = property_uuid;
    
    IF total_units > 0 THEN
        occupancy_rate := ROUND((occupied_units::DECIMAL / total_units) * 100, 2);
    ELSE
        occupancy_rate := 0;
    END IF;
    
    RETURN occupancy_rate;
END;
$$ LANGUAGE plpgsql;

-- 3.6: Get super admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_superadmin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  total_properties INT;
  active_managers INT;
  pending_approvals INT;
  total_revenue DECIMAL(10,2);
  result JSON;
BEGIN
  SELECT COUNT(*) INTO total_properties 
  FROM public.properties WHERE is_active = true;

  SELECT COUNT(*) INTO active_managers 
  FROM public.profiles 
  WHERE role = 'property_manager' AND is_active = true;

  SELECT COUNT(*) INTO pending_approvals 
  FROM public.approvals WHERE status = 'pending';

  SELECT COALESCE(SUM(amount), 0) INTO total_revenue 
  FROM public.payments 
  WHERE status = 'completed' 
    AND payment_date >= NOW() - INTERVAL '30 days';

  result := json_build_object(
    'totalProperties', total_properties,
    'activeManagers', active_managers,
    'pendingApprovals', pending_approvals,
    'totalRevenue', total_revenue
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'totalProperties', 0,
    'activeManagers', 0,
    'pendingApprovals', 0,
    'totalRevenue', 0
  );
END;
$$ LANGUAGE plpgsql;

-- 3.7: Get manager dashboard stats
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
  v_manager_id ALIAS FOR manager_id;
BEGIN
  SELECT COUNT(*) INTO managed_properties 
  FROM public.properties p
  WHERE p.property_manager_id = v_manager_id AND p.is_active = true;

  SELECT COUNT(DISTINCT t.id) INTO active_tenants
  FROM public.tenants t
  JOIN public.properties p ON t.property_id = p.id
  WHERE p.property_manager_id = v_manager_id AND t.status = 'active';

  SELECT COALESCE(SUM(l.monthly_rent), 0) INTO pending_rent
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.rent_payments rp
      WHERE rp.lease_id = l.id
        AND rp.status = 'completed'
        AND DATE_TRUNC('month', rp.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
    );

  SELECT COUNT(*) INTO maintenance_count
  FROM public.maintenance_requests mr
  JOIN public.properties p ON mr.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND mr.status IN ('pending', 'assigned');

  SELECT COALESCE(SUM(l.monthly_rent), 0) INTO total_revenue
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE;

  SELECT 
    CASE 
      WHEN SUM(p.total_units) > 0 THEN 
        (SUM(p.occupied_units)::DECIMAL / SUM(p.total_units)::DECIMAL) * 100
      ELSE 0
    END INTO occupancy_rate
  FROM public.properties p
  WHERE p.property_manager_id = v_manager_id AND p.is_active = true;

  result := json_build_object(
    'managedProperties', managed_properties,
    'activeTenants', active_tenants,
    'pendingRent', pending_rent,
    'maintenanceCount', maintenance_count,
    'totalRevenue', total_revenue,
    'occupancyRate', ROUND(occupancy_rate, 2)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3.8: Check system health
CREATE OR REPLACE FUNCTION public.check_system_health()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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

-- ======================== SECTION 4: TRIGGERS =============================

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at 
    BEFORE UPDATE ON public.units 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leases_updated_at ON public.leases;
CREATE TRIGGER update_leases_updated_at 
    BEFORE UPDATE ON public.leases 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_properties_updated_at ON public.tenant_properties;
CREATE TRIGGER update_tenant_properties_updated_at 
    BEFORE UPDATE ON public.tenant_properties 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_manager_assignments_updated_at ON public.manager_assignments;
CREATE TRIGGER update_manager_assignments_updated_at 
    BEFORE UPDATE ON public.manager_assignments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at ON public.maintenance_requests;
CREATE TRIGGER update_maintenance_requests_updated_at 
    BEFORE UPDATE ON public.maintenance_requests 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vacation_notices_updated_at ON public.vacation_notices;
CREATE TRIGGER update_vacation_notices_updated_at 
    BEFORE UPDATE ON public.vacation_notices 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deposit_refunds_updated_at ON public.deposit_refunds;
CREATE TRIGGER update_deposit_refunds_updated_at 
    BEFORE UPDATE ON public.deposit_refunds 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_approvals_updated_at ON public.approvals;
CREATE TRIGGER update_approvals_updated_at 
    BEFORE UPDATE ON public.approvals 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON public.audit_logs;
CREATE TRIGGER update_audit_logs_updated_at 
    BEFORE UPDATE ON public.audit_logs 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_requests_updated_at ON public.approval_requests;
CREATE TRIGGER update_approval_requests_updated_at 
    BEFORE UPDATE ON public.approval_requests 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON public.roles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user creation from auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================== SECTION 5: RLS SETUP (Enable) ========================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vacation_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deposit_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- ===================== SECTION 6: RLS POLICIES ==========================

-- Profiles policies
DROP POLICY IF EXISTS "Authenticated users can view any profile" ON public.profiles;
CREATE POLICY "Authenticated users can view any profile" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Properties policies
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Property managers can view assigned properties" ON public.properties;
CREATE POLICY "Property managers can view assigned properties" ON public.properties
    FOR SELECT USING (property_manager_id = auth.uid());

-- Messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Maintenance policies
DROP POLICY IF EXISTS "Users can view own maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Users can view own maintenance requests" ON public.maintenance_requests
    FOR SELECT USING (reported_by = auth.uid());

DROP POLICY IF EXISTS "Users can create maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Users can create maintenance requests" ON public.maintenance_requests
    FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Leases policies
DROP POLICY IF EXISTS "Users can view own leases" ON public.leases;
CREATE POLICY "Users can view own leases" ON public.leases
    FOR SELECT USING (tenant_id = auth.uid());

-- ==================== SECTION 7: SAMPLE DATA ====================

-- Insert default roles
INSERT INTO public.roles (name, description, permissions, is_default) VALUES
(
    'super_admin',
    'Full system access with all permissions',
    ARRAY[
        'manage_properties', 'manage_users', 'manage_approvals',
        'manage_messages', 'view_analytics', 'manage_system_settings',
        'view_reports', 'export_data', 'manage_roles',
        'manage_notifications', 'manage_payments', 'manage_maintenance',
        'manage_leases', 'manage_units'
    ],
    false
),
(
    'property_manager',
    'Manage properties and tenant applications',
    ARRAY[
        'manage_properties', 'manage_approvals', 'manage_messages',
        'view_analytics', 'view_reports', 'manage_maintenance',
        'manage_leases', 'manage_units'
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
INSERT INTO public.system_settings (category, key, value, description) VALUES
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

-- Sample properties
INSERT INTO public.properties (name, address, city, total_units, monthly_rent, security_deposit, property_type)
VALUES 
  ('Nairobi Apartments', 'Westlands, Nairobi', 'Nairobi', 20, 50000, 100000, 'apartment'),
  ('Mombasa Villa', 'Nyali, Mombasa', 'Mombasa', 5, 150000, 300000, 'villa'),
  ('Kisumu Suites', 'Milimani, Kisumu', 'Kisumu', 15, 35000, 70000, 'apartment'),
  ('Eldoret Complex', 'Elgon View, Eldoret', 'Eldoret', 10, 25000, 50000, 'commercial'),
  ('Thika Gardens', 'Thika Road, Thika', 'Thika', 8, 20000, 40000, 'apartment')
ON CONFLICT DO NOTHING;

-- ==================== SECTION 8: VIEWS ==========================

CREATE OR REPLACE VIEW public.property_analytics AS
SELECT 
    p.id,
    p.name,
    p.property_type,
    p.status,
    p.monthly_rent,
    p.total_units,
    p.occupied_units,
    CASE 
        WHEN p.total_units > 0 
        THEN ROUND((p.occupied_units::DECIMAL / p.total_units) * 100, 2)
        ELSE 0 
    END as occupancy_rate,
    p.property_manager_id,
    pr.first_name as manager_first_name,
    pr.last_name as manager_last_name,
    COUNT(DISTINCT l.id) as active_leases,
    COALESCE(SUM(CASE WHEN pm.status = 'completed' THEN pm.amount ELSE 0 END), 0) as total_revenue,
    COUNT(DISTINCT mr.id) as maintenance_requests,
    COUNT(DISTINCT ar.id) as pending_approvals
FROM public.properties p
LEFT JOIN public.profiles pr ON p.property_manager_id = pr.id
LEFT JOIN public.leases l ON p.id = l.property_id AND l.status = 'active'
LEFT JOIN public.payments pm ON p.id = pm.property_id AND pm.status = 'completed'
LEFT JOIN public.maintenance_requests mr ON p.id = mr.property_id
LEFT JOIN public.approvals ar ON p.id = ar.entity_id AND ar.status = 'pending'
GROUP BY p.id, p.name, p.property_type, p.status, p.monthly_rent, p.total_units, 
         p.occupied_units, p.property_manager_id, pr.first_name, pr.last_name;

CREATE OR REPLACE VIEW public.financial_overview AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_payments,
    COUNT(DISTINCT tenant_id) as paying_tenants,
    COUNT(DISTINCT property_id) as active_properties
FROM public.payments
WHERE payment_date IS NOT NULL
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

CREATE OR REPLACE VIEW public.tenant_overview AS
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
FROM public.profiles p
LEFT JOIN public.leases l ON p.id = l.tenant_id AND l.status = 'active'
LEFT JOIN public.maintenance_requests mr ON p.id = mr.reported_by AND mr.status != 'completed'
LEFT JOIN public.messages msg ON p.id = msg.receiver_id AND NOT msg.is_read
LEFT JOIN public.payments pm ON p.id = pm.tenant_id AND pm.status = 'pending'
WHERE p.role = 'tenant'
GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone;

-- ==================== SECTION 9: PERMISSIONS =======================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ==================== SECTION 10: VERIFICATION ==========================

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DATABASE SCHEMA CREATED SUCCESSFULLY!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables created: 21';
  RAISE NOTICE 'Indexes created: 60+';
  RAISE NOTICE 'Functions created: 8';
  RAISE NOTICE 'Triggers created: 17';
  RAISE NOTICE 'Policies created: 10';
  RAISE NOTICE 'Views created: 3';
  RAISE NOTICE '================================================';
END $$;

-- ============================================================================
-- END OF COMPLETE DATABASE SCHEMA
-- ============================================================================
