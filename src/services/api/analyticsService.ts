import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalProperties: number;
    totalTenants: number;
    occupancyRate: number;
    averageRent: number;
    maintenanceCosts: number;
    refundAmount: number;
  };
  trends: {
    revenueTrend: Array<{ date: string; amount: number }>;
    occupancyTrend: Array<{ date: string; rate: number }>;
    maintenanceTrend: Array<{ date: string; count: number }>;
  };
  breakdown: {
    revenueByProperty: Array<{ property: string; amount: number }>;
    occupancyByProperty: Array<{ property: string; rate: number }>;
    tenantsByProperty: Array<{ property: string; count: number }>;
  };
  metrics: {
    paymentOnTimeRate: number;
    maintenanceResponseTime: number;
    tenantSatisfaction: number;
    collectionEfficiency: number;
  };
}

export interface AnalyticsFilter {
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  compareWithPrevious?: boolean;
}

class AnalyticsService {
  // Get comprehensive analytics data
  async getAnalyticsData(filter: AnalyticsFilter): Promise<AnalyticsData> {
    try {
      const period = this.calculatePeriod(filter);

      const [summary, trends, breakdown, metrics] = await Promise.all([
        this.getSummaryData(period),
        this.getTrendData(period, filter.period),
        this.getBreakdownData(period),
        this.getMetricsData(period),
      ]);

      return {
        period,
        summary,
        trends,
        breakdown,
        metrics,
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  }

  // Get financial analytics
  async getFinancialAnalytics(period: { start: string; end: string }) {
    try {
      const [revenueData, expensesData, pendingPayments, completedPayments] =
        await Promise.all([
          // Revenue from rent payments
          supabase
            .from("rent_payments")
            .select("amount, payment_date, status")
            .eq("status", "paid")
            .gte("payment_date", period.start)
            .lte("payment_date", period.end),

          // Maintenance costs
          supabase
            .from("maintenance_requests")
            .select("actual_cost, completed_at, status")
            .eq("status", "completed")
            .gte("completed_at", period.start)
            .lte("completed_at", period.end),

          // Pending payments
          supabase
            .from("rent_payments")
            .select("amount, due_date")
            .eq("status", "pending")
            .gte("due_date", period.start)
            .lte("due_date", period.end),

          // Completed payments this period
          supabase
            .from("rent_payments")
            .select("amount, payment_date")
            .eq("status", "paid")
            .gte("payment_date", period.start)
            .lte("payment_date", period.end),
        ]);

      const totalRevenue =
        revenueData.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const totalExpenses =
        expensesData.data?.reduce(
          (sum, expense) => sum + (expense.actual_cost || 0),
          0
        ) || 0;
      const pendingAmount =
        pendingPayments.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;
      const completedAmount =
        completedPayments.data?.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        ) || 0;

      // Calculate collection rate
      const totalExpected = totalRevenue + pendingAmount;
      const collectionRate =
        totalExpected > 0 ? (completedAmount / totalExpected) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        pendingAmount,
        completedAmount,
        collectionRate,
        revenueData: revenueData.data || [],
        expensesData: expensesData.data || [],
      };
    } catch (error) {
      console.error("Error fetching financial analytics:", error);
      throw error;
    }
  }

