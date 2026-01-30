// src/types/user.types.ts

// Tenant user (old table)
export interface TenantUser {
  id: string;
  uuid: string;
  email: string;
  full_name: string;
  phone?: string | null;
  tenant: string; // Actually stores role: 'tenant', 'super_admin', 'property_manager'
  created_at: string;
  updated_at: string;
}

// Property Manager/Admin user (new table)
export interface PropertyManagerUser {
  id: string;
  user_id: string;
  user_type: 'property_manager' | 'super_admin';
  full_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  preferred_language?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  id_document_type?: string;
  id_document_number?: string;
  id_document_expiry?: string | null;
  tax_id?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'tenant' | 'property_manager' | 'super_admin';
export type UserType = TenantUser | PropertyManagerUser;

export interface CreateUserInput {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password: string;
  
  // Additional fields for property managers
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