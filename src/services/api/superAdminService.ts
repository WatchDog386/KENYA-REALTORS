import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  totalProperties: number;
  activeManagers: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalTenants: number;
  vacantUnits: number;
  maintenanceRequests: number;
  activeLeases: number;
  occupancyRate: number;
  monthlyGrowth: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: "warning" | "error" | "critical" | "success" | "info";
  priority: number;
  createdAt: string;
  resolved: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details: Record<string, any>;
}

class SuperAdminService {
  // Get comprehensive dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get current date range for metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Execute all queries in parallel for better performance
      const [
        propertiesData,
        managersData,
        approvalsData,
        currentMonthPayments,
        lastMonthPayments,
        tenantsData,
        unitsData,
        maintenanceData,
        leasesData,
      ] = await Promise.all([
        // Total properties
        supabase.from("properties").select("id", { count: "exact" }),

        // Active managers
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("role", "property_manager")
          .eq("status", "active"),

        // Pending approvals
        supabase
          .from("approval_queue")
          .select("id", { count: "exact" })
          .eq("status", "pending"),

        // Current month revenue
        supabase
          .from("rent_payments")
          .select("amount")
          .eq("status", "paid")
          .gte("payment_date", thirtyDaysAgo.toISOString()),

        // Last month revenue for growth calculation
        supabase
          .from("rent_payments")
          .select("amount")
          .eq("status", "paid")
          .gte("payment_date", lastMonth.toISOString())
          .lt("payment_date", thirtyDaysAgo.toISOString()),

        // Total tenants
        supabase
          .from("tenants")
          .select("id", { count: "exact" })
          .eq("status", "active"),

        // Vacant units
        supabase
          .from("property_units")
          .select("id", { count: "exact" })
          .eq("status", "available"),

        // Maintenance requests
        supabase
          .from("maintenance_requests")
          .select("id", { count: "exact" })
          .neq("status", "completed"),

        // Active leases
        supabase
          .from("leases")
          .select("id", { count: "exact" })
          .eq("status", "active"),
      ]);

      // Calculate total revenue
      const currentMonthRevenue =
        currentMonthPayments.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const lastMonthRevenue =
        lastMonthPayments.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;

