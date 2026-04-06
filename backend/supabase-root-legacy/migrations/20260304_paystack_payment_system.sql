-- PAYSTACK PAYMENT SYSTEM MIGRATION
--
-- Purpose: Add invoices, payments, and receipts tables for Paystack integration
-- Required for tenant rent payment functionality across all dashboards

-- INVOICES TABLE
-- Stores invoice records for tenant rent and utilities
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' 
        CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- PAYMENTS TABLE
-- Records successful payments from Paystack and other gateways
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    reference VARCHAR(255) NOT NULL UNIQUE, -- Paystack transaction reference
    gateway VARCHAR(50) NOT NULL DEFAULT 'paystack'
        CHECK (gateway IN ('paystack', 'mpesa', 'manual')),
    status VARCHAR(50) NOT NULL DEFAULT 'successful'
        CHECK (status IN ('successful', 'failed', 'pending')),
    paid_at TIMESTAMP WITH TIME ZONE,
    paystack_transaction_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECEIPTS TABLE
-- Auto-generated receipts for successful payments
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    tenant_name VARCHAR(255),
    property_name VARCHAR(255),
    unit_number VARCHAR(50),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON invoices(property_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_id ON receipts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR TENANTS (can view their own invoices, payments, and receipts)
CREATE POLICY "Tenants can view their own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM tenants WHERE id = tenant_id));

CREATE POLICY "Tenants can view their own payments"
    ON payments FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM tenants WHERE id = tenant_id));

CREATE POLICY "Tenants can view their own receipts"
    ON receipts FOR SELECT
    USING (auth.uid() = (SELECT auth_user_id FROM tenants WHERE id = tenant_id));

-- POLICIES FOR PROPERTY MANAGERS (can view invoices, payments, and receipts for their properties)
-- Note: Assumes property_managers table has property_id relationship
CREATE POLICY "Property managers can view invoices for their properties"
    ON invoices FOR SELECT
    USING (
        property_id IN (
            SELECT property_id FROM property_managers 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Property managers can view payments for their properties"
    ON payments FOR SELECT
    USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            WHERE i.property_id IN (
                SELECT property_id FROM property_managers 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Property managers can view receipts for their properties"
    ON receipts FOR SELECT
    USING (
        invoice_id IN (
            SELECT i.id FROM invoices i
            WHERE i.property_id IN (
                SELECT property_id FROM property_managers 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- POLICIES FOR SUPER ADMIN (can view all)
-- Note: Assumes is_superadmin column in auth.users or a superadmin role
CREATE POLICY "Super admins can view all invoices"
    ON invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'is_superadmin' = 'true'
        )
    );

CREATE POLICY "Super admins can view all payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'is_superadmin' = 'true'
        )
    );

CREATE POLICY "Super admins can view all receipts"
    ON receipts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'is_superadmin' = 'true'
        )
    );

-- POLICIES FOR INSERT/UPDATE (Admin operations)
CREATE POLICY "Only admins can insert invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'is_superadmin' = 'true'
        )
        OR
        property_id IN (
            SELECT property_id FROM property_managers 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Only admins can update invoices"
    ON invoices FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND raw_user_meta_data->>'is_superadmin' = 'true'
        )
        OR
        property_id IN (
            SELECT property_id FROM property_managers 
            WHERE auth_user_id = auth.uid()
        )
    );

-- WEBHOOK FUNCTION TO UPDATE RELATED DATA
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_update_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at();

CREATE TRIGGER payment_update_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_updated_at();
