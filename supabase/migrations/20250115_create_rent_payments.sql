-- Create Rent Payments Table
DROP TABLE IF EXISTS public.rent_payments CASCADE;

CREATE TABLE public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'credit_card', 'cash', 'cheque', 'mobile_money')),
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rent_payments_tenant ON public.rent_payments(tenant_id);
CREATE INDEX idx_rent_payments_lease ON public.rent_payments(lease_id);
CREATE INDEX idx_rent_payments_property ON public.rent_payments(property_id);
CREATE INDEX idx_rent_payments_status ON public.rent_payments(status);
CREATE INDEX idx_rent_payments_payment_date ON public.rent_payments(payment_date DESC);
CREATE INDEX idx_rent_payments_due_date ON public.rent_payments(due_date);

-- Enable Row Level Security
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all payments" ON public.rent_payments;
DROP POLICY IF EXISTS "Tenants can view own payments" ON public.rent_payments;

-- Policy: Super admins can manage all payments
CREATE POLICY "Super admins can manage all payments" 
ON public.rent_payments FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Policy: Tenants can view their own payments
CREATE POLICY "Tenants can view their own payments" 
ON public.rent_payments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.tenants t
        JOIN public.profiles p ON p.id = t.user_id
        WHERE p.id = auth.uid()
        AND t.id = rent_payments.tenant_id
    )
);

-- Policy: Property managers can view payments for their properties
CREATE POLICY "Property managers can view payments for their properties" 
ON public.rent_payments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.properties pr
        JOIN public.profiles p ON p.id = pr.property_manager_id
        WHERE p.id = auth.uid()
        AND pr.id = rent_payments.property_id
    )
);
