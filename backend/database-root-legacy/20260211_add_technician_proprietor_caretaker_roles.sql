-- ============================================================================
-- DATABASE MIGRATION: Add Technician, Proprietor, and Caretaker Roles
-- Date: February 11, 2026
-- Purpose: Add new roles and management systems for technicians, proprietors,
--          and caretakers with proper RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: UPDATE ROLE CONSTRAINTS
-- ============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
ALTER TABLE public.profiles ADD CONSTRAINT check_profiles_role_values 
CHECK (role IN ('super_admin', 'property_manager', 'tenant', 'technician', 'proprietor', 'caretaker', 'accountant'));

-- ============================================================================
-- PART 2: TECHNICIAN CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technician_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.technician_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technician_categories
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.technician_categories;
CREATE POLICY "Everyone can view active categories"
ON public.technician_categories FOR SELECT
USING (is_active = true OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "Only super admin can manage categories" ON public.technician_categories;
CREATE POLICY "Only super admin can manage categories"
ON public.technician_categories FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 3: TECHNICIANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.technician_categories(id) ON DELETE RESTRICT,
    
    -- Technician details
    specializations TEXT[], -- Additional specializations
    certification_url TEXT,
    experience_years INTEGER,
    
    -- Status
    is_available BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Ratings and reviews
    average_rating DECIMAL(3, 2),
    total_jobs_completed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technicians
DROP POLICY IF EXISTS "Everyone can view active technicians" ON public.technicians;
CREATE POLICY "Everyone can view active technicians"
ON public.technicians FOR SELECT
USING (status = 'active');

DROP POLICY IF EXISTS "Technicians can view their own record" ON public.technicians;
CREATE POLICY "Technicians can view their own record"
ON public.technicians FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Technicians can update their own record" ON public.technicians;
CREATE POLICY "Technicians can update their own record"
ON public.technicians FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin manages all technicians" ON public.technicians;
CREATE POLICY "Super admin manages all technicians"
ON public.technicians FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 4: TECHNICIAN PROPERTY ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technician_property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Relationship
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(technician_id, property_id)
);

-- Enable RLS
ALTER TABLE public.technician_property_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Technicians view their property assignments" ON public.technician_property_assignments;
CREATE POLICY "Technicians view their property assignments"
ON public.technician_property_assignments FOR SELECT
USING (technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Property managers view their technicians" ON public.technician_property_assignments;
CREATE POLICY "Property managers view their technicians"
ON public.technician_property_assignments FOR SELECT
USING (property_id IN (
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = auth.uid()
));

DROP POLICY IF EXISTS "Super admin manages assignments" ON public.technician_property_assignments;
CREATE POLICY "Super admin manages assignments"
ON public.technician_property_assignments FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 5: PROPRIETORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proprietors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Business info
    business_name TEXT,
    business_registration_number TEXT,
    business_license_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Bank details (encrypted in production)
    bank_account_holder TEXT,
    bank_account_number TEXT,
    bank_name TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proprietors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proprietors
DROP POLICY IF EXISTS "Proprietors view their own record" ON public.proprietors;
CREATE POLICY "Proprietors view their own record"
ON public.proprietors FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Proprietors update their own record" ON public.proprietors;
CREATE POLICY "Proprietors update their own record"
ON public.proprietors FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin manages proprietors" ON public.proprietors;
CREATE POLICY "Super admin manages proprietors"
ON public.proprietors FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 6: PROPRIETOR PROPERTY ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proprietor_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietor_id UUID NOT NULL REFERENCES public.proprietors(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Ownership details
    ownership_percentage DECIMAL(5, 2) DEFAULT 100,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(proprietor_id, property_id)
);

-- Enable RLS
ALTER TABLE public.proprietor_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Proprietors view their properties" ON public.proprietor_properties;
CREATE POLICY "Proprietors view their properties"
ON public.proprietor_properties FOR SELECT
USING (proprietor_id IN (SELECT id FROM public.proprietors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Super admin manages proprietor properties" ON public.proprietor_properties;
CREATE POLICY "Super admin manages proprietor properties"
ON public.proprietor_properties FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 7: PROPRIETOR REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proprietor_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietor_id UUID NOT NULL REFERENCES public.proprietors(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Report details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'occupancy', 'financial', 'maintenance')),
    title TEXT NOT NULL,
    description TEXT,
    data JSONB,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'sent')),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proprietor_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Proprietors view their reports" ON public.proprietor_reports;