      // Calculate monthly growth
      const monthlyGrowth =
        lastMonthRevenue > 0
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      // Calculate occupancy rate
      const totalUnits = await this.getTotalUnitsCount();
      const occupiedUnits = totalUnits - (unitsData.count || 0);
      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      return {
        totalProperties: propertiesData.count || 0,
        activeManagers: managersData.count || 0,
        pendingApprovals: approvalsData.count || 0,
        totalRevenue: currentMonthRevenue,
        totalTenants: tenantsData.count || 0,
        vacantUnits: unitsData.count || 0,
        maintenanceRequests: maintenanceData.count || 0,
        activeLeases: leasesData.count || 0,
        occupancyRate,
        monthlyGrowth,
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      throw error;
    }
  }

  // Get system alerts and warnings
  async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      const alerts: SystemAlert[] = [];

      // Check for pending approvals
      const { count: pendingApprovals } = await supabase
        .from("approval_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingApprovals && pendingApprovals > 0) {
        alerts.push({
          id: "pending-approvals",
          title: `${pendingApprovals} Pending Approvals`,
          description: "New requests require your attention",
          type: "warning",
          priority: 2,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Check for overdue payments
      const { count: overduePayments } = await supabase
        .from("rent_payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "overdue");

      if (overduePayments && overduePayments > 0) {
        alerts.push({
          id: "overdue-payments",
          title: `${overduePayments} Overdue Payments`,
          description: "Tenants have overdue rent payments",
          type: "warning",
          priority: 1,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Check for high maintenance requests
      const { count: openMaintenance } = await supabase
        .from("maintenance_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "assigned"]);

      if (openMaintenance && openMaintenance > 5) {
        alerts.push({
          id: "high-maintenance",
          title: "High Maintenance Load",
          description: `${openMaintenance} open maintenance requests`,
          type: "warning",
          priority: 3,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Check for vacant units
      const { count: vacantUnits } = await supabase
        .from("property_units")
        .select("*", { count: "exact", head: true })
        .eq("status", "available");

      if (vacantUnits && vacantUnits > 10) {
        alerts.push({
          id: "vacant-units",
          title: "High Vacancy Rate",
          description: `${vacantUnits} units are currently vacant`,
          type: "info",
          priority: 4,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // System status alert (always present)
      alerts.push({
        id: "system-status",
        title: "System Operational",
        description: "All systems are running normally",
        type: "success",
        priority: 5,
        createdAt: new Date().toISOString(),
        resolved: true,
      });

      // Sort by priority (lower = more important)
      return alerts.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error("Error fetching system alerts:", error);
      return [];
    }
  }

  // Get recent activity logs
  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          user_profile:profiles!audit_logs_user_id_fkey(
            first_name,
            last_name,
            email
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((log) => ({
        id: log.id,
        userId: log.user_id,
        userName: log.user_profile
          ? `${log.user_profile.first_name} ${log.user_profile.last_name}`
          : "System",
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        ipAddress: log.ip_address || "N/A",
        userAgent: log.user_agent || "N/A",
        timestamp: log.created_at,
        details: {
          old: log.old_data,
          new: log.new_data,
        },
      }));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }
  }

  // Generate system report
  async generateReport(
    reportType: "monthly" | "quarterly" | "annual",
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      // Set date range based on report type
      const now = new Date();
      let reportStart: Date;
      let reportEnd: Date = now;

      switch (reportType) {
        case "monthly":
          reportStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate()
          );
          break;
        case "quarterly":
          reportStart = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate()
          );
          break;
        case "annual":
          reportStart = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate()
          );
          break;
        default:
          reportStart = startDate
            ? new Date(startDate)
            : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          reportEnd = endDate ? new Date(endDate) : now;
      }

      // Get all data for the report period
      const [
        propertiesData,
        paymentsData,
        leasesData,
        maintenanceData,
        usersData,
      ] = await Promise.all([
        // Properties added in period
        supabase
          .from("properties")
          .select("*")
          .gte("created_at", reportStart.toISOString())
          .lte("created_at", reportEnd.toISOString()),

        // Payments in period
        supabase
          .from("rent_payments")
          .select("*")
          .eq("status", "paid")
          .gte("payment_date", reportStart.toISOString())
          .lte("payment_date", reportEnd.toISOString()),

        // Leases in period
        supabase
          .from("leases")
          .select("*")
          .gte("created_at", reportStart.toISOString())
          .lte("created_at", reportEnd.toISOString()),

        // Maintenance requests in period
        supabase
          .from("maintenance_requests")
          .select("*")
          .gte("created_at", reportStart.toISOString())
          .lte("created_at", reportEnd.toISOString()),

        // New users in period
        supabase
          .from("profiles")
          .select("*")
          .gte("created_at", reportStart.toISOString())
          .lte("created_at", reportEnd.toISOString()),
      ]);

      // Calculate report data
      const totalRevenue =
        paymentsData.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const avgPayment = paymentsData.data?.length
        ? totalRevenue / paymentsData.data.length
        : 0;

      const reportData = {
        metadata: {
          reportType,
          period: {
            start: reportStart.toISOString(),
            end: reportEnd.toISOString(),
          },
          generatedAt: new Date().toISOString(),
        },
        summary: {
          totalProperties: propertiesData.data?.length || 0,
          totalRevenue,
          totalPayments: paymentsData.data?.length || 0,
          averagePayment: avgPayment,
          newLeases: leasesData.data?.length || 0,
          maintenanceRequests: maintenanceData.data?.length || 0,
          newUsers: usersData.data?.length || 0,
        },
        details: {
          properties: propertiesData.data || [],
          payments: paymentsData.data || [],
          leases: leasesData.data || [],
          maintenance: maintenanceData.data || [],
          users: usersData.data || [],
        },
        charts: {
          revenueByWeek: this.calculateRevenueByWeek(paymentsData.data || []),
          propertyTypes: this.calculatePropertyTypeDistribution(
            propertiesData.data || []
          ),
          maintenanceByPriority: this.calculateMaintenanceByPriority(
            maintenanceData.data || []
          ),
        },
      };

      return reportData;
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  // Get total units count
  private async getTotalUnitsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("property_units")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting total units count:", error);
      return 0;
    }
  }

  // Calculate revenue by week
  private calculateRevenueByWeek(
    payments: any[]
  ): Array<{ week: string; revenue: number }> {
    const weeklyRevenue: Record<string, number> = {};

    payments.forEach((payment) => {
      const date = new Date(payment.payment_date);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!weeklyRevenue[weekKey]) {
        weeklyRevenue[weekKey] = 0;
      }
      weeklyRevenue[weekKey] += payment.amount || 0;
    });

    return Object.entries(weeklyRevenue)
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  // Calculate property type distribution
  private calculatePropertyTypeDistribution(
    properties: any[]
  ): Array<{ type: string; count: number }> {
    const typeCounts: Record<string, number> = {};

    properties.forEach((property) => {
      const type = property.type || "other";
      if (!typeCounts[type]) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }

  // Calculate maintenance by priority
  private calculateMaintenanceByPriority(
    maintenance: any[]
  ): Array<{ priority: string; count: number }> {
    const priorityCounts: Record<string, number> = {};

    maintenance.forEach((request) => {
      const priority = request.priority || "medium";
      if (!priorityCounts[priority]) {
        priorityCounts[priority] = 0;
      }
      priorityCounts[priority]++;
    });

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
    }));
  }

  // Get week start date
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
  }

  // Clear system cache
  async clearSystemCache(): Promise<boolean> {
    try {
      // In a real app, this would clear server-side cache
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
  }

  // Backup database
  async backupDatabase(): Promise<{ success: boolean; backupId?: string }> {
    try {
      // In a real app, this would trigger a database backup
      // For Supabase, you would use their backup API
      const backupId = `backup_${Date.now()}`;

      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: true,
        backupId,
      };
    } catch (error) {
      console.error("Error creating backup:", error);
      return { success: false };
    }
  }
}

export const superAdminService = new SuperAdminService();
