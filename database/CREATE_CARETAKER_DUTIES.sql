-- CREATE_CARETAKER_DUTIES.sql
-- Migration to create caretaker duties/tasks management system
-- This allows property managers to assign duties to caretakers and track reports

-- ============================================================================
-- CARETAKER DUTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.caretaker_duties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assignment info
    caretaker_id UUID NOT NULL REFERENCES public.caretakers(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Duty details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duty_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, cleaning, security, maintenance, inspection, other
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Schedule
    due_date TIMESTAMPTZ,
    recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- daily, weekly, monthly
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed, cancelled, overdue
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Report
    report_submitted BOOLEAN DEFAULT false,
    report_text TEXT,
    report_submitted_at TIMESTAMPTZ,
    report_images TEXT[], -- Array of image URLs
    
    -- Manager feedback
    manager_feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_caretaker_duties_caretaker ON public.caretaker_duties(caretaker_id);
CREATE INDEX IF NOT EXISTS idx_caretaker_duties_property ON public.caretaker_duties(property_id);
CREATE INDEX IF NOT EXISTS idx_caretaker_duties_status ON public.caretaker_duties(status);
CREATE INDEX IF NOT EXISTS idx_caretaker_duties_assigned_by ON public.caretaker_duties(assigned_by);
CREATE INDEX IF NOT EXISTS idx_caretaker_duties_due_date ON public.caretaker_duties(due_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.caretaker_duties ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "super_admin_full_access_duties" ON public.caretaker_duties
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Property managers can manage duties for properties they manage
CREATE POLICY "manager_manage_duties" ON public.caretaker_duties
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.property_manager_assignments pma
            WHERE pma.property_manager_id = auth.uid()
            AND pma.property_id = caretaker_duties.property_id
        )
    );

-- Caretakers can view and update their own duties
CREATE POLICY "caretaker_view_own_duties" ON public.caretaker_duties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.caretakers c
            WHERE c.id = caretaker_duties.caretaker_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "caretaker_update_own_duties" ON public.caretaker_duties
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.caretakers c
            WHERE c.id = caretaker_duties.caretaker_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.caretakers c
            WHERE c.id = caretaker_duties.caretaker_id
            AND c.user_id = auth.uid()
        )
    );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_caretaker_duties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_caretaker_duties_updated_at ON public.caretaker_duties;
CREATE TRIGGER trigger_update_caretaker_duties_updated_at
    BEFORE UPDATE ON public.caretaker_duties
    FOR EACH ROW
    EXECUTE FUNCTION update_caretaker_duties_updated_at();

-- ============================================================================
-- DUTY REPORT TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.duty_report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    duty_type VARCHAR(50) NOT NULL,
    template_fields JSONB NOT NULL DEFAULT '[]', -- Array of field definitions
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default report templates
INSERT INTO public.duty_report_templates (name, duty_type, template_fields, description) VALUES
(
    'General Duty Report',
    'general',
    '[
        {"name": "tasks_completed", "label": "Tasks Completed", "type": "textarea", "required": true},
        {"name": "issues_found", "label": "Issues Found", "type": "textarea", "required": false},
        {"name": "time_spent", "label": "Time Spent (hours)", "type": "number", "required": true},
        {"name": "notes", "label": "Additional Notes", "type": "textarea", "required": false}
    ]'::jsonb,
    'Standard report template for general duties'
),
(
    'Cleaning Report',
    'cleaning',
    '[
        {"name": "areas_cleaned", "label": "Areas Cleaned", "type": "textarea", "required": true},
        {"name": "supplies_used", "label": "Supplies Used", "type": "textarea", "required": false},
        {"name": "supplies_needed", "label": "Supplies Needed", "type": "textarea", "required": false},
        {"name": "condition_rating", "label": "Overall Condition (1-5)", "type": "number", "required": true},
        {"name": "notes", "label": "Additional Notes", "type": "textarea", "required": false}
    ]'::jsonb,
    'Report template for cleaning duties'
),
(
    'Security Report',
    'security',
    '[
        {"name": "patrol_areas", "label": "Areas Patrolled", "type": "textarea", "required": true},
        {"name": "incidents", "label": "Incidents Reported", "type": "textarea", "required": false},
        {"name": "visitor_log", "label": "Visitor Summary", "type": "textarea", "required": false},
        {"name": "equipment_status", "label": "Equipment Status", "type": "textarea", "required": false},
        {"name": "notes", "label": "Additional Notes", "type": "textarea", "required": false}
    ]'::jsonb,
    'Report template for security duties'
),
(
    'Maintenance Inspection Report',
    'inspection',
    '[
        {"name": "areas_inspected", "label": "Areas Inspected", "type": "textarea", "required": true},
        {"name": "issues_identified", "label": "Issues Identified", "type": "textarea", "required": true},
        {"name": "urgent_repairs", "label": "Urgent Repairs Needed", "type": "textarea", "required": false},
        {"name": "recommendations", "label": "Recommendations", "type": "textarea", "required": false},
        {"name": "photos_attached", "label": "Number of Photos Attached", "type": "number", "required": false}
    ]'::jsonb,
    'Report template for property inspections'
)
ON CONFLICT DO NOTHING;

-- RLS for templates
ALTER TABLE public.duty_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_view_templates" ON public.duty_report_templates
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "super_admin_manage_templates" ON public.duty_report_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON public.caretaker_duties TO authenticated;
GRANT ALL ON public.duty_report_templates TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Caretaker duties tables created successfully!';
END $$;
