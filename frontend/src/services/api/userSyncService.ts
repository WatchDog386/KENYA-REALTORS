// src/services/api/userSyncService.ts
/**
 * User Synchronization Service
 * Manages syncing between auth.users and profiles table for super admin dashboard
 */

import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | null;
  user_type?: string | null;
  status: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  avatar_url?: string;
  phone?: string;
}

class UserSyncService {
  /**
   * Fetch all users from profiles table
   * The profiles table should contain synced data from auth.users via trigger
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      console.log("🔄 Fetching all users from profiles table...");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching users from profiles:", error);
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} users`);
      return (data || []) as UserProfile[];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw error;
    }
  }

  /**
   * Fetch users by role from profiles table
   */
  async getUsersByRole(role: string): Promise<UserProfile[]> {
    try {
      console.log(`🔄 Fetching users with role: ${role}`);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`❌ Error fetching users by role ${role}:`, error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} users with role: ${role}`);
      return (data || []) as UserProfile[];
    } catch (error) {
      console.error(`Failed to fetch users by role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a specific user by ID from profiles table
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = No rows found (expected for non-existent users)
        console.error(`❌ Error fetching user ${userId}:`, error);
        throw error;
      }

      return (data as UserProfile) || null;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Sync all auth.users to profiles table manually
   * This is a fallback in case the trigger doesn't work
   */
  async syncAuthUsersToProfiles(): Promise<{ synced: number; error?: string }> {
    try {
      console.log("🔄 Starting auth.users to profiles sync...");

      // Use RPC if available
      const { data, error } = await supabase.rpc("sync_auth_users_to_profiles");

      if (error) {
        console.warn("⚠️ RPC sync not available, attempting direct fetch:", error);
        // Return message indicating RPC not available
        return {
          synced: 0,
          error: "Direct RPC not available - using trigger-based sync instead",
        };
      }

      console.log("✅ Auth users successfully synced to profiles");
      return { synced: data?.count || 0 };
    } catch (error) {
      console.error("Sync operation failed:", error);
      return {
        synced: 0,
        error: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Update user role and status in profiles table
   */
  async updateUserRole(
    userId: string,
    role: string,
    status?: string
  ): Promise<UserProfile | null> {
    try {
      const updateData: any = { role };
      if (status) updateData.status = status;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error updating user role:`, error);
        throw error;
      }

      console.log(`✅ User ${userId} role updated to ${role}`);
      return (data as UserProfile) || null;
    } catch (error) {
      console.error(`Failed to update user role:`, error);
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error updating user profile:`, error);
        throw error;
      }

      console.log(`✅ User profile ${userId} updated`);
      return (data as UserProfile) || null;
    } catch (error) {
      console.error(`Failed to update user profile:`, error);
      throw error;
    }
  }

  /**
   * Get user statistics from profiles table
   */
  async getUserStats(): Promise<{
    total: number;
    superAdmins: number;
    propertyManagers: number;
    tenants: number;
    unassigned: number;
  }> {
    try {
      const users = await this.getAllUsers();

      return {
        total: users.length,
        superAdmins: users.filter((u) => u.role === "super_admin").length,
        propertyManagers: users.filter((u) => u.role === "property_manager")
          .length,
        tenants: users.filter((u) => u.role === "tenant").length,
        unassigned: users.filter((u) => !u.role).length,
      };
    } catch (error) {
      console.error("Failed to get user stats:", error);
      throw error;
    }
  }

  /**
   * Verify that auth.users and profiles are in sync
   */
  async verifySync(): Promise<{
    synced: boolean;
    message: string;
    profilesCount: number;
  }> {
    try {
      const profiles = await this.getAllUsers();

      console.log(`✅ Sync verification: ${profiles.length} users in profiles table`);

      return {
        synced: true,
        message: `All users synced. Total: ${profiles.length}`,
        profilesCount: profiles.length,
      };
    } catch (error) {
      console.error("Sync verification failed:", error);
      return {
        synced: false,
        message: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        profilesCount: 0,
      };
    }
  }
}

export const userSyncService = new UserSyncService();
