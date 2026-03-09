import { supabase } from "./client";

export const superAdminQueries = {
  // Properties
  getProperties: async (filters?: { status?: string; manager_id?: string }) => {
    let query = supabase
      .from("properties")
      .select(
        `
        *,
        manager:users!properties_property_manager_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        tenants:tenants(
          id,
          user:users!tenants_user_id_fkey (
            first_name,
            last_name
          )
        )
      `
      )
      .eq("is_active", true);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.manager_id) {
      query = query.eq("property_manager_id", filters.manager_id);
    }

    return await query.order("created_at", { ascending: false });
  },

  // Managers
  getManagers: async () => {
    return await supabase
      .from("profiles")
      .select("*")
      .eq("role", "property_manager")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
  },

  // Approvals
  getPendingApprovals: async () => {
    return await supabase
      .from("approvals")
      .select(
        `
        *,
        property:properties!approvals_entity_id_fkey (
          id,
          name,
          address
        ),
        user:users!approvals_requested_by_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
  },

  // Financial Data
  getRevenueData: async (period: "month" | "quarter" | "year") => {
    return await supabase.rpc("get_revenue_data", { period_type: period });
  },

  // Audit Logs
  getAuditLogs: async (limit = 50) => {
    return await supabase
      .from("audit_logs")
      .select(
        `
        *,
        user:users!audit_logs_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);
  },
};
