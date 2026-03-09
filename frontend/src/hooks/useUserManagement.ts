// src/hooks/useUserManagement.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Role interface
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Updated interface to match your profiles table exactly
interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role: 'super_admin' | 'property_manager' | 'tenant' | 'maintenance' | 'accountant' | 'unassigned';
  user_type?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  avatar_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_by?: string;
  is_active?: boolean;
}

// NEW: Extended user profile with roles and permissions
interface UserWithRoles extends UserProfile {
  roles?: Role[];
  permissions?: string[];
  assigned_roles?: Array<{
    id: string;
    role: Role;
    assigned_at: string;
    assigned_by?: string;
  }>;
}

// NEW: Property Manager interface
interface PropertyManager {
  id: string;
  user_id: string;
  license_number?: string;
  experience_years?: number;
  specializations?: string[];
  portfolio?: any;
  assigned_properties_count?: number;
  performance_rating?: number;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

// NEW: Tenant interface
interface Tenant {
  id: string;
  user_id: string;
  property_id?: string;
  unit_id?: string;
  status: string;
  move_in_date?: string;
  move_out_date?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  identity_document_type?: string;
  identity_document_number?: string;
  identity_verified?: boolean;
  employment_status?: string;
  employer_name?: string;
  employer_contact?: string;
  monthly_income?: number;
  reference?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  lease_id?: string;
  emergency_contact_name?: string;
  vehicle_info?: any;
  preferred_contact_method?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  user?: UserProfile;
}

// NEW: Role assignment data interface
interface RoleAssignmentData {
  // Property Manager specific fields
  license_number?: string;
  experience_years?: number;
  specializations?: string[];
  
  // Tenant specific fields
  property_id?: string;
  unit_id?: string;
  identity_document_type?: string;
  identity_document_number?: string;
  employment_status?: string;
  employer_name?: string;
  monthly_income?: number;
  emergency_contact_email?: string;
  move_in_date?: string;
  lease_start_date?: string;
  lease_end_date?: string;
}

interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  user_type?: string;
  role?: 'super_admin' | 'property_manager' | 'tenant' | 'maintenance' | 'accountant' | 'unassigned';
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active?: boolean;
  avatar_url?: string;
  metadata?: any;
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const ITEMS_PER_PAGE = 20;

