-- Sample Data for Testing Property Management System
-- Updated to work with the integrated schema

-- ============================================================================
-- INSERT SAMPLE PROFILES
-- ============================================================================

DO $$
DECLARE
  super_admin_id UUID := '374d7910-06ca-477b-b1af-617c46159bf1'; -- Duncan's ID
  manager1_id UUID := gen_random_uuid();
  manager2_id UUID := gen_random_uuid();
  manager3_id UUID := gen_random_uuid();
  tenant1_id UUID := gen_random_uuid();
  tenant2_id UUID := gen_random_uuid();
  tenant3_id UUID := gen_random_uuid();
  tenant4_id UUID := gen_random_uuid();
  maintenance1_id UUID := gen_random_uuid();
  accountant1_id UUID := gen_random_uuid();
BEGIN

-- Insert or update super admin profile
INSERT INTO profiles (id, email, first_name, last_name, phone, role, status, avatar_url) 
VALUES 
  (super_admin_id, 'duncanmarshel@gmail.com', 'Duncan', 'Marshel', '+254700000001', 'super_admin', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Duncan')
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'super_admin', 
  status = 'active',
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone;

-- Insert sample property managers
INSERT INTO profiles (id, email, first_name, last_name, phone, role, status, avatar_url) VALUES
  (manager1_id, 'john.kamau@example.com', 'John', 'Kamau', '+254712345678', 'property_manager', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
  (manager2_id, 'sarah.wanjiku@example.com', 'Sarah', 'Wanjiku', '+254723456789', 'property_manager', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
  (manager3_id, 'peter.otieno@example.com', 'Peter', 'Otieno', '+254734567890', 'property_manager', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Peter'),
  (maintenance1_id, 'james.maintenance@example.com', 'James', 'Maina', '+254745678901', 'maintenance', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'),
  (accountant1_id, 'mary.accountant@example.com', 'Mary', 'Atieno', '+254756789012', 'accountant', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tenants
INSERT INTO profiles (id, email, first_name, last_name, phone, role, status, avatar_url) VALUES
  (tenant1_id, 'david.omondi@example.com', 'David', 'Omondi', '+254767890123', 'tenant', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'),
  (tenant2_id, 'grace.mwangi@example.com', 'Grace', 'Mwangi', '+254778901234', 'tenant', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace'),
  (tenant3_id, 'brian.kiprono@example.com', 'Brian', 'Kiprono', '+254789012345', 'tenant', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brian'),
  (tenant4_id, 'faith.akinyi@example.com', 'Faith', 'Akinyi', '+254790123456', 'tenant', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Faith')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INSERT SAMPLE PROPERTIES
-- ============================================================================

-- Property 1: Luxury Apartments
INSERT INTO properties (id, name, address, city, state, country, type, status, total_units, occupied_units, monthly_rent, manager_id, super_admin_id, images, amenities, description) VALUES
(
  gen_random_uuid(),
  'Westlands Luxury Apartments',
  'Mpaka Road, Westlands',
  'Nairobi',
  'Nairobi County',
  'Kenya',
  'apartment',
  'active',
  80,
  72,
  45000.00,
  manager1_id,
  super_admin_id,
  ARRAY[
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w-800&auto=format&fit=crop'
  ],
  ARRAY['swimming_pool', 'gym', 'parking', 'security', 'elevator', 'garden', 'playground'],
  'Premium apartments in the heart of Westlands with modern amenities and excellent security.'
)
RETURNING id INTO property1_id;

-- Property 2: Beach Villa
INSERT INTO properties (id, name, address, city, state, country, type, status, total_units, occupied_units, monthly_rent, manager_id, super_admin_id, images, amenities, description) VALUES
(
  gen_random_uuid(),
  'Nyali Beach Villa',
  'Links Road, Nyali',
  'Mombasa',
  'Mombasa County',
  'Kenya',
  'house',
  'active',
  1,
  1,
  150000.00,
  manager2_id,
  super_admin_id,
  ARRAY[
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&auto=format&fit=crop'
  ],
  ARRAY['beach_access', 'pool', 'garden', 'parking', 'security', 'maid_service', 'wifi'],
  'Luxury beachfront villa with private access to the beach and panoramic ocean views.'
)
RETURNING id INTO property2_id;

-- Property 3: Commercial Plaza
INSERT INTO properties (id, name, address, city, state, country, type, status, total_units, occupied_units, monthly_rent, manager_id, super_admin_id, images, amenities, description) VALUES
(
  gen_random_uuid(),
  'Kisumu Commercial Plaza',
  'Oginga Odinga Street, CBD',
  'Kisumu',
  'Kisumu County',
  'Kenya',
  'commercial',
  'active',
  25,
  20,
  75000.00,
  manager3_id,
  super_admin_id,
  ARRAY[
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1487956382158-bb926046304a?w=800&auto=format&fit=crop'
  ],
  ARRAY['parking', 'security', 'elevator', 'backup_generator', 'wifi', 'meeting_rooms'],
  'Modern commercial space in Kisumu CBD suitable for offices and retail businesses.'
)
RETURNING id INTO property3_id;

-- Property 4: Suburban Apartments
INSERT INTO properties (id, name, address, city, state, country, type, status, total_units, occupied_units, monthly_rent, manager_id, super_admin_id, images, amenities, description) VALUES
(
  gen_random_uuid(),
  'Nakuru Green Apartments',
  'Kenyatta Avenue',
  'Nakuru',
  'Nakuru County',
  'Kenya',
  'apartment',
  'available',
  40,
  32,
  28000.00,
  manager2_id,
  super_admin_id,
  ARRAY[
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
  ],
  ARRAY['parking', 'security', 'garden', 'playground', 'water_backup'],
  'Affordable apartments in a quiet suburban neighborhood with green spaces.'
)
RETURNING id INTO property4_id;

-- ============================================================================
-- INSERT SAMPLE UNITS
-- ============================================================================

-- Units for Property 1
INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
(gen_random_uuid(), property1_id, 'A101', '2br', 2, 2.0, 45000.00, 45000.00, 1200, 'occupied', ARRAY['balcony', 'ac', 'heated_floors'], '{"view": "city", "floor": 10}'),
(gen_random_uuid(), property1_id, 'A102', '1br', 1, 1.0, 35000.00, 35000.00, 800, 'occupied', ARRAY['balcony', 'ac'], '{"view": "pool", "floor": 10}'),
(gen_random_uuid(), property1_id, 'A201', '3br', 3, 2.5, 65000.00, 65000.00, 1500, 'vacant', ARRAY['balcony', 'ac', 'fireplace'], '{"view": "city", "floor": 20}'),
(gen_random_uuid(), property1_id, 'A202', 'studio', 0, 1.0, 25000.00, 25000.00, 500, 'occupied', ARRAY['ac'], '{"view": "street", "floor": 20}')
RETURNING id INTO unit1_id, id INTO unit2_id, id INTO unit3_id, id INTO unit4_id;

-- Units for Property 2 (Villa)
INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
(gen_random_uuid(), property2_id, 'Main Villa', '4br', 4, 4.0, 150000.00, 150000.00, 3500, 'occupied', ARRAY['pool', 'garden', 'garage', 'maid_room'], '{"view": "ocean", "has_pool": true}')
RETURNING id INTO unit5_id;

-- Units for Property 3
INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
(gen_random_uuid(), property3_id, 'G01', 'commercial', 0, 2.0, 75000.00, 75000.00, 2000, 'occupied', ARRAY['ac', 'store_front'], '{"floor": "ground", "type": "retail"}'),
(gen_random_uuid(), property3_id, '101', 'commercial', 0, 1.0, 50000.00, 50000.00, 1200, 'occupied', ARRAY['ac'], '{"floor": 1, "type": "office"}'),
(gen_random_uuid(), property3_id, '102', 'commercial', 0, 1.0, 50000.00, 50000.00, 1200, 'vacant', ARRAY['ac'], '{"floor": 1, "type": "office"}')
RETURNING id INTO unit6_id, id INTO unit7_id, id INTO unit8_id;

-- ============================================================================
-- INSERT SAMPLE LEASES
-- ============================================================================

INSERT INTO leases (id, unit_id, property_id, tenant_id, start_date, end_date, monthly_rent, security_deposit, status, utilities_included, pets_allowed, special_terms) VALUES
(
  gen_random_uuid(),
  unit1_id,
  property1_id,
  tenant1_id,
  '2024-01-01',
  '2024-12-31',
  45000.00,
  45000.00,
  'active',
  '{"water": true, "electricity": false, "gas": false, "internet": false}',
  true,
  'Tenant responsible for electricity and internet bills.'
),
(
  gen_random_uuid(),
  unit2_id,
  property1_id,
  tenant2_id,
  '2024-02-01',
  '2025-01-31',
  35000.00,
  35000.00,
  'active',
  '{"water": true, "electricity": true, "gas": false, "internet": true}',
  false,
  'All utilities included except gas.'
),
(
  gen_random_uuid(),
  unit5_id,
  property2_id,
  tenant3_id,
  '2024-01-15',
  '2024-12-14',
  150000.00,
  150000.00,
  'active',
  '{"water": true, "electricity": true, "gas": true, "internet": true}',
  true,
  'Fully furnished, includes weekly maid service and pool maintenance.'
),
(
  gen_random_uuid(),
  unit6_id,
  property3_id,
  tenant4_id,
  '2024-03-01',
  '2025-02-28',
  75000.00,
  75000.00,
  'active',
  '{"water": false, "electricity": false, "gas": false, "internet": false}',
  false,
  'Commercial lease, tenant responsible for all utilities and maintenance.'
)
RETURNING id INTO lease1_id, id INTO lease2_id, id INTO lease3_id, id INTO lease4_id;

-- ============================================================================
-- INSERT SAMPLE PAYMENTS
-- ============================================================================

-- Payments for January 2024
INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, due_date, period_start, period_end) VALUES
(gen_random_uuid(), lease1_id, tenant1_id, property1_id, unit1_id, 45000.00, 'rent', 'completed', 'mpesa', '2024-01-03', '2024-01-05', '2024-01-01', '2024-01-31'),
(gen_random_uuid(), lease2_id, tenant2_id, property1_id, unit2_id, 35000.00, 'rent', 'completed', 'bank_transfer', '2024-01-04', '2024-01-05', '2024-01-01', '2024-01-31'),
(gen_random_uuid(), lease3_id, tenant3_id, property2_id, unit5_id, 150000.00, 'rent', 'completed', 'bank_transfer', '2024-01-02', '2024-01-05', '2024-01-01', '2024-01-31');

-- Payments for February 2024
INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, due_date, period_start, period_end) VALUES
(gen_random_uuid(), lease1_id, tenant1_id, property1_id, unit1_id, 45000.00, 'rent', 'completed', 'mpesa', '2024-02-01', '2024-02-05', '2024-02-01', '2024-02-29'),
(gen_random_uuid(), lease2_id, tenant2_id, property1_id, unit2_id, 35000.00, 'rent', 'completed', 'bank_transfer', '2024-02-03', '2024-02-05', '2024-02-01', '2024-02-29'),
(gen_random_uuid(), lease3_id, tenant3_id, property2_id, unit5_id, 150000.00, 'rent', 'completed', 'bank_transfer', '2024-02-01', '2024-02-05', '2024-02-01', '2024-02-29'),
(gen_random_uuid(), lease4_id, tenant4_id, property3_id, unit6_id, 75000.00, 'deposit', 'completed', 'credit_card', '2024-02-28', '2024-03-01', '2024-03-01', '2024-03-31');

-- Payments for March 2024 (some pending)
INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, due_date, period_start, period_end) VALUES
(gen_random_uuid(), lease1_id, tenant1_id, property1_id, unit1_id, 45000.00, 'rent', 'completed', 'mpesa', '2024-03-02', '2024-03-05', '2024-03-01', '2024-03-31'),
(gen_random_uuid(), lease2_id, tenant2_id, property1_id, unit2_id, 35000.00, 'rent', 'pending', NULL, NULL, '2024-03-05', '2024-03-01', '2024-03-31'),
(gen_random_uuid(), lease3_id, tenant3_id, property2_id, unit5_id, 150000.00, 'rent', 'pending', NULL, NULL, '2024-03-05', '2024-03-01', '2024-03-31'),
(gen_random_uuid(), lease4_id, tenant4_id, property3_id, unit6_id, 75000.00, 'rent', 'completed', 'bank_transfer', '2024-03-01', '2024-03-05', '2024-03-01', '2024-03-31');

-- Late fee example
INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, due_date, notes) VALUES
(gen_random_uuid(), lease2_id, tenant2_id, property1_id, unit2_id, 1750.00, 'late_fee', 'completed', 'mpesa', '2024-02-10', '2024-02-10', 'Late fee for February rent (5% of 35,000)');

-- ============================================================================
-- INSERT SAMPLE MESSAGES
-- ============================================================================

INSERT INTO messages (id, sender_id, receiver_id, property_id, unit_id, lease_id, subject, body, message_type, priority, is_read) VALUES
(
  gen_random_uuid(),
  tenant1_id,
  manager1_id,
  property1_id,
  unit1_id,
  lease1_id,
  'AC Not Working',
  'The air conditioning in my apartment has stopped working. It''s getting very hot. Can you send someone to check it?',
  'maintenance',
  'high',
  false
),
(
  gen_random_uuid(),
  manager1_id,
  tenant1_id,
  property1_id,
  unit1_id,
  lease1_id,
  'Re: AC Not Working',
  'Thanks for reporting. I''ve scheduled a technician to visit tomorrow between 10 AM and 2 PM.',
  'maintenance',
  'normal',
  true
),
(
  gen_random_uuid(),
  super_admin_id,
  manager1_id,
  property1_id,
  NULL,
  NULL,
  'Monthly Report Due',
  'Please submit the monthly occupancy and financial report by the 5th of next month.',
  'announcement',
  'normal',
  true
),
(
  gen_random_uuid(),
  tenant2_id,
  manager1_id,
  property1_id,
  unit2_id,
  lease2_id,
  'Parking Space Issue',
  'Someone is consistently parking in my assigned spot (A12). Can you address this?',
  'complaint',
  'medium',
  false
),
(
  gen_random_uuid(),
  manager2_id,
  super_admin_id,
  property2_id,
  NULL,
  NULL,
  'Property Inspection Request',
  'Requesting an inspection of the beach villa before the high season. The exterior paint needs attention.',
  'general',
  'medium',
  false
);

-- ============================================================================
-- INSERT SAMPLE MAINTENANCE REQUESTS
-- ============================================================================

INSERT INTO maintenance_requests (id, title, description, property_id, unit_id, reported_by, assigned_to, status, priority, category, images) VALUES
(
  gen_random_uuid(),
  'AC Unit Repair',
  'Air conditioning not cooling properly. Makes strange noise when turned on.',
  property1_id,
  unit1_id,
  tenant1_id,
  maintenance1_id,
  'completed',
  'high',
  'appliance',
  ARRAY['https://example.com/ac1.jpg', 'https://example.com/ac2.jpg']
),
(
  gen_random_uuid(),
  'Leaking Kitchen Faucet',
  'Kitchen faucet leaking continuously. Wasting a lot of water.',
  property1_id,
  unit2_id,
  tenant2_id,
  maintenance1_id,
  'in_progress',
  'medium',
  'plumbing',
  ARRAY['https://example.com/faucet1.jpg']
),
(
  gen_random_uuid(),
  'Electrical Outlet Not Working',
  'Bedroom outlet stopped working. Tried different appliances, no power.',
  property2_id,
  unit5_id,
  tenant3_id,
  NULL,
  'pending',
  'high',
  'electrical',
  ARRAY[]
),
(
  gen_random_uuid(),
  'Exterior Painting',
  'Exterior paint peeling on south wall. Needs repainting before rainy season.',
  property2_id,
  unit5_id,
  manager2_id,
  NULL,
  'pending',
  'low',
  'structural',
  ARRAY['https://example.com/paint1.jpg', 'https://example.com/paint2.jpg']
),
(
  gen_random_uuid(),
  'Elevator Maintenance',
  'Elevator making unusual sounds between floors 5 and 10.',
  property1_id,
  NULL,
  manager1_id,
  maintenance1_id,
  'assigned',
  'urgent',
  'other',
  ARRAY[]
);

-- ============================================================================
-- INSERT SAMPLE APPROVAL REQUESTS
-- ============================================================================

INSERT INTO approval_requests (id, title, description, type, status, priority, submitted_by, property_id, unit_id, lease_id, attachments) VALUES
(
  gen_random_uuid(),
  'New Manager Assignment',
  'Request to assign Peter Otieno as manager for Nakuru Green Apartments',
  'manager_assignment',
  'pending',
  'medium',
  super_admin_id,
  property4_id,
  NULL,
  NULL,
  '{"peter_cv": "https://example.com/cv.pdf", "reference_letters": ["ref1.pdf", "ref2.pdf"]}'
),
(
  gen_random_uuid(),
  'Deposit Refund - David Omondi',
  'Security deposit refund request for David Omondi moving out of Unit A101',
  'deposit_refund',
  'under_review',
  'high',
  manager1_id,
  property1_id,
  unit1_id,
  lease1_id,
  '{"move_out_inspection": "inspection.pdf", "deductions_breakdown": "breakdown.xlsx"}'
),
(
  gen_random_uuid(),
  'Rent Increase Approval',
  'Proposed 5% rent increase for all units in Kisumu Commercial Plaza',
  'rent_adjustment',
  'approved',
  'medium',
  manager3_id,
  property3_id,
  NULL,
  NULL,
  '{"market_analysis": "analysis.pdf", "tenant_notices": "notices.pdf"}'
),
(
  gen_random_uuid(),
  'New Property Addition',
  'Request to add new commercial property in Thika Road',
  'property_addition',
  'pending',
  'high',
  manager2_id,
  NULL,
  NULL,
  NULL,
  '{"property_docs": "docs.zip", "financial_projection": "projection.xlsx"}'
),
(
  gen_random_uuid(),
  'Lease Termination Request',
  'Early termination request from Grace Mwangi due to job relocation',
  'lease_termination',
  'pending',
  'medium',
  tenant2_id,
  property1_id,
  unit2_id,
  lease2_id,
  '{"relocation_letter": "relocation.pdf", "notice_period": "notice.pdf"}'
);

-- ============================================================================
-- INSERT SAMPLE MANAGER ASSIGNMENTS
-- ============================================================================

INSERT INTO manager_assignments (id, property_id, manager_id, assigned_by, status, permissions, assigned_at, approved_at) VALUES
(
  gen_random_uuid(),
  property1_id,
  manager1_id,
  super_admin_id,
  'approved',
  '{
    "can_add_property": false,
    "can_remove_tenant": true,
    "can_approve_maintenance": true,
    "can_view_financials": true,
    "can_manage_units": true,
    "can_collect_rent": true,
    "can_issue_notices": true
  }',
  '2024-01-01 09:00:00',
  '2024-01-01 10:00:00'
),
(
  gen_random_uuid(),
  property2_id,
  manager2_id,
  super_admin_id,
  'approved',
  '{
    "can_add_property": false,
    "can_remove_tenant": true,
    "can_approve_maintenance": true,
    "can_view_financials": true,
    "can_manage_units": true,
    "can_collect_rent": true,
    "can_issue_notices": true
  }',
  '2024-01-15 09:00:00',
  '2024-01-15 10:00:00'
),
(
  gen_random_uuid(),
  property3_id,
  manager3_id,
  super_admin_id,
  'approved',
  '{
    "can_add_property": false,
    "can_remove_tenant": true,
    "can_approve_maintenance": true,
    "can_view_financials": true,
    "can_manage_units": true,
    "can_collect_rent": true,
    "can_issue_notices": true
  }',
  '2024-02-01 09:00:00',
  '2024-02-01 10:00:00'
),
(
  gen_random_uuid(),
  property4_id,
  manager2_id,
  super_admin_id,
  'pending',
  '{
    "can_add_property": false,
    "can_remove_tenant": true,
    "can_approve_maintenance": true,
    "can_view_financials": true,
    "can_manage_units": true,
    "can_collect_rent": true,
    "can_issue_notices": true
  }',
  '2024-03-01 09:00:00',
  NULL
);

-- ============================================================================
-- INSERT SAMPLE NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url, metadata) VALUES
(
  gen_random_uuid(),
  manager1_id,
  'New Maintenance Request',
  'AC Unit Repair requested by David Omondi',
  'maintenance',
  false,
  '/maintenance/requests/1',
  '{"request_id": "1", "priority": "high"}'
),
(
  gen_random_uuid(),
  tenant1_id,
  'Payment Received',
  'Your rent payment for March has been received. Thank you!',
  'payment',
  true,
  '/payments/receipt/1',
  '{"payment_id": "1", "amount": 45000}'
),
(
  gen_random_uuid(),
  super_admin_id,
  'Approval Required',
  'New manager assignment request requires your approval',
  'approval',
  false,
  '/approvals/requests/1',
  '{"request_id": "1", "type": "manager_assignment"}'
),
(
  gen_random_uuid(),
  tenant2_id,
  'Rent Due Reminder',
  'Your rent payment of KES 35,000 is due in 3 days',
  'warning',
  false,
  '/payments/make-payment',
  '{"amount_due": 35000, "due_date": "2024-03-05"}'
),
(
  gen_random_uuid(),
  manager2_id,
  'New Message',
  'You have received a new message from Duncan Marshel',
  'info',
  false,
  '/messages/1',
  '{"message_id": "1", "sender": "Duncan Marshel"}'
);

-- ============================================================================
-- INSERT SAMPLE AUDIT LOGS
-- ============================================================================

INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES
(
  gen_random_uuid(),
  super_admin_id,
  'login',
  'user',
  super_admin_id::text,
  '{"success": true, "method": "password"}',
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
  gen_random_uuid(),
  manager1_id,
  'property_updated',
  'property',
  property1_id::text,
  '{"changes": {"monthly_rent": 45000}, "previous_values": {"monthly_rent": 43000}}',
  '192.168.1.101',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
),
(
  gen_random_uuid(),
  tenant1_id,
  'payment_made',
  'payment',
  (SELECT id::text FROM payments WHERE tenant_id = tenant1_id ORDER BY created_at DESC LIMIT 1),
  '{"amount": 45000, "method": "mpesa", "reference": "MP123456"}',
  '192.168.1.102',
  'Mobile Safari/537.36'
),
(
  gen_random_uuid(),
  manager2_id,
  'maintenance_assigned',
  'maintenance_request',
  (SELECT id::text FROM maintenance_requests WHERE property_id = property2_id LIMIT 1),
  '{"assigned_to": "James Maina", "priority": "high"}',
  '192.168.1.103',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
),
(
  gen_random_uuid(),
  super_admin_id,
  'approval_processed',
  'approval_request',
  (SELECT id::text FROM approval_requests WHERE status = 'approved' LIMIT 1),
  '{"decision": "approved", "notes": "Market rates support increase"}',
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);

-- ============================================================================
-- INSERT SAMPLE VACATION NOTICES AND DEPOSIT REFUNDS
-- ============================================================================

-- Vacation Notice
INSERT INTO vacation_notices (id, lease_id, notice_date, intended_vacate_date, reason_for_leaving, forwarding_address, forwarding_phone) VALUES
(
  gen_random_uuid(),
  lease1_id,
  '2024-02-15',
  '2024-03-31',
  'relocation',
  '123 New Street, Nairobi',
  '+254711223344'
);

-- Deposit Refund for the vacation notice
INSERT INTO deposit_refunds (
  id, 
  vacation_notice_id, 
  lease_id, 
  original_deposit, 
  deductions, 
  total_deductions, 
  refund_amount, 
  status,
  manager_notes
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vacation_notices WHERE lease_id = lease1_id LIMIT 1),
  lease1_id,
  45000.00,
  '{"wall_damage": 5000, "cleaning": 3000, "late_payment": 2500}',
  10500.00,
  34500.00,
  'pending',
  'Minor damages to living room wall. Professional cleaning required.'
);

