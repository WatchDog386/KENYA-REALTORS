-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id),
  tenant_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_property ON refunds(property_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON refunds(created_at DESC);

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can do everything" ON refunds
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));

CREATE POLICY "Property managers can view property refunds" ON refunds
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE property_manager_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view their own refunds" ON refunds
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can create refunds" ON refunds
  FOR INSERT WITH CHECK (tenant_id = auth.uid());