// src/services/technicianService.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  Technician, 
  TechnicianCategory, 
  TechnicianPropertyAssignment,
  TechnicianJobUpdate 
} from '@/types/newRoles';

// ============================================================================
// TECHNICIAN CATEGORIES
// ============================================================================

export const technicianService = {
  // Get all active technician categories
  async getCategories(): Promise<TechnicianCategory[]> {
    const { data, error } = await supabase
      .from('technician_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<TechnicianCategory> {
    const { data, error } = await supabase
      .from('technician_categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new category (super admin only)
  async createCategory(name: string, description: string, icon?: string): Promise<TechnicianCategory> {
    const { data, error } = await supabase
      .from('technician_categories')
      .insert([{
        name,
        description,
        icon,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update category
  async updateCategory(id: string, updates: Partial<TechnicianCategory>): Promise<TechnicianCategory> {
    const { data, error } = await supabase
      .from('technician_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============================================================================
  // TECHNICIAN MANAGEMENT
  // ============================================================================

  // Get technician by user ID
  async getTechnicianByUserId(userId: string): Promise<Technician | null> {
    const { data, error } = await supabase
      .from('technicians')
      .select(`
        *,
        category:technician_categories(*),
        profile:profiles(*)
      `)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data;
  },

  // Get technician by ID
  async getTechnicianById(id: string): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .select(`
        *,
        category:technician_categories(*),
        profile:profiles(id, first_name, last_name, email, phone)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all technicians for a category
  async getTechniciansByCategory(categoryId: string, propertyId?: string): Promise<Technician[]> {
    let query = supabase
      .from('technicians')
      .select(`
        *,
        profile:profiles(id, first_name, last_name, email, avatar_url),
        assignments:technician_property_assignments(property_id)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'active')
      .eq('is_available', true);
    
    // If propertyId provided, get technicians assigned to that property
    if (propertyId) {
      query = query.or(`assignments.is_active.eq.true,assignments.property_id.eq.${propertyId}`);
    }

    const { data, error } = await query.order('average_rating', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create technician profile
  async createTechnician(
    userId: string,
    categoryId: string,
    specializations?: string[],
    certificationUrl?: string,
    experienceYears?: number
  ): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .insert([{
        user_id: userId,
        category_id: categoryId,
        specializations,
        certification_url: certificationUrl,
        experience_years: experienceYears,
        is_available: true,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update technician profile
  async updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============================================================================
  // PROPERTY ASSIGNMENTS
  // ============================================================================

  // Assign technician to property
  async assignTechnicianToProperty(
    technicianId: string,
    propertyId: string
  ): Promise<TechnicianPropertyAssignment> {
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .insert([{
        technician_id: technicianId,
        property_id: propertyId,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get technicians assigned to property
  async getTechniciansForProperty(propertyId: string): Promise<Technician[]> {
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .select(`
        technician:technicians(
          *,
          category:technician_categories(*),
          profile:profiles(id, first_name, last_name, email, avatar_url)
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []).map((d: any) => d.technician);
  },

  // Remove technician from property
  async removeTechnicianFromProperty(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('technician_property_assignments')
      .delete()
      .eq('id', assignmentId);
    
    if (error) throw error;
  },

  // ============================================================================
  // JOB UPDATES & MAINTENANCE REQUEST ROUTING
  // ============================================================================

  // Assign maintenance request to technician based on category
  async assignMaintenanceToTechnician(
    maintenanceRequestId: string,
    technicianId: string,
    responseDeadlineHours: number = 24
  ): Promise<void> {
    const deadline = new Date(Date.now() + responseDeadlineHours * 60 * 60 * 1000);
    
    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        assigned_to_technician_id: technicianId,
        technician_response_deadline: deadline.toISOString(),
        status: 'pending'
      })
      .eq('id', maintenanceRequestId);
    
    if (error) throw error;
  },

  // Record job update by technician
  async createJobUpdate(
    maintenanceRequestId: string,
    technicianId: string,
    status: string,
    notes: string,
    updateType: 'status_change' | 'comment' | 'schedule_update'
  ): Promise<TechnicianJobUpdate> {
    const { data, error } = await supabase
      .from('technician_job_updates')
      .insert([{
        maintenance_request_id: maintenanceRequestId,
        technician_id: technicianId,
        status,
        notes,
        update_type: updateType
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get job history for maintenance request
  async getJobHistory(maintenanceRequestId: string): Promise<TechnicianJobUpdate[]> {
    const { data, error } = await supabase
      .from('technician_job_updates')
      .select('*')
      .eq('maintenance_request_id', maintenanceRequestId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get technician's assigned jobs
  async getTechnicianJobs(technicianId: string, status?: string) {
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        property:properties(id, name, location),
        tenant:profiles!fk_maintenance_tenant_profile(id, first_name, last_name, email),
        category:technician_categories(name)
      `)
      .eq('assigned_to_technician_id', technicianId);
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Escalate maintenance request to property manager
  async escalateMaintenance(maintenanceRequestId: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        is_escalated_to_manager: true,
        escalated_at: new Date().toISOString()
      })
      .eq('id', maintenanceRequestId);
    
    if (error) throw error;
  }
};
