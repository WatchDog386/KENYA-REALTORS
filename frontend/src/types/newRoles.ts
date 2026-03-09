// Types for Technician System
export interface TechnicianCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  user_id: string;
  category_id: string;
  specializations?: string[];
  certification_url?: string;
  experience_years?: number;
  is_available: boolean;
  status: 'active' | 'inactive' | 'suspended';
  average_rating?: number;
  total_jobs_completed: number;
  created_at: string;
  updated_at: string;
  profile?: any; // User profile info
  category?: TechnicianCategory;
}

export interface TechnicianPropertyAssignment {
  id: string;
  technician_id: string;
  property_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export interface TechnicianJobUpdate {
  id: string;
  maintenance_request_id: string;
  technician_id: string;
  status: 'accepted' | 'in_progress' | 'completed' | 'rejected' | 'on_hold';
  notes?: string;
  update_type: 'status_change' | 'comment' | 'schedule_update';
  created_by: string;
  created_at: string;
}

// Types for Proprietor System
export interface Proprietor {
  id: string;
  user_id: string;
  business_name?: string;
  business_registration_number?: string;
  business_license_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  bank_account_holder?: string;
  bank_account_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
  profile?: any;
}

export interface ProprietorProperty {
  id: string;
  proprietor_id: string;
  property_id: string;
  ownership_percentage: number;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
}

export interface ProprietorReport {
  id: string;
  proprietor_id: string;
  property_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'occupancy' | 'financial' | 'maintenance';
  title: string;
  description?: string;
  data?: Record<string, any>;
  status: 'draft' | 'pending' | 'approved' | 'sent';
  created_by: string;
  created_at: string;
  sent_at?: string;
  updated_at: string;
}

export interface ProprietorMessage {
  id: string;
  proprietor_id: string;
  sender_id: string;
  subject?: string;
  message: string;
  message_type: 'general' | 'alert' | 'report' | 'notification';
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: any;
}

// Types for Caretaker System
export interface Caretaker {
  id: string;
  user_id: string;
  property_id: string;
  property_manager_id: string;
  hire_date?: string;
  assignment_date: string;
  assigned_by: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_rating?: number;
  created_at: string;
  updated_at: string;
  profile?: any;
  property?: any;
}

// Enhanced Maintenance Request Type
export interface MaintenanceRequestEnhanced {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  image_url?: string;
  assigned_to_technician_id?: string;
  category_id?: string;
  is_escalated_to_manager: boolean;
  escalated_at?: string;
  technician_response_deadline?: string;
  assigned_vendor_id?: string;
  scheduled_date?: string;
  
  // Work documentation
  work_start_photo?: string;
  work_progress_photos?: string[];
  work_completion_photo?: string;
  work_description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  work_completed_at?: string;
  rating_by_tenant?: number;
  
  created_at: string;
  updated_at: string;
  technician?: Technician;
  category?: TechnicianCategory;
  tenant?: any;
  property?: any;
}

// Types for Accountant System
export interface Accountant {
  id: string;
  user_id: string;
  employee_id?: string;
  hire_date?: string;
  assignment_date: string;
  assigned_by: string;
  status: 'active' | 'inactive' | 'suspended';
  transactions_processed: number;
  accuracy_rating?: number;
  created_at: string;
  updated_at: string;
  profile?: any;
}

export interface AccountingTransaction {
  id: string;
  property_id: string;
  transaction_type: 'deposit' | 'rent' | 'bill' | 'payment';
  amount: number;
  description?: string;
  tenant_id?: string;
  property_manager_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  pending_from: string;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  property?: any;
  property_manager?: any;
  tenant?: any;
}

export interface AccountingDashboardData {
  totalPending: number;
  totalProcessed: number;
  totalAmount: number;
  pendingAmount: number;
  transactions: AccountingTransaction[];
  summaryByType: {
    deposits: { count: number; amount: number };
    rent: { count: number; amount: number };
    bills: { count: number; amount: number };
    payments: { count: number; amount: number };
  };
}
