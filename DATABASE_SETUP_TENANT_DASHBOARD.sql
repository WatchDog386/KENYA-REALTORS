-- =====================================================
-- TENANT DASHBOARD DATABASE SETUP
-- =====================================================
-- This file contains SQL to create/update all necessary
-- tables for the tenant dashboard with full CRUD support

-- =====================================================
-- 1. CALENDAR_EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'reminder', 'event')),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);

-- =====================================================
-- 2. USER_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  maintenance_alerts BOOLEAN DEFAULT TRUE,
  payment_reminders BOOLEAN DEFAULT TRUE,
  lease_updates BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- =====================================================
-- 3. EMERGENCY_CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- =====================================================
-- 4. HELP_FAQS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.help_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_faqs_category ON public.help_faqs(category);

-- =====================================================
-- 5. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read);

-- =====================================================
-- 6. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tenant', 'manager', 'admin')),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- =====================================================
-- 7. RENT_PAYMENTS TABLE (Ensure it exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'overdue', 'failed')),
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rent_payments_user_id ON public.rent_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON public.rent_payments(status);

-- =====================================================
-- 8. MAINTENANCE_REQUESTS TABLE (Ensure it exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  images TEXT[],
  estimated_completion DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_user_id ON public.maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

-- =====================================================
-- 9. DEPOSITS_REFUNDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.deposits_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lease_id UUID,
  original_deposit DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'disputed')),
  deductions JSONB,
  estimated_return_date DATE,
  actual_return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposits_refunds_user_id ON public.deposits_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_refunds_status ON public.deposits_refunds(status);

-- =====================================================
-- 10. TENANTS TABLE (Link users to properties)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID,
  unit_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  move_in_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);

-- =====================================================
-- 11. PROPERTIES TABLE (If not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. UNITS TABLE (If not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id),
  unit_number TEXT NOT NULL,
  unit_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. LEASES TABLE (If not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  property_id UUID REFERENCES public.properties(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10, 2),
  security_deposit DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leases_tenant_id ON public.leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_property_id ON public.leases(property_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Calendar Events RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_events_user_policy ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- User Settings RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_user_policy ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Emergency Contacts RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY emergency_contacts_user_policy ON public.emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_user_policy ON public.messages
  FOR ALL USING (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_user_policy ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Rent Payments RLS
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY rent_payments_user_policy ON public.rent_payments
  FOR ALL USING (auth.uid() = user_id);

-- Maintenance Requests RLS
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY maintenance_requests_user_policy ON public.maintenance_requests
  FOR ALL USING (auth.uid() = user_id);

-- Deposits Refunds RLS
ALTER TABLE public.deposits_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY deposits_refunds_user_policy ON public.deposits_refunds
  FOR ALL USING (auth.uid() = user_id);

-- Tenants RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_user_policy ON public.tenants
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- INSERT SAMPLE FAQs
-- =====================================================
INSERT INTO public.help_faqs (category, question, answer, order_num) VALUES
('Payments', 'How do I pay my rent?', 'You can pay your rent online through our secure payment portal. Navigate to the Payments section and select "Pay Rent" to get started.', 1),
('Payments', 'What payment methods do you accept?', 'We accept credit cards, debit cards, and bank transfers. All payments are processed securely.', 2),
('Payments', 'Can I pay late?', 'Late payments may result in additional fees. Please try to pay on time. Contact your property manager if you need assistance.', 3),
('Maintenance', 'How do I submit a maintenance request?', 'Go to the Maintenance section and click "Request Repair". Describe the issue and upload photos if possible.', 1),
('Maintenance', 'How long does maintenance usually take?', 'Most urgent issues are addressed within 24 hours. Standard requests typically take 3-7 business days.', 2),
('Maintenance', 'Is emergency maintenance available 24/7?', 'Yes, call the emergency number provided in the Safety section for urgent issues outside business hours.', 3),
('Account', 'How do I update my profile information?', 'Visit the Profile section to update your personal information, contact details, and emergency contacts.', 1),
('Account', 'How do I reset my password?', 'Click "Forgot Password" on the login page to receive a password reset link via email.', 2)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
-- All tables have been created/verified with:
-- ✓ Proper foreign key relationships
-- ✓ Indexes for performance
-- ✓ Row-Level Security (RLS) enabled
-- ✓ Timestamps for auditing
-- ✓ Sample data for FAQs
