// src/services/technicianService.ts
import { supabase } from '../../integrations/supabase/client';
import { 
  Technician, 
  TechnicianCategory, 
  TechnicianPropertyAssignment,
  TechnicianJobUpdate 
} from '../../types/newRoles';

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

  // Create technician profile (With 1 Category and Optional Multiple Properties)
  async createTechnician(
    userId: string,
    categoryId: string,
    propertyIds: string[] = [], // New: Multiple Properties
    assignedBy: string, // New: Required for property assignment
    specializations?: string[],
    certificationUrl?: string,
    experienceYears?: number
  ): Promise<Technician> {
    // 1. Create the Technician record (Enforces 1 Category)
    const { data: technician, error } = await supabase
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

    // 2. Assign to Multiple Properties if provided
    if (propertyIds.length > 0 && technician) {
       await this.syncTechnicianProperties(technician.id, propertyIds, assignedBy);
    }

    return technician;
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

  // Sync technician properties (Set the list of assigned properties)
  // Logic: Allows a technician to be assigned to MORE THAN ONE property.
  async syncTechnicianProperties(
    technicianId: string, 
    propertyIds: string[], 
    assignedBy: string
  ): Promise<void> {
    
    // 1. Deactivate all existing assignments for this technician
    await supabase
        .from('technician_property_assignments')
        .update({ is_active: false })
        .eq('technician_id', technicianId);

    if (propertyIds.length === 0) return;

    // 2. Prepare upsert data
    // We use UPSERT to either insert new or reactivate existing
    const assignments = propertyIds.map(pid => ({
        technician_id: technicianId,
        property_id: pid,
        is_active: true,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
    }));

    // 3. Perform Upsert
    const { error } = await supabase
        .from('technician_property_assignments')
        .upsert(assignments, { onConflict: 'technician_id,property_id' });

    if (error) throw error;
  },

  // Assign technician to property (Legacy/Single)
  async assignTechnicianToProperty(
    technicianId: string,
    propertyId: string,
    assignedBy: string // Updated to require assignedBy
  ): Promise<TechnicianPropertyAssignment> {
    const { data, error } = await supabase
      .from('technician_property_assignments')
      .upsert([{
        technician_id: technicianId,
        property_id: propertyId,
        assigned_by: assignedBy,
        is_active: true
      }], { onConflict: 'technician_id,property_id' })
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
        technician_id: technicianId,
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

// Get technician's assigned jobs AND available jobs in assigned properties
  async getTechnicianJobs(technicianId: string, status?: string) {
    console.log(`[TechnicianService] Fetching jobs for technician: ${technicianId}`);
    
    // 1. Get Technician details (category_id)
    const { data: tech, error: techError } = await supabase
      .from('technicians')
      .select('category_id')
      .eq('id', technicianId)
      .single();

    if (techError || !tech) {
        console.error('[TechnicianService] Error fetching technician details:', techError);
        return [];
    }

    // 2. Get Technician's assigned properties
    const { data: assignments, error: assignError } = await supabase
      .from('technician_property_assignments')
      .select('property_id')
      .eq('technician_id', technicianId)
      .eq('is_active', true);

    if (assignError) {
        console.error('[TechnicianService] Error fetching assignments:', assignError);
        return [];
    }

    const assignedPropertyIds = (assignments || []).map((a: { property_id: string }) => a.property_id);
    console.log(`[TechnicianService] Technician category: ${tech.category_id}, Assigned properties: ${assignedPropertyIds.length}`);
    
    // DEBUG: Check what's actually in the database
    const { count: totalCount } = await supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true });
    const { data: sampleRequests } = await supabase
      .from('maintenance_requests')
      .select('id, title, category_id, assigned_to_technician_id, property_id, status')
      .limit(5);
    console.log(`[TechnicianService] DEBUG: Total requests in system: ${totalCount}, Sample:`, sampleRequests);
    
    // 3. Fetch Jobs (Split into three queries: direct assignments + property pool + category pool)
    
    // Query A: Direct Assignments (assigned_to_technician_id = tech.id)
    let queryDirectAssigned = supabase
        .from('maintenance_requests')
        .select(`
            *,
            property:properties(id, name, location),
            tenant:profiles!fk_maintenance_tenant_profile(id, first_name, last_name, email, phone, avatar_url),
            category:technician_categories(name)
        `)
        .eq('assigned_to_technician_id', technicianId);

    // Query B: Property Pool (Unassigned + In assigned properties + Matching Category)
    // FIXED: Only include this query if technician has assigned properties
    let queryPropertyPool = null;
    if (assignedPropertyIds.length > 0) {
        queryPropertyPool = supabase
            .from('maintenance_requests')
            .select(`
                *,
                property:properties(id, name, location),
                tenant:profiles!fk_maintenance_tenant_profile(id, first_name, last_name, email, phone, avatar_url),
                category:technician_categories(name)
            `)
            .is('assigned_to_technician_id', null)
            .eq('category_id', tech.category_id)
            .in('property_id', assignedPropertyIds);
    }

    // Query C: Category Pool (Unassigned + Matching Category + No property assignment requirement)
    // This ensures technicians see jobs in their category even if they have no properties assigned
    let queryCategoryPool = supabase
        .from('maintenance_requests')
        .select(`
            *,
            property:properties(id, name, location),
            tenant:profiles!fk_maintenance_tenant_profile(id, first_name, last_name, email, phone, avatar_url),
            category:technician_categories(name)
        `)
        .is('assigned_to_technician_id', null)
        .eq('category_id', tech.category_id);

    // Query D: Fallback - All unassigned requests without category_id (legacy requests)
    // Some requests might not have category_id set - show them as available
    let queryFallback = supabase
        .from('maintenance_requests')
        .select(`
            *,
            property:properties(id, name, location),
            tenant:profiles!fk_maintenance_tenant_profile(id, first_name, last_name, email, phone, avatar_url),
            category:technician_categories(name)
        `)
        .is('assigned_to_technician_id', null)
        .is('category_id', null);

    // Apply status filter if present
    if (status) {
        queryDirectAssigned = queryDirectAssigned.eq('status', status);
        if (queryPropertyPool) queryPropertyPool = queryPropertyPool.eq('status', status);
        queryCategoryPool = queryCategoryPool.eq('status', status);
        queryFallback = queryFallback.eq('status', status);
    }

    // Execute in parallel
    const queries = [queryDirectAssigned, queryCategoryPool, queryFallback];
    if (queryPropertyPool) queries.splice(1, 0, queryPropertyPool);
    
    const results = await Promise.all(queries);
    
    const directRes = results[0];
    const propertyRes = queryPropertyPool ? results[1] : { data: [], error: null };
    const categoryRes = results[queryPropertyPool ? 2 : 1];
    const fallbackRes = results[queryPropertyPool ? 3 : 2];

    if (directRes.error) console.error("Error fetching directly assigned jobs:", directRes.error);
    if (propertyRes.error) console.error("Error fetching property pool jobs:", propertyRes.error);
    if (categoryRes.error) console.error("Error fetching category pool jobs:", categoryRes.error);
    if (fallbackRes.error) console.error("Error fetching fallback jobs:", fallbackRes.error);

    // Combine results in priority order
    const directJobs = directRes.data || [];
    const propertyJobs = propertyRes.data || [];
    const categoryJobs = categoryRes.data || [];
    const fallbackJobs = fallbackRes.data || [];

    // Combine all results
    const allJobs = [...directJobs, ...propertyJobs, ...categoryJobs, ...fallbackJobs];
    
    // Deduplicate
    const uniqueJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());

    console.log(`[TechnicianService] Found ${uniqueJobs.length} jobs (${directJobs.length} direct, ${propertyJobs.length} property pool, ${categoryJobs.length} category pool, ${fallbackJobs.length} fallback)`);

    // Sort by Date (newest first)
    return uniqueJobs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
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
  },

  // ============================================================================
  // DIAGNOSTIC - Debug technician job visibility
  // ============================================================================

  async diagnoseTechnicianJobVisibility(userId: string) {
    try {
      console.log(`\n🔍 [DIAGNOSIS] Analyzing technician visibility for user: ${userId}`);

      // 1. Get technician profile
      const { data: tech, error: techError } = await supabase
        .from('technicians')
        .select('id, user_id, category_id, is_available')
        .eq('user_id', userId)
        .single();

      if (techError || !tech) {
        console.error('❌ Technician not found:', techError);
        return null;
      }

      console.log('👷 Technician Details:', {
        id: tech.id,
        category_id: tech.category_id,
        is_available: tech.is_available
      });

      // 2. Get assigned properties
      const { data: props } = await supabase
        .from('technician_property_assignments')
        .select('property_id')
        .eq('technician_id', tech.id)
        .eq('is_active', true);

      const propIds = (props || []).map((p: any) => p.property_id);
      console.log(`🏢 Assigned Properties: ${propIds.length}`);

      // 3. Check all maintenance requests
      const { data: allRequests } = await supabase
        .from('maintenance_requests')
        .select('id, title, category_id, assigned_to_technician_id, property_id, status')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log(`📋 Total requests in system: ${allRequests?.length || 0}`);
      if (allRequests?.length) {
        allRequests.forEach((r: any) => {
          console.log(`   - ${r.title}: cat=${r.category_id}, assigned=${r.assigned_to_technician_id}, prop=${r.property_id}`);
        });
      }

      // 4. Check requests matching technician's category
      const { data: catRequests } = await supabase
        .from('maintenance_requests')
        .select('id, title, category_id')
        .eq('category_id', tech.category_id);

      console.log(`🏷️  Requests in technician's category: ${catRequests?.length || 0}`);

      // 5. Try the actual query
      console.log(`\n🔄 Attempting getTechnicianJobs...`);
      const jobs = await this.getTechnicianJobs(tech.id);
      console.log(`✅ getTechnicianJobs returned: ${jobs.length} jobs`);

      return {
        technician: tech,
        assignedProperties: propIds,
        allRequestsCount: allRequests?.length || 0,
        categoryRequestsCount: catRequests?.length || 0,
        jobsVisible: jobs.length
      };
    } catch (err) {
      console.error('❌ Diagnosis error:', err);
      return null;
    }
  },

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to real-time updates for technician's jobs
   * Automatically refetches jobs when maintenance_requests table changes
   */
  subscribeToTechnicianJobs(
    technicianId: string,
    onUpdate: (jobs: any[]) => void,
    onError?: (error: any) => void
  ) {
    console.log(`[TechnicianService] Setting up real-time subscription for technician: ${technicianId}`);

    const subscription = supabase
      .channel(`technician_jobs_${technicianId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
        },
        async (payload: any) => {
          console.log(`[TechnicianService] Real-time update received:`, payload);
          // If we have a technician ID, refetch this specific technician's jobs
          if (technicianId) {
             try {
                // We're just notifying the component to refetch, but here we can't easily access THIS service instance 
                // due to 'this' binding unless we use arrow function for the method or bind.
                // However, the callback passed in (onUpdate) likely expects the new list.
                // Since this is inside an object method, 'this' might be tricky if not bound.
                // Safer to let the component handle the refetch or pass the technicianService explicitly.
                // For now, let's just use the onUpdate callback with likely empty array or trigger re-fetch.
                // But wait, the original code had: const updatedJobs = await this.getTechnicianJobs(technicianId);
                // "this" context might be lost here depending on how it's called.
                // But let's assume it works.
                const updatedJobs = await technicianService.getTechnicianJobs(technicianId);
                onUpdate(updatedJobs);
             } catch (error) {
                console.error('[TechnicianService] Error fetching updated jobs:', error);
                if (onError) onError(error);
             }
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`[TechnicianService] Subscription status:`, status);
      });

    return subscription;
  },

  /**
   * Subscribe to real-time updates for a specific maintenance request
   */
  subscribeToMaintenanceRequest(
    requestId: string,
    onUpdate: (request: any) => void,
    onError?: (error: any) => void
  ) {
    const subscription = supabase
      .channel(`maintenance_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload: any) => {
          console.log(`[TechnicianService] Maintenance request updated:`, payload);
          onUpdate(payload.new);
        }
      )
      .subscribe((status: string) => {
        console.log(`[TechnicianService] Request subscription status:`, status);
      });

    return subscription;
  }
};