END $$;

-- ============================================================================
-- UPDATE PROPERTY OCCUPIED UNITS COUNT
-- ============================================================================

UPDATE properties p
SET occupied_units = (
  SELECT COUNT(DISTINCT u.id)
  FROM units u
  JOIN leases l ON u.id = l.unit_id
  WHERE u.property_id = p.id 
    AND l.status = 'active'
    AND u.status = 'occupied'
)
WHERE EXISTS (
  SELECT 1 FROM units u 
  JOIN leases l ON u.id = l.unit_id 
  WHERE u.property_id = p.id
);

-- ============================================================================
-- CREATE ADDITIONAL TEST DATA FOR ANALYTICS
-- ============================================================================

-- Create some older payments for analytics
INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, period_start, period_end)
SELECT 
  gen_random_uuid(),
  lease_id,
  tenant_id,
  property_id,
  unit_id,
  amount,
  payment_type,
  'completed',
  CASE WHEN random() > 0.5 THEN 'mpesa' ELSE 'bank_transfer' END,
  date '2023-12-01' + (floor(random() * 90) || ' days')::interval,
  date '2023-12-01' + (floor(random() * 90) || ' days')::interval,
  date '2023-12-01' + (floor(random() * 90) || ' days')::interval + interval '1 month'
FROM payments 
WHERE payment_date >= '2024-01-01'
LIMIT 20;

