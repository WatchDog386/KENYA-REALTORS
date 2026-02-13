import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequestEnhanced } from '@/types/newRoles';

/**
 * Work Documentation Service
 * Handles technician job documentation with photos and cost estimates
 */

// ============================================================================
// WORK DOCUMENTATION
// ============================================================================

/**
 * Upload work start photo
 */
export const uploadWorkStartPhoto = async (
  maintenanceRequestId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileName = `start-${maintenanceRequestId}-${Date.now()}.jpg`;
    const filePath = `maintenance-work/${maintenanceRequestId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('maintenance-images')
      .upload(filePath, file, { upsert: false });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance-images')
      .getPublicUrl(filePath);

    // Update maintenance request
    await supabase
      .from('maintenance_requests')
      .update({
        work_start_photo: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintenanceRequestId);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error uploading work start photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload work progress photo
 */
export const uploadWorkProgressPhoto = async (
  maintenanceRequestId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileName = `progress-${maintenanceRequestId}-${Date.now()}.jpg`;
    const filePath = `maintenance-work/${maintenanceRequestId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('maintenance-images')
      .upload(filePath, file, { upsert: false });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance-images')
      .getPublicUrl(filePath);

    // Get current maintenance request
    const { data: currentRequest } = await supabase
      .from('maintenance_requests')
      .select('work_progress_photos')
      .eq('id', maintenanceRequestId)
      .single();

    const progressPhotos = currentRequest?.work_progress_photos || [];
    progressPhotos.push(urlData.publicUrl);

    // Update maintenance request
    await supabase
      .from('maintenance_requests')
      .update({
        work_progress_photos: progressPhotos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintenanceRequestId);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error uploading work progress photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Upload work completion photo
 */
export const uploadWorkCompletionPhoto = async (
  maintenanceRequestId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileName = `completion-${maintenanceRequestId}-${Date.now()}.jpg`;
    const filePath = `maintenance-work/${maintenanceRequestId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('maintenance-images')
      .upload(filePath, file, { upsert: false });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('maintenance-images')
      .getPublicUrl(filePath);

    // Update maintenance request
    await supabase
      .from('maintenance_requests')
      .update({
        work_completion_photo: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintenanceRequestId);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error uploading work completion photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit work documentation with description and cost
 */
export const submitWorkDocumentation = async (
  maintenanceRequestId: string,
  technicianId: string,
  data: {
    description: string;
    estimated_cost: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify technician is assigned to this job
    const { data: request, error: fetchError } = await supabase
      .from('maintenance_requests')
      .select('assigned_to_technician_id, work_start_photo, work_completion_photo')
      .eq('id', maintenanceRequestId)
      .single();

    if (fetchError) throw fetchError;
    if (request?.assigned_to_technician_id !== technicianId) {
      throw new Error('Not assigned to this maintenance request');
    }

    // Verify photos are uploaded
    if (!request?.work_start_photo || !request?.work_completion_photo) {
      throw new Error('Must provide start and completion photos');
    }

    // Update maintenance request with documentation
    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        work_description: data.description,
        estimated_cost: data.estimated_cost,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintenanceRequestId);

    if (error) throw error;

    // Create job update record
    await supabase.from('technician_job_updates').insert([
      {
        maintenance_request_id: maintenanceRequestId,
        technician_id: technicianId,
        status: 'in_progress',
        notes: `Work started: ${data.description}`,
        update_type: 'status_change',
        created_by: technicianId,
      },
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting work documentation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete work and provide final cost
 */
export const completeWorkDocumentation = async (
  maintenanceRequestId: string,
  technicianId: string,
  actualCost: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify technician is assigned
    const { data: request, error: fetchError } = await supabase
      .from('maintenance_requests')
      .select('assigned_to_technician_id')
      .eq('id', maintenanceRequestId)
      .single();

    if (fetchError) throw fetchError;
    if (request?.assigned_to_technician_id !== technicianId) {
      throw new Error('Not assigned to this maintenance request');
    }

    // Update maintenance request
    const { error } = await supabase
      .from('maintenance_requests')
      .update({
        actual_cost: actualCost,
        status: 'completed',
        work_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', maintenanceRequestId);

    if (error) throw error;

    // Create completion job update
    await supabase.from('technician_job_updates').insert([
      {
        maintenance_request_id: maintenanceRequestId,
        technician_id: technicianId,
        status: 'completed',
        notes: `Work completed. Final cost: KES ${actualCost}`,
        update_type: 'status_change',
        created_by: technicianId,
      },
    ]);

    // Update technician's job count
    await supabase.rpc('increment_technician_jobs', {
      tech_id: technicianId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error completing work documentation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get maintenance request with full documentation
 */
export const getMaintenanceWithDocumentation = async (
  maintenanceRequestId: string
): Promise<MaintenanceRequestEnhanced | null> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(
        '*, technician:assigned_to_technician_id(*, category:category_id(*)), category:category_id(*), tenant:tenant_id(*), property:property_id(*)'
      )
      .eq('id', maintenanceRequestId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching maintenance with documentation:', error);
    return null;
  }
};

/**
 * Get all work photos for a maintenance request
 */
export const getWorkPhotos = async (maintenanceRequestId: string) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('work_start_photo, work_progress_photos, work_completion_photo')
      .eq('id', maintenanceRequestId)
      .single();

    if (error) throw error;

    return {
      startPhoto: data?.work_start_photo,
      progressPhotos: data?.work_progress_photos || [],
      completionPhoto: data?.work_completion_photo,
    };
  } catch (error) {
    console.error('Error fetching work photos:', error);
    return null;
  }
};

/**
 * Get cost breakdown for a job
 */
export const getJobCostBreakdown = async (maintenanceRequestId: string) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('estimated_cost, actual_cost, status')
      .eq('id', maintenanceRequestId)
      .single();

    if (error) throw error;

    return {
      estimated: data?.estimated_cost || 0,
      actual: data?.actual_cost || 0,
      status: data?.status,
      variance: data?.actual_cost ? data.actual_cost - (data?.estimated_cost || 0) : 0,
    };
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    return null;
  }
};

/**
 * Get technician's work statistics
 */
export const getTechnicianWorkStats = async (technicianId: string) => {
  try {
    // Get completed jobs
    const { data: completedJobs } = await supabase
      .from('maintenance_requests')
      .select('actual_cost, work_completed_at, rating_by_tenant')
      .eq('assigned_to_technician_id', technicianId)
      .eq('status', 'completed');

    if (!completedJobs) return null;

    const totalJobs = completedJobs.length;
    const totalCostCompleted = completedJobs.reduce((sum, j) => sum + (j.actual_cost || 0), 0);
    const avgRating =
      totalJobs > 0
        ? completedJobs.reduce((sum, j) => sum + (j.rating_by_tenant || 0), 0) / totalJobs
        : 0;

    return {
      totalJobsCompleted: totalJobs,
      averageCostPerJob: totalJobs > 0 ? totalCostCompleted / totalJobs : 0,
      totalEarnings: totalCostCompleted,
      averageRating: parseFloat(avgRating.toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching technician work stats:', error);
    return null;
  }
};
