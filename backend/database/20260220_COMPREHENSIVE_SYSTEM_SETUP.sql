-- ============================================================================
-- COMPREHENSIVE SYSTEM SETUP - ALL PORTALS
-- Date: February 20, 2026
-- Purpose: Consolidate all database migrations in correct order for 7 portals
-- Portals: Super Admin, Property Manager, Tenant, Technician, Proprietor, 
--          Caretaker, Accountant
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: VERIFY PROFILE ROLE CONSTRAINTS
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS check_profiles_role_values;
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

ALTER TABLE public.technician_categories ENABLE ROW LEVEL SECURITY;

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
    specializations TEXT[],
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

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

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
-- PART 4: TECHNICIAN PROPERTY ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.technician_property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(technician_id, property_id)
);

ALTER TABLE public.technician_property_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view relevant assignments" ON public.technician_property_assignments;
CREATE POLICY "Users view relevant assignments"
ON public.technician_property_assignments FOR SELECT
USING (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    OR assigned_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super admin manages assignments" ON public.technician_property_assignments;
CREATE POLICY "Super admin manages assignments"
ON public.technician_property_assignments FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 5: UPDATE MAINTENANCE_REQUESTS TABLE
-- ============================================================================

ALTER TABLE IF EXISTS public.maintenance_requests 
ADD COLUMN IF NOT EXISTS assigned_to_technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.technician_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS is_escalated_to_manager BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS work_start_photo TEXT,
ADD COLUMN IF NOT EXISTS work_progress_photos TEXT[],
ADD COLUMN IF NOT EXISTS work_completion_photo TEXT,
ADD COLUMN IF NOT EXISTS work_description TEXT,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rating_by_tenant DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS technician_response_deadline TIMESTAMP WITH TIME ZONE;

-- Fix maintenance_requests status enum
ALTER TABLE IF EXISTS public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;

ALTER TABLE IF EXISTS public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_status_check CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 6: MAINTENANCE_REQUESTS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Tenants create requests" ON public.maintenance_requests;
CREATE POLICY "Tenants create requests"
ON public.maintenance_requests FOR INSERT
WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Tenants view own requests" ON public.maintenance_requests;
CREATE POLICY "Tenants view own requests"
ON public.maintenance_requests FOR SELECT
USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS "Technicians view requests" ON public.maintenance_requests;
CREATE POLICY "Technicians view requests"
ON public.maintenance_requests FOR SELECT
USING (
  -- A. Directly assigned requests
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  OR
  -- B. Property pool + category match
  (
    assigned_to_technician_id IS NULL 
    AND category_id IN (SELECT category_id FROM public.technicians WHERE user_id = auth.uid())
    AND property_id IN (
      SELECT property_id FROM public.technician_property_assignments 
      WHERE technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
      AND is_active = true
    )
  )
  OR
  -- C. Category pool (unassigned + matching category)
  (
    assigned_to_technician_id IS NULL 
    AND category_id IN (SELECT category_id FROM public.technicians WHERE user_id = auth.uid())
  )
  OR
  -- D. Super admin and managers
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager'))
);

DROP POLICY IF EXISTS "Technician can update assigned requests" ON public.maintenance_requests;
CREATE POLICY "Technician can update assigned requests"
ON public.maintenance_requests FOR UPDATE
USING (
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager'))
)
WITH CHECK (
  assigned_to_technician_id IN (
    SELECT id FROM public.technicians WHERE user_id = auth.uid()
  )
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('super_admin', 'property_manager'))
);

