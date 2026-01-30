-- ============================================================================
-- Manager-Property Relationships and Manager Portal Setup
-- Updated for Integrated Schema
-- ============================================================================

-- 1. Ensure foreign key relationship exists for properties manager
DO $$
BEGIN
    -- Check if column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'manager_id'
    ) THEN
        -- Check if foreign key constraint exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'properties' 
            AND kcu.column_name = 'manager_id'
            AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN
            -- Add foreign key constraint
            ALTER TABLE properties 
            ADD CONSTRAINT fk_properties_manager 
            FOREIGN KEY (manager_id) 
            REFERENCES profiles(id) 
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 2. Create property_managers table for additional manager data (if not exists)
CREATE TABLE IF NOT EXISTS property_managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    license_number TEXT,
    experience_years INTEGER DEFAULT 0,
    specializations TEXT[] DEFAULT '{}',
    portfolio JSONB DEFAULT '{}',
    assigned_properties_count INTEGER DEFAULT 0,
    performance_rating DECIMAL(3,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    contact_phone TEXT,
    contact_email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    address TEXT,
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for property_managers
CREATE INDEX IF NOT EXISTS idx_property_managers_user_id ON property_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_property_managers_is_available ON property_managers(is_available);
CREATE INDEX IF NOT EXISTS idx_property_managers_experience ON property_managers(experience_years DESC);

-- 3. Update manager_assignments table (ensure it exists with proper structure)
DO $$
BEGIN
    -- Check if manager_assignments table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manager_assignments') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE manager_assignments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
            manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            assigned_by UUID REFERENCES profiles(id),
            assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_date TIMESTAMP WITH TIME ZONE,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'transferred')),
            notes TEXT,
            permissions JSONB DEFAULT '{
                "can_manage_tenants": true,
                "can_manage_maintenance": true,
                "can_view_financials": true,
                "can_collect_payments": true,
                "can_issue_notices": true,
                "can_manage_units": true,
                "can_approve_applications": false,
                "can_modify_property": false
            }',
            salary_amount DECIMAL(10,2),
            salary_type TEXT CHECK (salary_type IN ('monthly', 'percentage', 'fixed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(property_id, manager_id) WHERE status = 'active'
        );
        
        -- Create indexes
        CREATE INDEX idx_manager_assignments_property ON manager_assignments(property_id);
        CREATE INDEX idx_manager_assignments_manager ON manager_assignments(manager_id);
        CREATE INDEX idx_manager_assignments_status ON manager_assignments(status);
        CREATE INDEX idx_manager_assignments_assigned_date ON manager_assignments(assignment_date DESC);
        
        RAISE NOTICE 'Created manager_assignments table';
    END IF;
END $$;

-- 4. Create manager_performance_logs table
CREATE TABLE IF NOT EXISTS manager_performance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metrics JSONB NOT NULL,
    rating DECIMAL(3,2),
    review TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance logs
CREATE INDEX IF NOT EXISTS idx_performance_logs_manager ON manager_performance_logs(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_period ON manager_performance_logs(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_logs_rating ON manager_performance_logs(rating DESC);

-- 5. Create manager_tasks table
CREATE TABLE IF NOT EXISTS manager_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT CHECK (task_type IN ('inspection', 'maintenance', 'tenant_meeting', 'payment_collection', 'documentation', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    notes TEXT,
    attachments JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_manager_tasks_manager ON manager_tasks(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_property ON manager_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_status ON manager_tasks(status);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_priority ON manager_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_due_date ON manager_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_type ON manager_tasks(task_type);

-- 6. Create manager_documents table
CREATE TABLE IF NOT EXISTS manager_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT CHECK (document_type IN ('license', 'certification', 'contract', 'id', 'insurance', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_manager_documents_manager ON manager_documents(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_documents_type ON manager_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_manager_documents_verified ON manager_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_manager_documents_expires ON manager_documents(expires_at) WHERE expires_at IS NOT NULL;

-- 7. Create property_visits table
CREATE TABLE IF NOT EXISTS property_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    visit_type TEXT CHECK (visit_type IN ('routine_inspection', 'tenant_issue', 'maintenance_check', 'showing', 'emergency')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    actual_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    duration_minutes INTEGER,
    notes TEXT,
    findings JSONB,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for property visits
CREATE INDEX IF NOT EXISTS idx_property_visits_property ON property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_manager ON property_visits(manager_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_date ON property_visits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_property_visits_status ON property_visits(status);

-- 8. Enable RLS on new tables
ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
-- Property managers can view and update their own profile
CREATE POLICY "Property managers can view own profile" ON property_managers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Property managers can update own profile" ON property_managers
    FOR UPDATE USING (user_id = auth.uid());

-- Super admins can manage all property managers
CREATE POLICY "Super admins can manage property managers" ON property_managers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Property managers can view their own performance logs
CREATE POLICY "Property managers can view own performance" ON manager_performance_logs
    FOR SELECT USING (manager_id = auth.uid());

-- Super admins and assigned property owners can view performance logs
CREATE POLICY "Super admins can view all performance" ON manager_performance_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Property managers can view and manage their own tasks
CREATE POLICY "Property managers can manage own tasks" ON manager_tasks
    FOR ALL USING (manager_id = auth.uid());

-- Super admins can manage all tasks
CREATE POLICY "Super admins can manage all tasks" ON manager_tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Property managers can manage their own documents
CREATE POLICY "Property managers can manage own documents" ON manager_documents
    FOR ALL USING (manager_id = auth.uid());

-- Super admins can view all documents
CREATE POLICY "Super admins can view all documents" ON manager_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Property visits policies
CREATE POLICY "Property managers can view assigned property visits" ON property_visits
    FOR SELECT USING (
        manager_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = property_visits.property_id 
            AND p.manager_id = auth.uid()
        )
    );

CREATE POLICY "Property managers can create visits for assigned properties" ON property_visits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = property_visits.property_id 
            AND p.manager_id = auth.uid()
        )
    );

CREATE POLICY "Super admins can manage all visits" ON property_visits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- 10. Create RPC functions for manager portal

-- Function to get comprehensive manager dashboard stats
CREATE OR REPLACE FUNCTION get_manager_dashboard_stats(p_manager_id UUID)
RETURNS JSON AS $$
DECLARE
    managed_properties INTEGER;
    active_tenants INTEGER;
    pending_rent DECIMAL(10,2);
    maintenance_count INTEGER;
    total_revenue DECIMAL(10,2);
    occupancy_rate DECIMAL(5,2);
    upcoming_tasks INTEGER;
    overdue_tasks INTEGER;
    result JSON;
BEGIN
    -- Get managed properties count (from properties table)
    SELECT COUNT(*) INTO managed_properties 
    FROM properties 
    WHERE manager_id = p_manager_id 
        AND status = 'active';

    -- Get active tenants count
    SELECT COUNT(DISTINCT l.tenant_id) INTO active_tenants
    FROM leases l
    JOIN properties p ON l.property_id = p.id
    WHERE p.manager_id = p_manager_id 
        AND l.status = 'active'
        AND l.start_date <= CURRENT_DATE
        AND l.end_date >= CURRENT_DATE;

    -- Get pending rent (rent due in current month not paid)
    SELECT COALESCE(SUM(l.monthly_rent), 0) INTO pending_rent
    FROM leases l
    JOIN properties p ON l.property_id = p.id
    WHERE p.manager_id = p_manager_id
        AND l.status = 'active'
        AND l.start_date <= CURRENT_DATE
        AND l.end_date >= CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM payments pay
            WHERE pay.tenant_id = l.tenant_id
                AND pay.property_id = l.property_id
                AND pay.status = 'completed'
                AND pay.payment_type = 'rent'
                AND DATE_TRUNC('month', pay.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
        );

    -- Get pending maintenance requests
    SELECT COUNT(*) INTO maintenance_count
    FROM maintenance_requests mr
    JOIN properties p ON mr.property_id = p.id
    WHERE p.manager_id = p_manager_id
        AND mr.status IN ('pending', 'assigned');

    -- Get total monthly revenue from active leases
    SELECT COALESCE(SUM(l.monthly_rent), 0) INTO total_revenue
    FROM leases l
    JOIN properties p ON l.property_id = p.id
    WHERE p.manager_id = p_manager_id
        AND l.status = 'active'
        AND l.start_date <= CURRENT_DATE
        AND l.end_date >= CURRENT_DATE;

    -- Get occupancy rate
    SELECT 
        CASE 
            WHEN SUM(p.total_units) > 0 THEN 
                ROUND((SUM(p.occupied_units)::DECIMAL / SUM(p.total_units)::DECIMAL) * 100, 2)
            ELSE 0
        END INTO occupancy_rate
    FROM properties p
    WHERE p.manager_id = p_manager_id
        AND p.status = 'active';

    -- Get upcoming tasks (due in next 7 days)
    SELECT COUNT(*) INTO upcoming_tasks
    FROM manager_tasks
    WHERE manager_id = p_manager_id
        AND status IN ('pending', 'in_progress')
        AND due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days');

    -- Get overdue tasks
    SELECT COUNT(*) INTO overdue_tasks
    FROM manager_tasks
    WHERE manager_id = p_manager_id
        AND status IN ('pending', 'in_progress')
        AND due_date < CURRENT_DATE;

    -- Build result JSON
    result := json_build_object(
        'managedProperties', managed_properties,
        'activeTenants', active_tenants,
        'pendingRent', pending_rent,
        'maintenanceCount', maintenance_count,
        'totalRevenue', total_revenue,
        'occupancyRate', occupancy_rate,
        'upcomingTasks', upcoming_tasks,
        'overdueTasks', overdue_tasks,
        'properties', (
            SELECT json_agg(json_build_object(
                'id', p.id,
                'name', p.name,
                'type', p.type,
                'address', p.address,
                'city', p.city,
                'totalUnits', p.total_units,
                'occupiedUnits', p.occupied_units,
                'occupancyRate', 
                    CASE 
                        WHEN p.total_units > 0 THEN 
                            ROUND((p.occupied_units::DECIMAL / p.total_units::DECIMAL) * 100, 2)
                        ELSE 0
                    END,
                'monthlyRevenue', COALESCE((
                    SELECT SUM(l.monthly_rent)
                    FROM leases l
                    WHERE l.property_id = p.id
                        AND l.status = 'active'
                        AND l.start_date <= CURRENT_DATE
                        AND l.end_date >= CURRENT_DATE
                ), 0),
                'pendingMaintenance', (
                    SELECT COUNT(*) 
                    FROM maintenance_requests mr
                    WHERE mr.property_id = p.id
                        AND mr.status IN ('pending', 'assigned')
                )
            ))
            FROM properties p
            WHERE p.manager_id = p_manager_id
                AND p.status = 'active'
        ),
        'upcomingTasksList', (
            SELECT json_agg(json_build_object(
                'id', t.id,
                'title', t.title,
                'dueDate', t.due_date,
                'priority', t.priority,
                'propertyName', p.name
            ))
            FROM manager_tasks t
            LEFT JOIN properties p ON t.property_id = p.id
            WHERE t.manager_id = p_manager_id
                AND t.status IN ('pending', 'in_progress')
                AND t.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
            ORDER BY t.due_date
            LIMIT 5
        ),
        'recentActivities', (
            SELECT json_agg(json_build_object(
                'action', al.action,
                'details', al.details,
                'createdAt', al.created_at
            ))
            FROM audit_logs al
            WHERE al.user_id = p_manager_id
            ORDER BY al.created_at DESC
            LIMIT 10
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get manager performance summary
CREATE OR REPLACE FUNCTION get_manager_performance_summary(p_manager_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'propertyCount', COUNT(DISTINCT p.id),
        'leaseRenewals', (
            SELECT COUNT(*)
            FROM leases l
            WHERE l.property_id IN (
                SELECT id FROM properties WHERE manager_id = p_manager_id
            )
            AND l.updated_at BETWEEN p_start_date AND p_end_date
            AND l.status = 'active'
        ),
        'maintenanceCompleted', (
            SELECT COUNT(*)
            FROM maintenance_requests mr
            WHERE mr.property_id IN (
                SELECT id FROM properties WHERE manager_id = p_manager_id
            )
            AND mr.status = 'completed'
            AND mr.completed_at BETWEEN p_start_date AND p_end_date
        ),
        'tenantSatisfaction', (
            SELECT ROUND(AVG(CAST(value->>'rating' AS DECIMAL)), 2)
            FROM (
                SELECT jsonb_array_elements(details->'ratings') as value
                FROM audit_logs al
                WHERE al.user_id = p_manager_id
                AND al.action = 'tenant_feedback'
                AND al.created_at BETWEEN p_start_date AND p_end_date
            ) ratings
            WHERE value->>'rating' IS NOT NULL
        ),
        'rentCollectionRate', (
            SELECT 
                CASE 
                    WHEN total_due > 0 THEN ROUND((collected::DECIMAL / total_due) * 100, 2)
                    ELSE 0
                END
            FROM (
                SELECT 
                    SUM(CASE WHEN pay.status = 'completed' THEN pay.amount ELSE 0 END) as collected,
                    SUM(l.monthly_rent) as total_due
                FROM leases l
                LEFT JOIN payments pay ON l.property_id = pay.property_id 
                    AND DATE_TRUNC('month', pay.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
                    AND pay.payment_type = 'rent'
                WHERE l.property_id IN (
                    SELECT id FROM properties WHERE manager_id = p_manager_id
                )
                AND l.status = 'active'
                AND l.start_date <= CURRENT_DATE
                AND l.end_date >= CURRENT_DATE
            ) stats
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign property to manager
CREATE OR REPLACE FUNCTION assign_property_to_manager(
    p_property_id UUID,
    p_manager_id UUID,
    p_assigned_by UUID,
    p_permissions JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    -- End any existing active assignment for this property
    UPDATE manager_assignments 
    SET status = 'terminated', 
        end_date = NOW(),
        updated_at = NOW()
    WHERE property_id = p_property_id 
        AND status = 'active';

    -- Create new assignment
    INSERT INTO manager_assignments (
        property_id,
        manager_id,
        assigned_by,
        permissions,
        notes
    ) VALUES (
        p_property_id,
        p_manager_id,
        p_assigned_by,
        COALESCE(p_permissions, '{
            "can_manage_tenants": true,
            "can_manage_maintenance": true,
            "can_view_financials": true,
            "can_collect_payments": true,
            "can_issue_notices": true,
            "can_manage_units": true,
            "can_approve_applications": false,
            "can_modify_property": false
        }'::jsonb),
        p_notes
    ) RETURNING id INTO v_assignment_id;

    -- Update property manager_id
    UPDATE properties 
    SET manager_id = p_manager_id,
        updated_at = NOW()
    WHERE id = p_property_id;

    -- Log the assignment
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        p_assigned_by,
        'manager_assignment',
        'property',
        p_property_id::TEXT,
        json_build_object(
            'manager_id', p_manager_id,
            'assignment_id', v_assignment_id,
            'permissions', p_permissions
        )
    );

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get manager's property portfolio
CREATE OR REPLACE FUNCTION get_manager_portfolio(p_manager_id UUID)
RETURNS TABLE(
    property_id UUID,
    property_name TEXT,
    property_type TEXT,
    address TEXT,
    city TEXT,
    total_units INTEGER,
    occupied_units INTEGER,
    occupancy_rate DECIMAL(5,2),
    monthly_revenue DECIMAL(10,2),
    pending_maintenance INTEGER,
    active_leases INTEGER,
    lease_expirations_30d INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.type,
        p.address,
        p.city,
        p.total_units,
        p.occupied_units,
        CASE 
            WHEN p.total_units > 0 THEN 
                ROUND((p.occupied_units::DECIMAL / p.total_units) * 100, 2)
            ELSE 0
        END as occupancy_rate,
        COALESCE((
            SELECT SUM(l.monthly_rent)
            FROM leases l
            WHERE l.property_id = p.id
                AND l.status = 'active'
                AND l.start_date <= CURRENT_DATE
                AND l.end_date >= CURRENT_DATE
        ), 0) as monthly_revenue,
        (
            SELECT COUNT(*)
            FROM maintenance_requests mr
            WHERE mr.property_id = p.id
                AND mr.status IN ('pending', 'assigned')
        ) as pending_maintenance,
        (
            SELECT COUNT(*)
            FROM leases l
            WHERE l.property_id = p.id
                AND l.status = 'active'
                AND l.start_date <= CURRENT_DATE
                AND l.end_date >= CURRENT_DATE
        ) as active_leases,
        (
            SELECT COUNT(*)
            FROM leases l
            WHERE l.property_id = p.id
                AND l.status = 'active'
                AND l.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
        ) as lease_expirations_30d
    FROM properties p
    WHERE p.manager_id = p_manager_id
        AND p.status = 'active'
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Insert sample data for property managers
DO $$
DECLARE
    super_admin_id UUID;
    manager1_id UUID;
    manager2_id UUID;
    manager3_id UUID;
BEGIN
    -- Get IDs from profiles
    SELECT id INTO super_admin_id FROM profiles WHERE email = 'duncanmarshel@gmail.com';
    SELECT id INTO manager1_id FROM profiles WHERE email = 'john.kamau@example.com';
    SELECT id INTO manager2_id FROM profiles WHERE email = 'sarah.wanjiku@example.com';
    SELECT id INTO manager3_id FROM profiles WHERE email = 'peter.otieno@example.com';

    -- Insert property manager profiles
    INSERT INTO property_managers (user_id, license_number, experience_years, specializations, bio) VALUES
    (manager1_id, 'PM-KEN-001234', 5, ARRAY['residential', 'commercial'], 'Experienced property manager with 5+ years in residential and commercial property management.'),
    (manager2_id, 'PM-KEN-001235', 8, ARRAY['luxury', 'vacation_rentals'], 'Specialized in luxury properties and vacation rentals with excellent client satisfaction record.'),
    (manager3_id, 'PM-KEN-001236', 3, ARRAY['residential', 'student_housing'], 'Focused on residential properties and student housing with strong tenant relations skills.')
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        experience_years = EXCLUDED.experience_years,
        specializations = EXCLUDED.specializations,
        bio = EXCLUDED.bio;

    -- Insert manager documents
    INSERT INTO manager_documents (manager_id, document_type, title, file_url, is_verified) VALUES
    (manager1_id, 'license', 'Property Manager License', 'https://example.com/docs/license1.pdf', true),
    (manager2_id, 'license', 'Property Manager License', 'https://example.com/docs/license2.pdf', true),
    (manager3_id, 'license', 'Property Manager License', 'https://example.com/docs/license3.pdf', true),
    (manager1_id, 'certification', 'Certified Property Manager', 'https://example.com/docs/cert1.pdf', true),
    (manager2_id, 'certification', 'Real Estate Broker License', 'https://example.com/docs/cert2.pdf', true)
    ON CONFLICT DO NOTHING;

    -- Insert manager tasks
    INSERT INTO manager_tasks (manager_id, property_id, title, task_type, priority, due_date) 
    SELECT 
        manager1_id,
        id,
        CASE 
            WHEN random() < 0.3 THEN 'Property Inspection'
            WHEN random() < 0.6 THEN 'Tenant Meeting'
            ELSE 'Document Review'
        END,
        CASE 
            WHEN random() < 0.5 THEN 'inspection' 
            ELSE 'tenant_meeting' 
        END,
        CASE 
            WHEN random() < 0.3 THEN 'high'
            WHEN random() < 0.6 THEN 'medium'
            ELSE 'low'
        END,
        CURRENT_DATE + (floor(random() * 30) || ' days')::interval
    FROM properties 
    WHERE manager_id = manager1_id
    LIMIT 5
    ON CONFLICT DO NOTHING;

    -- Insert property visits
    INSERT INTO property_visits (property_id, manager_id, visit_type, scheduled_date, status) 
    SELECT 
        id,
        manager_id,
        CASE 
            WHEN random() < 0.5 THEN 'routine_inspection'
            ELSE 'maintenance_check'
        END,
        CURRENT_DATE + (floor(random() * 7) || ' days')::interval + '10:00:00'::time,
        'scheduled'
    FROM properties 
    WHERE manager_id IS NOT NULL
    LIMIT 3
    ON CONFLICT DO NOTHING;

    -- Insert performance logs
    INSERT INTO manager_performance_logs (manager_id, period_start, period_end, metrics, rating) VALUES
    (manager1_id, '2024-01-01', '2024-01-31', 
        '{"properties_managed": 2, "tenant_satisfaction": 4.5, "rent_collection": 98.2, "maintenance_response": 4.8}', 4.6),
    (manager2_id, '2024-01-01', '2024-01-31', 
        '{"properties_managed": 1, "tenant_satisfaction": 4.8, "rent_collection": 99.5, "maintenance_response": 4.9}', 4.8),
    (manager1_id, '2024-02-01', '2024-02-29', 
        '{"properties_managed": 3, "tenant_satisfaction": 4.7, "rent_collection": 97.8, "maintenance_response": 4.7}', 4.7)
    ON CONFLICT DO NOTHING;

END $$;

-- 12. Update property manager counts
UPDATE property_managers pm
SET assigned_properties_count = (
    SELECT COUNT(*)
    FROM properties p
    WHERE p.manager_id = pm.user_id
        AND p.status = 'active'
)
WHERE EXISTS (
    SELECT 1 FROM properties p WHERE p.manager_id = pm.user_id
);

-- 13. Create triggers for updated_at
CREATE OR REPLACE TRIGGER update_property_managers_updated_at 
    BEFORE UPDATE ON property_managers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_manager_performance_logs_updated_at 
    BEFORE UPDATE ON manager_performance_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_manager_tasks_updated_at 
    BEFORE UPDATE ON manager_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_manager_documents_updated_at 
    BEFORE UPDATE ON manager_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_property_visits_updated_at 
    BEFORE UPDATE ON property_visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Create function to sync manager assignments
CREATE OR REPLACE FUNCTION sync_manager_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- When a property's manager_id is updated, create a manager_assignment record
    IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
        IF NEW.manager_id IS NOT NULL THEN
            PERFORM assign_property_to_manager(
                NEW.id,
                NEW.manager_id,
                NEW.super_admin_id,
                NULL,
                'Auto-assigned via property update'
            );
        ELSE
            -- End any active assignment if manager is removed
            UPDATE manager_assignments 
            SET status = 'terminated', 
                end_date = NOW(),
                updated_at = NOW()
            WHERE property_id = NEW.id 
                AND status = 'active';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property manager updates
CREATE OR REPLACE TRIGGER trigger_sync_manager_assignments
    AFTER UPDATE OF manager_id ON properties
    FOR EACH ROW
    EXECUTE FUNCTION sync_manager_assignments();

-- 15. Create view for manager overview
CREATE OR REPLACE VIEW manager_overview AS
SELECT 
    pm.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    pm.license_number,
    pm.experience_years,
    pm.assigned_properties_count,
    pm.performance_rating,
    pm.is_available,
    (
        SELECT COUNT(*)
        FROM properties prop
        WHERE prop.manager_id = pm.user_id
            AND prop.status = 'active'
    ) as active_properties,
    (
        SELECT SUM(prop.occupied_units)
        FROM properties prop
        WHERE prop.manager_id = pm.user_id
            AND prop.status = 'active'
    ) as total_tenants,
    (
        SELECT ROUND(AVG(mpl.rating), 2)
        FROM manager_performance_logs mpl
        WHERE mpl.manager_id = pm.user_id
    ) as avg_performance_rating
FROM property_managers pm
JOIN profiles p ON pm.user_id = p.id
WHERE p.role = 'property_manager';

-- 16. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_managers_experience_rating ON property_managers(experience_years DESC, performance_rating DESC);
CREATE INDEX IF NOT EXISTS idx_manager_tasks_completion ON manager_tasks(manager_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_manager_documents_expiration ON manager_documents(manager_id, expires_at, is_verified);
CREATE INDEX IF NOT EXISTS idx_property_visits_completion ON property_visits(property_id, status, scheduled_date);

-- 17. Comment on tables
COMMENT ON TABLE property_managers IS 'Extended profile information for property managers including licenses and experience';
COMMENT ON TABLE manager_assignments IS 'History of property assignments to managers with permissions and status';
COMMENT ON TABLE manager_performance_logs IS 'Performance tracking and reviews for property managers';
COMMENT ON TABLE manager_tasks IS 'Tasks and assignments for property managers';
COMMENT ON TABLE manager_documents IS 'Important documents and certifications for property managers';
COMMENT ON TABLE property_visits IS 'Scheduled and completed property visits by managers';

-- ============================================================================
-- END OF MANAGER-PROPERTY RELATIONSHIPS SETUP
-- ============================================================================