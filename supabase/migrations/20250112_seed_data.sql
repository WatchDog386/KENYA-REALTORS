-- ============================================================================
-- Initial Seed Data for Property Management System
-- Updated for Integrated Schema
-- ============================================================================

-- First, let's create the necessary super admin profile if not exists
DO $$
DECLARE
    super_admin_id UUID := '374d7910-06ca-477b-b1af-617c46159bf1'; -- Duncan's ID
    company_email TEXT := 'admin@kenyarealtors.com';
    company_phone TEXT := '+254700000000';
BEGIN

    -- Insert or update super admin profile
    INSERT INTO profiles (id, email, first_name, last_name, phone, role, status) 
    VALUES 
        (super_admin_id, 'duncanmarshel@gmail.com', 'Duncan', 'Marshel', '+254700000001', 'super_admin', 'active')
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'super_admin',
        status = 'active',
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone;

    -- Insert system settings
    INSERT INTO system_settings (category, key, value, description) VALUES
    ('general', 'company_name', '"Kenya Realtors Property Management"', 'Name of the company'),
    ('general', 'company_email', '""' || company_email || '"', 'Company email address'),
    ('general', 'company_phone', '""' || company_phone || '"', 'Company phone number'),
    ('general', 'company_address', '"Westlands, Nairobi, Kenya"', 'Company physical address'),
    ('general', 'company_website', '"https://kenyarealtors.com"', 'Company website'),
    ('general', 'timezone', '"Africa/Nairobi"', 'System timezone'),
    ('general', 'date_format', '"dd/MM/yyyy"', 'Date display format'),
    ('general', 'time_format', '"HH:mm"', 'Time display format'),
    
    ('financial', 'default_currency', '"KES"', 'Default currency code'),
    ('financial', 'currency_symbol', '"KSh"', 'Currency symbol'),
    ('financial', 'default_rent_due_day', '1', 'Default day of month when rent is due'),
    ('financial', 'late_fee_percentage', '5', 'Late fee percentage'),
    ('financial', 'late_fee_grace_period', '5', 'Grace period in days before late fee'),
    ('financial', 'security_deposit_months', '1', 'Security deposit in months of rent'),
    ('financial', 'payment_methods', '["mpesa", "bank_transfer", "credit_card", "cash"]', 'Accepted payment methods'),
    ('financial', 'tax_rate', '16', 'VAT tax rate percentage'),
    
    ('rental', 'default_lease_term', '12', 'Default lease term in months'),
    ('rental', 'auto_renewal_days', '60', 'Days before lease end to prompt renewal'),
    ('rental', 'notice_period_days', '30', 'Required notice period for vacation'),
    ('rental', 'pet_policy', '{"allowed": true, "deposit_required": true, "monthly_fee": 1000}', 'Pet policy settings'),
    ('rental', 'smoking_policy', '{"allowed": false, "designated_areas_only": true}', 'Smoking policy'),
    
    ('maintenance', 'response_time_hours', '24', 'Hours to respond to maintenance requests'),
    ('maintenance', 'emergency_response_time', '2', 'Emergency response time in hours'),
    ('maintenance', 'routine_inspection_frequency', '3', 'Routine inspections per year'),
    ('maintenance', 'preventive_maintenance', 'true', 'Enable preventive maintenance scheduling'),
    
    ('notifications', 'enable_email', 'true', 'Enable email notifications'),
    ('notifications', 'enable_sms', 'true', 'Enable SMS notifications'),
    ('notifications', 'enable_push', 'true', 'Enable push notifications'),
    ('notifications', 'email_from', '"noreply@kenyarealtors.com"', 'Sender email for notifications'),
    ('notifications', 'sms_provider', '"africas_talking"', 'SMS service provider'),
    
    ('security', 'session_timeout_minutes', '30', 'User session timeout'),
    ('security', 'password_expiry_days', '90', 'Password expiration days'),
    ('security', 'max_login_attempts', '5', 'Maximum failed login attempts'),
    ('security', 'lockout_minutes', '30', 'Account lockout duration'),
    ('security', 'require_2fa', 'false', 'Require two-factor authentication'),
    
    ('document', 'lease_template_url', '"https://kenyarealtors.com/templates/lease.pdf"', 'Default lease template'),
    ('document', 'invoice_template_url', '"https://kenyarealtors.com/templates/invoice.pdf"', 'Default invoice template'),
    ('document', 'receipt_template_url', '"https://kenyarealtors.com/templates/receipt.pdf"', 'Default receipt template'),
    
    ('api', 'google_maps_key', '""', 'Google Maps API key'),
    ('api', 'sms_api_key', '""', 'SMS API key'),
    ('api', 'email_api_key', '""', 'Email service API key'),
    
    ('dashboard', 'default_view', '"overview"', 'Default dashboard view'),
    ('dashboard', 'refresh_interval', '5', 'Dashboard auto-refresh interval in minutes'),
    ('dashboard', 'show_metrics', 'true', 'Show performance metrics'),
    ('dashboard', 'show_alerts', 'true', 'Show system alerts')
    ON CONFLICT (category, key) DO UPDATE 
    SET 
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW();

    -- Insert property types configuration
    INSERT INTO system_settings (category, key, value, description) VALUES
    ('property_types', 'apartment', '{"icon": "apartment", "color": "#3B82F6", "default_amenities": ["security", "water", "parking"]}', 'Apartment property type'),
    ('property_types', 'house', '{"icon": "house", "color": "#10B981", "default_amenities": ["garden", "parking", "security"]}', 'House property type'),
    ('property_types', 'commercial', '{"icon": "business", "color": "#8B5CF6", "default_amenities": ["parking", "security", "elevator"]}', 'Commercial property type'),
    ('property_types', 'condo', '{"icon": "apartment", "color": "#F59E0B", "default_amenities": ["security", "pool", "gym"]}', 'Condominium property type'),
    ('property_types', 'townhouse', '{"icon": "home", "color": "#EF4444", "default_amenities": ["parking", "garden", "security"]}', 'Townhouse property type')
    ON CONFLICT (category, key) DO NOTHING;

    -- Insert maintenance categories
    INSERT INTO system_settings (category, key, value, description) VALUES
    ('maintenance_categories', 'plumbing', '{"icon": "plumbing", "priority": "medium", "average_cost": 5000}', 'Plumbing maintenance'),
    ('maintenance_categories', 'electrical', '{"icon": "electrical_services", "priority": "high", "average_cost": 8000}', 'Electrical maintenance'),
    ('maintenance_categories', 'appliance', '{"icon": "kitchen", "priority": "medium", "average_cost": 15000}', 'Appliance repair'),
    ('maintenance_categories', 'structural', '{"icon": "construction", "priority": "low", "average_cost": 25000}', 'Structural repairs'),
    ('maintenance_categories', 'heating', '{"icon": "ac_unit", "priority": "high", "average_cost": 12000}', 'Heating and cooling'),
    ('maintenance_categories', 'pest_control', '{"icon": "bug_report", "priority": "low", "average_cost": 7000}', 'Pest control'),
    ('maintenance_categories', 'cleaning', '{"icon": "cleaning_services", "priority": "low", "average_cost": 3000}', 'Cleaning services'),
    ('maintenance_categories', 'other', '{"icon": "handyman", "priority": "medium", "average_cost": 10000}', 'Other maintenance')
    ON CONFLICT (category, key) DO NOTHING;

    -- Insert approval request types
    INSERT INTO system_settings (category, key, value, description) VALUES
    ('approval_types', 'manager_assignment', '{"requires_property": true, "requires_documents": true, "approval_levels": 2}', 'Manager assignment requests'),
    ('approval_types', 'deposit_refund', '{"requires_lease": true, "requires_inspection": true, "approval_levels": 2}', 'Deposit refund requests'),
    ('approval_types', 'property_addition', '{"requires_documents": true, "requires_financials": true, "approval_levels": 1}', 'New property addition'),
    ('approval_types', 'rent_adjustment', '{"requires_justification": true, "requires_notice": true, "approval_levels": 1}', 'Rent adjustment requests'),
    ('approval_types', 'lease_termination', '{"requires_notice": true, "requires_reason": true, "approval_levels": 1}', 'Lease termination requests'),
    ('approval_types', 'major_repair', '{"requires_quotes": true, "budget_limit": 50000, "approval_levels": 2}', 'Major repair requests'),
    ('approval_types', 'contract_signing', '{"requires_review": true, "requires_verification": true, "approval_levels": 1}', 'Contract signing authorization')
    ON CONFLICT (category, key) DO NOTHING;

    -- Insert notification templates
    INSERT INTO system_settings (category, key, value, description) VALUES
    ('notification_templates', 'welcome_tenant', '{"subject": "Welcome to {property_name}", "body": "Dear {tenant_name}, welcome to {property_name}. Your unit {unit_number} is ready for move-in.", "type": "email"}', 'Welcome email for new tenants'),
    ('notification_templates', 'rent_due_reminder', '{"subject": "Rent Due Reminder", "body": "Dear {tenant_name}, your rent of {amount} for {property_name} is due on {due_date}.", "type": "sms"}', 'Rent due reminder'),
    ('notification_templates', 'rent_overdue', '{"subject": "Rent Overdue Notice", "body": "Dear {tenant_name}, your rent for {property_name} is overdue. Late fee of {late_fee} has been applied.", "type": "sms,email"}', 'Rent overdue notice'),
    ('notification_templates', 'maintenance_scheduled', '{"subject": "Maintenance Scheduled", "body": "Maintenance has been scheduled for {property_name} on {date}. Please ensure access.", "type": "sms"}', 'Maintenance scheduling notice'),
    ('notification_templates', 'lease_renewal', '{"subject": "Lease Renewal Reminder", "body": "Dear {tenant_name}, your lease for {property_name} expires on {end_date}. Please contact us to renew.", "type": "email"}', 'Lease renewal reminder'),
    ('notification_templates', 'vacation_notice', '{"subject": "Vacation Notice Received", "body": "Vacation notice received for {property_name}. Move-out inspection scheduled for {inspection_date}.", "type": "email"}', 'Vacation notice confirmation'),
    ('notification_templates', 'payment_confirmation', '{"subject": "Payment Received", "body": "Dear {tenant_name}, payment of {amount} for {property_name} has been received. Thank you!", "type": "email,sms"}', 'Payment confirmation'),
    ('notification_templates', 'system_alert', '{"subject": "System Alert: {alert_type}", "body": "System alert: {alert_message}. Please check the dashboard for details.", "type": "email"}', 'System alerts')
    ON CONFLICT (category, key) DO NOTHING;

    -- Insert sample properties (for demonstration)
    INSERT INTO properties (id, name, address, city, state, country, type, status, total_units, occupied_units, monthly_rent, manager_id, super_admin_id, images, amenities, description) VALUES
    (
        gen_random_uuid(),
        'Sunset Villas Apartments',
        '123 Sunset Road, Westlands',
        'Nairobi',
        'Nairobi County',
        'Kenya',
        'apartment',
        'active',
        24,
        18,
        45000.00,
        (SELECT id FROM profiles WHERE email = 'john.kamau@example.com'),
        super_admin_id,
        ARRAY[
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
        ],
        ARRAY['swimming_pool', 'gym', 'parking', '24/7_security', 'elevator', 'garden', 'playground', 'cctv'],
        'Premium apartment complex in Westlands with modern amenities and excellent security. Close to shopping centers and business districts.'
    ),
    (
        gen_random_uuid(),
        'Green View Gardens',
        '456 Green Street, Karen',
        'Nairobi',
        'Nairobi County',
        'Kenya',
        'house',
        'active',
        12,
        9,
        120000.00,
        (SELECT id FROM profiles WHERE email = 'sarah.wanjiku@example.com'),
        super_admin_id,
        ARRAY[
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&auto=format&fit=crop'
        ],
        ARRAY['garden', 'parking', 'security', 'maid_quarters', 'borehole', 'backup_generator'],
        'Luxury houses in Karen with spacious gardens and premium finishes. Perfect for families seeking privacy and tranquility.'
    ),
    (
        gen_random_uuid(),
        'Mombasa Beach Villas',
        '789 Beach Road, Nyali',
        'Mombasa',
        'Mombasa County',
        'Kenya',
        'house',
        'active',
        8,
        6,
        180000.00,
        (SELECT id FROM profiles WHERE email = 'peter.otieno@example.com'),
        super_admin_id,
        ARRAY[
            'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
        ],
        ARRAY['beach_access', 'private_pool', 'garden', 'security', 'maid_service', 'wifi', 'entertainment_system'],
        'Exclusive beachfront villas with private pools and direct beach access. Perfect for vacation rentals or permanent residence.'
    ),
    (
        gen_random_uuid(),
        'Kisumu Business Plaza',
        '321 Oginga Odinga Road, CBD',
        'Kisumu',
        'Kisumu County',
        'Kenya',
        'commercial',
        'active',
        16,
        12,
        85000.00,
        (SELECT id FROM profiles WHERE email = 'john.kamau@example.com'),
        super_admin_id,
        ARRAY[
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1487956382158-bb926046304a?w=800&auto=format&fit=crop'
        ],
        ARRAY['parking', '24/7_security', 'elevator', 'backup_generator', 'wifi', 'meeting_rooms', 'cctv'],
        'Modern commercial plaza in Kisumu CBD ideal for offices, retail spaces, and professional services. Prime location with excellent amenities.'
    ),
    (
        gen_random_uuid(),
        'Nakuru Valley Apartments',
        '654 Valley Road, Nakuru',
        'Nakuru',
        'Nakuru County',
        'Kenya',
        'apartment',
        'available',
        20,
        15,
        28000.00,
        (SELECT id FROM profiles WHERE email = 'sarah.wanjiku@example.com'),
        super_admin_id,
        ARRAY[
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
        ],
        ARRAY['parking', 'security', 'water_backup', 'garden', 'playground'],
        'Affordable apartments in a quiet suburban neighborhood with beautiful valley views. Perfect for young professionals and small families.'
    )
    RETURNING id INTO property1_id, id INTO property2_id, id INTO property3_id, id INTO property4_id, id INTO property5_id;

    -- Insert sample units for properties
    -- Property 1: Sunset Villas Apartments
    INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
    (gen_random_uuid(), property1_id, 'A101', '2br', 2, 2.0, 45000.00, 45000.00, 950, 'occupied', ARRAY['balcony', 'ac', 'fitted_kitchen'], '{"view": "pool", "floor": 1}'),
    (gen_random_uuid(), property1_id, 'A102', '3br', 3, 2.0, 65000.00, 65000.00, 1200, 'occupied', ARRAY['balcony', 'ac', 'fitted_kitchen', 'storage'], '{"view": "garden", "floor": 1}'),
    (gen_random_uuid(), property1_id, 'A201', '1br', 1, 1.0, 35000.00, 35000.00, 650, 'vacant', ARRAY['balcony', 'ac'], '{"view": "street", "floor": 2}'),
    (gen_random_uuid(), property1_id, 'A202', '2br', 2, 1.5, 45000.00, 45000.00, 900, 'occupied', ARRAY['balcony', 'ac', 'fitted_kitchen'], '{"view": "pool", "floor": 2}'),
    (gen_random_uuid(), property1_id, 'B101', 'studio', 0, 1.0, 25000.00, 25000.00, 450, 'occupied', ARRAY['ac', 'kitchenette'], '{"view": "garden", "floor": 1}');

    -- Property 2: Green View Gardens
    INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
    (gen_random_uuid(), property2_id, 'Villa 1', '4br', 4, 4.0, 120000.00, 120000.00, 2800, 'occupied', ARRAY['garden', 'parking_2', 'maid_room'], '{"has_pool": false, "plot_size": "1/4 acre"}'),
    (gen_random_uuid(), property2_id, 'Villa 2', '5br', 5, 4.5, 150000.00, 150000.00, 3200, 'occupied', ARRAY['pool', 'garden', 'parking_3', 'maid_room'], '{"has_pool": true, "plot_size": "1/2 acre"}'),
    (gen_random_uuid(), property2_id, 'Villa 3', '3br', 3, 3.0, 90000.00, 90000.00, 2200, 'vacant', ARRAY['garden', 'parking_2'], '{"has_pool": false, "plot_size": "1/8 acre"}');

    -- Property 3: Mombasa Beach Villas
    INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
    (gen_random_uuid(), property3_id, 'Beach House 1', '6br', 6, 5.0, 250000.00, 250000.00, 4500, 'occupied', ARRAY['private_beach', 'pool', 'garden', 'parking_4'], '{"beach_front": true, "has_boat_dock": true}'),
    (gen_random_uuid(), property3_id, 'Beach House 2', '4br', 4, 4.0, 180000.00, 180000.00, 3200, 'occupied', ARRAY['beach_access', 'pool', 'garden'], '{"beach_front": false, "ocean_view": true}');

    -- Property 4: Kisumu Business Plaza
    INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
    (gen_random_uuid(), property4_id, 'Suite 101', 'office', 0, 2.0, 85000.00, 85000.00, 1200, 'occupied', ARRAY['ac', 'store_front', 'private_washroom'], '{"floor": "ground", "type": "retail"}'),
    (gen_random_uuid(), property4_id, 'Suite 201', 'office', 0, 1.0, 65000.00, 65000.00, 900, 'occupied', ARRAY['ac', 'kitchenette'], '{"floor": 2, "type": "office"}'),
    (gen_random_uuid(), property4_id, 'Suite 202', 'office', 0, 1.0, 65000.00, 65000.00, 900, 'vacant', ARRAY['ac'], '{"floor": 2, "type": "office"}'),
    (gen_random_uuid(), property4_id, 'Suite 301', 'office', 0, 2.0, 95000.00, 95000.00, 1500, 'occupied', ARRAY['ac', 'boardroom'], '{"floor": 3, "type": "executive"}');

    -- Property 5: Nakuru Valley Apartments
    INSERT INTO units (id, property_id, unit_number, unit_type, bedrooms, bathrooms, rent_amount, deposit_amount, square_feet, status, amenities, features) VALUES
    (gen_random_uuid(), property5_id, 'NV101', '1br', 1, 1.0, 28000.00, 28000.00, 600, 'occupied', ARRAY['balcony'], '{"view": "valley", "floor": 1}'),
    (gen_random_uuid(), property5_id, 'NV102', '2br', 2, 1.5, 38000.00, 38000.00, 850, 'occupied', ARRAY['balcony', 'storage'], '{"view": "valley", "floor": 1}'),
    (gen_random_uuid(), property5_id, 'NV201', '1br', 1, 1.0, 28000.00, 28000.00, 600, 'vacant', ARRAY['balcony'], '{"view": "street", "floor": 2}'),
    (gen_random_uuid(), property5_id, 'NV202', '2br', 2, 1.5, 38000.00, 38000.00, 850, 'occupied', ARRAY['balcony'], '{"view": "valley", "floor": 2}');

    -- Insert sample leases
    INSERT INTO leases (id, property_id, unit_id, tenant_id, start_date, end_date, monthly_rent, security_deposit, status, utilities_included, pets_allowed) 
    SELECT 
        gen_random_uuid(),
        u.property_id,
        u.id,
        p.id,
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '9 months',
        u.rent_amount,
        u.deposit_amount,
        'active',
        '{"water": true, "electricity": false, "gas": false, "internet": false}',
        CASE WHEN random() > 0.5 THEN true ELSE false END
    FROM units u
    CROSS JOIN LATERAL (
        SELECT id FROM profiles 
        WHERE role = 'tenant' 
        LIMIT 1
    ) p
    WHERE u.status = 'occupied'
    LIMIT 8
    ON CONFLICT DO NOTHING;

    -- Insert sample payments
    INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, payment_date, due_date, period_start, period_end)
    SELECT 
        gen_random_uuid(),
        l.id,
        l.tenant_id,
        l.property_id,
        l.unit_id,
        l.monthly_rent,
        'rent',
        'completed',
        CASE 
            WHEN random() > 0.7 THEN 'mpesa'
            WHEN random() > 0.4 THEN 'bank_transfer'
            ELSE 'credit_card'
        END,
        CURRENT_DATE - INTERVAL '10 days',
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days',
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month',
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'
    FROM leases l
    WHERE l.status = 'active'
    LIMIT 5
    ON CONFLICT DO NOTHING;

    -- Insert some pending payments
    INSERT INTO payments (id, lease_id, tenant_id, property_id, unit_id, amount, payment_type, status, payment_method, due_date, period_start, period_end)
    SELECT 
        gen_random_uuid(),
        l.id,
        l.tenant_id,
        l.property_id,
        l.unit_id,
        l.monthly_rent,
        'rent',
        'pending',
        NULL,
        CURRENT_DATE + INTERVAL '5 days',
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
    FROM leases l
    WHERE l.status = 'active'
    LIMIT 3
    ON CONFLICT DO NOTHING;

    -- Insert sample announcements
    INSERT INTO messages (id, sender_id, receiver_id, subject, body, message_type, priority, created_at) VALUES
    (
        gen_random_uuid(),
        super_admin_id,
        NULL, -- Broadcast to all
        'Welcome to Kenya Realtors Property Management System',
        'We are excited to launch our new property management platform. This system will streamline all property management activities including rent collection, maintenance requests, and tenant communication. Please explore the features and let us know if you need any assistance.',
        'announcement',
        'normal',
        CURRENT_DATE - INTERVAL '5 days'
    ),
    (
        gen_random_uuid(),
        super_admin_id,
        NULL, -- Broadcast to all
        'Quarterly Maintenance Schedule',
        'Quarterly property maintenance will be conducted from 15th to 20th of this month. Please ensure access to your units during business hours. For any specific timing requests, contact your property manager.',
        'announcement',
        'high',
        CURRENT_DATE - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        super_admin_id,
        NULL, -- Broadcast to all
        'New Payment Portal Live',
        'Our new online payment portal is now live. You can now pay rent, deposits, and other fees online through M-Pesa, bank transfer, or credit card. Login to your tenant portal to access the new payment system.',
        'announcement',
        'normal',
        CURRENT_DATE
    ),
    (
        gen_random_uuid(),
        super_admin_id,
        NULL, -- Broadcast to managers
        'Manager Training Session',
        'Mandatory training session for all property managers on Friday at 10 AM. We will cover new features in the system and compliance updates.',
        'announcement',
        'high',
        CURRENT_DATE - INTERVAL '1 day'
    );

    -- Insert sample notifications for users
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM profiles WHERE email = 'david.omondi@example.com'),
        'Rent Payment Due',
        'Your rent payment of KSh 45,000 is due in 3 days. Please make payment to avoid late fees.',
        'payment',
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM profiles WHERE email = 'john.kamau@example.com'),
        'New Maintenance Request',
        'New maintenance request received for Sunset Villas Apartments - Unit A101. Please review and assign.',
        'maintenance',
        false,
        NOW()
    ),
    (
        gen_random_uuid(),
        super_admin_id,
        'System Update Available',
        'A new system update is available. Please schedule maintenance window for installation.',
        'system',
        true,
        NOW() - INTERVAL '2 hours'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM profiles WHERE email = 'grace.mwangi@example.com'),
        'Lease Renewal Reminder',
        'Your lease for Green View Gardens expires in 45 days. Please contact your manager to discuss renewal options.',
        'lease',
        false,
        NOW() - INTERVAL '1 day'
    );

    -- Insert sample audit logs
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) VALUES
    (
        gen_random_uuid(),
        super_admin_id,
        'system_initialized',
        'system',
        'setup',
        '{"version": "1.0.0", "timestamp": "' || NOW()::text || '"}',
        '192.168.1.1',
        'PostgreSQL/15',
        NOW() - INTERVAL '7 days'
    ),
    (
        gen_random_uuid(),
        super_admin_id,
        'user_login',
        'user',
        super_admin_id::text,
        '{"success": true, "method": "password", "location": "Nairobi"}',
        '41.90.120.45',
        'Chrome/120.0.0.0',
        NOW() - INTERVAL '2 hours'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM profiles WHERE email = 'john.kamau@example.com'),
        'property_updated',
        'property',
        property1_id::text,
        '{"changes": {"monthly_rent": 45000}, "reason": "annual_adjustment"}',
        '41.90.120.46',
        'Safari/17.0',
        NOW() - INTERVAL '1 day'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM profiles WHERE email = 'david.omondi@example.com'),
        'payment_made',
        'payment',
        (SELECT id::text FROM payments LIMIT 1),
        '{"amount": 45000, "method": "mpesa", "reference": "MP123456789"}',
        '41.90.120.47',
        'Mobile Safari',
        NOW() - INTERVAL '3 days'
    );

    -- Update property occupied units count
    UPDATE properties p
    SET occupied_units = (
        SELECT COUNT(*)
        FROM units u
        WHERE u.property_id = p.id
            AND u.status = 'occupied'
    )
    WHERE id IN (property1_id, property2_id, property3_id, property4_id, property5_id);

    -- Log completion
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details) VALUES
    (
        gen_random_uuid(),
        super_admin_id,
        'seed_data_completed',
        'system',
        'database',
        '{"tables_initialized": ["profiles", "properties", "units", "leases", "payments", "system_settings", "notifications", "audit_logs"], "timestamp": "' || NOW()::text || '"}'
    );