  // Get property performance analytics
  async getPropertyPerformance(period: { start: string; end: string }) {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          name,
          total_units,
          occupied_units,
          monthly_rent,
          rent_payments!inner(
            amount,
            payment_date,
            status
          )
        `
        )
        .gte("rent_payments.payment_date", period.start)
        .lte("rent_payments.payment_date", period.end);

      if (error) throw error;

      const performanceData = (properties || []).map((property) => {
        const paidPayments =
          property.rent_payments?.filter((p: any) => p.status === "paid") || [];
        const totalRevenue = paidPayments.reduce(
          (sum: number, payment: any) => sum + (payment.amount || 0),
          0
        );
        const occupancyRate =
          property.total_units > 0
            ? (property.occupied_units / property.total_units) * 100
            : 0;

        return {
          id: property.id,
          name: property.name,
          totalUnits: property.total_units,
          occupiedUnits: property.occupied_units,
          occupancyRate,
          monthlyRent: property.monthly_rent || 0,
          totalRevenue,
          averageRevenuePerUnit:
            property.occupied_units > 0
              ? totalRevenue / property.occupied_units
              : 0,
        };
      });

      // Sort by revenue descending
      performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return performanceData;
    } catch (error) {
      console.error("Error fetching property performance:", error);
      throw error;
    }
  }

  // Get tenant analytics
  async getTenantAnalytics(period: { start: string; end: string }) {
    try {
      const [tenantsData, leaseData, paymentData, maintenanceData] =
        await Promise.all([
          // All tenants
          supabase.from("tenants").select(`
            id,
            status,
            move_in_date,
            profiles!inner(
              first_name,
              last_name,
              email
            )
          `),

          // Leases
          supabase
            .from("leases")
            .select("id, tenant_id, status, start_date, end_date"),

          // Payment history
          supabase
            .from("rent_payments")
            .select("tenant_id, amount, status, payment_date, due_date")
            .gte("payment_date", period.start)
            .lte("payment_date", period.end),

          // Maintenance requests
          supabase
            .from("maintenance_requests")
            .select("tenant_id, status, created_at, completed_at")
            .gte("created_at", period.start)
            .lte("created_at", period.end),
        ]);

      // Process tenant data
      const tenants = tenantsData.data || [];
      const leases = leaseData.data || [];
      const payments = paymentData.data || [];
      const maintenance = maintenanceData.data || [];

      const tenantStats = {
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t) => t.status === "active").length,
        newTenants: tenants.filter((t) => {
          const moveIn = new Date(t.move_in_date);
          const periodStart = new Date(period.start);
          return moveIn >= periodStart;
        }).length,
        leavingTenants: leases.filter(
          (l) => l.status === "expired" || l.status === "terminated"
        ).length,
        averageTenancyDuration: this.calculateAverageTenancyDuration(
          tenants,
          leases
        ),
        paymentCompliance: this.calculatePaymentCompliance(payments),
        maintenanceFrequency: this.calculateMaintenanceFrequency(
          maintenance,
          tenants.length
        ),
      };

      return tenantStats;
    } catch (error) {
      console.error("Error fetching tenant analytics:", error);
      throw error;
    }
  }

  // Get maintenance analytics
  async getMaintenanceAnalytics(period: { start: string; end: string }) {
    try {
      const { data: maintenanceRequests, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .gte("created_at", period.start)
        .lte("created_at", period.end);

      if (error) throw error;

      const requests = maintenanceRequests || [];

      const stats = {
        totalRequests: requests.length,
        openRequests: requests.filter((r) => r.status !== "completed").length,
        completedRequests: requests.filter((r) => r.status === "completed")
          .length,
        averageCompletionTime: this.calculateAverageCompletionTime(requests),
        byPriority: {
          urgent: requests.filter((r) => r.priority === "urgent").length,
          high: requests.filter((r) => r.priority === "high").length,
          medium: requests.filter((r) => r.priority === "medium").length,
          low: requests.filter((r) => r.priority === "low").length,
        },
        byCategory: this.groupByCategory(requests),
        totalCost: requests.reduce((sum, r) => sum + (r.actual_cost || 0), 0),
        averageCost:
          requests.length > 0
            ? requests.reduce((sum, r) => sum + (r.actual_cost || 0), 0) /
              requests.length
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching maintenance analytics:", error);
      throw error;
    }
  }

  // Export analytics data
  async exportAnalyticsData(
    filter: AnalyticsFilter,
    format: "csv" | "json" | "excel"
  ) {
    try {
      const data = await this.getAnalyticsData(filter);

      if (format === "csv") {
        return this.convertToCSV(data);
      } else if (format === "json") {
        return JSON.stringify(data, null, 2);
      } else {
        // For Excel, you would typically use a library like xlsx
        // This is a simplified version
        return this.convertToExcel(data);
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      throw error;
    }
  }

  // Private helper methods
  private calculatePeriod(filter: AnalyticsFilter): {
    start: string;
    end: string;
  } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (filter.period) {
      case "daily":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "quarterly":
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case "yearly":
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case "custom":
        start = filter.startDate
          ? new Date(filter.startDate)
          : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        end = filter.endDate ? new Date(filter.endDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }

  private async getSummaryData(period: { start: string; end: string }) {
    const [financial, property, tenant, maintenance] = await Promise.all([
      this.getFinancialAnalytics(period),
      this.getPropertyPerformance(period),
      this.getTenantAnalytics(period),
      this.getMaintenanceAnalytics(period),
    ]);

    const totalProperties = property.length;
    const totalRevenue = financial.totalRevenue;
    const totalTenants = tenant.totalTenants;
    const totalOccupancy =
      property.reduce((sum, p) => sum + p.occupancyRate, 0) / property.length;
    const averageRent =
      property.reduce((sum, p) => sum + p.monthlyRent, 0) / property.length;
    const maintenanceCosts = maintenance.totalCost;
    const refundAmount = 0; // You would need to fetch refund data

    return {
      totalRevenue,
      totalProperties,
      totalTenants,
      occupancyRate: totalOccupancy,
      averageRent,
      maintenanceCosts,
      refundAmount,
    };
  }

  private async getTrendData(
    period: { start: string; end: string },
    interval: string
  ) {
    // This would calculate trends over time
    // Simplified for now
    return {
      revenueTrend: [],
      occupancyTrend: [],
      maintenanceTrend: [],
    };
  }

  private async getBreakdownData(period: { start: string; end: string }) {
    const propertyPerformance = await this.getPropertyPerformance(period);

    return {
      revenueByProperty: propertyPerformance.map((p) => ({
        property: p.name,
        amount: p.totalRevenue,
      })),
      occupancyByProperty: propertyPerformance.map((p) => ({
        property: p.name,
        rate: p.occupancyRate,
      })),
      tenantsByProperty: propertyPerformance.map((p) => ({
        property: p.name,
        count: p.occupiedUnits,
      })),
    };
  }

  private async getMetricsData(period: { start: string; end: string }) {
    const [financial, maintenance, tenant] = await Promise.all([
      this.getFinancialAnalytics(period),
      this.getMaintenanceAnalytics(period),
      this.getTenantAnalytics(period),
    ]);

    return {
      paymentOnTimeRate: financial.collectionRate,
      maintenanceResponseTime: maintenance.averageCompletionTime,
      tenantSatisfaction: 85, // This would come from surveys or ratings
      collectionEfficiency: financial.collectionRate,
    };
  }

  private calculateAverageTenancyDuration(
    tenants: any[],
    leases: any[]
  ): number {
    if (tenants.length === 0) return 0;

    const totalDuration = tenants.reduce((sum, tenant) => {
      const lease = leases.find((l) => l.tenant_id === tenant.id);
      if (lease) {
        const start = new Date(lease.start_date);
        const end = lease.end_date ? new Date(lease.end_date) : new Date();
        const durationMonths =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return sum + durationMonths;
      }
      return sum;
    }, 0);

    return totalDuration / tenants.length;
  }

  private calculatePaymentCompliance(payments: any[]): number {
    if (payments.length === 0) return 0;

    const onTimePayments = payments.filter((p) => {
      const paymentDate = new Date(p.payment_date);
      const dueDate = new Date(p.due_date);
      return paymentDate <= dueDate && p.status === "paid";
    }).length;

    return (onTimePayments / payments.length) * 100;
  }

  private calculateMaintenanceFrequency(
    maintenance: any[],
    tenantCount: number
  ): number {
    if (tenantCount === 0) return 0;
    return maintenance.length / tenantCount;
  }

  private calculateAverageCompletionTime(requests: any[]): number {
    const completedRequests = requests.filter(
      (r) => r.status === "completed" && r.completed_at
    );
    if (completedRequests.length === 0) return 0;

    const totalHours = completedRequests.reduce((sum, request) => {
      const created = new Date(request.created_at);
      const completed = new Date(request.completed_at);
      const hours =
        (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / completedRequests.length;
  }

  private groupByCategory(requests: any[]): Record<string, number> {
    const categories: Record<string, number> = {};

    requests.forEach((request) => {
      const category = request.category || "uncategorized";
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    });

    return categories;
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const rows: string[] = [];

    // Add summary
    rows.push("SUMMARY");
    rows.push("Metric,Value");
    Object.entries(data.summary).forEach(([key, value]) => {
      rows.push(`${key},${value}`);
    });

    // Add metrics
    rows.push("\nMETRICS");
    rows.push("Metric,Value");
    Object.entries(data.metrics).forEach(([key, value]) => {
      rows.push(`${key},${value}`);
    });

    return rows.join("\n");
  }

  private convertToExcel(data: any): string {
    // In a real app, use a library like xlsx
    // This returns a JSON representation
    return JSON.stringify(data);
  }
}

export const analyticsService = new AnalyticsService();
