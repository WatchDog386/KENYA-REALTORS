// src/services/caretakerDutyService.ts
import { supabase } from '@/integrations/supabase/client';

export interface CaretakerDuty {
  id: string;
  caretaker_id: string;
  property_id: string;
  assigned_by: string;
  title: string;
  description?: string;
  duty_type: 'general' | 'cleaning' | 'security' | 'maintenance' | 'inspection' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  recurring: boolean;
  recurrence_pattern?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  started_at?: string;
  completed_at?: string;
  report_submitted: boolean;
  report_text?: string;
  report_submitted_at?: string;
  report_images?: string[];
  manager_feedback?: string;
  rating?: number;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  caretaker?: {
    id: string;
    user_id: string;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  assigner?: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateDutyInput {
  caretaker_id: string;
  property_id: string;
  title: string;
  description?: string;
  duty_type: string;
  priority?: string;
  due_date?: string;
  recurring?: boolean;
  recurrence_pattern?: string;
}

export interface DutyReportInput {
  report_text: string;
  report_images?: string[];
}

export interface DutyReportTemplate {
  id: string;
  name: string;
  duty_type: string;
  template_fields: any[];
  description?: string;
  is_active: boolean;
}

export const caretakerDutyService = {
  // ============================================================================
  // PROPERTY MANAGER FUNCTIONS
  // ============================================================================

  // Create a new duty assignment
  async createDuty(input: CreateDutyInput): Promise<CaretakerDuty> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('caretaker_duties')
      .insert({
        ...input,
        assigned_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create an ad-hoc report/duty (initiated by caretaker)
  async createAdhocReport(input: CreateDutyInput & { report_text?: string, report_submitted?: boolean, report_images?: string[] }): Promise<CaretakerDuty> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const status = input.report_submitted ? 'completed' : 'in_progress';
    const submittedAt = input.report_submitted ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('caretaker_duties')
      .insert({
        ...input,
        assigned_by: user.id, // Self-assigned for ad-hoc reports
        status: status,
        report_submitted_at: submittedAt
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get duties for a property (for property managers)
  async getPropertyDuties(propertyId: string): Promise<CaretakerDuty[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        caretaker:caretakers(
          id,
          user_id,
          profile:profiles!user_id(first_name, last_name, email)
        ),
        assigner:profiles!assigned_by(first_name, last_name)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get duties assigned by a manager
  async getDutiesAssignedByManager(managerId: string): Promise<CaretakerDuty[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        caretaker:caretakers(
          id,
          user_id,
          profile:profiles!user_id(first_name, last_name, email)
        )
      `)
      .eq('assigned_by', managerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update duty status or details
  async updateDuty(dutyId: string, updates: Partial<CaretakerDuty>): Promise<CaretakerDuty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update(updates)
      .eq('id', dutyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Review and rate a completed duty
  async reviewDuty(dutyId: string, feedback: string, rating: number): Promise<CaretakerDuty> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        manager_feedback: feedback,
        rating,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancel a duty
  async cancelDuty(dutyId: string): Promise<void> {
    const { error } = await supabase
      .from('caretaker_duties')
      .update({ status: 'cancelled' })
      .eq('id', dutyId);

    if (error) throw error;
  },

  // ============================================================================
  // CARETAKER FUNCTIONS
  // ============================================================================

  // Get duties for a caretaker
  async getCaretakerDuties(caretakerId: string): Promise<CaretakerDuty[]> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select(`
        *,
        assigner:profiles!assigned_by(first_name, last_name)
      `)
      .eq('caretaker_id', caretakerId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  // Start a duty
  async startDuty(dutyId: string): Promise<CaretakerDuty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Submit duty report
  async submitReport(dutyId: string, report: DutyReportInput): Promise<CaretakerDuty> {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        report_submitted: true,
        report_text: report.report_text,
        report_images: report.report_images || [],
        report_submitted_at: new Date().toISOString()
      })
      .eq('id', dutyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // REPORT TEMPLATES
  // ============================================================================

  async getReportTemplates(): Promise<DutyReportTemplate[]> {
    const { data, error } = await supabase
      .from('duty_report_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getTemplateByDutyType(dutyType: string): Promise<DutyReportTemplate | null> {
    const { data, error } = await supabase
      .from('duty_report_templates')
      .select('*')
      .eq('duty_type', dutyType)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getCaretakerDutyStats(caretakerId: string) {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select('status, rating')
      .eq('caretaker_id', caretakerId);

    if (error) throw error;

    const duties = data || [];
    const completed = duties.filter(d => d.status === 'completed').length;
    const pending = duties.filter(d => d.status === 'pending').length;
    const inProgress = duties.filter(d => d.status === 'in_progress').length;
    const overdue = duties.filter(d => d.status === 'overdue').length;
    
    const ratingsWithValues = duties.filter(d => d.rating != null);
    const avgRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, d) => sum + (d.rating || 0), 0) / ratingsWithValues.length
      : 0;

    return {
      total: duties.length,
      completed,
      pending,
      inProgress,
      overdue,
      averageRating: Math.round(avgRating * 10) / 10
    };
  },

  async getPropertyDutyStats(propertyId: string) {
    const { data, error } = await supabase
      .from('caretaker_duties')
      .select('status')
      .eq('property_id', propertyId);

    if (error) throw error;

    const duties = data || [];
    return {
      total: duties.length,
      completed: duties.filter(d => d.status === 'completed').length,
      pending: duties.filter(d => d.status === 'pending').length,
      inProgress: duties.filter(d => d.status === 'in_progress').length,
      overdue: duties.filter(d => d.status === 'overdue').length
    };
  }
};
