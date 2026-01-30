-- Fix get_manager_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_manager_dashboard_stats(manager_id UUID)
RETURNS JSON AS $$
DECLARE
  managed_properties INTEGER;
  active_tenants INTEGER;
  pending_rent DECIMAL(10,2);
  maintenance_count INTEGER;
  total_revenue DECIMAL(10,2);
  occupancy_rate DECIMAL(5,2);
  result JSON;
  v_manager_id ALIAS FOR manager_id;
BEGIN
  SELECT COUNT(*) INTO managed_properties 
  FROM public.properties p
  WHERE p.property_manager_id = v_manager_id AND p.is_active = true;

  SELECT COUNT(DISTINCT t.id) INTO active_tenants
  FROM public.tenants t
  JOIN public.properties p ON t.property_id = p.id
  WHERE p.property_manager_id = v_manager_id AND t.status = 'active';

  SELECT COALESCE(SUM(l.monthly_rent), 0) INTO pending_rent
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.rent_payments rp
      WHERE rp.lease_id = l.id
        AND rp.status = 'completed'
        AND DATE_TRUNC('month', rp.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
    );

  SELECT COUNT(*) INTO maintenance_count
  FROM public.maintenance_requests mr
  JOIN public.properties p ON mr.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND mr.status IN ('pending', 'assigned');

  SELECT COALESCE(SUM(l.monthly_rent), 0) INTO total_revenue
  FROM public.leases l
  JOIN public.properties p ON l.property_id = p.id
  WHERE p.property_manager_id = v_manager_id
    AND l.status = 'active'
    AND l.start_date <= CURRENT_DATE
    AND l.end_date >= CURRENT_DATE;

  SELECT 
    CASE 
      WHEN SUM(p.total_units) > 0 THEN 
        (SUM(p.occupied_units)::DECIMAL / SUM(p.total_units)::DECIMAL) * 100
      ELSE 0
    END INTO occupancy_rate
  FROM public.properties p
  WHERE p.property_manager_id = v_manager_id AND p.is_active = true;

  result := json_build_object(
    'managedProperties', managed_properties,
    'activeTenants', active_tenants,
    'pendingRent', pending_rent,
    'maintenanceCount', maintenance_count,
    'totalRevenue', total_revenue,
    'occupancyRate', ROUND(occupancy_rate, 2)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;
