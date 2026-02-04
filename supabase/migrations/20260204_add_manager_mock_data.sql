-- Add mock data for messages table
INSERT INTO public.messages (sender_id, recipient_id, subject, content, is_read, created_at)
SELECT 
  p1.id,
  p2.id,
  'Maintenance Request Update',
  'Please review the maintenance request submitted for Unit 101. The contractor estimates the work will take 2-3 days.',
  false,
  now() - interval '1 day'
FROM profiles p1, profiles p2
WHERE p1.role = 'tenant' AND p2.role = 'property_manager'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.messages (sender_id, recipient_id, subject, content, is_read, created_at)
SELECT 
  p1.id,
  p2.id,
  'Rent Payment Confirmation',
  'Your rent payment of $1,500 has been received and processed for Unit 102.',
  true,
  now() - interval '5 days'
FROM profiles p1, profiles p2
WHERE p1.role = 'property_manager' AND p2.role = 'tenant'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add mock data for rent_payments table
INSERT INTO public.rent_payments (tenant_id, property_id, amount, due_date, paid_date, status, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE - interval '10 days',
  CURRENT_DATE - interval '5 days',
  'paid',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.rent_payments (tenant_id, property_id, amount, due_date, status, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE - interval '5 days',
  'overdue',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.rent_payments (tenant_id, property_id, amount, due_date, status, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE + interval '5 days',
  'pending',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add mock data for security_deposits table
INSERT INTO public.security_deposits (tenant_id, property_id, amount, deposit_date, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE - interval '90 days',
  'held',
  'Security deposit held for Unit 102',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.security_deposits (tenant_id, property_id, amount, deposit_date, return_date, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE - interval '180 days',
  CURRENT_DATE - interval '10 days',
  'released',
  'Security deposit released after lease end',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.security_deposits (tenant_id, property_id, amount, deposit_date, deduction_amount, deduction_reason, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  1500,
  CURRENT_DATE - interval '120 days',
  200,
  'Carpet staining and wall damage',
  'deducted',
  'Deduction made for damages',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add mock data for lease_applications table
INSERT INTO public.lease_applications (applicant_id, property_id, status, application_date, notes, created_at)
SELECT 
  p.id,
  prop.id,
  'pending',
  CURRENT_DATE - interval '3 days',
  'Applicant requesting 2-bedroom unit',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.lease_applications (applicant_id, property_id, status, application_date, notes, created_at)
SELECT 
  p.id,
  prop.id,
  'approved',
  CURRENT_DATE - interval '10 days',
  'Application approved - lease signed',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.lease_applications (applicant_id, property_id, status, application_date, notes, created_at)
SELECT 
  p.id,
  prop.id,
  'under_review',
  CURRENT_DATE - interval '1 day',
  'Awaiting background check results',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add mock data for leases table
INSERT INTO public.leases (tenant_id, property_id, start_date, end_date, monthly_rent, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  CURRENT_DATE - interval '90 days',
  CURRENT_DATE + interval '270 days',
  1500,
  'active',
  'Active lease agreement for 12 months',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.leases (tenant_id, property_id, start_date, end_date, monthly_rent, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  CURRENT_DATE + interval '30 days',
  CURRENT_DATE + interval '395 days',
  1600,
  'pending',
  'Pending lease - to start next month',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.leases (tenant_id, property_id, start_date, end_date, monthly_rent, status, notes, created_at)
SELECT 
  p.id,
  prop.id,
  CURRENT_DATE - interval '365 days',
  CURRENT_DATE - interval '5 days',
  1400,
  'expired',
  'Lease expired - tenant moved out',
  now()
FROM profiles p, properties prop
WHERE p.role = 'tenant' AND prop.id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1
ON CONFLICT DO NOTHING;
