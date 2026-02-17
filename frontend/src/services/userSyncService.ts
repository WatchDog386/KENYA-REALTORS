// src/services/userSyncService.ts
import { supabase } from "./supabase";

export const userSyncService = {
  /**
   * Verify sync status between auth.users and profiles table
   */
  async verifySync() {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id", { count: "exact" });

      if (profilesError) {
        return {
          synced: false,
          profilesCount: 0,
          error: profilesError.message,
        };
      }

      return {
        synced: true,
        profilesCount: profilesData?.length || 0,
        error: null,
      };
    } catch (error) {
      console.error("Error verifying sync:", error);
      return {
        synced: false,
        profilesCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Update user role and status
   */
  async updateUserRole(userId: string, newRole: string, status: string = "active") {
    try {
      // Update the profile with the new role and status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          user_type: newRole,
          status: status,
          is_active: status === "active",
          approved_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      return {
        success: true,
        message: `User role updated to ${newRole}`,
      };
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  /**
   * Get all users with profile data
   */
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (error) {
        throw error;
      }

      return { success: true, message: `User status updated to ${status}` };
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },
};
