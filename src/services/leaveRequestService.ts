import { supabase } from '@/integrations/supabase/client';

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeavePropertyOption {
  id: string;
  name: string;
  location?: string | null;
}

export interface LeaveRequestRecord {
  id: string;
  user_id: string;
  property_id: string | null;
  role: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: LeaveRequestStatus;
  manager_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  share_with_proprietor: boolean;
  shared_with_proprietor_at?: string | null;
  created_at: string;
  updated_at: string;
  property?: LeavePropertyOption | null;
  requester?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  reviewer?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
}

export interface CreateLeaveRequestInput {
  property_id?: string | null;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface ReviewLeaveRequestInput {
  status: 'approved' | 'rejected';
  manager_notes?: string;
  share_with_proprietor?: boolean;
}

const millisecondsPerDay = 1000 * 60 * 60 * 24;

const toInclusiveDays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
  return Math.max(diff, 1);
};

const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
};

const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name, email')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'User profile not found');
  }

  return data;
};

const getPropertyIdsForCurrentUser = async (): Promise<string[]> => {
  const profile = await getCurrentProfile();

  if (profile.role === 'property_manager') {
    const { data } = await supabase
      .from('property_manager_assignments')
      .select('property_id')
      .eq('property_manager_id', profile.id)
      .eq('status', 'active');

    return (data || []).map((row: any) => row.property_id).filter(Boolean);
  }

  if (profile.role === 'technician') {
    const { data } = await supabase
      .from('technician_property_assignments')
      .select('property_id')
      .eq('technician_id', profile.id)
      .eq('is_active', true);

    return (data || []).map((row: any) => row.property_id).filter(Boolean);
  }

  if (profile.role === 'caretaker') {
    const { data } = await supabase
      .from('caretakers')
      .select('property_id')
      .eq('user_id', profile.id)
      .eq('status', 'active');

    return (data || []).map((row: any) => row.property_id).filter(Boolean);
  }

  if (profile.role === 'accountant') {
    const { data } = await supabase
      .from('accountants')
      .select('property_id')
      .eq('user_id', profile.id)
      .eq('status', 'active');

    return (data || []).map((row: any) => row.property_id).filter(Boolean);
  }

  return [];
};

export const leaveRequestService = {
  async getAssignableProperties(): Promise<LeavePropertyOption[]> {
    const propertyIds = await getPropertyIdsForCurrentUser();

    if (propertyIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('properties')
      .select('id, name, location')
      .in('id', propertyIds)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((property: any) => ({
      id: property.id,
      name: property.name,
      location: property.location,
    }));
  },

  async submitLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequestRecord> {
    const profile = await getCurrentProfile();
    const daysRequested = toInclusiveDays(input.start_date, input.end_date);

    const payload = {
      user_id: profile.id,
      role: profile.role,
      property_id: input.property_id || null,
      start_date: input.start_date,
      end_date: input.end_date,
      days_requested: daysRequested,
      reason: input.reason,
      status: 'pending',
      share_with_proprietor: false,
    };

    const { data, error } = await supabase
      .from('employee_leave_requests')
      .insert([payload])
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to submit leave request');
    }

    return data as LeaveRequestRecord;
  },

  async getMyLeaveRequests(): Promise<LeaveRequestRecord[]> {
    const profile = await getCurrentProfile();

    const { data, error } = await supabase
      .from('employee_leave_requests')
      .select(`
        *,
        property:properties(id, name, location),
        reviewer:profiles!employee_leave_requests_reviewed_by_fkey(id, first_name, last_name, email)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as LeaveRequestRecord[];
  },

  async getLeaveRequestsForReview(): Promise<LeaveRequestRecord[]> {
    const { data, error } = await supabase
      .from('employee_leave_requests')
      .select(`
        *,
        property:properties(id, name, location),
        requester:profiles!employee_leave_requests_user_id_fkey(id, first_name, last_name, email, role),
        reviewer:profiles!employee_leave_requests_reviewed_by_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as LeaveRequestRecord[];
  },

  async reviewLeaveRequest(leaveRequestId: string, input: ReviewLeaveRequestInput): Promise<void> {
    const reviewer = await getCurrentProfile();
    const shouldShare = Boolean(input.share_with_proprietor && input.status === 'approved');

    const updates = {
      status: input.status,
      manager_notes: input.manager_notes || null,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      share_with_proprietor: shouldShare,
      shared_with_proprietor_at: shouldShare ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from('employee_leave_requests')
      .update(updates)
      .eq('id', leaveRequestId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async getSharedLeaveRequestsForProprietor(): Promise<LeaveRequestRecord[]> {
    const { data, error } = await supabase
      .from('employee_leave_requests')
      .select(`
        *,
        property:properties(id, name, location),
        requester:profiles!employee_leave_requests_user_id_fkey(id, first_name, last_name, email, role),
        reviewer:profiles!employee_leave_requests_reviewed_by_fkey(id, first_name, last_name, email)
      `)
      .eq('status', 'approved')
      .eq('share_with_proprietor', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as LeaveRequestRecord[];
  },
};
