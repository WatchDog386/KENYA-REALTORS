// src/hooks/useRoles.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// User role interface with user and role details
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  expires_at?: string;
  role?: Role;
  user?: any;
  assigned_by_user?: any;
}

export const useRoles = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (err) throw err;

      setRoles(data || []);
      return data || [];
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Failed to fetch roles');
      toast.error('Failed to load roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch roles for a specific user with full details
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          assigned_by,
          assigned_at,
          expires_at,
          roles!inner (
            id,
            name,
            description,
            permissions,
            is_default,
            created_at,
            updated_at
          ),
          profiles!assigned_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (err) throw err;

      // Map the response to match UserRole interface
      const mappedData = (data || []).map((ur: any) => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        assigned_by: ur.assigned_by,
        assigned_at: ur.assigned_at,
        expires_at: ur.expires_at,
        role: ur.roles,
        assigned_by_user: ur.profiles,
      }));

      setUserRoles(mappedData);
      return mappedData;
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
      setError(err.message || 'Failed to fetch user roles');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign a role to a user
  const assignRoleToUser = useCallback(
    async (userId: string, roleId: string, assignedBy?: string) => {
      try {
        setLoading(true);
        setError(null);

        // Check if user already has this role
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role_id', roleId)
          .single();

        if (existing) {
          throw new Error('User already has this role');
        }

        const { data, error: err } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleId,
            assigned_by: assignedBy,
            assigned_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (err) throw err;

        toast.success('Role assigned successfully');
        return data;
      } catch (err: any) {
        console.error('Error assigning role:', err);
        const message = err.message || 'Failed to assign role';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Remove a role from a user
  const removeRoleFromUser = useCallback(async (userRoleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (err) throw err;

      toast.success('Role removed successfully');
      return true;
    } catch (err: any) {
      console.error('Error removing role:', err);
      const message = err.message || 'Failed to remove role';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get role by ID
  const getRoleById = useCallback(async (roleId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (err) throw err;
      return data;
    } catch (err: any) {
      console.error('Error fetching role:', err);
      return null;
    }
  }, []);

  // Create a new role
  const createRole = useCallback(async (roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('roles')
        .insert(roleData)
        .select()
        .single();

      if (err) throw err;

      toast.success('Role created successfully');
      return data;
    } catch (err: any) {
      console.error('Error creating role:', err);
      const message = err.message || 'Failed to create role';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a role
  const updateRole = useCallback(async (roleId: string, roleData: Partial<Role>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('roles')
        .update(roleData)
        .eq('id', roleId)
        .select()
        .single();

      if (err) throw err;

      toast.success('Role updated successfully');
      return data;
    } catch (err: any) {
      console.error('Error updating role:', err);
      const message = err.message || 'Failed to update role';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a role
  const deleteRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (err) throw err;

      toast.success('Role deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting role:', err);
      const message = err.message || 'Failed to delete role';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    roles,
    userRoles,
    error,
    fetchRoles,
    fetchUserRoles,
    assignRoleToUser,
    removeRoleFromUser,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
  };
};
