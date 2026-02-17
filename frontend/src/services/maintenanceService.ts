// src/services/maintenanceService.ts
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequestEnhanced } from '@/types/newRoles';

export const maintenanceService = {
  // ============================================================================
  // CREATE MAINTENANCE REQUEST WITH IMAGE
  // ============================================================================

  // Create maintenance request by tenant with image upload
  async createMaintenanceRequest(
    tenantId: string,
    propertyId: string,
    unitId: string | null,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'emergency',
    categoryId: string,
    imageFile?: File
  ): Promise<MaintenanceRequestEnhanced> {
    let imageUrl: string | null = null;

    // Upload image if provided
    if (imageFile) {
      const fileName = `maintenance-${Date.now()}-${imageFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('maintenance-images')
        .upload(`${propertyId}/${fileName}`, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      imageUrl = data?.path || null;
    }

    // Create maintenance request
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([{
        tenant_id: tenantId,
        property_id: propertyId,
        unit_id: unitId,
        title,
        description,
        priority,
        category_id: categoryId,
        image_url: imageUrl,
        status: 'pending',
        is_escalated_to_manager: false
      }])
      .select(`
        *,
        property:properties(id, name, location),
        tenant:profiles(id, first_name, last_name, email),
        category:technician_categories(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // ROUTE TO TECHNICIANS
  // ============================================================================

  // Get available technicians for a category and property
  async getAvailableTechnicians(categoryId: string, propertyId: string) {
    console.log(`[GetTechs] Finding technicians for category: ${categoryId}, property: ${propertyId}`);
    
    // FIRST: Check technicians assigned to THIS property
    const { data: propertyTechs, error: propError } = await supabase
      .from('technician_property_assignments')
      .select(`
        technician:technicians(
          id,
          user_id,
          category_id,
          profile:profiles(id, first_name, last_name, email, phone, avatar_url),
          is_available,
          average_rating,
          total_jobs_completed
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (propError) throw propError;

    const assignedTechs = (propertyTechs || [])
      .map((d: any) => d.technician)
      .filter((t: any) => t?.is_available && t?.category_id === categoryId);

    console.log(`[GetTechs] Found ${assignedTechs.length} technicians assigned to property ${propertyId}`);

    // If found technicians for this property, use them
    if (assignedTechs.length > 0) {
      return assignedTechs;
    }

    // FALLBACK: Get any available technician in this category (not assigned to this property yet)
    console.log(`[GetTechs] No property-assigned technicians, checking category pool...`);
    const { data: categoryTechs, error: catError } = await supabase
      .from('technicians')
      .select(`
        id,
        user_id,
        profile:profiles(id, first_name, last_name, email, phone, avatar_url),
        is_available,
        average_rating,
        total_jobs_completed
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true);

    if (catError) throw catError;

    const unassignedTechs = categoryTechs || [];
    console.log(`[GetTechs] Found ${unassignedTechs.length} technicians in category pool`);

    return unassignedTechs;
  },

  // Auto-assign maintenance request to best available technician
  async autoAssignToTechnician(
    maintenanceRequestId: string,
    categoryId: string,
    propertyId: string
  ): Promise<MaintenanceRequestEnhanced | null> {
    try {
      console.log(`[AutoAssign] Starting auto-assign for request ${maintenanceRequestId}, category: ${categoryId}, property: ${propertyId}`);
      
      const technicians = await this.getAvailableTechnicians(categoryId, propertyId);
      console.log(`[AutoAssign] Found ${technicians.length} available technicians in category`);

      if (technicians.length === 0) {
        console.log(`[AutoAssign] ⚠️ No technicians available. Request will stay in category pool.`);
        // Request will still be visible in category pool via RLS
        return null;
      }

      // Sort by rating and select best one
      const bestTechnician = technicians.sort((a: any, b: any) => {
        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.total_jobs_completed || 0) - (a.total_jobs_completed || 0);
      })[0];

      console.log(`[AutoAssign] Selected technician: ${bestTechnician.id}`);

      // Assign to technician
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          assigned_to_technician_id: bestTechnician.id,
          technician_response_deadline: deadline.toISOString(),
          status: 'pending'
        })
        .eq('id', maintenanceRequestId)
        .select(`
          *,
          property:properties(id, name, location),
          tenant:profiles(id, first_name, last_name, email),
          category:technician_categories(id, name),
          technician:technicians(
            id,
            profile:profiles(id, first_name, last_name, email, phone)
          )
        `)
        .single();

      if (error) {
        console.error(`[AutoAssign] Error assigning request:`, error);
        throw error;
      }

      console.log(`[AutoAssign] ✅ Successfully assigned to technician ${bestTechnician.id}`);
      return data;
    } catch (err) {
      console.error('[AutoAssign] Unexpected error:', err);
      return null;
    }
  },

  // ============================================================================
  // MAINTENANCE REQUEST MANAGEMENT
  // ============================================================================

  // Get maintenance request by ID
  async getMaintenanceRequest(id: string): Promise<MaintenanceRequestEnhanced> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(id, name, location),
        tenant:profiles(id, first_name, last_name, email, phone),
        category:technician_categories(id, name),
        technician:technicians(
          id,
          profile:profiles(id, first_name, last_name, email, phone, avatar_url),
          average_rating,
          total_jobs_completed
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get tenant's maintenance requests
  async getTenantMaintenanceRequests(tenantId: string, propertyId?: string) {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(id, name, location),
        category:technician_categories(id, name),
        technician:technicians(
          id,
          profile:profiles(id, first_name, last_name, email, phone)
        )
      `)
      .eq('tenant_id', tenantId);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get property's maintenance requests
  async getPropertyMaintenanceRequests(propertyId: string, status?: string) {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        tenant:profiles(id, first_name, last_name, email, phone),
        category:technician_categories(id, name),
        technician:technicians(
          id,
          profile:profiles(id, first_name, last_name, email, phone)
        )
      `)
      .eq('property_id', propertyId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update maintenance request status
  async updateMaintenanceStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<MaintenanceRequestEnhanced> {
    const updates: any = { status, updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, name, location),
        tenant:profiles(id, first_name, last_name, email),
        category:technician_categories(id, name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // ESCALATION
  // ============================================================================

  // Escalate to property manager (when technician doesn't respond)
  async escalateToPropertyManager(maintenanceRequestId: string, reason: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({
        is_escalated_to_manager: true,
        escalated_at: new Date().toISOString(),
        status: 'pending'
      })
      .eq('id', maintenanceRequestId)
      .select()
      .single();

    if (error) throw error;

    // You can add logging/notification here
    console.log(`Maintenance ${maintenanceRequestId} escalated: ${reason}`);

    return data;
  },

  // Get escalated requests for property manager
  async getEscalatedRequests(propertyId: string) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        tenant:profiles(id, first_name, last_name, email, phone),
        category:technician_categories(id, name),
        technician:technicians(
          id,
          profile:profiles(id, first_name, last_name, email, phone)
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_escalated_to_manager', true)
      .order('escalated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // ============================================================================
  // IMAGE MANAGEMENT
  // ============================================================================

  // Get image URL for maintenance request
  async getMaintenanceImageUrl(path: string): Promise<string | null> {
    const { data } = supabase.storage
      .from('maintenance-images')
      .getPublicUrl(path);

    return data?.publicUrl || null;
  },

  // Upload additional images to existing request
  async addImageToRequest(maintenanceRequestId: string, imageFile: File): Promise<string> {
    const { data: request } = await supabase
      .from('maintenance_requests')
      .select('property_id')
      .eq('id', maintenanceRequestId)
      .single();

    const fileName = `maintenance-${maintenanceRequestId}-${Date.now()}-${imageFile.name}`;
    const { data, error } = await supabase.storage
      .from('maintenance-images')
      .upload(`${request?.property_id}/${fileName}`, imageFile);

    if (error) throw error;
    return data?.path || '';
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  // Get maintenance statistics for property
  async getMaintenanceStats(propertyId: string) {
    const { data: requests, error } = await supabase
      .from('maintenance_requests')
      .select('status, priority')
      .eq('property_id', propertyId);

    if (error) throw error;

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter((r: any) => r.status === 'pending').length || 0,
      inProgress: requests?.filter((r: any) => r.status === 'in_progress').length || 0,
      completed: requests?.filter((r: any) => r.status === 'completed').length || 0,
      cancelled: requests?.filter((r: any) => r.status === 'cancelled').length || 0,
      urgent: requests?.filter((r: any) => r.priority === 'emergency' || r.priority === 'high').length || 0
    };

    return stats;
  },

  // ============================================================================
  // DIAGNOSTIC - Debug why requests aren't reaching technicians
  // ============================================================================

  async diagnoseRequestVisibility(maintenanceRequestId: string) {
    try {
      console.log(`\n🔍 [DIAGNOSTIC] Analyzing request: ${maintenanceRequestId}`);

      // 1. Get the request details
      const { data: request, error: reqError } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          title,
          category_id,
          property_id,
          assigned_to_technician_id,
          status,
          created_at
        `)
        .eq('id', maintenanceRequestId)
        .single();

      if (reqError) {
        console.error('❌ Request not found:', reqError);
        return null;
      }

      console.log('📋 Request Details:', {
        id: request.id,
        title: request.title,
        category_id: request.category_id,
        property_id: request.property_id,
        assigned_to: request.assigned_to_technician_id || 'Unassigned',
        status: request.status
      });

      // 2. Check the category
      const { data: category } = await supabase
        .from('technician_categories')
        .select('id, name')
        .eq('id', request.category_id)
        .single();

      console.log('🏷️  Category:', category?.name || 'Not found');

      // 3. Get the property
      const { data: property } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('id', request.property_id)
        .single();

      console.log('🏠 Property:', property?.name || 'Not found');

      // 4. Find technicians in this category
      const { data: techniciansInCategory } = await supabase
        .from('technicians')
        .select('id, user_id, is_available')
        .eq('category_id', request.category_id);

      console.log(`👷 Technicians in category "${category?.name}":`, techniciansInCategory?.length || 0);
      if (techniciansInCategory) {
        techniciansInCategory.forEach((t: any) => {
          console.log(`   - Tech ID: ${t.id}, Available: ${t.is_available}`);
        });
      }

      // 5. Find technicians assigned to this property
      const { data: techsForProperty } = await supabase
        .from('technician_property_assignments')
        .select('technician_id, technician:technicians(id, category_id)')
        .eq('property_id', request.property_id)
        .eq('is_active', true);

      console.log(`🏢 Technicians assigned to property:`, techsForProperty?.length || 0);
      if (techsForProperty) {
        techsForProperty.forEach((ta: any) => {
          console.log(`   - Tech ID: ${ta.technician_id}`);
        });
      }

      console.log('✅ Diagnostic complete\n');
      
      return {
        request,
        category,
        property,
        techniciansInCategory,
        techniciansForProperty: techsForProperty
      };
    } catch (err) {
      console.error('❌ Diagnostic error:', err);
      return null;
    }
  },

  // ============================================================================
  // COMPLETION REPORTS
  // ============================================================================

  // Create maintenance completion report
  async createCompletionReport(
    maintenanceRequestId: string,
    technicianId: string,
    propertyId: string,
    data: {
      notes?: string;
      hours_spent?: number;
      materials_used?: string;
      cost_estimate?: number;
      before_work_image_path?: string;
      in_progress_image_path?: string;
      after_repair_image_path?: string;
    }
  ) {
    console.log(`[CompletionReport] Creating report for request: ${maintenanceRequestId}`);

    const { data: report, error } = await supabase
      .from('maintenance_completion_reports')
      .insert([{
        maintenance_request_id: maintenanceRequestId,
        technician_id: technicianId,
        property_id: propertyId,
        notes: data.notes || null,
        hours_spent: data.hours_spent || null,
        materials_used: data.materials_used || null,
        cost_estimate: data.cost_estimate || null,
        before_work_image_url: data.before_work_image_path || null,
        in_progress_image_url: data.in_progress_image_path || null,
        after_repair_image_url: data.after_repair_image_path || null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Update maintenance request to link to the report
    await supabase
      .from('maintenance_requests')
      .update({
        completion_report_id: report.id,
        completion_status: 'pending'
      })
      .eq('id', maintenanceRequestId);

    console.log(`[CompletionReport] ✅ Report created: ${report.id}`);
    return report;
  },

  // Get completion report
  async getCompletionReport(reportId: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .select(`
        *,
        technician:technicians(
          id,
          user_id,
          profile:profiles(id, first_name, last_name, email, phone, avatar_url)
        ),
        maintenance_request:maintenance_requests(
          id,
          title,
          description,
          priority,
          status
        ),
        property:properties(id, name, location)
      `)
      .eq('id', reportId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get completion reports for a technician
  async getTechnicianCompletionReports(technicianId: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .select(`
        *,
        maintenance_request:maintenance_requests(
          id,
          title,
          priority,
          status
        ),
        property:properties(id, name)
      `)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get completion reports for property manager
  async getPropertyCompletionReports(propertyId: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .select(`
        *,
        technician:technicians(
          id,
          user_id,
          profile:profiles(id, first_name, last_name, email, phone, avatar_url)
        ),
        maintenance_request:maintenance_requests(
          id,
          title,
          description,
          priority,
          status
        ),
        property:properties(id, name, location)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Approve completion report (property manager)
  async approveCompletionReport(reportId: string, notes?: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .update({
        status: 'approved',
        manager_notes: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    // Update maintenance request status
    if (data?.maintenance_request_id) {
      await supabase
        .from('maintenance_requests')
        .update({ completion_status: 'approved' })
        .eq('id', data.maintenance_request_id);
    }

    return data;
  },

  // Reject completion report (property manager)
  async rejectCompletionReport(reportId: string, notes?: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .update({
        status: 'rejected',
        manager_notes: notes || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    // Update maintenance request status
    if (data?.maintenance_request_id) {
      await supabase
        .from('maintenance_requests')
        .update({ completion_status: 'rejected' })
        .eq('id', data.maintenance_request_id);
    }

    return data;
  },

  // Approve payment (accountant)
  async approveCostReport(reportId: string, actualCost: number, notes?: string) {
    const { data, error } = await supabase
      .from('maintenance_completion_reports')
      .update({
        actual_cost: actualCost,
        accountant_notes: notes || null,
        cost_approved_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};