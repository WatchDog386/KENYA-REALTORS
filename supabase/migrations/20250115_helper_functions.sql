-- ============================================
-- HELPER FUNCTIONS AND UTILITIES - January 15, 2025
-- ============================================

-- ============================================
-- 1. FUNCTION: Get user role
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    RETURN COALESCE(user_role, 'tenant');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 2. FUNCTION: Check if user has permission
-- ============================================
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    -- Super admin has all permissions
    IF user_role = 'super_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permissions based on role
    CASE permission
        WHEN 'view_properties' THEN
            RETURN user_role IN ('super_admin', 'property_manager', 'owner');
        WHEN 'manage_properties' THEN
            RETURN user_role IN ('super_admin', 'property_manager', 'owner');
        WHEN 'manage_tenants' THEN
            RETURN user_role IN ('super_admin', 'property_manager');
        WHEN 'view_payments' THEN
            RETURN user_role IN ('super_admin', 'property_manager', 'owner', 'tenant');
        WHEN 'manage_leases' THEN
            RETURN user_role IN ('super_admin', 'property_manager', 'owner');
        WHEN 'manage_maintenance' THEN
            RETURN user_role IN ('super_admin', 'property_manager', 'maintenance');
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 3. FUNCTION: Get manager dashboard stats
-- ============================================
CREATE OR REPLACE FUNCTION get_manager_dashboard_stats(manager_id UUID)
RETURNS TABLE (
    managed_properties INTEGER,
    active_tenants INTEGER,
    pending_maintenance INTEGER,
    recent_payments NUMERIC,
    total_revenue NUMERIC,
    occupancy_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id)::INTEGER as managed_properties,
        COUNT(DISTINCT l.tenant_id)::INTEGER as active_tenants,
        COUNT(DISTINCT CASE WHEN mr.status IN ('pending', 'assigned') THEN mr.id END)::INTEGER as pending_maintenance,
        COALESCE(SUM(CASE WHEN py.status = 'completed' THEN py.amount ELSE 0 END), 0) as recent_payments,
        COALESCE(SUM(p.monthly_rent * p.occupied_units), 0) as total_revenue,
        CASE 
            WHEN COUNT(DISTINCT p.id) = 0 THEN 0
            ELSE (SUM(p.occupied_units)::NUMERIC / NULLIF(SUM(p.total_units), 0)) * 100
        END as occupancy_rate
    FROM properties p
    LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
    LEFT JOIN maintenance_requests mr ON p.id = mr.property_id
    LEFT JOIN payments py ON l.id = py.lease_id
    WHERE p.manager_id = manager_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 4. FUNCTION: Get tenant dashboard stats
-- ============================================
CREATE OR REPLACE FUNCTION get_tenant_dashboard_stats(tenant_id UUID)
RETURNS TABLE (
    active_leases INTEGER,
    due_payments NUMERIC,
    paid_payments NUMERIC,
    pending_maintenance INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT l.id)::INTEGER as active_leases,
        COALESCE(SUM(CASE WHEN py.status = 'pending' AND py.due_date <= CURRENT_DATE THEN py.amount ELSE 0 END), 0) as due_payments,
        COALESCE(SUM(CASE WHEN py.status = 'completed' THEN py.amount ELSE 0 END), 0) as paid_payments,
        COUNT(DISTINCT CASE WHEN mr.status IN ('pending', 'assigned', 'in_progress') THEN mr.id END)::INTEGER as pending_maintenance
    FROM leases l
    LEFT JOIN payments py ON l.id = py.lease_id
    LEFT JOIN maintenance_requests mr ON l.property_id = mr.property_id
    WHERE l.tenant_id = tenant_id AND l.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 5. FUNCTION: Update last login timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_login_at = NOW() WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE UPDATE TRIGGERS FOR updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leases_updated_at ON leases;
CREATE TRIGGER update_leases_updated_at
    BEFORE UPDATE ON leases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_requests_updated_at ON maintenance_requests;
CREATE TRIGGER update_maintenance_requests_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_manager_assignments_updated_at ON manager_assignments;
CREATE TRIGGER update_manager_assignments_updated_at
    BEFORE UPDATE ON manager_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active leases with tenant and property info
CREATE OR REPLACE VIEW active_leases AS
SELECT
    l.id,
    l.tenant_id,
    p.id as property_id,
    p.name as property_name,
    pr.full_name as tenant_name,
    pr.email as tenant_email,
    l.start_date,
    l.end_date,
    l.monthly_rent,
    l.status,
    EXTRACT(MONTH FROM AGE(l.end_date)) as months_remaining
FROM leases l
JOIN properties p ON l.property_id = p.id
JOIN profiles pr ON l.tenant_id = pr.id
WHERE l.status = 'active';

-- View: Overdue payments
CREATE OR REPLACE VIEW overdue_payments AS
SELECT
    py.id,
    py.lease_id,
    l.tenant_id,
    pr.full_name as tenant_name,
    p.name as property_name,
    py.amount,
    py.due_date,
    CURRENT_DATE - py.due_date as days_overdue,
    py.status
FROM payments py
JOIN leases l ON py.lease_id = l.id
JOIN properties p ON l.property_id = p.id
JOIN profiles pr ON l.tenant_id = pr.id
WHERE py.status IN ('pending', 'overdue')
AND py.due_date < CURRENT_DATE;

-- View: Property occupancy summary
CREATE OR REPLACE VIEW property_occupancy_summary AS
SELECT
    p.id,
    p.name,
    p.total_units,
    p.occupied_units,
    (p.occupied_units::NUMERIC / NULLIF(p.total_units, 0)) * 100 as occupancy_rate,
    COUNT(DISTINCT l.tenant_id) as active_tenants,
    SUM(l.monthly_rent) as total_monthly_revenue
FROM properties p
LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
GROUP BY p.id, p.name, p.total_units, p.occupied_units;

-- ============================================
-- 9. COMPLETION
-- ============================================
-- Helper functions and utilities created successfully!
