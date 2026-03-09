import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role: "super_admin" | "property_manager" | "tenant";
  status: "active" | "inactive" | "pending" | "suspended";
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;

  // Related data
  assigned_properties?: Array<{
    id: string;
    name: string;
  }>;
  tenant_info?: {
    property_id: string;
    unit_id: string;
    lease_id: string;
    move_in_date: string;
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "property_manager" | "tenant";
  status?: "active" | "pending";
  metadata?: Record<string, any>;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: "property_manager" | "tenant";
  status?: "active" | "inactive" | "suspended";
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  // Get all users with pagination and filtering
  async getUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
    try {
      const {
        role = "all",
        status = "all",
        search = "",
        page = 1,
        limit = 20,
      } = filters;

      let query = supabase.from("profiles").select("*", { count: "exact" });

      // Apply filters
      if (role !== "all") {
        query = query.eq("role", role);
      }

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        users: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      return {
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  }

  // Get user by ID with related data
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      let query = supabase.from("profiles").select("*").eq("id", id).single();

      const { data: user, error } = await query;

      if (error) throw error;
      if (!user) return null;

      // Fetch additional data based on role
      let additionalData: any = {};

      if (user.role === "property_manager") {
        const { data: properties } = await supabase
          .from("properties")
          .select("id, name")
          .eq("manager_id", id);
        additionalData.assigned_properties = properties || [];
      }

      if (user.role === "tenant") {
        const { data: tenantInfo } = await supabase
          .from("tenants")
          .select("property_id, unit_id, lease_id, move_in_date")
          .eq("user_id", id)
          .single();
        additionalData.tenant_info = tenantInfo;
      }

      return {
        ...user,
        ...additionalData,
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("User not found");
      return null;
    }
  }

  // Create new user (with auth account)
  async createUser(input: CreateUserInput): Promise<UserProfile | null> {
    try {
      // First, create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Then create user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            user_id: authData.user.id,
            email: input.email,
            first_name: input.first_name,
            last_name: input.last_name,
            phone: input.phone,
            role: input.role,
            status: input.status || "active",
            metadata: input.metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      toast.success("User created successfully");

      // If role is tenant, send welcome email with login details
      if (input.role === "tenant") {
        await this.sendWelcomeEmail(input.email, input.first_name);
      }

      return profileData;
    } catch (error: any) {
      console.error("Error creating user:", error);

      if (error.message.includes("already registered")) {
        toast.error("User with this email already exists");
      } else {
        toast.error(`Failed to create user: ${error.message}`);
      }

      return null;
    }
  }

  // Update user profile
  async updateUser(
    id: string,
    updates: UpdateUserInput
  ): Promise<UserProfile | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      toast.success("User updated successfully");
      return data;
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
      return null;
    }
  }

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<boolean> {
    try {
      // Check if user is a manager with assigned properties
      const user = await this.getUserById(id);

      if (user?.role === "property_manager") {
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("manager_id", id)
          .limit(1);

        if (properties && properties.length > 0) {
          throw new Error("Cannot delete manager with assigned properties");
        }
      }

      // Soft delete by setting status to inactive
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("User deactivated successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user: ${error.message}`);
      return false;
    }
  }

  // Reactivate user
  async reactivateUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("User reactivated successfully");
      return true;
    } catch (error: any) {
      console.error("Error reactivating user:", error);
      toast.error(`Failed to reactivate user: ${error.message}`);
      return false;
    }
  }

  // Change user role
  async changeUserRole(
    id: string,
    newRole: "super_admin" | "property_manager" | "tenant"
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      toast.success(`User role changed to ${newRole.replace("_", " ")}`);
      return data;
    } catch (error: any) {
      console.error("Error changing user role:", error);
      toast.error(`Failed to change user role: ${error.message}`);
      return null;
    }
  }

  // Reset user password
  async resetUserPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent successfully");
      return true;
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(`Failed to send reset email: ${error.message}`);
      return false;
    }
  }

  // Get user statistics
  async getUserStatistics() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, status");

      if (error) throw error;

      const stats = {
        total: data.length,
        superAdmins: data.filter((u) => u.role === "super_admin").length,
        managers: data.filter((u) => u.role === "property_manager").length,
        tenants: data.filter((u) => u.role === "tenant").length,
        active: data.filter((u) => u.status === "active").length,
        inactive: data.filter((u) => u.status === "inactive").length,
        pending: data.filter((u) => u.status === "pending").length,
        suspended: data.filter((u) => u.status === "suspended").length,
        byRole: {
          super_admin: 0,
          property_manager: 0,
          tenant: 0,
        },
        byStatus: {
          active: 0,
          inactive: 0,
          pending: 0,
          suspended: 0,
        },
      };

      // Calculate detailed counts
      data.forEach((user) => {
        stats.byRole[user.role]++;
        stats.byStatus[user.status]++;
      });

      return stats;
    } catch (error) {
      console.error("Error getting user statistics:", error);
      return null;
    }
  }

  // Get property managers (for assignment)
  async getPropertyManagers(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "property_manager")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching property managers:", error);
      return [];
    }
  }

  // Bulk update users
  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<UpdateUserInput>
  ): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .in("id", userIds);

      if (error) throw error;

      toast.success(`${userIds.length} users updated successfully`);
      return true;
    } catch (error: any) {
      console.error("Error bulk updating users:", error);
      toast.error(`Failed to update users: ${error.message}`);
      return false;
    }
  }

  // Export users to CSV
  async exportUsersToCSV(filters: UserFilters = {}): Promise<void> {
    try {
      const { users } = await this.getUsers({
        ...filters,
        limit: 1000, // Export up to 1000 users
      });

      // Convert to CSV
      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Role",
        "Status",
        "Created At",
      ];
      const csvRows = [
        headers.join(","),
        ...users.map((user) =>
          [
            user.id,
            `"${user.first_name} ${user.last_name}"`,
            user.email,
            user.phone,
            user.role,
            user.status,
            new Date(user.created_at).toLocaleDateString(),
          ].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Users exported successfully");
    } catch (error: any) {
      console.error("Error exporting users:", error);
      toast.error(`Failed to export users: ${error.message}`);
    }
  }

  // Upload user avatar
  async uploadAvatar(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-avatars").getPublicUrl(filePath);

      // Update user profile with avatar URL
      await this.updateUser(userId, { avatar_url: publicUrl });

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
      return null;
    }
  }

  // Send welcome email (simulated)
  private async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    try {
      // In a real app, this would call your email service
      console.log(`Sending welcome email to ${email} for ${firstName}`);

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }
}

export const userService = new UserService();
