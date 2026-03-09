// src/services/dutyService.ts
import { supabase } from '@/integrations/supabase/client';

export interface Duty {
  id: string;
  caretaker_id: string;
  property_id: string;
  assigned_by: string;
  title: string;
  description: string | null;
  duty_type: string;
  priority: string;
  due_date: string | null;
  recurring: boolean;
  recurrence_pattern: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  report_submitted: boolean;
  report_text: string | null;
  report_submitted_at: string | null;
  report_images: string[] | null;
  manager_feedback: string | null;
  rating: number | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DutyWithAssignee extends Duty {
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  property?: {
    id: string;
    name: string;
    location: string;
  } | null;
}

export interface DutyReportTemplate {
  id: string;
  name: string;
  duty_type: string;
  template_fields: any[];
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const dutyService = {
  // ============================================================================
  // DUTY MANAGEMENT
  // ============================================================================

  // Get all duties for a caretaker
  async getCaretakerDuties(caretakerId: string): Promise<DutyWithAssignee[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        property:properties(id, name, location)
      `)
      .eq('caretaker_id', caretakerId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching caretaker duties:', error);
      throw error;
    }

    return data || [];
  },

  // Get a specific duty by ID
  async getDutyById(dutyId: string): Promise<DutyWithAssignee | null> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        property:properties(id, name, location),
        assigned_to:profiles!assigned_by(id, first_name, last_name, email)
      `)
      .eq('id', dutyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching duty:', error);
      throw error;
    }

    return data || null;
  },

  // Get duties that need reporting (completed but no report yet)
  async getDutiesRequiringReport(caretakerId: string): Promise<DutyWithAssignee[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        property:properties(id, name, location)
      `)
      .eq('caretaker_id', caretakerId)
      .eq('report_submitted', false)
      .in('status', ['completed', 'in_progress'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching duties requiring report:', error);
      throw error;
    }

    return data || [];
  },

  // Get report templates
  async getReportTemplates(dutyType?: string): Promise<DutyReportTemplate[]> {
    let query = supabase
      .from('duty_report_templates')
      .select('*')
      .eq('is_active', true);

    if (dutyType) {
      query = query.eq('duty_type', dutyType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }

    return data || [];
  },

  // Submit a report for a duty
  async submitReport(
    dutyId: string,
    reportText: string,
    reportImages?: string[]
  ): Promise<Duty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        report_text: reportText,
        report_images: reportImages || [],
        report_submitted: true,
        report_submitted_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) {
      console.error('Error submitting report:', error);
      throw error;
    }

    return data;
  },

  // Draft a report (save without submitting)
  async saveDraft(
    dutyId: string,
    reportText: string,
    reportImages?: string[]
  ): Promise<Duty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        report_text: reportText,
        report_images: reportImages || []
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      throw error;
    }

    return data;
  },

  // Update duty status
  async updateDutyStatus(dutyId: string, status: string): Promise<Duty> {
    const updateData: any = { status };

    if (status === 'in_progress' && !['in_progress', 'completed'].includes(status)) {
      updateData.started_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('caretaker_duties')
      .update(updateData)
      .eq('id', dutyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating duty status:', error);
      throw error;
    }

    return data;
  },

  // Get duties for property manager review
  async getPropertyManagerDuties(propertyManagerId: string): Promise<DutyWithAssignee[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        property:properties(id, name, location),
        caretaker:caretakers(id, user_id),
        profile:caretakers!caretaker_duties_caretaker_id_fkey(*)
      `)
      .eq('assigned_by', propertyManagerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching property manager duties:', error);
      throw error;
    }

    return data || [];
  },

  // Get duties with pending reports (for property manager)
  async getPendingReports(propertyManagerId: string): Promise<DutyWithAssignee[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        property:properties(id, name, location)
      `)
      .eq('assigned_by', propertyManagerId)
      .eq('report_submitted', true)
      .is('reviewed_at', null)
      .order('report_submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending reports:', error);
      throw error;
    }

    return data || [];
  },

  // Review a report (property manager)
  async reviewReport(
    dutyId: string,
    feedback: string,
    rating: number
  ): Promise<Duty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        manager_feedback: feedback,
        rating: Math.min(5, Math.max(1, rating)),
        reviewed_at: new Date().toISOString()
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }

    return data;
  },

  // Get duty statistics for caretaker
  async getCaretakerStatistics(caretakerId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    averageRating: number;
  }> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select('status, rating')
      .eq('caretaker_id', caretakerId);

    if (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }

    const duties = data || [];
    const ratings = duties.filter(d => d.rating !== null).map(d => d.rating);

    return {
      total: duties.length,
      pending: duties.filter(d => d.status === 'pending').length,
      inProgress: duties.filter(d => d.status === 'in_progress').length,
      completed: duties.filter(d => d.status === 'completed').length,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    };
  }
};