END $$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to anon users (for auth and public APIs)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE profiles, properties, announcements TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Grant service role full access (for server-side operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- Create Views for Public Access
-- ============================================================================

CREATE OR REPLACE VIEW public_properties AS
SELECT 
    id,
    name,
    address,
    city,
    state,
    country,
    type,
    status,
    total_units,
    occupied_units,
    monthly_rent,
    images,
    amenities,
    description,
    created_at
FROM properties 
WHERE status IN ('available', 'active')
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW available_units AS
SELECT 
    u.id,
    u.property_id,
    p.name as property_name,
    u.unit_number,
    u.unit_type,
    u.bedrooms,
    u.bathrooms,
    u.rent_amount,
    u.deposit_amount,
    u.square_feet,
    u.amenities,
    u.features,
    p.address,
    p.city,
    p.state,
    p.images as property_images,
    p.amenities as property_amenities,
    u.availability_date,
    u.created_at
FROM units u
JOIN properties p ON u.property_id = p.id
WHERE u.status = 'vacant'
    AND p.status IN ('available', 'active')
ORDER BY u.created_at DESC;

-- ============================================================================
-- Verification Query (Optional)
-- ============================================================================

/*
-- Check seed data
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'super_admin') as super_admins,
    (SELECT COUNT(*) FROM profiles WHERE role = 'property_manager') as property_managers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'tenant') as tenants,
    (SELECT COUNT(*) FROM properties) as total_properties,
    (SELECT COUNT(*) FROM units) as total_units,
    (SELECT COUNT(*) FROM units WHERE status = 'occupied') as occupied_units,
    (SELECT COUNT(*) FROM units WHERE status = 'vacant') as vacant_units,
    (SELECT COUNT(*) FROM leases WHERE status = 'active') as active_leases,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
    (SELECT COUNT(*) FROM system_settings) as system_settings,
    (SELECT COUNT(*) FROM notifications) as notifications;
*/

-- ============================================================================
-- Seed Data Completion Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed data initialization completed successfully!';
    RAISE NOTICE 'Super Admin: duncanmarshel@gmail.com';
    RAISE NOTICE 'Property Managers: john.kamau@example.com, sarah.wanjiku@example.com, peter.otieno@example.com';
    RAISE NOTICE 'Tenants: david.omondi@example.com, grace.mwangi@example.com, brian.kiprono@example.com, faith.akinyi@example.com';
    RAISE NOTICE 'Sample Properties: 5 properties with units and leases created';
    RAISE NOTICE 'System Settings: Configured with default values';
END $$;

-- ============================================================================
-- END OF INITIAL SEED DATA
-- ============================================================================