  // Test database connection
  const testDbConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single();

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }, []);

  // Fetch properties for tenant assignment
  const fetchProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, property_name, address, city, state')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }, []);

  // Fetch units for a specific property
  const fetchUnitsByProperty = useCallback(async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, unit_type, rent_amount, status, property_id, bedrooms, bathrooms')
        .eq('property_id', propertyId)
        .eq('status', 'vacant')
        .order('unit_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    }
  }, []);

  // UPDATED: Fetch all users with proper unassigned user handling
  const fetchUsers = useCallback(async (page: number = 1, role?: string, search?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      // Filter by role if specified
      if (role && role !== 'all') {
        if (role === 'unassigned') {
          // Get users without specific roles (tenants or unassigned)
          query = query.or('role.is.null,role.eq.tenant,role.eq.unassigned');
        } else {
          query = query.eq('role', role);
        }
      }
      
      // Search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      // Calculate pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          throw new Error('Database schema issue. Ensure profiles table exists.');
        }
        throw error;
      }
      
      // Process data to ensure all fields are present
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'tenant',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      
      setUsers(processedData);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
      return processedData;
    } catch (err: any) {
      console.error('Error fetching users:', err);
      
      if (err.message.includes('Database schema')) {
        toast.error('Database Setup Required', {
          description: 'Please ensure your Supabase database has the proper schema setup.'
        });
      } else {
        toast.error('Failed to load users');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // UPDATED: Fetch available users for role assignment (unassigned users)
  const fetchAvailableUsersForRoleAssignment = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get users who are unassigned (no specific role or tenant role)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.is.null,role.eq.tenant,role.eq.unassigned')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process data
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'unassigned',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching available users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Fetch assigned users (users with specific roles)
  const fetchAssignedUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get users with specific roles (excluding tenant and unassigned)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['super_admin', 'property_manager', 'maintenance', 'accountant'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process data
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'unassigned',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Fetch all users for display (combines assigned and available)
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get ALL users from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process data
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'unassigned',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Fetch only users who have logged in (last_login_at IS NOT NULL)
  const fetchLoggedInUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get users with a non-null last_login_at
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('last_login_at', 'is', null)
        .order('last_login_at', { ascending: false });

      if (error) throw error;

      // Process data
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'unassigned',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));

      // Update the hook's users state so components can use it directly
      setUsers(processedData);

      return processedData;
    } catch (error) {
      console.error('Error fetching logged-in users:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Fetch users with their roles and permissions from roles table
  const fetchUsersWithRoles = useCallback(async (page: number = 1, roleFilter?: string) => {
    try {
      setLoading(true);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Fetch users with their assigned roles from user_roles table
      const { data, error, count } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            id,
            role_id,
            assigned_at,
            assigned_by,
            roles (
              id,
              name,
              description,
              permissions,
              is_default
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Process data and extract permissions from roles
      const processedData = (data || []).map((user: any) => {
        const roles = user.user_roles?.map((ur: any) => ur.roles) || [];
        const permissions = Array.from(
          new Set(roles.flatMap((r: any) => r?.permissions || []))
        ) as string[];

        return {
          ...user,
          roles,
          permissions,
          assigned_roles: user.user_roles?.map((ur: any) => ({
            id: ur.id,
            role: ur.roles,
            assigned_at: ur.assigned_at,
            assigned_by: ur.assigned_by,
          })) || [],
        };
      });

      setUsers(processedData);
      setCurrentPage(page);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      return processedData;
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      toast.error('Failed to load users with roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Fetch a single user with all their roles and permissions
  const fetchUserWithRoles = useCallback(async (userId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            id,
            role_id,
            assigned_at,
            assigned_by,
            roles (
              id,
              name,
              description,
              permissions,
              is_default
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        const roles = data.user_roles?.map((ur: any) => ur.roles) || [];
        const permissions = Array.from(
          new Set(roles.flatMap((r: any) => r?.permissions || []))
        ) as string[];

        const processedUser = {
          ...data,
          roles,
          permissions,
          assigned_roles: data.user_roles?.map((ur: any) => ({
            id: ur.id,
            role: ur.roles,
            assigned_at: ur.assigned_at,
            assigned_by: ur.assigned_by,
          })) || [],
        };

        setSelectedUser(processedUser);
        return processedUser as UserWithRoles;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user with roles:', error);
      toast.error('Failed to load user details');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch property managers with their details
  const fetchPropertyManagers = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('property_managers')
        .select(`
          *,
          user:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as PropertyManager[];
    } catch (error) {
      console.error('Error fetching property managers:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tenants with their details
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          user:profiles(*),
          property:properties(id, name),
          unit:units(id, unit_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Tenant[];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get detailed tenant information
  const fetchTenantDetails = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          user:profiles(*),
          property:properties(*),
          unit:units(*),
          lease:leases(*)
        `)
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      
      return data as Tenant;
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get detailed property manager information
  const fetchPropertyManagerDetails = useCallback(async (managerId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('property_managers')
        .select(`
          *,
          user:profiles(*),
          assignments:manager_assignments(*, property:properties(*))
        `)
        .eq('id', managerId)
        .single();

      if (error) throw error;
      
      return data as PropertyManager;
    } catch (error) {
      console.error('Error fetching property manager details:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users by query
  const searchUsers = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setSearchQuery(query);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);

      if (error) throw error;
      
      // Process data
      const processedData = (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        phone: user.phone || '',
        role: user.role || 'tenant',
        user_type: user.user_type || 'tenant',
        status: user.status || 'active',
        avatar_url: user.avatar_url,
        metadata: user.metadata,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_phone: user.emergency_contact_phone,
        created_by: user.created_by,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      
      setUsers(processedData);
      setCurrentPage(1);
      setTotalPages(1);
      
      return processedData;
    } catch (err: any) {
      console.error('Error searching users:', err);
      toast.error('Failed to search users');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user by ID
  const fetchUserById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const processedUser = {
        id: data.id,
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email,
        phone: data.phone || '',
        role: data.role || 'tenant',
        user_type: data.user_type || 'tenant',
        status: data.status || 'active',
        avatar_url: data.avatar_url,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_login_at: data.last_login_at,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        created_by: data.created_by,
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      
      setSelectedUser(processedUser);
      return processedUser;
    } catch (err: any) {
      console.error('Error fetching user:', err);
      toast.error('User not found');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Mark user as unassigned
  const markUserAsUnassigned = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: 'unassigned',
          user_type: 'tenant',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ User marked as unassigned:', data);
      
      // Remove from role-specific tables if exists
      try {
        await supabase
          .from('property_managers')
          .delete()
          .eq('user_id', userId);
      } catch (pmError) {
        console.warn('Could not delete property manager record:', pmError);
      }
      
      try {
        await supabase
          .from('tenants')
          .delete()
          .eq('user_id', userId);
      } catch (tenantError) {
        console.warn('Could not delete tenant record:', tenantError);
      }
      
      toast.success('User marked as unassigned');
      
      // Refresh users list
      await fetchUsers(currentPage);
      
      return data;
    } catch (err: any) {
      console.error('❌ Error marking user as unassigned:', err);
      toast.error(`Failed to mark user as unassigned: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, currentPage]);

  // Assign role to existing user
  const assignRoleToUser = useCallback(async (userId: string, role: 'property_manager' | 'tenant' | 'maintenance' | 'accountant' | 'super_admin' | 'unassigned', roleData?: RoleAssignmentData) => {
    try {
      setLoading(true);
      
      console.log('🚀 Assigning role to user:', { userId, role, roleData });
      
      // Get the current user who's assigning the role (admin)
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Calculate user_type based on role
      const user_type = role === 'super_admin' ? 'super_admin' :
                       role === 'property_manager' ? 'property_manager' :
                       role === 'unassigned' ? 'tenant' : 'tenant';
      
      // Step 1: Update user role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          role: role,
          user_type: user_type,
          status: 'active',
          updated_at: new Date().toISOString(),
          created_by: currentUser.user?.id || null,
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) throw profileError;

      console.log('✅ User role updated in profiles:', profileData);
      
      // Step 2: Create specific records based on role
      if (role === 'property_manager') {
        await assignPropertyManagerRole(userId, roleData);
      } else if (role === 'tenant') {
        await assignTenantRole(userId, roleData);
      } else if (role === 'unassigned') {
        // Remove from role-specific tables
        await markUserAsUnassigned(userId);
      }
      
      // Step 3: Send password reset email for property managers (if they need to set password)
      if (role === 'property_manager') {
        try {
          const { data: user } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
          
          if (user?.email) {
            await supabase.auth.resetPasswordForEmail(user.email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            console.log('✅ Password reset email sent to property manager');
          }
        } catch (passwordError) {
          console.warn('Could not send password reset email:', passwordError);
        }
      }
      
      // Refresh users list
      await fetchUsers(currentPage);
      
      toast.success('Role assigned successfully', {
        description: `User has been assigned as ${role === 'unassigned' ? 'unassigned' : `a ${role}`}`
      });
      
      return profileData;
    } catch (err: any) {
      console.error('❌ Error assigning role:', err);
      
      let errorMessage = 'Failed to assign role';
      let errorDescription = err.message || 'An unknown error occurred';
      
      if (err.message.includes('User not found')) {
        errorMessage = 'User Not Found';
        errorDescription = 'The specified user does not exist in the system.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 10000,
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, currentPage, markUserAsUnassigned]);

  // Assign property manager role to existing user
  const assignPropertyManagerRole = useCallback(async (userId: string, roleData?: RoleAssignmentData) => {
    try {
      // Check if property manager record already exists
      const { data: existingManager } = await supabase
        .from('property_managers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let result;
      
      if (existingManager) {
        // Update existing record
        const { data, error } = await supabase
          .from('property_managers')
          .update({
            license_number: roleData?.license_number || '',
            experience_years: roleData?.experience_years || 0,
            specializations: roleData?.specializations || [],
            is_available: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log('✅ Property manager record updated:', data);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('property_managers')
          .insert([{
            user_id: userId,
            license_number: roleData?.license_number || '',
            experience_years: roleData?.experience_years || 0,
            specializations: roleData?.specializations || [],
            portfolio: {},
            assigned_properties_count: 0,
            performance_rating: 0,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log('✅ Property manager record created:', data);
      }
      
      return result;
    } catch (error) {
      console.error('Error assigning property manager role:', error);
      throw error;
    }
  }, []);

  // Assign tenant role to existing user
  const assignTenantRole = useCallback(async (userId: string, roleData?: RoleAssignmentData) => {
    try {
      // Check if tenant record already exists
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id, unit_id')
        .eq('user_id', userId)
        .maybeSingle();

      let result;
      
      if (existingTenant) {
        // Update existing record
        const { data, error } = await supabase
          .from('tenants')
          .update({
            property_id: roleData?.property_id || null,
            unit_id: roleData?.unit_id || null,
            identity_document_type: roleData?.identity_document_type || null,
            identity_document_number: roleData?.identity_document_number || null,
            employment_status: roleData?.employment_status || null,
            employer_name: roleData?.employer_name || null,
            monthly_income: roleData?.monthly_income || null,
            emergency_contact_email: roleData?.emergency_contact_email || null,
            move_in_date: roleData?.move_in_date ? new Date(roleData.move_in_date).toISOString() : null,
            lease_start_date: roleData?.lease_start_date ? new Date(roleData.lease_start_date).toISOString() : null,
            lease_end_date: roleData?.lease_end_date ? new Date(roleData.lease_end_date).toISOString() : null,
            status: 'active',
            identity_verified: false,
            preferred_contact_method: 'email',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Update unit status if unit changed
        if (roleData?.unit_id && roleData.unit_id !== existingTenant.unit_id) {
          // Free up old unit
          if (existingTenant.unit_id) {
            await supabase
              .from('units')
              .update({ status: 'vacant' })
              .eq('id', existingTenant.unit_id);
          }
          // Occupy new unit
          await supabase
            .from('units')
            .update({ status: 'occupied' })
            .eq('id', roleData.unit_id);
        }
        
        console.log('✅ Tenant record updated:', data);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('tenants')
          .insert([{
            user_id: userId,
            property_id: roleData?.property_id || null,
            unit_id: roleData?.unit_id || null,
            status: 'active',
            identity_document_type: roleData?.identity_document_type || null,
            identity_document_number: roleData?.identity_document_number || null,
            employment_status: roleData?.employment_status || null,
            employer_name: roleData?.employer_name || null,
            monthly_income: roleData?.monthly_income || null,
            emergency_contact_email: roleData?.emergency_contact_email || null,
            move_in_date: roleData?.move_in_date ? new Date(roleData.move_in_date).toISOString() : null,
            lease_start_date: roleData?.lease_start_date ? new Date(roleData.lease_start_date).toISOString() : null,
            lease_end_date: roleData?.lease_end_date ? new Date(roleData.lease_end_date).toISOString() : null,
            identity_verified: false,
            preferred_contact_method: 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
        
        // Update unit status to occupied
        if (roleData?.unit_id) {
          await supabase
            .from('units')
            .update({ status: 'occupied' })
            .eq('id', roleData.unit_id);
        }
        
        console.log('✅ Tenant record created:', data);
      }
      
      return result;
    } catch (error) {
      console.error('Error assigning tenant role:', error);
      throw error;
    }
  }, []);

  // Create property manager record
  const createPropertyManagerRecord = useCallback(async (userId: string, metadata: any = {}, additionalData: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('property_managers')
        .insert([{
          user_id: userId,
          license_number: metadata.license_number || additionalData.license_number || '',
          experience_years: metadata.experience_years || additionalData.experience_years || 0,
          specializations: metadata.specializations || additionalData.specializations || [],
          portfolio: {},
          assigned_properties_count: 0,
          performance_rating: 0,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Property manager record created:', data);
      return data;
    } catch (error) {
      console.error('Error creating property manager record:', error);
      throw error;
    }
  }, []);

  // Create tenant record
  const createTenantRecord = useCallback(async (userId: string, metadata: any = {}, additionalData: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([{
          user_id: userId,
          property_id: metadata.property_id || additionalData.property_id || null,
          unit_id: metadata.unit_id || additionalData.unit_id || null,
          status: 'active',
          move_in_date: metadata.move_in_date || additionalData.move_in_date ? new Date(metadata.move_in_date || additionalData.move_in_date).toISOString() : null,
          emergency_contact_name: metadata.emergency_contact_name || additionalData.emergency_contact_name || null,
          emergency_contact_phone: metadata.emergency_contact_phone || additionalData.emergency_contact_phone || null,
          emergency_contact_email: metadata.emergency_contact_email || additionalData.emergency_contact_email || null,
          identity_document_type: metadata.identity_document_type || additionalData.identity_document_type || null,
          identity_document_number: metadata.identity_document_number || additionalData.identity_document_number || null,
          employment_status: metadata.employment_status || additionalData.employment_status || null,
          employer_name: metadata.employer_name || additionalData.employer_name || null,
          employer_contact: metadata.employer_contact || additionalData.employer_contact || null,
          monthly_income: metadata.monthly_income || additionalData.monthly_income || null,
          identity_verified: false,
          lease_start_date: metadata.lease_start_date || additionalData.lease_start_date ? new Date(metadata.lease_start_date || additionalData.lease_start_date).toISOString() : null,
          lease_end_date: metadata.lease_end_date || additionalData.lease_end_date ? new Date(metadata.lease_end_date || additionalData.lease_end_date).toISOString() : null,
          preferred_contact_method: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update unit status to occupied if unit_id is provided
      if (metadata.unit_id || additionalData.unit_id) {
        const unitId = metadata.unit_id || additionalData.unit_id;
        await supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', unitId);
          
        console.log('✅ Unit status updated to occupied:', unitId);
      }
      
      console.log('✅ Tenant record created:', data);
      return data;
    } catch (error) {
      console.error('Error creating tenant record:', error);
      throw error;
    }
  }, []);

  // Update tenant record
  const updateTenantRecord = useCallback(async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating tenant record:', error);
      throw error;
    }
  }, []);

  // Update property manager record
  const updatePropertyManagerRecord = useCallback(async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('property_managers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error updating property manager record:', error);
      throw error;
    }
  }, []);

  // Delete tenant record
  const deleteTenantRecord = useCallback(async (userId: string) => {
    try {
      // First get the tenant to check if they have a unit assigned
      const { data: tenant } = await supabase
        .from('tenants')
        .select('unit_id')
        .eq('user_id', userId)
        .single();

      // Delete tenant record
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // If tenant had a unit, update it to vacant
      if (tenant?.unit_id) {
        await supabase
          .from('units')
          .update({ status: 'vacant' })
          .eq('id', tenant.unit_id);
      }

      return true;
    } catch (error) {
      console.error('Error deleting tenant record:', error);
      throw error;
    }
  }, []);

  // Delete property manager record
  const deletePropertyManagerRecord = useCallback(async (userId: string) => {
    try {
      // Check if property manager has assigned properties
      const { data: assignments } = await supabase
        .from('manager_assignments')
        .select('id')
        .eq('manager_id', userId);

      if (assignments && assignments.length > 0) {
        throw new Error('Cannot delete property manager with assigned properties. Reassign properties first.');
      }

      const { error } = await supabase
        .from('property_managers')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting property manager record:', error);
      throw error;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id: string, updates: UpdateUserData) => {
    try {
      setLoading(true);
      
      // Recalculate full_name if first or last name changed
      if (updates.first_name || updates.last_name) {
        const currentUser = users.find(u => u.id === id);
        if (currentUser) {
          const newFirstName = updates.first_name || currentUser.first_name || '';
          const newLastName = updates.last_name || currentUser.last_name || '';
          updates.full_name = `${newFirstName} ${newLastName}`.trim();
        }
      }
      
      // Calculate user_type based on role if role is changing
      if (updates.role) {
        updates.user_type = updates.role === 'super_admin' ? 'super_admin' :
                           updates.role === 'property_manager' ? 'property_manager' :
                           updates.role === 'unassigned' ? 'tenant' : 'tenant';
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('User updated successfully');
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      if (selectedUser?.id === id) {
        setSelectedUser(data);
      }
      
      return data;
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(`Failed to update user: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedUser, users]);

  // UPDATED: Delete user with support for property managers, tenants, and unassigned users
  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      // Check if user exists and get their role
      const { data: userData, error: fetchError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error('User not found');
      }

      const userRole = userData?.role;

      // Check if user is a manager with assigned properties
      if (userRole === 'property_manager') {
        const { data: properties, error: propsError } = await supabase
          .from('properties')
          .select('id')
          .or(`property_manager_id.eq.${id},manager_id.eq.${id}`)
          .limit(1);

        if (!propsError && properties && properties.length > 0) {
          throw new Error('Cannot delete property manager with assigned properties. Reassign properties first.');
        }
        
        // Delete property manager record
        await deletePropertyManagerRecord(id);
      }
      
      // Check if user is a tenant and delete tenant record
      if (userRole === 'tenant') {
        await deleteTenantRecord(id);
      }

      // Delete from profiles table first
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Also delete from auth.users using service role
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey && serviceRoleKey !== 'your-service-role-key-here') {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
            },
          });
        } catch (authError) {
          console.warn('Could not delete auth user:', authError);
        }
      }
      
      // Delete related records
      try {
        await supabase.from('user_profiles').delete().eq('user_id', id);
      } catch (e) { console.warn('Could not delete user_profiles:', e); }
      
      try {
        await supabase.from('user_preferences').delete().eq('user_id', id);
      } catch (e) { console.warn('Could not delete user_preferences:', e); }
      
      toast.success('User deleted successfully');
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== id));
      if (selectedUser?.id === id) {
        setSelectedUser(null);
      }
      
      // Refresh users list
      await fetchUsers(currentPage);
      
      return true;
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error(`Failed to delete user: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedUser, currentPage, fetchUsers, deletePropertyManagerRecord, deleteTenantRecord]);

  // Suspend user
  const suspendUser = useCallback(async (userId: string, reason: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: 'suspended',
          is_active: false,
          updated_at: new Date().toISOString(),
          metadata: {
            suspension_reason: reason,
            suspended_at: new Date().toISOString()
          }
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Also update tenant status if user is a tenant
      if (data.role === 'tenant') {
        try {
          await supabase
            .from('tenants')
            .update({ status: 'suspended' })
            .eq('user_id', userId);
        } catch (tenantError) {
          console.warn('Could not update tenant status:', tenantError);
        }
      }
      
      // Log the suspension in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'USER_SUSPENDED',
          entity_type: 'user',
          entity_id: userId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          details: { reason: reason }
        });

      if (auditError) {
        console.warn('Failed to log suspension to audit logs:', auditError);
      }
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'suspended', is_active: false, metadata: data.metadata } : u
      ));
      
      toast.success('User suspended successfully');
      return data;
    } catch (err: any) {
      console.error('Error suspending user:', err);
      toast.error(`Failed to suspend user: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Activate user
  const activateUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString(),
          metadata: {
            ...(await supabase.from('profiles').select('metadata').eq('id', userId).single()).data?.metadata,
            activated_at: new Date().toISOString()
          }
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Also update tenant status if user is a tenant
      if (data.role === 'tenant') {
        try {
          await supabase
            .from('tenants')
            .update({ status: 'active' })
            .eq('user_id', userId);
        } catch (tenantError) {
          console.warn('Could not update tenant status:', tenantError);
        }
      }
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'active', is_active: true, metadata: data.metadata } : u
      ));
      
      toast.success('User activated successfully');
      return data;
    } catch (err: any) {
      console.error('Error activating user:', err);
      toast.error(`Failed to activate user: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user role
  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    try {
      setLoading(true);
      
      // Get current user data
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const oldRole = currentUser?.role;
      
      // Calculate user_type based on new role
      const user_type = newRole === 'super_admin' ? 'super_admin' :
                       newRole === 'property_manager' ? 'property_manager' :
                       newRole === 'unassigned' ? 'tenant' : 'tenant';
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          user_type: user_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Handle role-specific table updates
      if (oldRole === 'tenant' && newRole !== 'tenant') {
        // Remove from tenants table
        await deleteTenantRecord(userId);
      } else if (oldRole === 'property_manager' && newRole !== 'property_manager') {
        // Remove from property_managers table
        await deletePropertyManagerRecord(userId);
      }
      
      if (newRole === 'property_manager') {
        // Add to property_managers table
        await createPropertyManagerRecord(userId);
      } else if (newRole === 'tenant') {
        // Add to tenants table with default values
        await createTenantRecord(userId);
      }
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole as any, user_type: user_type } : u
      ));
      
      toast.success('User role updated successfully');
      return data;
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast.error(`Failed to update user role: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [deleteTenantRecord, deletePropertyManagerRecord, createPropertyManagerRecord, createTenantRecord]);

  // Reset user password (triggers password reset email)
  const resetUserPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      toast.success('Password reset email sent successfully');
      return true;
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error(`Failed to send reset email: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // NEW: Get detailed statistics for users including unassigned count
  const getUserStats = useCallback(async () => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('role, status, is_active');

      if (usersError) throw usersError;
      
      // Get property managers count with details
      const { data: propertyManagers, error: pmError } = await supabase
        .from('property_managers')
        .select('id, assigned_properties_count, is_available');
        
      // Get tenants count with details
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, status, property_id, unit_id');

      const stats = {
        total: users.length,
        superAdmins: users.filter(u => u.role === 'super_admin').length,
        propertyManagers: users.filter(u => u.role === 'property_manager').length,
        tenants: users.filter(u => u.role === 'tenant').length,
        maintenance: users.filter(u => u.role === 'maintenance').length,
        accountants: users.filter(u => u.role === 'accountant').length,
        unassigned: users.filter(u => !u.role || u.role === 'unassigned' || u.role === 'tenant').length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        isActive: users.filter(u => u.is_active === true).length,
        isInactive: users.filter(u => u.is_active === false).length,
        
        // Detailed stats
        propertyManagersDetails: {
          total: propertyManagers?.length || 0,
          available: propertyManagers?.filter(pm => pm.is_available === true).length || 0,
          withAssignments: propertyManagers?.filter(pm => (pm.assigned_properties_count || 0) > 0).length || 0,
        },
        tenantsDetails: {
          total: tenants?.length || 0,
          active: tenants?.filter(t => t.status === 'active').length || 0,
          withProperty: tenants?.filter(t => t.property_id).length || 0,
          withUnit: tenants?.filter(t => t.unit_id).length || 0,
        }
      };
      
      return stats;
    } catch (err) {
      console.error('Error getting user stats:', err);
      return null;
    }
  }, []);

  // Bulk update users
  const bulkUpdateUsers = useCallback(async (userIds: string[], updates: Partial<UpdateUserData>) => {
    try {
      setLoading(true);
      
      // If updating names, need to handle full_name
      const processedUpdates = { ...updates };
      if (updates.first_name || updates.last_name) {
        delete processedUpdates.first_name;
        delete processedUpdates.last_name;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...processedUpdates,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds);

      if (error) throw error;
      
      toast.success(`${userIds.length} users updated successfully`);
      
      // Refresh users list
      await fetchUsers(currentPage);
      
      return true;
    } catch (err: any) {
      console.error('Error bulk updating users:', err);
      toast.error(`Failed to update users: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPage, fetchUsers]);

  // Export users to CSV
  const exportUsersToCSV = useCallback(async (userIds?: string[]) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*');
      
      if (userIds && userIds.length > 0) {
        query = query.in('id', userIds);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert to CSV
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status', 'Created At', 'Last Login', 'Emergency Contact', 'Emergency Phone'];
      const csvRows = [
        headers.join(','),
        ...data.map(user => [
          `"${user.first_name || ''}"`,
          `"${user.last_name || ''}"`,
          `"${user.email || ''}"`,
          `"${user.phone || ''}"`,
          `"${user.role || ''}"`,
          `"${user.status || ''}"`,
          `"${new Date(user.created_at).toLocaleDateString()}"`,
          `"${user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}"`,
          `"${user.emergency_contact_name || ''}"`,
          `"${user.emergency_contact_phone || ''}"`
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Users exported successfully');
      return true;
    } catch (err: any) {
      console.error('Error exporting users:', err);
      toast.error(`Failed to export users: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update last login time
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state if user is in the list
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, last_login_at: new Date().toISOString() } : u
      ));
      
      return true;
    } catch (err: any) {
      console.error('Error updating last login:', err);
      return false;
    }
  }, []);

  // Get user by role type
  const getUsersByType = useCallback(async (type: 'property_manager' | 'tenant' | 'other' | 'unassigned') => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*');
      
      if (type === 'property_manager') {
        query = query.eq('role', 'property_manager');
      } else if (type === 'tenant') {
        query = query.eq('role', 'tenant');
      } else if (type === 'unassigned') {
        query = query.or('role.is.null,role.eq.unassigned');
      } else {
        // 'other' includes maintenance, accountant, super_admin
        query = query.in('role', ['maintenance', 'accountant', 'super_admin']);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as UserProfile[];
    } catch (error) {
      console.error(`Error fetching ${type} users:`, error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if email exists
  const checkEmailExists = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }, []);

  // Get user dashboard statistics
  const getUserDashboardStats = useCallback(async () => {
    try {
      const [usersStats, propertyManagersStats, tenantsStats] = await Promise.all([
        getUserStats(),
        fetchPropertyManagers(),
        fetchTenants()
      ]);

      return {
        totalUsers: usersStats?.total || 0,
        activeUsers: usersStats?.active || 0,
        propertyManagers: usersStats?.propertyManagers || 0,
        tenants: usersStats?.tenants || 0,
        unassignedUsers: usersStats?.unassigned || 0,
        availablePropertyManagers: propertyManagersStats.filter(pm => pm.is_available).length,
        assignedPropertyManagers: propertyManagersStats.filter(pm => (pm.assigned_properties_count || 0) > 0).length,
        tenantsWithProperty: tenantsStats.filter(t => t.property_id).length,
        newUsersThisMonth: users.filter(u => {
          const created = new Date(u.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return null;
    }
  }, [getUserStats, fetchPropertyManagers, fetchTenants, users]);

  // NEW: Get users count by status
  const getUsersCountByStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status');

      if (error) throw error;
      
      const counts = {
        active: 0,
        suspended: 0,
        pending: 0,
        inactive: 0
      };
      
      data?.forEach(user => {
        if (user.status === 'active') counts.active++;
        else if (user.status === 'suspended') counts.suspended++;
        else if (user.status === 'pending') counts.pending++;
        else if (user.status === 'inactive') counts.inactive++;
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting users count by status:', error);
      return null;
    }
  }, []);

  return {
    // State
    users,
    selectedUser,
    loading,
    currentPage,
    totalPages,
    searchQuery,
    
    // Methods
    fetchUsers,
    fetchUserById,
    fetchUsersWithRoles,
    fetchUserWithRoles,
    assignRoleToUser,
    updateUser,
    deleteUser,
    suspendUser,
    activateUser,
    updateUserRole,
    resetUserPassword,
    getUserStats,
    bulkUpdateUsers,
    exportUsersToCSV,
    searchUsers,
    testDbConnection,
    updateLastLogin,
    
    // Methods for property managers and tenants
    fetchProperties,
    fetchUnitsByProperty,
    fetchPropertyManagers,
    fetchTenants,
    fetchTenantDetails,
    fetchPropertyManagerDetails,
    createPropertyManagerRecord,
    createTenantRecord,
    updateTenantRecord,
    updatePropertyManagerRecord,
    deleteTenantRecord,
    deletePropertyManagerRecord,
    getUsersByType,
    checkEmailExists,
    getUserDashboardStats,
    fetchAvailableUsersForRoleAssignment,
    assignPropertyManagerRole,
    assignTenantRole,
    markUserAsUnassigned, // NEW
    
    // NEW Methods
    fetchAssignedUsers,
    fetchAllUsers,
    fetchLoggedInUsers,
    getUsersCountByStatus,
    
    // Setters
    setSelectedUser,
    setSearchQuery,
    setCurrentPage
  };
};