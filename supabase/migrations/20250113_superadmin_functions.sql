-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_superadmin_dashboard_stats()
RETURNS TABLE (
  total_properties bigint,
  active_managers bigint,
  pending_approvals bigint,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total active properties
    (SELECT COUNT(*) FROM properties WHERE is_active = true) as total_properties,
    
    -- Active property managers
    (SELECT COUNT(*) FROM users WHERE role = 'property_manager' AND is_active = true) as active_managers,
    
    -- Pending approvals
    (SELECT COUNT(*) FROM approvals WHERE status = 'pending') as pending_approvals,
    
    -- Total revenue (last 30 days)
    COALESCE((
      SELECT SUM(amount) 
      FROM payments 
      WHERE status = 'completed' 
      AND payment_date >= NOW() - INTERVAL '30 days'
    ), 0) as total_revenue;
END;
$$ LANGUAGE plpgsql;

-- Function to process approval requests
CREATE OR REPLACE FUNCTION process_approval_request(
  p_approval_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_approval approvals%ROWTYPE;
  v_result json;
BEGIN
  -- Get approval details
  SELECT * INTO v_approval FROM approvals WHERE id = p_approval_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval not found';
  END IF;
  
  -- Update approval status
  UPDATE approvals 
  SET 
    status = CASE 
      WHEN p_action = 'approve' THEN 'approved'
      WHEN p_action = 'reject' THEN 'rejected'
      ELSE 'cancelled'
    END,
    reviewed_at = NOW(),
    review_notes = p_reason,
    reviewed_by = auth.uid()
  WHERE id = p_approval_id
  RETURNING * INTO v_approval;
  
  -- Execute approval-specific logic
  CASE v_approval.approval_type
    WHEN 'property_manager_assignment' THEN
      -- Assign manager to property
      UPDATE properties 
      SET property_manager_id = v_approval.entity_id
      WHERE id = v_approval.related_entity_id;
      
    WHEN 'lease_termination' THEN
      -- Terminate lease
      UPDATE leases 
      SET status = 'terminated', 
          termination_date = NOW()
      WHERE id = v_approval.entity_id;
      
    WHEN 'rent_increase' THEN
      -- Apply rent increase
      UPDATE lease_terms 
      SET rent_amount = (v_approval.details->>'new_rent')::numeric
      WHERE lease_id = v_approval.entity_id;
      
    ELSE
      -- Handle other approval types
      NULL;
  END CASE;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id
  ) VALUES (
    v_approval.requested_by,
    'Approval ' || p_action || 'ed',
    'Your request for ' || v_approval.approval_type || ' has been ' || p_action || 'ed.',
    'approval',
    'approval',
    p_approval_id
  );
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'message', 'Approval ' || p_action || 'ed successfully',
    'approval', row_to_json(v_approval)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get revenue data
CREATE OR REPLACE FUNCTION get_revenue_data(period_type text)
RETURNS TABLE (
  period text,
  revenue numeric,
  properties_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE period_type
      WHEN 'month' THEN TO_CHAR(payment_date, 'YYYY-MM')
      WHEN 'quarter' THEN CONCAT('Q', EXTRACT(QUARTER FROM payment_date), ' ', EXTRACT(YEAR FROM payment_date))
      WHEN 'year' THEN TO_CHAR(payment_date, 'YYYY')
    END as period,
    SUM(amount) as revenue,
    COUNT(DISTINCT property_id) as properties_count
  FROM payments
  WHERE status = 'completed'
    AND payment_date >= NOW() - CASE period_type
      WHEN 'month' THEN INTERVAL '12 months'
      WHEN 'quarter' THEN INTERVAL '4 quarters'
      WHEN 'year' THEN INTERVAL '5 years'
    END
  GROUP BY 
    CASE period_type
      WHEN 'month' THEN TO_CHAR(payment_date, 'YYYY-MM')
      WHEN 'quarter' THEN CONCAT('Q', EXTRACT(QUARTER FROM payment_date), ' ', EXTRACT(YEAR FROM payment_date))
      WHEN 'year' THEN TO_CHAR(payment_date, 'YYYY')
    END
  ORDER BY period DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS json AS $$
DECLARE
  v_health_status json;
  v_unprocessed_payments bigint;
  v_failed_jobs bigint;
  v_database_size text;
BEGIN
  -- Check for unprocessed payments (older than 24 hours)
  SELECT COUNT(*) INTO v_unprocessed_payments 
  FROM payments 
  WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
  
  -- Check for failed background jobs
  SELECT COUNT(*) INTO v_failed_jobs 
  FROM background_jobs 
  WHERE status = 'failed' 
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  -- Get database size
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_database_size;
  
  -- Determine overall status
  v_health_status := json_build_object(
    'status', CASE 
      WHEN v_unprocessed_payments > 10 OR v_failed_jobs > 5 THEN 'degraded'
      ELSE 'healthy'
    END,
    'checks', json_build_object(
      'database', json_build_object(
        'status', 'healthy',
        'size', v_database_size
      ),
      'payments', json_build_object(
        'status', CASE WHEN v_unprocessed_payments > 10 THEN 'warning' ELSE 'healthy' END,
        'unprocessed', v_unprocessed_payments
      ),
      'jobs', json_build_object(
        'status', CASE WHEN v_failed_jobs > 5 THEN 'warning' ELSE 'healthy' END,
        'failed_recently', v_failed_jobs
      )
    ),
    'timestamp', NOW()
  );
  
  RETURN v_health_status;
END;
$$ LANGUAGE plpgsql;