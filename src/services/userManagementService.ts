// User management service for super admin dashboard
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | null;
  user_type: string | null;
  status: string | null;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
}

/**
 * Fetch all users from profiles table
 * Only accessible by super admins
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  } catch (error: any) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Search users by email or name
 */
export async function searchUsers(query: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  } catch (error: any) {
    console.error("Error searching users:", error);
    return [];
  }
}

/**
 * Update user role and status (super admin only)
 */
export async function updateUserRole(
  userId: string,
  role: string,
  status: string = "active"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return false;
  }
}

/**
 * Approve a pending user (property manager)
 */
export async function approveUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error approving user:", error);
    return false;
  }
}

/**
 * Deactivate a user
 */
export async function deactivateUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error deactivating user:", error);
    return false;
  }
}

/**
 * Get users filtered by role
 */
export async function getUsersByRole(role: string): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  } catch (error: any) {
    console.error("Error fetching users by role:", error);
    return [];
  }
}

/**
 * Get pending approvals (property managers waiting for activation)
 */
export async function getPendingApprovals(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "property_manager")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    return [];
  }
}

/**
 * Sync users from auth.users to profiles table
 * This is typically done automatically by triggers, but can be called manually
 */
export async function syncAuthUsersToProfiles(): Promise<boolean> {
  try {
    // Call the sync function if it exists
    const { error } = await supabase.rpc("sync_missing_profiles");

    if (error && error.code !== "PGRST202") {
      throw error;
    }

    return true;
  } catch (error: any) {
    console.error("Error syncing users:", error);
    return false;
  }
}
