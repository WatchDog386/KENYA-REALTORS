-- ============================================================================
-- COMPLETE DATABASE SCHEMA MIGRATION
-- Date: February 2026
-- Version: 1.0 - Clean Slate Implementation
-- Purpose: Fresh database setup for Property Management System with 
--          Super Admin, Property Manager, and Tenant roles
-- ============================================================================

-- ============================================================================
-- PART 1: ENABLE EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PART 2: CREATE ROLE ENUM (Safe Creation)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('super_admin', 'property_manager', 'tenant');
    END IF;
END
$$;

-- ============================================================================
-- PART 3: PROFILES TABLE (User Profile Information)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- Role Assignment
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'property_manager', 'tenant')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'pending', 'suspended', 'inactive')) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT false,
    
    -- Admin Approval
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: PROPERTIES TABLE (Property Master Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    
    -- Image & Amenities
    image_url TEXT,
    amenities TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    
    -- Financial
    total_monthly_rental_expected DECIMAL(12, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: PROPERTY_UNIT_TYPES TABLE (Unit Type Specifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Unit Type Details
    unit_type_name VARCHAR(100) NOT NULL,
    unit_category VARCHAR(50) NOT NULL,
    
    -- Quantity & Pricing
    total_units_of_type INTEGER NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(12, 2) NOT NULL,
    occupied_count INTEGER DEFAULT 0,
    vacant_count INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CHECK (total_units_of_type >= 0),
    CHECK (price_per_unit >= 0),
    UNIQUE(property_id, unit_type_name)
);

-- Enable RLS
ALTER TABLE public.property_unit_types ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: UNITS TABLE (Individual Unit Instances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_type_id UUID NOT NULL REFERENCES public.property_unit_types(id) ON DELETE CASCADE,
    
    -- Unit Identity
    unit_number VARCHAR(50) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(property_id, unit_number)
);

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 7: PROPERTY_MANAGER_ASSIGNMENTS TABLE (Manager-Property Mapping)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.property_manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_manager_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    
    -- Timestamps
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints: ONE Property Manager per Property, ONE Property per Manager
    UNIQUE(property_manager_id),
    UNIQUE(property_id)
);

-- Enable RLS
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 8: TENANTS TABLE (Tenant-Unit Assignment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    -- Lease Information
    move_in_date TIMESTAMP WITH TIME ZONE,
    move_out_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'notice_given', 'inactive')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 9: LEASES TABLE (Lease Agreements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    -- Lease Terms
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(12, 2) NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'terminated')),
    
    -- Documents
    lease_file_url TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 10: RENT_PAYMENTS TABLE (Rent Payment Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method VARCHAR(50),
    transaction_id TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'waived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 11: MAINTENANCE_REQUESTS TABLE (Maintenance Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    
    -- Request Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    urgency VARCHAR(50) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'emergency')),
    
    -- Image
    image_url TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Notes
    manager_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 12: VACATION_NOTICES TABLE (Tenant Vacation Intent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vacation_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Notice Details
    notice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    intended_move_out_date DATE NOT NULL,
    reason TEXT,
    
    -- Confirmation
    status VARCHAR(50) DEFAULT 'notice_given' CHECK (status IN ('notice_given', 'acknowledged', 'completed')),
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vacation_notices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 13: BILLS_AND_UTILITIES TABLE (Bills Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bills_and_utilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Bill Details
    bill_type VARCHAR(100) NOT NULL,
    provider VARCHAR(255),
    amount DECIMAL(12, 2),
    
    -- Period
    bill_period_start DATE,
    bill_period_end DATE,
    due_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.bills_and_utilities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 14: DEPOSITS TABLE (Tenant Deposits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Deposit Details
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'held' CHECK (status IN ('held', 'partially_released', 'released', 'forfeited')),
    
    -- Refund Details
    refund_amount DECIMAL(12, 2),
    refund_date DATE,
    refund_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    released_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 15: MESSAGES TABLE (Communication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    
    -- Message Content
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 16: APPROVALS TABLE (User Approval Workflow)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Approval Details
    approval_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Manager Info
    requested_role VARCHAR(50),
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    
    -- Approval Process
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 17: CREATE INDICES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_properties_name ON public.properties(name);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

CREATE INDEX IF NOT EXISTS idx_property_unit_types_property ON public.property_unit_types(property_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);

CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_manager ON public.property_manager_assignments(property_manager_id);
CREATE INDEX IF NOT EXISTS idx_property_manager_assignments_property ON public.property_manager_assignments(property_id);

CREATE INDEX IF NOT EXISTS idx_tenants_user ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit ON public.tenants(unit_id);

CREATE INDEX IF NOT EXISTS idx_leases_tenant ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property ON public.leases(property_id);

CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant ON public.rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property ON public.rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON public.rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date ON public.rent_payments(due_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit ON public.maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_vacation_notices_tenant ON public.vacation_notices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vacation_notices_property ON public.vacation_notices(property_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_approvals_user ON public.approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);

-- ============================================================================
-- PART 18: RLS POLICIES - SUPER ADMIN (Full Access)
-- ============================================================================

-- Super admin can do everything
DROP POLICY IF EXISTS "super_admin_profiles_all" ON public.profiles;
CREATE POLICY "super_admin_profiles_all" ON public.profiles
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "super_admin_properties_all" ON public.properties;
CREATE POLICY "super_admin_properties_all" ON public.properties
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "super_admin_units_all" ON public.units;
CREATE POLICY "super_admin_units_all" ON public.units
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "super_admin_tenants_all" ON public.tenants;
CREATE POLICY "super_admin_tenants_all" ON public.tenants
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "super_admin_assignments_all" ON public.property_manager_assignments;
CREATE POLICY "super_admin_assignments_all" ON public.property_manager_assignments
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- ============================================================================
-- PART 19: RLS POLICIES - PROPERTY MANAGER (Property-Scoped Access)
-- ============================================================================

-- Property manager can see their own assignment
DROP POLICY IF EXISTS "manager_see_own_assignment" ON public.property_manager_assignments;
CREATE POLICY "manager_see_own_assignment" ON public.property_manager_assignments
    USING (property_manager_id = auth.uid());

-- Property manager can see their assigned property and units
DROP POLICY IF EXISTS "manager_see_assigned_property" ON public.properties;
CREATE POLICY "manager_see_assigned_property" ON public.properties
    USING (id IN (
        SELECT property_id FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() AND status = 'active'
    ));

DROP POLICY IF EXISTS "manager_see_property_units" ON public.units;
CREATE POLICY "manager_see_property_units" ON public.units
    USING (property_id IN (
        SELECT property_id FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() AND status = 'active'
    ));

-- Property manager can see tenants in their property
DROP POLICY IF EXISTS "manager_see_property_tenants" ON public.tenants;
CREATE POLICY "manager_see_property_tenants" ON public.tenants
    USING (property_id IN (
        SELECT property_id FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() AND status = 'active'
    ));

-- Property manager can see maintenance requests for their property
DROP POLICY IF EXISTS "manager_see_maintenance_requests" ON public.maintenance_requests;
CREATE POLICY "manager_see_maintenance_requests" ON public.maintenance_requests
    USING (property_id IN (
        SELECT property_id FROM public.property_manager_assignments 
        WHERE property_manager_id = auth.uid() AND status = 'active'
    ));

-- ============================================================================
-- PART 20: RLS POLICIES - TENANT (Self-Scoped Access)
-- ============================================================================

-- Tenant can see own profile
DROP POLICY IF EXISTS "tenant_see_own_profile" ON public.profiles;
CREATE POLICY "tenant_see_own_profile" ON public.profiles
    USING (id = auth.uid());

-- Tenant can see own tenant record
DROP POLICY IF EXISTS "tenant_see_own_assignment" ON public.tenants;
CREATE POLICY "tenant_see_own_assignment" ON public.tenants
    USING (user_id = auth.uid());

-- Tenant can see own unit
DROP POLICY IF EXISTS "tenant_see_own_unit" ON public.units;
CREATE POLICY "tenant_see_own_unit" ON public.units
    USING (id IN (
        SELECT unit_id FROM public.tenants WHERE user_id = auth.uid()
    ));

-- Tenant can see own property
DROP POLICY IF EXISTS "tenant_see_own_property" ON public.properties;
CREATE POLICY "tenant_see_own_property" ON public.properties
    USING (id IN (
        SELECT property_id FROM public.tenants WHERE user_id = auth.uid()
    ));

-- Tenant can see own maintenance requests
DROP POLICY IF EXISTS "tenant_see_own_maintenance" ON public.maintenance_requests;
CREATE POLICY "tenant_see_own_maintenance" ON public.maintenance_requests
    USING (tenant_id = auth.uid());

-- ============================================================================
-- PART 21: CREATE VIEWS
-- ============================================================================

-- View to simplify user queries
CREATE OR REPLACE VIEW public.all_users_with_profile AS
SELECT
    u.id,
    u.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.role,
    p.status,
    p.is_active,
    p.approved_at,
    p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- ============================================================================
-- PART 22: HELPER FUNCTIONS FOR TRIGGERS
-- ============================================================================

-- Function to sync auth.users email to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email <> OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 23: TRIGGERS
-- ============================================================================

-- Trigger to sync auth.users email changes to profiles
DROP TRIGGER IF EXISTS sync_email_trigger ON auth.users;
CREATE TRIGGER sync_email_trigger
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email();

-- ============================================================================
-- PART 24: GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to read their own data
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.all_users_with_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.properties TO authenticated;
GRANT SELECT ON public.property_unit_types TO authenticated;
GRANT SELECT ON public.units TO authenticated;
GRANT SELECT ON public.property_manager_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.rent_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.maintenance_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vacation_notices TO authenticated;
GRANT SELECT ON public.bills_and_utilities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deposits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.approvals TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
