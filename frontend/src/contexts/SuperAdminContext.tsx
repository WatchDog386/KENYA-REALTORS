// src/contexts/SuperAdminContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

interface SuperAdminContextType {
  stats: {
    totalProperties: number;
    activeUsers: number;
    pendingApprovals: number;
    totalRevenue: number;
    monthlyGrowth: number;
  };
  recentActivities: any[];
  systemAlerts: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  generateReport: (type: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(
  undefined
);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
  }
  return context;
};

interface SuperAdminProviderProps {
  children: ReactNode;
}

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({
  children,
}) => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      // Get properties count
      const { count: propertiesCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      // Get active users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("role", "is", null);

      // Get pending approvals
      const { count: approvalsCount } = await supabase
        .from("approvals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get total revenue
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue =
        payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({
        totalProperties: propertiesCount || 0,
        activeUsers: usersCount || 0,
        pendingApprovals: approvalsCount || 0,
        totalRevenue,
        monthlyGrowth: 12.5,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
      setError("Failed to load statistics");
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Mock activities for now
      const mockActivities = [
        {
          id: "1",
          action: "Property added",
          user: "John Doe",
          time: "2 hours ago",
          type: "property",
        },
        {
          id: "2",
          action: "User registered",
          user: "Jane Smith",
          time: "4 hours ago",
          type: "user",
        },
        {
          id: "3",
          action: "Payment received",
          user: "Mike Johnson",
          time: "1 day ago",
          type: "payment",
        },
      ];
      setRecentActivities(mockActivities);
    } catch (err) {
      console.error("Error loading activities:", err);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      // Mock alerts for now
      const mockAlerts = [
        {
          id: "1",
          title: "System Update Available",
          description: "New update ready",
          type: "info",
        },
        {
          id: "2",
          title: "Backup Completed",
          description: "Daily backup successful",
          type: "success",
        },
      ];
      setSystemAlerts(mockAlerts);
    } catch (err) {
      console.error("Error loading alerts:", err);
    }
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivities(),
        loadSystemAlerts(),
      ]);
    } catch (err) {
      console.error("Error refetching:", err);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string) => {
    console.log(`Generating ${type} report...`);
    // Implement report generation logic
  };

  const hasPermission = (permission: string) => {
    // Super admin has all permissions
    return true;
  };

  useEffect(() => {
    refetch();
  }, []);

  const value = {
    stats,
    recentActivities,
    systemAlerts,
    loading,
    error,
    refetch,
    generateReport,
    hasPermission,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
};