CREATE POLICY "Proprietors view their reports"
ON public.proprietor_reports FOR SELECT
USING (proprietor_id IN (SELECT id FROM public.proprietors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Super admin manages reports" ON public.proprietor_reports;
CREATE POLICY "Super admin manages reports"
ON public.proprietor_reports FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 8: PROPRIETOR-SUPER ADMIN COMMUNICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proprietor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietor_id UUID NOT NULL REFERENCES public.proprietors(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Message
    subject TEXT,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general' CHECK (message_type IN ('general', 'alert', 'report', 'notification')),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proprietor_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Proprietors view their messages" ON public.proprietor_messages;
CREATE POLICY "Proprietors view their messages"
ON public.proprietor_messages FOR SELECT
USING (proprietor_id IN (SELECT id FROM public.proprietors WHERE user_id = auth.uid()) 
       OR sender_id = auth.uid());

DROP POLICY IF EXISTS "Proprietors mark messages as read" ON public.proprietor_messages;
CREATE POLICY "Proprietors mark messages as read"
ON public.proprietor_messages FOR UPDATE
USING (proprietor_id IN (SELECT id FROM public.proprietors WHERE user_id = auth.uid()))
WITH CHECK (proprietor_id IN (SELECT id FROM public.proprietors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Super admin manages proprietor messages" ON public.proprietor_messages;
CREATE POLICY "Super admin manages proprietor messages"
ON public.proprietor_messages FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 9: CARETAKERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caretakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    property_manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Employment details
    hire_date DATE,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Performance
    performance_rating DECIMAL(3, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.caretakers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for caretakers
DROP POLICY IF EXISTS "Caretakers view their own record" ON public.caretakers;
CREATE POLICY "Caretakers view their own record"
ON public.caretakers FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Property managers view assigned caretakers" ON public.caretakers;
CREATE POLICY "Property managers view assigned caretakers"
ON public.caretakers FOR SELECT
USING (property_manager_id = auth.uid() 
       OR property_id IN (SELECT property_id FROM public.property_manager_assignments WHERE property_manager_id = auth.uid()));

DROP POLICY IF EXISTS "Caretakers can't modify their record" ON public.caretakers;
CREATE POLICY "Caretakers can't modify their record"
ON public.caretakers FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Super admin manages caretakers" ON public.caretakers;
CREATE POLICY "Super admin manages caretakers"
ON public.caretakers FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 10: ACCOUNTANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accountants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Employment
    employee_id VARCHAR(100),
    hire_date DATE,
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Performance
    transactions_processed INTEGER DEFAULT 0,
    accuracy_rating DECIMAL(3, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.accountants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accountants
DROP POLICY IF EXISTS "Accountants view their own record" ON public.accountants;
CREATE POLICY "Accountants view their own record"
ON public.accountants FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Accountants can't modify their record" ON public.accountants;
CREATE POLICY "Accountants can't modify their record"
ON public.accountants FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Super admin manages accountants" ON public.accountants;
CREATE POLICY "Super admin manages accountants"
ON public.accountants FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 11: ACCOUNTING TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Transaction type and amount
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'rent', 'bill', 'payment')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    
    -- Related entity
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    -- Approval workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    pending_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    reference_number TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Accountants view all pending transactions" ON public.accounting_transactions;
CREATE POLICY "Accountants view all pending transactions"
ON public.accounting_transactions FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'accountant') OR 
       auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "Property managers view their property transactions" ON public.accounting_transactions;
CREATE POLICY "Property managers view their property transactions"
ON public.accounting_transactions FOR SELECT
USING (property_manager_id = auth.uid() AND status IN ('approved', 'processed'));

DROP POLICY IF EXISTS "Accountants approve transactions" ON public.accounting_transactions;
CREATE POLICY "Accountants approve transactions"
ON public.accounting_transactions FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'accountant') OR 
       auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'accountant') OR 
            auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

DROP POLICY IF EXISTS "Super admin manages transactions" ON public.accounting_transactions;
CREATE POLICY "Super admin manages transactions"
ON public.accounting_transactions FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 12: UPDATE MAINTENANCE_REQUESTS TABLE
-- ============================================================================

ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS assigned_to_technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.technician_categories(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS is_escalated_to_manager BOOLEAN DEFAULT false;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS technician_response_deadline TIMESTAMP WITH TIME ZONE;

-- Work documentation columns
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS work_start_photo TEXT;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS work_progress_photos TEXT[];
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS work_completion_photo TEXT;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS work_description TEXT;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2);
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2);
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS rating_by_tenant DECIMAL(3, 2);

-- Drop old images column if it exists and is an array
ALTER TABLE public.maintenance_requests DROP COLUMN IF EXISTS images;

-- ============================================================================
-- PART 13: TECHNICIAN JOB UPDATES TABLE (for job history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technician_job_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    
    -- Update details
    status VARCHAR(50) NOT NULL CHECK (status IN ('accepted', 'in_progress', 'completed', 'rejected', 'on_hold')),
    notes TEXT,
    update_type VARCHAR(50) CHECK (update_type IN ('status_change', 'comment', 'schedule_update')),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.technician_job_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users view relevant job updates" ON public.technician_job_updates;
CREATE POLICY "Users view relevant job updates"
ON public.technician_job_updates FOR SELECT
USING (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    OR maintenance_request_id IN (SELECT id FROM public.maintenance_requests WHERE tenant_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.maintenance_requests mr
        JOIN public.property_manager_assignments pma ON mr.property_id = pma.property_id
        WHERE mr.id = technician_job_updates.maintenance_request_id 
        AND pma.property_manager_id = auth.uid()
    )
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

DROP POLICY IF EXISTS "Technicians create job updates" ON public.technician_job_updates;
CREATE POLICY "Technicians create job updates"
ON public.technician_job_updates FOR INSERT
WITH CHECK (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    AND created_by = auth.uid()
);

-- ============================================================================
-- PART 14: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_categories TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_property_assignments TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietors TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietor_properties TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietor_reports TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proprietor_messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caretakers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountants TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_transactions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_job_updates TO authenticated, service_role;

-- ============================================================================
-- PART 15: SEED DEFAULT TECHNICIAN CATEGORIES
-- ============================================================================

INSERT INTO public.technician_categories (name, description, created_by) 
SELECT * FROM (VALUES
    ('plumbing', 'Plumbing repairs and maintenance', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('electrical', 'Electrical repairs and installations', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('painting', 'Painting and wall finishing', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('carpentry', 'Carpentry and woodwork', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('glazing', 'Glass and glazing work', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('welding', 'Metal welding and fabrication', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('tiling', 'Tile installation and repair', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1)),
    ('lift_maintenance', 'Lift/elevator maintenance and repair', (SELECT id FROM public.profiles WHERE role = 'super_admin' LIMIT 1))
) AS t(name, description, created_by)
WHERE NOT EXISTS (SELECT 1 FROM public.technician_categories WHERE name = t.name)
ON CONFLICT DO NOTHING;

COMMIT;

SELECT '✅ Migration completed successfully!' as status;
