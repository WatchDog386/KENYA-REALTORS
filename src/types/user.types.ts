// src/types/user.types.ts

// Unified User Profile (from profiles table)
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string | null;
  role: 'tenant' | 'property_manager' | 'super_admin' | 'maintenance' | 'accountant';
  user_type?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  is_active: boolean;
  avatar_url?: string | null;
  property_id?: string | null; // For tenant/manager assignments
  unit_id?: string | null; // For tenant housing assignment
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export type UserRole = 'tenant' | 'property_manager' | 'super_admin' | 'maintenance' | 'accountant';

export interface CreateUserInput {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password: string;
  
  // Additional optional fields
  date_of_birth?: string;
  nationality?: string;
  preferred_language?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  id_document_type?: string;
  id_document_number?: string;
  id_document_expiry?: string;
  tax_id?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'suspended';
  avatar_url?: string;
}
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  id_document_type?: string;
  id_document_number?: string;
  id_document_expiry?: string;
  tax_id?: string;
}