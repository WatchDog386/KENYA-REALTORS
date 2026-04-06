-- ============================================================================
-- ADD INVOICES AND RECEIPTS FOR ACCOUNTING
-- Date: February 11, 2026
-- ============================================================================

BEGIN;

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_id UUID REFERENCES public.accounting_transactions(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
    
    items JSONB, -- Store line items as JSON
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Accountants can view all invoices" ON public.invoices;
CREATE POLICY "Accountants can view all invoices" ON public.invoices
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

DROP POLICY IF EXISTS "Accountants can manage invoices" ON public.invoices;
CREATE POLICY "Accountants can manage invoices" ON public.invoices
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

-- ============================================================================
-- RECEIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.accounting_transactions(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    
    amount_paid DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Accountants can view all receipts" ON public.receipts;
CREATE POLICY "Accountants can view all receipts" ON public.receipts
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

DROP POLICY IF EXISTS "Accountants can manage receipts" ON public.receipts;
CREATE POLICY "Accountants can manage receipts" ON public.receipts
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('accountant', 'super_admin')));

COMMIT;
