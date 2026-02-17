import { supabase } from '@/integrations/supabase/client';

/**
 * Super Admin Management Service
 * Handles user management across all roles: create, suspend, deactivate
 */

export interface UserManagementData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'technician' | 'proprietor' | 'caretaker' | 'accountant' | 'property_manager' | 'tenant';
  roleSpecificData?: any; // Additional data based on role
}

// ============================================================================
// USER CREATION BY ROLE
// ============================================================================

/**
 * Create a new user with specified role
 * Handles user creation + role-specific profile setup
 */
export const createUserWithRole = async (
  userData: UserManagementData
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    // 1. Create auth user via Supabase Auth (using admin API would be needed in production)
    // For now, this returns the structure - actual implementation uses Supabase Auth Admin
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: Math.random().toString(36).slice(-12), // Temporary password
    });

    if (authError) throw authError;
    if (!authData.user?.id) throw new Error('Failed to create user');

    const userId = authData.user.id;

    // 2. Create profile with role
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        role: userData.role,
      },
    ]);

    if (profileError) throw profileError;

    // 3. Create role-specific profile
    await createRoleSpecificProfile(userId, userData);

    return { success: true, userId };
  } catch (error: any) {
    console.error('Error creating user with role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create role-specific profile based on role
 */
const createRoleSpecificProfile = async (userId: string, userData: UserManagementData) => {
  try {
    const assignedBy = (await supabase.auth.getUser()).data.user?.id || '';

    switch (userData.role) {
      case 'technician':
        await supabase.from('technicians').insert([
          {
            user_id: userId,
            category_id: userData.roleSpecificData?.category_id,
            specializations: userData.roleSpecificData?.specializations || [],
            certification_url: userData.roleSpecificData?.certification_url,
            experience_years: userData.roleSpecificData?.experience_years || 0,
            is_available: true,
            status: 'active',
          },
        ]);
        break;

      case 'proprietor':
        await supabase.from('proprietors').insert([
          {
            user_id: userId,
            business_name: userData.roleSpecificData?.business_name,
            business_registration_number: userData.roleSpecificData?.business_registration_number,
            business_license_url: userData.roleSpecificData?.business_license_url,
            status: 'active',
            bank_account_holder: userData.roleSpecificData?.bank_account_holder,
            bank_account_number: userData.roleSpecificData?.bank_account_number,
            bank_name: userData.roleSpecificData?.bank_name,
          },
        ]);
        break;

      case 'caretaker':
        await supabase.from('caretakers').insert([
          {
            user_id: userId,
            property_id: userData.roleSpecificData?.property_id,
            property_manager_id: userData.roleSpecificData?.property_manager_id,
            hire_date: userData.roleSpecificData?.hire_date || new Date().toISOString().split('T')[0],
            assigned_by: assignedBy,
            status: 'active',
          },
        ]);
        break;

      case 'accountant':
        await supabase.from('accountants').insert([
          {
            user_id: userId,
            employee_id: userData.roleSpecificData?.employee_id,
            hire_date: userData.roleSpecificData?.hire_date || new Date().toISOString().split('T')[0],
            assigned_by: assignedBy,
            status: 'active',
          },
        ]);
        break;

      case 'property_manager':
        // Property manager might have different setup
        break;

      case 'tenant':
        // Tenant setup if needed
        break;
    }
  } catch (error) {
    console.error('Error creating role-specific profile:', error);
  }
};

// ============================================================================
// USER STATUS MANAGEMENT
// ============================================================================

/**
 * Suspend user across all roles
 */
export const suspendUser = async (userId: string): Promise<boolean> => {
  try {
    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const role = profile?.role;

    // Update role-specific table
    switch (role) {
      case 'technician':
        await supabase
          .from('technicians')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'proprietor':
        await supabase
          .from('proprietors')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'caretaker':
        await supabase
          .from('caretakers')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'accountant':
        await supabase
          .from('accountants')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
    }

    return true;
  } catch (error) {
    console.error('Error suspending user:', error);
    return false;
  }
};

/**
 * Deactivate user (soft delete)
 */
export const deactivateUser = async (userId: string): Promise<boolean> => {
  try {
    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const role = profile?.role;

    // Update role-specific table
    switch (role) {
      case 'technician':
        await supabase
          .from('technicians')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'proprietor':
        await supabase
          .from('proprietors')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'caretaker':
        await supabase
          .from('caretakers')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'accountant':
        await supabase
          .from('accountants')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
    }

    return true;
  } catch (error) {
    console.error('Error deactivating user:', error);
    return false;
  }
};

/**
 * Reactivate user
 */
export const reactivateUser = async (userId: string): Promise<boolean> => {
  try {
    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const role = profile?.role;

    // Update role-specific table
    switch (role) {
      case 'technician':
        await supabase
          .from('technicians')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'proprietor':
        await supabase
          .from('proprietors')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'caretaker':
        await supabase
          .from('caretakers')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      case 'accountant':
        await supabase
          .from('accountants')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
    }

    return true;
  } catch (error) {
    console.error('Error reactivating user:', error);
    return false;
  }
};

// ============================================================================
// USER LISTING & SEARCHING
// ============================================================================

/**
 * Get all users with a specific role
 */
export const getUsersByRole = async (
  role: 'technician' | 'proprietor' | 'caretaker' | 'accountant' | 'property_manager' | 'tenant'
) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
};

/**
 * Get all active users
 */
export const getAllActiveUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'super_admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

/**
 * Search users by email or name
 */
export const searchUsers = async (searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Get user details with role-specific info
 */
export const getUserWithRoleDetails = async (userId: string) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    let roleData = null;

    switch (profile?.role) {
      case 'technician':
        const { data: techData } = await supabase
          .from('technicians')
          .select('*, category:category_id(*)')
          .eq('user_id', userId)
          .single();
        roleData = techData;
        break;
      case 'proprietor':
        const { data: propData } = await supabase
          .from('proprietors')
          .select('*')
          .eq('user_id', userId)
          .single();
        roleData = propData;
        break;
      case 'caretaker':
        const { data: careData } = await supabase
          .from('caretakers')
          .select('*, property:property_id(*), property_manager:property_manager_id(*)')
          .eq('user_id', userId)
          .single();
        roleData = careData;
        break;
      case 'accountant':
        const { data: accData } = await supabase
          .from('accountants')
          .select('*')
          .eq('user_id', userId)
          .single();
        roleData = accData;
        break;
    }

    return { profile, roleData };
  } catch (error) {
    console.error('Error fetching user with role details:', error);
    return null;
  }
};

/**
 * Get role statistics
 */
export const getRoleStatistics = async () => {
  try {
    const roles = ['technician', 'proprietor', 'caretaker', 'accountant', 'property_manager', 'tenant'];
    const stats = {};

    for (const role of roles) {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', role);

      if (!error) {
        stats[role] = count || 0;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error fetching role statistics:', error);
    return {};
  }
};
