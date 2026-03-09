import { supabase } from "./supabase";

export interface DashboardStats {
  total_properties: number;
  active_managers: number;
  pending_approvals: number;
  total_revenue: number;
  properties_change: number;
  managers_change: number;
  approvals_change: number;
  revenue_change_percentage: number;
}

export interface Activity {
  id: string;
  action: string;
  user_id: string;
  user_name: string;
  user_email: string;
  time: string;
  type: "property" | "manager" | "refund" | "lease" | "system";
  metadata?: Record<string, any>;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: "warning" | "info" | "success" | "error";
  priority: "low" | "medium" | "high";
  created_at: string;
  resolved: boolean;
}

export const dashboardService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: propertiesData, error: propertiesError } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    const { data: managersData, error: managersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "property_manager")
      .eq("status", "active");

    const { data: approvalsData, error: approvalsError } = await supabase
      .from("approval_requests")
      .select("id")
      .eq("status", "pending");

    const { data: revenueData, error: revenueError } = await supabase.rpc(
      "get_total_revenue"
    );

    // Get changes from last month (placeholder - you'll need to implement proper comparison)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return {
      total_properties: propertiesData?.count || 0,
      active_managers: managersData?.length || 0,
      pending_approvals: approvalsData?.length || 0,
      total_revenue: revenueData || 0,
      properties_change: 2, // You'll need to calculate this
      managers_change: 1,
      approvals_change: 3,
      revenue_change_percentage: 8,
    };
  },

  // Get recent activities
  async getRecentActivities(limit = 10): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select(
        `
        id,
        action,
        user_id,
        users!activities_user_id_fkey(name, email),
        created_at,
        type,
        metadata
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((item) => ({
      id: item.id,
      action: item.action,
      user_id: item.user_id,
      user_name: item.users?.name || "Unknown",
      user_email: item.users?.email || "",
      time: item.created_at,
      type: item.type,
      metadata: item.metadata,
    }));
  },

  // Get system alerts
  async getSystemAlerts(): Promise<SystemAlert[]> {
    const { data, error } = await supabase
      .from("system_alerts")
      .select("*")
      .eq("resolved", false)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    return data;
  },

  // Get quick actions data (could be static or from settings)
  async getQuickActions() {
    // This could be fetched from a database table or kept as static
    return [
      {
        title: "Add New Property",
        icon: "Home",
        href: "/portal/properties",
        color: "bg-blue-100 text-blue-700",
      },
      {
        title: "Assign Manager",
        icon: "UserPlus",
        href: "/portal/super-admin/manager-assignments",
        color: "bg-green-100 text-green-700",
      },
      {
        title: "Review Approvals",
        icon: "CheckCircle",
        href: "/portal/super-admin/approvals",
        color: "bg-yellow-100 text-yellow-700",
      },
      {
        title: "System Settings",
        icon: "Shield",
        href: "/portal/super-admin/system-settings",
        color: "bg-purple-100 text-purple-700",
      },
    ];
  },

  // Generate report
  async generateReport(startDate?: string, endDate?: string) {
    const { data, error } = await supabase.rpc("generate_dashboard_report", {
      start_date:
        startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: endDate || new Date().toISOString(),
    });

    if (error) throw error;
    return data;
  },
};
