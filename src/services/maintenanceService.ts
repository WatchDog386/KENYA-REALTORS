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
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .select(`
        technician:technicians(
          id,
          user_id,
          profile:profiles(id, first_name, last_name, email, phone, avatar_url),
          is_available,
          average_rating,
          total_jobs_completed
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (error) throw error;

    // Filter by category
    const technicians = (data || [])
      .map((d: any) => d.technician)
      .filter((t: any) => t?.is_available);

    return technicians;
  },

  // Auto-assign maintenance request to best available technician
  async autoAssignToTechnician(
    maintenanceRequestId: string,
    categoryId: string,
    propertyId: string
  ): Promise<MaintenanceRequestEnhanced | null> {
    try {
      const technicians = await this.getAvailableTechnicians(categoryId, propertyId);

      if (technicians.length === 0) {
        // No technicians available, will be escalated to manager
        return null;
      }

      // Sort by rating and select best one
      const bestTechnician = technicians.sort((a: any, b: any) => {
        const ratingDiff = (b.average_rating || 0) - (a.average_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.total_jobs_completed || 0) - (a.total_jobs_completed || 0);
      })[0];

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

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Auto-assign error:', err);
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
  }
};
