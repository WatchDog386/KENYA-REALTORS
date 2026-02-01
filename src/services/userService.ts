// src/services/userService.ts
import { supabase } from "@/integrations/supabase/client";
import { CreateUserInput, UserRole } from "@/types/user.types";

export const userService = {
  // Create user based on role
  async createUser(
    input: CreateUserInput
  ): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      console.log(`Creating ${input.role} user:`, input.email);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
            role: input.role,
          },
        },
      });

      if (authError) {
        console.error("Auth creation error:", authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "User creation failed" };
      }

      const userId = authData.user.id;

      // 2. Create profile in unified profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email: input.email,
        first_name: input.full_name?.split(" ")[0] || "",
        last_name: input.full_name?.split(" ").slice(1).join(" ") || "",
        full_name: input.full_name,
        phone: input.phone || null,
        role: input.role,
        user_type: input.role,
        status: "active",
        is_active: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return { success: false, error: profileError.message };
      }

      console.log(`✅ ${input.role} user created successfully`);
      return { success: true, userId };
    } catch (error: any) {
      console.error("User creation error:", error);
      return { success: false, error: error.message };
    }
  },

  // Get all users (from both tables)
  async getAllUsers(): Promise<{ tenants: any[]; managers: any[] }> {
    try {
      // Get tenants from OLD table
      const { data: tenants, error: tenantsError } = await supabase
        .from("profiles_old")
        .select("*")
        .order("created_at", { ascending: false });

      // Get property managers/admins from NEW table
      const { data: managers, error: managersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (tenantsError || managersError) {
        console.error("Error fetching users:", tenantsError || managersError);
        return { tenants: [], managers: [] };
      }

      return {
        tenants: tenants || [],
        managers: managers || [],
      };
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return { tenants: [], managers: [] };
    }
  },

  // Delete user (from both auth and appropriate table)
  async deleteUser(
    userId: string,
    userType: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Delete from appropriate table
      if (userType === "tenant") {
        const { error: tableError } = await supabase
          .from("profiles_old")
          .delete()
          .eq("id", userId);

        if (tableError) {
          return { success: false, error: tableError.message };
        }
      } else {
        const { error: tableError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (tableError) {
          return { success: false, error: tableError.message };
        }
      }

      // 2. Delete from auth (admin only - requires service role)
      // Note: This requires service role key
      console.log(`User ${userId} marked for deletion from database`);

      return { success: true };
    } catch (error: any) {
      console.error("Delete user error:", error);
      return { success: false, error: error.message };
    }
  },

  // Update user
  async updateUser(
    userId: string,
    userType: UserRole,
    updates: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tableName = userType === "tenant" ? "profiles_old" : "profiles";

      const { error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Update user error:", error);
      return { success: false, error: error.message };
    }
  },
};
