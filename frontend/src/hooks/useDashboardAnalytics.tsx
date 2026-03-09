// src/hooks/useDashboardAnalytics.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsStats {
  totalProperties: number;
  totalUnits: number;
  activeUsers: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  newUsers: number;
  conversionRate: number;
  propertiesByStatus: {
    active: number;
    pending: number;
    sold: number;
    rented: number;
    maintenance: number;
  };
  unitsByStatus: {
    available: number;
    occupied: number;
    maintenance: number;
    [key: string]: number;
  };
  usersByRole: {
    super_admin: number;
    property_manager: number;
    tenant: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  userGrowthData: Array<{
    month: string;
    newUsers: number;
    activeUsers: number;
  }>;
  occupancyData: Array<{
    month: string;
    occupancyRate: number;
  }>;
  propertyTypes: Array<{
    type: string;
    count: number;
  }>;
  topProperties: Array<{
    id: string;
    name: string;
    revenue: number;
    occupancyRate: number;
    unitCount: number;
  }>;
  paymentStatus: {
    onTime: number;
    late: number;
    overdue: number;
  };
}

interface TimeRange {
  start: Date;
  end: Date;
}

export const useDashboardAnalytics = (timeRange?: TimeRange) => {
  const [stats, setStats] = useState<AnalyticsStats>({
    totalProperties: 0,
    totalUnits: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    activeSessions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    newUsers: 0,
    conversionRate: 0,
    propertiesByStatus: {
      active: 0,
      pending: 0,
      sold: 0,
      rented: 0,
      maintenance: 0,
    },
    unitsByStatus: {
      available: 0,
      occupied: 0,
      maintenance: 0,
    },
    usersByRole: {
      super_admin: 0,
      property_manager: 0,
      tenant: 0,
    },
    monthlyRevenue: [],
    userGrowthData: [],
    occupancyData: [],
    propertyTypes: [],
    topProperties: [],
    paymentStatus: {
      onTime: 0,
      late: 0,
      overdue: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        propertiesData,
        usersData,
        approvalsData,
        paymentsData,
        sessionsData,
        unitsData,
      ] = await Promise.all([
        fetchPropertiesAnalytics(),
        fetchUsersAnalytics(),
        fetchApprovalsAnalytics(),
        fetchPaymentsAnalytics(),
        fetchSessionsAnalytics(),
        fetchUnitsAnalytics(),
      ]);

      const monthlyGrowth = calculateMonthlyGrowth(paymentsData.monthlyRevenue);
      const conversionRate = calculateConversionRate(
        usersData.newUsers,
        propertiesData.totalProperties
      );

      setStats({
        totalProperties: propertiesData.totalProperties,
        totalUnits: unitsData.totalUnits,
        activeUsers: usersData.activeUsers,
        pendingApprovals: approvalsData.pendingApprovals,
        totalRevenue: paymentsData.totalRevenue,
        monthlyGrowth,
        activeSessions: sessionsData.activeSessions,
        avgSessionDuration: sessionsData.avgSessionDuration,
        bounceRate: sessionsData.bounceRate,
        newUsers: usersData.newUsers,
        conversionRate,
        propertiesByStatus: propertiesData.propertiesByStatus,
        unitsByStatus: unitsData.unitsByStatus,
        usersByRole: usersData.usersByRole,
        monthlyRevenue: paymentsData.monthlyRevenue,
        userGrowthData: usersData.userGrowthData,
        occupancyData: unitsData.occupancyData,
        propertyTypes: propertiesData.propertyTypes,
        topProperties: propertiesData.topProperties,
        paymentStatus: paymentsData.paymentStatus,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
      toast({
        title: "Error",
        description: "Failed to load dashboard analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  const fetchPropertiesAnalytics = async () => {
    try {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, name, status, type");

      if (error) throw error;

      const totalProperties = properties?.length || 0;

      // Count properties by status
      const propertiesByStatus = {
        active: properties?.filter((p) => p.status === "active").length || 0,
        pending: properties?.filter((p) => p.status === "pending").length || 0,
        sold: properties?.filter((p) => p.status === "sold").length || 0,
        rented: properties?.filter((p) => p.status === "rented").length || 0,
        maintenance:
          properties?.filter((p) => p.status === "maintenance").length || 0,
      };

      // Count properties by type
      const propertyTypeCounts: Record<string, number> = {};
      properties?.forEach((property) => {
        const type = property.type || "other";
        propertyTypeCounts[type] = (propertyTypeCounts[type] || 0) + 1;
      });

      const propertyTypes = Object.entries(propertyTypeCounts).map(
        ([type, count]) => ({
          type,
          count,
        })
      );

      // Fetch top properties by revenue from payments
      const { data: payments } = await supabase
        .from("payments")
        .select("property_id, amount, created_at")
        .eq("status", "completed");

      // Calculate revenue by property
      const revenueByProperty: Record<string, number> = {};
      payments?.forEach((payment) => {
        if (payment.property_id) {
          revenueByProperty[payment.property_id] =
            (revenueByProperty[payment.property_id] || 0) + (payment.amount || 0);
        }
      });

      // Get top 3 properties and their unit counts
      const topProperties = (
        await Promise.all(
          Object.entries(revenueByProperty)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(async ([propertyId, revenue]) => {
              const propertyData = properties?.find((p) => p.id === propertyId);
              const { count: unitCount } = await supabase
                .from("units")
                .select("*", { count: "est", head: true })
                .eq("property_id", propertyId);

              const { data: units } = await supabase
                .from("units")
                .select("status")
                .eq("property_id", propertyId);

              const occupiedUnits =
                units?.filter((u) => u.status === "occupied").length || 0;
              const totalUnits = units?.length || 1;
              const occupancyRate =
                totalUnits > 0
                  ? Math.round((occupiedUnits / totalUnits) * 100)
                  : 0;

              return {
                id: propertyId,
                name: propertyData?.name || "Unknown Property",
                revenue,
                occupancyRate,
                unitCount: totalUnits,
              };
            })
        )
      ).filter((p) => p !== null);

      return {
        totalProperties,
        propertiesByStatus,
        propertyTypes,
        topProperties,
      };
    } catch (err) {
      console.error("Error fetching properties analytics:", err);
      throw err;
    }
  };

  const fetchUsersAnalytics = async () => {
    try {
      // Get all users
      const { data: users, error } = await supabase
        .from("profiles")
        .select("role, created_at");

      if (error) throw error;

      const activeUsers = users?.length || 0;

      // Count users by role
      const usersByRole = {
        super_admin: users?.filter((u) => u.role === "super_admin").length || 0,
        property_manager:
          users?.filter((u) => u.role === "property_manager").length || 0,
        tenant: users?.filter((u) => u.role === "tenant").length || 0,
      };

      // Calculate new users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newUsers =
        users?.filter((user) => new Date(user.created_at) > sevenDaysAgo)
          .length || 0;

      // Calculate user growth data for last 6 months
      const userGrowthData: Array<{ month: string; newUsers: number; activeUsers: number }> = [];
      const months = 6;

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthlyNewUsers =
          users?.filter((user) => {
            const userDate = new Date(user.created_at);
            return userDate >= monthStart && userDate <= monthEnd;
          }).length || 0;

        // For active users, we'll use a decreasing percentage of total
        const estimatedActiveUsers = Math.floor(
          activeUsers * (0.5 + (i / months) * 0.5)
        );

        userGrowthData.push({
          month: monthName,
          newUsers: monthlyNewUsers,
          activeUsers: estimatedActiveUsers,
        });
      }

      return {
        activeUsers,
        usersByRole,
        newUsers,
        userGrowthData,
      };
    } catch (err) {
      console.error("Error fetching users analytics:", err);
      throw err;
    }
  };

  const fetchApprovalsAnalytics = async () => {
    try {
      // Check if approvals table exists
      const { data: approvals, error } = await supabase
        .from("approvals")
        .select("status")
        .eq("status", "pending");

      if (error && error.code !== "42P01") {
        // Ignore table doesn't exist error
        console.error("Error fetching approvals:", error);
      }

      return {
        pendingApprovals: approvals?.length || 0,
      };
    } catch (err) {
      console.error("Error fetching approvals analytics:", err);
      return { pendingApprovals: 0 };
    }
  };

  const fetchPaymentsAnalytics = async () => {
    try {
      // Check if payments table exists
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, status, created_at, due_date");

      if (error && error.code !== "42P01") {
        // Ignore table doesn't exist error
        console.error("Error fetching payments:", error);
      }

      const totalRevenue =
        payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      // Calculate payment status percentages
      const totalPayments = payments?.length || 0;
      const onTimePayments = payments?.filter(
        (p) => p.status === "completed" || p.status === "paid"
      ).length || 0;
      const latePayments = payments?.filter((p) => p.status === "late").length || 0;
      const overduePayments = payments?.filter(
        (p) => p.status === "overdue"
      ).length || 0;

      const paymentStatus = {
        onTime: totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 0,
        late: totalPayments > 0 ? Math.round((latePayments / totalPayments) * 100) : 0,
        overdue:
          totalPayments > 0 ? Math.round((overduePayments / totalPayments) * 100) : 0,
      };

      // Calculate monthly revenue (last 6 months)
      const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
      const months = 6;

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthlyPayments =
          payments?.filter((payment) => {
            const paymentDate = new Date(payment.created_at);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          }) || [];

        const revenue = monthlyPayments.reduce(
          (sum, payment) => sum + (payment.amount || 0),
          0
        );

        monthlyRevenue.push({
          month: monthName,
          revenue,
        });
      }

      return {
        totalRevenue,
        monthlyRevenue,
        paymentStatus,
      };
    } catch (err) {
      console.error("Error fetching payments analytics:", err);
      return {
        totalRevenue: 0,
        monthlyRevenue: [],
        paymentStatus: { onTime: 0, late: 0, overdue: 0 },
      };
    }
  };

  const fetchSessionsAnalytics = async () => {
    try {
      // Mock session data - in a real app, this would come from your analytics service
      const activeSessions = Math.floor(Math.random() * 50) + 10;
      const avgSessionDuration = 5 * 60 + Math.floor(Math.random() * 240); // 5-9 minutes in seconds
      const bounceRate = 30 + Math.random() * 20; // 30-50%

      return {
        activeSessions,
        avgSessionDuration,
        bounceRate,
      };
    } catch (err) {
      console.error("Error fetching sessions analytics:", err);
      return {
        activeSessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
      };
    }
  };

  const fetchUnitsAnalytics = async () => {
    try {
      const { data: units, error } = await supabase
        .from("units")
        .select("status, property_id, created_at, price");

      if (error) throw error;

      const totalUnits = units?.length || 0;

      // Count units by status
      const unitsByStatus = {
        available: units?.filter((u) => u.status === "available").length || 0,
        occupied: units?.filter((u) => u.status === "occupied").length || 0,
        maintenance: units?.filter((u) => u.status === "maintenance").length || 0,
      };

      // Calculate occupancy data for last 6 months
      const occupancyData: Array<{ month: string; occupancyRate: number }> = [];
      const months = 6;

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Get units created by this month
        const unitsInMonth = units?.filter((u) => {
          const unitDate = new Date(u.created_at);
          return unitDate <= monthEnd;
        }) || [];

        const occupiedInMonth = unitsInMonth.filter(
          (u) => u.status === "occupied"
        ).length;
        const occupancyRate =
          unitsInMonth.length > 0
            ? Math.round((occupiedInMonth / unitsInMonth.length) * 100)
            : 0;

        occupancyData.push({
          month: monthName,
          occupancyRate,
        });
      }

      return {
        totalUnits,
        unitsByStatus,
        occupancyData,
      };
    } catch (err) {
      console.error("Error fetching units analytics:", err);
      throw err;
    }
  };

  const calculateMonthlyGrowth = (
    monthlyRevenue: Array<{ month: string; revenue: number }>
  ) => {
    if (monthlyRevenue.length < 2) return 0;

    const currentMonth = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const previousMonth = monthlyRevenue[monthlyRevenue.length - 2].revenue;

    if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;

    return ((currentMonth - previousMonth) / previousMonth) * 100;
  };

  const calculateConversionRate = (
    newUsers: number,
    totalProperties: number
  ) => {
    if (totalProperties === 0) return 0;
    return (newUsers / totalProperties) * 100;
  };

  const exportAnalytics = async (format: "csv" | "json" = "json") => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        stats,
        timeRange: timeRange || "all",
      };

      if (format === "csv") {
        // Convert stats to CSV format
        const csvRows = [];

        // Basic stats
        csvRows.push("Metric,Value");
        csvRows.push(`Total Properties,${stats.totalProperties}`);
        csvRows.push(`Active Users,${stats.activeUsers}`);
        csvRows.push(`Total Revenue,${stats.totalRevenue}`);
        csvRows.push(`Monthly Growth,${stats.monthlyGrowth.toFixed(2)}%`);

        // Properties by status
        csvRows.push("");
        csvRows.push("Properties by Status,Count");
        Object.entries(stats.propertiesByStatus).forEach(([status, count]) => {
          csvRows.push(`${status},${count}`);
        });

        const csv = csvRows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Export as JSON
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics_export_${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      setError(err.message || "Export failed");
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  const refresh = () => {
    fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    stats,
    loading,
    error,
    refresh,
    exportAnalytics,
  };
};
