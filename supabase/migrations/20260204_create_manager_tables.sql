-- Drop messages table if it exists with wrong schema
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop rent_payments table if it exists with wrong schema
DROP TABLE IF EXISTS public.rent_payments CASCADE;

-- Create rent_payments table
CREATE TABLE public.rent_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop security_deposits table if it exists with wrong schema
DROP TABLE IF EXISTS public.security_deposits CASCADE;

-- Create security_deposits table
CREATE TABLE public.security_deposits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  deposit_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'deducted', 'returned')),
  deduction_reason text,
  deduction_amount numeric(10,2),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop lease_applications table if it exists with wrong schema
DROP TABLE IF EXISTS public.lease_applications CASCADE;

-- Create lease_applications table
CREATE TABLE public.lease_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_unit_types(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  application_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Drop leases table if it exists with wrong schema
DROP TABLE IF EXISTS public.leases CASCADE;

-- Create leases table
CREATE TABLE public.leases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_unit_types(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'terminated')),
  lease_file_url text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_id ON rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_property_id ON rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_security_deposits_tenant_id ON security_deposits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_deposits_property_id ON security_deposits(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_applications_applicant_id ON lease_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_lease_applications_property_id ON lease_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_applications_status ON lease_applications(status);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is property manager
CREATE OR REPLACE FUNCTION is_property_manager(user_id uuid, prop_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM property_manager_assignments
    WHERE property_manager_id = user_id AND property_id = prop_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'super_admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for messages
DROP POLICY IF EXISTS messages_user_read ON messages;
CREATE POLICY messages_user_read ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS messages_user_insert ON messages;
CREATE POLICY messages_user_insert ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS messages_user_update ON messages;
CREATE POLICY messages_user_update ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id OR
    is_super_admin(auth.uid())
  );

-- RLS Policies for rent_payments
DROP POLICY IF EXISTS rent_payments_tenant_read ON rent_payments;
CREATE POLICY rent_payments_tenant_read ON rent_payments
  FOR SELECT USING (
    auth.uid() = tenant_id OR
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS rent_payments_manager_write ON rent_payments;
CREATE POLICY rent_payments_manager_write ON rent_payments
  FOR INSERT WITH CHECK (
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

-- RLS Policies for security_deposits
DROP POLICY IF EXISTS security_deposits_tenant_read ON security_deposits;
CREATE POLICY security_deposits_tenant_read ON security_deposits
  FOR SELECT USING (
    auth.uid() = tenant_id OR
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS security_deposits_manager_write ON security_deposits;
CREATE POLICY security_deposits_manager_write ON security_deposits
  FOR INSERT WITH CHECK (
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

-- RLS Policies for lease_applications
DROP POLICY IF EXISTS lease_applications_applicant_read ON lease_applications;
CREATE POLICY lease_applications_applicant_read ON lease_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS lease_applications_applicant_insert ON lease_applications;
CREATE POLICY lease_applications_applicant_insert ON lease_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS lease_applications_manager_update ON lease_applications;
CREATE POLICY lease_applications_manager_update ON lease_applications
  FOR UPDATE USING (
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

-- RLS Policies for leases
DROP POLICY IF EXISTS leases_tenant_read ON leases;
CREATE POLICY leases_tenant_read ON leases
  FOR SELECT USING (
    auth.uid() = tenant_id OR
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS leases_manager_write ON leases;
CREATE POLICY leases_manager_write ON leases
  FOR INSERT WITH CHECK (
    is_property_manager(auth.uid(), property_id) OR
    is_super_admin(auth.uid())
  );
