-- Create maintenance_completion_reports table
-- This tracks completion reports submitted by technicians with before/during/after images

CREATE TABLE IF NOT EXISTS maintenance_completion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
  
  -- Report content
  notes TEXT,
  hours_spent DECIMAL(5, 2),
  materials_used TEXT,
  
  -- Images
  before_work_image_url TEXT,      -- Image before starting repair
  in_progress_image_url TEXT,      -- Image during repair
  after_repair_image_url TEXT,     -- Image after repair completed
  
  -- Status & dates
  status TEXT DEFAULT 'draft',     -- draft, submitted, approved, rejected
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  
  -- For accounting approval
  cost_estimate DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  cost_approved_at TIMESTAMP,
  
  -- Manager notes
  manager_notes TEXT,
  accountant_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_completion_reports_maintenance_id ON maintenance_completion_reports(maintenance_request_id);
CREATE INDEX idx_completion_reports_technician_id ON maintenance_completion_reports(technician_id);
CREATE INDEX idx_completion_reports_property_id ON maintenance_completion_reports(property_id);
CREATE INDEX idx_completion_reports_status ON maintenance_completion_reports(status);

-- Add RLS policies for maintenance_completion_reports table

-- Technician can view and edit their own completion reports
CREATE POLICY "Technicians can manage own completion reports" ON maintenance_completion_reports
  USING (technician_id IN (
    SELECT id FROM technicians WHERE user_id = auth.uid()
  ));

-- Property managers can view completion reports for their properties
CREATE POLICY "Property managers can view completion reports" ON maintenance_completion_reports
  USING (property_id IN (
    SELECT pm.property_id FROM property_manager_assignments pm
    WHERE pm.property_manager_id = auth.uid()
  ));

-- Accountants can view all completion reports for approval
CREATE POLICY "Accountants can view completion reports" ON maintenance_completion_reports
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'accountant'
    )
  );

-- Super admins can view all completion reports
CREATE POLICY "Super admins can view completion reports" ON maintenance_completion_reports
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Enable RLS
ALTER TABLE maintenance_completion_reports ENABLE ROW LEVEL SECURITY;

-- Update maintenance_requests table to add completion_report_id reference
ALTER TABLE maintenance_requests 
ADD COLUMN completion_report_id UUID REFERENCES maintenance_completion_reports(id) ON DELETE SET NULL,
ADD COLUMN completion_status TEXT DEFAULT NULL;  -- 'pending', 'approved', 'rejected'

-- Create composite index for faster lookups
CREATE INDEX idx_maintenance_requests_completion_status ON maintenance_requests(completion_status);

-- Update property_manager_assignments to include accounting role capability
-- (Already exists, just documenting for reference)