DROP POLICY IF EXISTS "Manager can update maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Manager can update maintenance requests"
ON public.maintenance_requests FOR UPDATE
USING (
  property_id IN (
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = auth.uid()
  )
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
)
WITH CHECK (
  property_id IN (
    SELECT property_id FROM public.property_manager_assignments 
    WHERE property_manager_id = auth.uid()
  )
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

-- ============================================================================
-- PART 7: COMPLETION REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_completion_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
    
    -- Report content
    notes TEXT,
    hours_spent DECIMAL(5, 2),
    materials_used TEXT,
    
    -- Images
    before_work_image_url TEXT,
    in_progress_image_url TEXT,
    after_repair_image_url TEXT,
    
    -- Status & dates
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    -- For accounting approval
    cost_estimate DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    cost_approved_at TIMESTAMP,
    
    manager_notes TEXT,
    accountant_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.maintenance_completion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Technicians manage their reports" ON public.maintenance_completion_reports;
CREATE POLICY "Technicians manage their reports"
ON public.maintenance_completion_reports FOR ALL
USING (technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid()))
WITH CHECK (technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Managers view reports" ON public.maintenance_completion_reports;
CREATE POLICY "Managers view reports"
ON public.maintenance_completion_reports FOR SELECT
USING (
    property_id IN (SELECT property_id FROM public.property_manager_assignments WHERE property_manager_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin')
);

DROP POLICY IF EXISTS "Accountants view all reports" ON public.maintenance_completion_reports;
CREATE POLICY "Accountants view all reports"
ON public.maintenance_completion_reports FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

-- ============================================================================
-- PART 8: PROPRIETOR TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proprietor_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    ownership_percentage DECIMAL(5, 2) DEFAULT 100.00,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(proprietor_id, property_id)
);

ALTER TABLE public.proprietor_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proprietors view own properties" ON public.proprietor_properties;
CREATE POLICY "Proprietors view own properties"
ON public.proprietor_properties FOR SELECT
USING (proprietor_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 9: CARETAKER TABLE (UPDATE)
-- ============================================================================

ALTER TABLE IF EXISTS public.caretakers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3, 2);

ALTER TABLE public.caretakers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Caretakers view their assignments" ON public.caretakers;
CREATE POLICY "Caretakers view their assignments"
ON public.caretakers FOR SELECT
USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'super_admin'));

-- ============================================================================
-- PART 10: ACCOUNTING TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    
    -- References
    related_to UUID,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accountants manage transactions" ON public.accounting_transactions;
CREATE POLICY "Accountants manage transactions"
ON public.accounting_transactions FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')))
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

DROP POLICY IF EXISTS "Managers view their property transactions" ON public.accounting_transactions;
CREATE POLICY "Managers view their property transactions"
ON public.accounting_transactions FOR SELECT
USING (
    property_id IN (SELECT property_id FROM public.property_manager_assignments WHERE property_manager_id = auth.uid())
);

-- ============================================================================
-- PART 11: NOTIFICATIONS TABLE (IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (recipient_id = auth.uid());

-- ============================================================================
-- PART 12: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON public.maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_technician ON public.maintenance_requests(assigned_to_technician_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_category ON public.maintenance_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON public.maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON public.technicians(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_category ON public.technicians(category_id);

CREATE INDEX IF NOT EXISTS idx_technician_prop_assignments_tech ON public.technician_property_assignments(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_prop_assignments_prop ON public.technician_property_assignments(property_id);

CREATE INDEX IF NOT EXISTS idx_completion_reports_technician ON public.maintenance_completion_reports(technician_id);
CREATE INDEX IF NOT EXISTS idx_completion_reports_request ON public.maintenance_completion_reports(maintenance_request_id);

CREATE INDEX IF NOT EXISTS idx_proprietor_properties_proprietor ON public.proprietor_properties(proprietor_id);
CREATE INDEX IF NOT EXISTS idx_proprietor_properties_property ON public.proprietor_properties(property_id);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_property ON public.accounting_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_status ON public.accounting_transactions(status);

COMMIT;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
-- Run these queries in Supabase to verify setup:
-- 
-- SELECT COUNT(*) FROM technician_categories;
-- SELECT COUNT(*) FROM technicians;
-- SELECT COUNT(*) FROM maintenance_requests WHERE category_id IS NOT NULL;
-- SELECT COUNT(*) FROM completion_reports;
-- 
-- ============================================================================
