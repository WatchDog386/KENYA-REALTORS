// Database Types - Updated for Schema Fix (February 6, 2026)
// All types match the corrected Supabase schema

// ============================================================================
// PROFILES
// ============================================================================
export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'super_admin' | 'property_manager' | 'tenant' | 'maintenance' | 'accountant';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

// ============================================================================
// PROPERTIES
// ============================================================================
export interface Property {
  id: string;
  name: string;
  location: string;
  description: string | null;
  type: string | null;
  image_url: string | null;
  amenities: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROPERTY_UNIT_TYPES
// ============================================================================
export interface PropertyUnitType {
  id: string;
  property_id: string;
  unit_type_name: string;
  unit_category: string;
  total_units_of_type: number;
  price_per_unit: number;
  occupied_count: number;
  vacant_count: number;
  maintenance_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UNITS
// ============================================================================
export interface Unit {
  id: string;
  property_id: string;
  unit_type_id: string;
  unit_number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROPERTY_MANAGER_ASSIGNMENTS (1:1 mapping)
// ============================================================================
export interface PropertyManagerAssignment {
  id: string;
  property_manager_id: string;
  property_id: string;
  status: 'active' | 'inactive' | 'transferred';
  assigned_at: string;
}

// ============================================================================
// TENANTS (1:1 user-to-tenant mapping)
// ============================================================================
export interface Tenant {
  id: string;
  user_id: string; // UNIQUE - one tenant per user
  property_id: string;
  unit_id: string;
  status: 'active' | 'pending' | 'notice_given' | 'inactive';
  move_in_date: string | null;
  move_out_date: string | null;
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_email: string | null;
  employment_status: 'employed' | 'self_employed' | 'student' | 'retired' | 'unemployed' | 'other' | null;
  employer_name: string | null;
  monthly_income: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEASES
// ============================================================================
export interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  lease_file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// RENT_PAYMENTS (UPDATED - NEW COLUMNS)
// ============================================================================
export interface RentPayment {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string; // ← NEW
  amount: number;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null; // ← NEW (bank_transfer, credit_card, etc.)
  transaction_id: string | null; // ← NEW
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'waived';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MAINTENANCE_REQUESTS (UPDATED - NEW COLUMNS)
// ============================================================================
export interface MaintenanceRequest {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  title: string;
  description: string | null;
  image_url: string | null; // ← NEW
  manager_notes: string | null; // ← NEW
  completed_at: string | null; // ← NEW
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'normal' | 'high' | 'emergency';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VACATION_NOTICES (UPDATED - NEW COLUMNS)
// ============================================================================
export interface VacationNotice {
  id: string;
  lease_id: string | null;
  tenant_id: string; // ← NEW
  unit_id: string; // ← NEW
  property_id: string; // ← NEW
  notice_date: string;
  intended_vacate_date: string;
  actual_vacate_date: string | null;
  reason_for_leaving: string | null;
  forwarding_address: string | null;
  forwarding_phone: string | null;
  acknowledged_by: string | null; // ← NEW
  acknowledged_at: string | null; // ← NEW
  status: 'notice_given' | 'acknowledged' | 'completed'; // ← NEW
  created_at: string;
  updated_at: string;
}

// ============================================================================
// BILLS_AND_UTILITIES (NEW TABLE)
// ============================================================================
export interface BillAndUtility {
  id: string;
  unit_id: string;
  property_id: string;
  bill_type: string;
  provider: string | null;
  amount: number | null;
  bill_period_start: string | null;
  bill_period_end: string | null;
  due_date: string | null;
  status: 'open' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DEPOSITS (NEW TABLE)
// ============================================================================
export interface Deposit {
  id: string;
  tenant_id: string;
  unit_id: string;
  property_id: string;
  amount: number;
  status: 'held' | 'partially_released' | 'released' | 'forfeited';
  refund_amount: number | null;
  refund_date: string | null;
  refund_reason: string | null;
  created_at: string;
  released_at: string | null;
}

// ============================================================================
// MESSAGES (NEW TABLE)
// ============================================================================
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  property_id: string | null;
  subject: string | null;
  content: string;
  message_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// ============================================================================
// APPROVALS (NEW TABLE)
// ============================================================================
export interface Approval {
  id: string;
  user_id: string;
  approval_type: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_role: string | null;
  property_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUPPORT_TICKETS
// ============================================================================
export interface SupportTicket {
  id: string;
  tenant_id: string; // References auth.users(id) - FIXED
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  updated_at: string;
}