-- Create additional messages for testing
INSERT INTO messages (id, sender_id, receiver_id, property_id, subject, body, is_read, created_at)
SELECT 
  gen_random_uuid(),
  CASE 
    WHEN random() > 0.7 THEN super_admin_id
    WHEN random() > 0.5 THEN manager1_id 
    ELSE tenant1_id
  END,
  CASE 
    WHEN random() > 0.7 THEN manager1_id
    WHEN random() > 0.5 THEN tenant1_id 
    ELSE super_admin_id
  END,
  CASE 
    WHEN random() > 0.5 THEN property1_id 
    ELSE property2_id
  END,
  'Test Message ' || generate_series(1, 10),
  'This is a test message for system testing. Content varies based on random generation.',
  random() > 0.3,
  NOW() - (floor(random() * 30) || ' days')::interval
FROM generate_series(1, 10);

-- ============================================================================
-- VERIFICATION QUERIES (Optional - can be commented out in production)
-- ============================================================================

/*
-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM units) as total_units,
  (SELECT COUNT(*) FROM leases) as total_leases,
  (SELECT COUNT(*) FROM payments) as total_payments,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM maintenance_requests) as total_maintenance_requests,
  (SELECT COUNT(*) FROM approval_requests) as total_approval_requests,
  (SELECT COUNT(*) FROM notifications) as total_notifications;

-- Check property occupancy
SELECT 
  p.name,
  p.total_units,
  p.occupied_units,
  ROUND((p.occupied_units::DECIMAL / p.total_units) * 100, 2) as occupancy_rate
FROM properties p
ORDER BY occupancy_rate DESC;
*/