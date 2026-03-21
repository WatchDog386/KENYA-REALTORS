-- Extend maintenance completion reports for repair procurement approval and payment tracking.

ALTER TABLE IF EXISTS public.maintenance_completion_reports
  ADD COLUMN IF NOT EXISTS lpo_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_email TEXT,
  ADD COLUMN IF NOT EXISTS supplier_phone TEXT,
  ADD COLUMN IF NOT EXISTS cost_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_accountant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accountant_notes TEXT,
  -- Requisition / LPO detailed tracking
  ADD COLUMN IF NOT EXISTS technician_details TEXT,
  ADD COLUMN IF NOT EXISTS technician_docket_number TEXT,
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS damage_reported_date DATE,
  ADD COLUMN IF NOT EXISTS vacated_date DATE,
  ADD COLUMN IF NOT EXISTS materials_requested JSONB,
  ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sum NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_mcr_lpo_number ON public.maintenance_completion_reports(lpo_number);
CREATE INDEX IF NOT EXISTS idx_mcr_invoice_number ON public.maintenance_completion_reports(invoice_number);
CREATE INDEX IF NOT EXISTS idx_mcr_status ON public.maintenance_completion_reports(status);

ALTER TABLE IF EXISTS public.maintenance_completion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accountants update procurement approval" ON public.maintenance_completion_reports;
CREATE POLICY "Accountants update procurement approval"
ON public.maintenance_completion_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'accountant'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'accountant'
  )
);

DROP POLICY IF EXISTS "Proprietors view own property procurement reports" ON public.maintenance_completion_reports;
CREATE POLICY "Proprietors view own property procurement reports"
ON public.maintenance_completion_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.proprietor_properties pp
    JOIN public.proprietors pr ON pr.id = pp.proprietor_id
    WHERE pp.property_id = maintenance_completion_reports.property_id
      AND pp.is_active = true
      AND pr.user_id = auth.uid()
  )
);

-- ==========================================
-- Payroll and Accountant Linking
-- ==========================================
-- Create an employees table linked to profiles, tracked by accountants
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_role TEXT NOT NULL,
  department TEXT,
  basic_salary NUMERIC(12, 2) DEFAULT 0,
  payment_details JSONB, -- Bank details, MPESA etc.
  assigned_accountant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payroll transactions logic
CREATE TABLE IF NOT EXISTS public.payroll_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  accountant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Accountant processing this
  amount_paid NUMERIC(12, 2) NOT NULL,
  payment_period VARCHAR(50), -- e.g. "March 2026"
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  disbursement_method TEXT,
  reference_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_transactions ENABLE ROW LEVEL SECURITY;

-- Allow accountants to manage employees
DROP POLICY IF EXISTS "Accountants manage employees" ON public.employees;
CREATE POLICY "Accountants manage employees"
ON public.employees
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'accountant'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'accountant'));

-- Allow employees to see their own records
DROP POLICY IF EXISTS "Employees view own records" ON public.employees;
CREATE POLICY "Employees view own records"
ON public.employees
FOR SELECT
USING (user_id = auth.uid());

-- Allow accountants to process payroll
DROP POLICY IF EXISTS "Accountants manage payroll" ON public.payroll_transactions;
CREATE POLICY "Accountants manage payroll"
ON public.payroll_transactions
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'accountant'));

-- Allow employees to view their own payroll slips
DROP POLICY IF EXISTS "Employees view own payroll" ON public.payroll_transactions;
CREATE POLICY "Employees view own payroll"
ON public.payroll_transactions
FOR SELECT
USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

