import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import SuperAdminProfile from "@/components/portal/super-admin/SuperAdminProfile";
import { supabase } from "@/integrations/supabase/client";
import { formatForDisplay } from "@/utils/formatCurrency";

interface DashboardStats {
  totalProperties: number;
  totalUsers: number;
  totalTenants: number;
  totalPayments: number;
  totalApprovals: number;
  activeUsers: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  pendingMaintenance: number;
  overduePayments: number;
  collectionRate: number;
  vacantUnits: number;
  totalLeases: number;
  pendingRequests: number;
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: "property" | "user" | "payment" | "maintenance" | "approval";
  createdAt: string;
  time: string;
  action?: string;
}

interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: "warning" | "error" | "success" | "info" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  action?: string;
  createdAt?: string;
}

interface SystemStatus {
  database: boolean;
  api: boolean;
  responseTime: number;
  lastChecked: string;
}

type ActivityStatus = "PROPERTY" | "USER" | "PAYMENT" | "MAINTENANCE" | "APPROVAL";
type RequestPriority = "HIGH" | "MEDIUM" | "NORMAL";

const EMPTY_STATS: DashboardStats = {
  totalProperties: 0,
  totalUsers: 0,
  totalTenants: 0,
  totalPayments: 0,
  totalApprovals: 0,
  activeUsers: 0,
  pendingApprovals: 0,
  totalRevenue: 0,
  totalUnits: 0,
  occupiedUnits: 0,
  occupancyRate: 0,
  pendingMaintenance: 0,
  overduePayments: 0,
  collectionRate: 0,
  vacantUnits: 0,
  totalLeases: 0,
  pendingRequests: 0,
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: true,
    api: true,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadDashboardData({ silent: true });
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const loadDashboardData = async (opts?: { silent?: boolean; showToast?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoading(true);
      }

      const [nextStats, nextRecent, nextSystemStatus] = await Promise.all([
        loadStats(),
        loadRecentItems(),
        checkSystemStatus(),
      ]);
      const nextAlerts = await loadSystemAlerts(nextStats);

      setStats(nextStats);
      setRecentItems(nextRecent);
      setSystemStatus(nextSystemStatus);
      setSystemAlerts(nextAlerts);

      if (opts?.showToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (!opts?.silent) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  };

  const loadStats = async (): Promise<DashboardStats> => {
    try {
      const [{ data: properties }, { data: units = [] }] = await Promise.all([
        supabase.from("properties").select("id, status"),
        supabase.from("units").select("id, status, price"),
      ]);

      const occupiedUnits = units.filter(
        (u: any) => String(u.status || "").toLowerCase() === "occupied",
      ).length;
      const totalUnits = units.length;
      const vacantUnits = Math.max(totalUnits - occupiedUnits, 0);
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      const [
        { count: totalUsersCount },
        { count: activeUsersCount },
        { count: totalApprovalsCount },
        { count: pendingApprovalsCount },
        { count: pendingMaintenanceCount },
      ] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("approvals")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("approvals")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("maintenance_requests")
            .select("id", { count: "exact", head: true })
            .in("status", ["pending", "assigned"]),
        ]);

      const todayIso = new Date().toISOString().split("T")[0];
      const { count: totalPaymentsCount } = await supabase
        .from("rent_payments")
        .select("id", { count: "exact", head: true });

      const { count: overduePaymentsCount } = await supabase
        .from("rent_payments")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "partial"])
        .lt("due_date", todayIso);

      const { count: totalTenantsCount } = await supabase
        .from("tenants")
        .select("id", { count: "exact", head: true });

      const { count: totalLeasesCount } = await supabase
        .from("leases")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments } = await supabase
        .from("rent_payments")
        .select("amount, amount_paid, status, created_at")
        .in("status", ["paid", "partial", "completed"])
        .gte("created_at", startOfMonth.toISOString());

      const totalRevenue =
        payments?.reduce((sum: number, payment: any) => {
          const paidAmount = Number(payment.amount_paid || 0);
          const fallbackAmount = Number(payment.amount || 0);
          return sum + (paidAmount || fallbackAmount);
        }, 0) || 0;

      const totalExpectedRevenue = units
        .filter((u: any) => String(u.status || "").toLowerCase() === "occupied")
        .reduce((sum: number, u: any) => sum + Number(u.price || 0), 0);

      const collectionRate = totalExpectedRevenue > 0 ? (totalRevenue / totalExpectedRevenue) * 100 : 0;

      const pendingRequests = (pendingApprovalsCount || 0) + (pendingMaintenanceCount || 0);

      return {
        totalProperties: properties?.length || 0,
        totalUsers: totalUsersCount || 0,
        totalTenants: totalTenantsCount || 0,
        totalPayments: totalPaymentsCount || 0,
        totalApprovals: totalApprovalsCount || 0,
        activeUsers: activeUsersCount || 0,
        pendingApprovals: pendingApprovalsCount || 0,
        totalRevenue,
        totalUnits,
        occupiedUnits,
        occupancyRate: Number(occupancyRate.toFixed(1)),
        pendingMaintenance: pendingMaintenanceCount || 0,
        overduePayments: overduePaymentsCount || 0,
        collectionRate: Number(collectionRate.toFixed(1)),
        vacantUnits,
        totalLeases: totalLeasesCount || 0,
        pendingRequests,
      };
    } catch (error) {
      console.error("Error loading stats:", error);
      return EMPTY_STATS;
    }
  };

  const mapEntityTypeToRecentType = (entityType?: string): RecentItem["type"] => {
    const normalized = String(entityType || "").toLowerCase();
    if (["property", "properties", "unit", "units"].includes(normalized)) return "property";
    if (["profile", "profiles", "user", "users", "tenant", "tenants"].includes(normalized)) return "user";
    if (["payment", "payments", "rent_payments", "invoice", "invoices"].includes(normalized)) return "payment";
    if (["maintenance", "maintenance_request", "maintenance_requests"].includes(normalized)) return "maintenance";
    return "approval";
  };

  const mapEntityTypeToRoute = (entityType?: string): string => {
    const normalized = String(entityType || "").toLowerCase();
    if (["property", "properties", "unit", "units"].includes(normalized)) return "/portal/super-admin/properties";
    if (["profile", "profiles", "user", "users", "tenant", "tenants"].includes(normalized)) return "/portal/super-admin/users";
    if (["payment", "payments", "rent_payments", "invoice", "invoices"].includes(normalized)) return "/portal/super-admin/payments";
    if (["maintenance", "maintenance_request", "maintenance_requests"].includes(normalized)) return "/portal/super-admin/dashboard";
    if (["application", "applications", "lease_application", "lease_applications"].includes(normalized)) return "/portal/super-admin/applications";
    return "/portal/super-admin/approvals";
  };

  const formatAuditActionLabel = (action?: string): string => {
    const safeAction = String(action || "ACTIVITY");
    return safeAction
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const loadRecentItems = async (): Promise<RecentItem[]> => {
    try {
      const { data: auditLogs, error: auditError } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!auditError && (auditLogs || []).length > 0) {
        const auditItems: RecentItem[] = (auditLogs || []).map((log: any) => {
          const details = typeof log?.details === "object" && log.details !== null ? log.details : {};
          const entityLabel = String(log?.entity_type || "system").replace(/_/g, " ");
          const summaryBits = [
            details?.reason ? `Reason: ${details.reason}` : null,
            log?.entity_id ? `ID: ${String(log.entity_id).slice(0, 8)}` : null,
          ].filter(Boolean);

          return {
            id: `audit-${log.id}`,
            title: formatAuditActionLabel(log.action),
            subtitle: `${entityLabel}${summaryBits.length ? ` • ${summaryBits.join(" • ")}` : ""}`,
            type: mapEntityTypeToRecentType(log.entity_type),
            createdAt: log.created_at,
            time: formatTimeAgo(log.created_at),
            action: mapEntityTypeToRoute(log.entity_type),
          };
        });

        return auditItems.slice(0, 12);
      }

      const items: RecentItem[] = [];

      const [propertiesRes, usersRes, approvalsRes, paymentsRes, maintenanceRes, applicationsRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id, name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role, status, created_at")
          .neq("role", "super_admin")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("approvals")
          .select("id, approval_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("rent_payments")
          .select("id, amount, amount_paid, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("maintenance_requests")
          .select("id, title, status, priority, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("lease_applications")
          .select("id, applicant_name, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const recentProperties = propertiesRes.data || [];
      const recentUsers = usersRes.data || [];
      const recentApprovals = approvalsRes.data || [];
      const recentPayments = paymentsRes.data || [];
      const recentMaintenance = maintenanceRes.data || [];
      const recentApplications = applicationsRes.data || [];

      recentProperties.forEach((prop: any) => {
        items.push({
          id: `property-${prop.id}`,
          title: prop.name || "Unnamed Property",
          subtitle: `Property • ${prop.status || "active"}`,
          type: "property",
          createdAt: prop.created_at,
          time: formatTimeAgo(prop.created_at),
          action: "/portal/super-admin/properties",
        });
      });

      recentUsers.forEach((usr: any) => {
        const displayName = `${usr.first_name || ""} ${usr.last_name || ""}`.trim() || usr.email;
        items.push({
          id: `user-${usr.id}`,
          title: displayName,
          subtitle: `${usr.role || "user"} • ${usr.status || "active"}`,
          type: "user",
          createdAt: usr.created_at,
          time: formatTimeAgo(usr.created_at),
          action: "/portal/super-admin/users",
        });
      });

      recentApprovals.forEach((approval: any) => {
        items.push({
          id: `approval-${approval.id}`,
          title: `Approval ${approval.approval_type || "request"}`,
          subtitle: `Approval • ${approval.status || "pending"}`,
          type: "approval",
          createdAt: approval.created_at,
          time: formatTimeAgo(approval.created_at),
          action: "/portal/super-admin/approvals",
        });
      });

      recentPayments.forEach((payment: any) => {
        const value = Number(payment.amount_paid || payment.amount || 0);
        items.push({
          id: `payment-${payment.id}`,
          title: `Payment ${formatForDisplay(value, "KSH", true)}`,
          subtitle: `Payment • ${payment.status || "pending"}`,
          type: "payment",
          createdAt: payment.created_at,
          time: formatTimeAgo(payment.created_at),
          action: "/portal/super-admin/payments",
        });
      });

      recentMaintenance.forEach((request: any) => {
        items.push({
          id: `maintenance-${request.id}`,
          title: request.title || "Maintenance request",
          subtitle: `Maintenance • ${request.status || "pending"}${request.priority ? ` • ${request.priority}` : ""}`,
          type: "maintenance",
          createdAt: request.created_at,
          time: formatTimeAgo(request.created_at),
          action: "/portal/super-admin/dashboard",
        });
      });

      recentApplications.forEach((application: any) => {
        items.push({
          id: `application-${application.id}`,
          title: application.applicant_name || "Lease application",
          subtitle: `Application • ${application.status || "pending"}`,
          type: "approval",
          createdAt: application.created_at,
          time: formatTimeAgo(application.created_at),
          action: "/portal/super-admin/applications",
        });
      });

      return items
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12);
    } catch (error) {
      console.error("Error loading recent items:", error);
      return [];
    }
  };

  const loadSystemAlerts = async (nextStats: DashboardStats): Promise<SystemAlert[]> => {
    try {
      const alerts: SystemAlert[] = [];
      const nowIso = new Date().toISOString();

      const { data: emergencyMaintenance } = await supabase
        .from("maintenance_requests")
        .select("id, title, description, created_at")
        .eq("priority", "emergency")
        .eq("status", "pending")
        .limit(3);

      (emergencyMaintenance || []).forEach((req: any) => {
        alerts.push({
          id: `em-${req.id}`,
          title: `Emergency: ${req.title || "Maintenance request"}`,
          description: req.description || "Immediate action required.",
          type: "critical",
          priority: "critical",
          action: "/portal/super-admin/maintenance",
          createdAt: req.created_at || nowIso,
        });
      });

      if (nextStats.overduePayments > 0) {
        alerts.push({
          id: "overdue-payments",
          title: "Overdue payments",
          description: `${nextStats.overduePayments} rent payment(s) are overdue.`,
          type: "error",
          priority: "high",
          action: "/portal/super-admin/payments",
          createdAt: nowIso,
        });
      }

      if (nextStats.pendingApprovals > 0) {
        alerts.push({
          id: "approvals",
          title: "Pending approvals",
          description: `${nextStats.pendingApprovals} approval item(s) are awaiting review.`,
          type: "warning",
          priority: "high",
          action: "/portal/super-admin/approvals",
          createdAt: nowIso,
        });
      }

      if (nextStats.vacantUnits > 0) {
        alerts.push({
          id: "vacancies",
          title: "Vacant units",
          description: `${nextStats.vacantUnits} unit(s) are currently vacant.`,
          type: "info",
          priority: "medium",
          action: "/portal/super-admin/properties",
          createdAt: nowIso,
        });
      }

      if (alerts.length === 0) {
        alerts.push({
          id: "healthy",
          title: "System healthy",
          description: "No high-priority issues detected.",
          type: "success",
          priority: "low",
          action: "/portal/super-admin/dashboard",
          createdAt: nowIso,
        });
      }

      return alerts;
    } catch (error) {
      console.error("Error loading alerts:", error);
      return [
        {
          id: "fallback",
          title: "Alerts unavailable",
          description: "Could not load alerts right now.",
          type: "warning",
          priority: "medium",
          action: "/portal/super-admin/settings",
          createdAt: new Date().toISOString(),
        },
      ];
    }
  };

  const checkSystemStatus = async (): Promise<SystemStatus> => {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      const responseTime = Date.now() - startTime;

      return {
        database: !error,
        api: responseTime < 2000,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      return {
        database: false,
        api: false,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData({ showToast: true });
    setRefreshing(false);
  };

  const handleSendNote = () => {
    if (!noteDraft.trim()) {
      toast.info("Type a note first");
      return;
    }

    toast.success("Note queued for admin log");
    setNoteDraft("");
  };

  const resolveRequestStatus = (item: RecentItem): ActivityStatus => {
    switch (item.type) {
      case "property":
        return "PROPERTY";
      case "user":
        return "USER";
      case "approval":
        return "APPROVAL";
      case "maintenance":
        return "MAINTENANCE";
      case "payment":
        return "PAYMENT";
      default:
        return "PROPERTY";
    }
  };

  const resolveRequestPriority = (item: RecentItem): RequestPriority => {
    if (item.type === "approval" || item.type === "maintenance") return "HIGH";
    if (item.type === "payment") return "MEDIUM";
    return "NORMAL";
  };

  const getStaffAlertTone = (type: SystemAlert["type"]) => {
    switch (type) {
      case "critical":
      case "error":
        return "border-[#d8606b] bg-[#ffe6e9] text-[#7f1f2a]";
      case "warning":
        return "border-[#e0a838] bg-[#fff4d8] text-[#6b4c05]";
      case "success":
        return "border-[#5db77b] bg-[#e5f8eb] text-[#1f5f35]";
      default:
        return "border-[#78a7ce] bg-[#eaf4ff] text-[#21486f]";
    }
  };

  const getRecentItemTone = (type: RecentItem["type"]) => {
    switch (type) {
      case "user":
        return "border-[#9aa5b5] bg-[#edf1f6] text-[#2f3f55]";
      case "payment":
        return "border-[#9d88e0] bg-[#efeaff] text-[#3f2a80]";
      case "maintenance":
        return "border-[#e0b352] bg-[#fff5df] text-[#6b4c08]";
      case "approval":
        return "border-[#72a8e5] bg-[#e8f2ff] text-[#184f8f]";
      case "property":
      default:
        return "border-[#71be88] bg-[#e8f8ee] text-[#1f6a37]";
    }
  };

  const getUserRoleTone = (role: string) => {
    const normalizedRole = role.trim().toLowerCase();
    if (normalizedRole === "tenant") return "bg-[#2fa7bf] text-white";
    if (normalizedRole === "property_manager") return "bg-[#156ad8] text-white";
    if (normalizedRole === "caretaker") return "bg-[#27a85b] text-white";
    if (normalizedRole === "supplier") return "bg-[#f3bd11] text-[#1f2937]";
    if (normalizedRole === "accountant") return "bg-[#6a4acb] text-white";
    if (normalizedRole === "technician") return "bg-[#dc3545] text-white";
    if (normalizedRole === "admin" || normalizedRole === "super_admin") return "bg-[#2f3d51] text-white";
    return "bg-[#7b8895] text-white";
  };

  const filteredRecentItems = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return recentItems;

    return recentItems.filter(
      (item) =>
        item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term),
    );
  }, [recentItems, searchQuery]);

  const staffActivityNotes = useMemo(() => {
    const alertNotes = systemAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      source: "alert" as const,
      label: alert.id.split("-")[0] || "System",
      createdAt: alert.createdAt || new Date().toISOString(),
      title: alert.title,
      detail: alert.description,
      alertType: alert.type,
      activityType: undefined as RecentItem["type"] | undefined,
    }));

    const recentNotes = recentItems.map((item) => ({
      id: `recent-${item.id}`,
      source: "recent" as const,
      label: item.type,
      createdAt: item.createdAt,
      title: item.title,
      detail: item.subtitle,
      alertType: undefined as SystemAlert["type"] | undefined,
      activityType: item.type,
    }));

    return [...alertNotes, ...recentNotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [systemAlerts, recentItems]);

  const highPriorityCount = useMemo(
    () => systemAlerts.filter((alert) => alert.priority === "high" || alert.priority === "critical").length,
    [systemAlerts],
  );

  const inReviewCount = useMemo(
    () => filteredRecentItems.filter((item) => resolveRequestStatus(item) === "APPROVAL").length,
    [filteredRecentItems],
  );

  const pipelineLegend = useMemo(() => {
    const data = [
      { label: "Activities", value: Math.max(filteredRecentItems.length, 0), color: "#2fa7df" },
      { label: "Maintenance", value: Math.max(stats.pendingMaintenance, 0), color: "#7b8895" },
      { label: "Payments", value: Math.max(stats.overduePayments, 0), color: "#6a4acb" },
      { label: "Approvals", value: Math.max(stats.pendingApprovals, 0), color: "#156ad8" },
      { label: "Vacancies", value: Math.max(stats.vacantUnits, 0), color: "#f59e0b" },
      { label: "Active Users", value: Math.max(stats.activeUsers - stats.pendingApprovals, 0), color: "#27a85b" },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return data.map((item, index) => ({ ...item, percent: index < 5 ? 20 : 0 }));
    }

    return data.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [filteredRecentItems.length, stats]);

  const donutGradient = useMemo(() => {
    const totalPercent = pipelineLegend.reduce((sum, item) => sum + item.percent, 0) || 100;
    let cursor = 0;

    const slices = pipelineLegend.map((item, index) => {
      const start = cursor;
      const raw = (item.percent / totalPercent) * 100;
      const end = index === pipelineLegend.length - 1 ? 100 : start + raw;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });

    return `conic-gradient(${slices.join(",")})`;
  }, [pipelineLegend]);

  const topMetrics = [
    {
      title: "Properties",
      value: stats.totalProperties.toLocaleString(),
      bg: "bg-[#2aa8bf]",
      footer: "bg-[#1f93a8]",
      href: "/portal/super-admin/properties",
    },
    {
      title: "Users",
      value: stats.totalUsers.toLocaleString(),
      bg: "bg-[#2daf4a]",
      footer: "bg-[#24933d]",
      href: "/portal/super-admin/users",
    },
    {
      title: "Payments",
      value: stats.totalPayments.toLocaleString(),
      bg: "bg-[#f3bd11]",
      footer: "bg-[#d6a409]",
      href: "/portal/super-admin/payments",
    },
    {
      title: "Approvals",
      value: stats.pendingApprovals.toLocaleString(),
      bg: "bg-[#dc3545]",
      footer: "bg-[#c12c3a]",
      href: "/portal/super-admin/approvals",
    },
  ];

  const rightStats = [
    {
      title: "Tenants",
      value: stats.totalTenants.toLocaleString(),
      bg: "bg-[#f3bd11]",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Properties",
      value: stats.totalProperties.toLocaleString(),
      bg: "bg-[#dc3545]",
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      title: "Payments Due",
      value: stats.overduePayments.toLocaleString(),
      bg: "bg-[#2dae49]",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Approvals Pending",
      value: stats.pendingApprovals.toLocaleString(),
      bg: "bg-[#2fa7bf]",
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#2f3d51]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-['Poppins','Segoe_UI',sans-serif] text-[#243041] p-4 md:p-6 bg-[#d7dce1] min-h-screen">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#bcc3cd] pb-4">
          <div>
            <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#9aa4b1] bg-[#eef1f4] px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] transition-colors hover:bg-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric) => (
            <div key={metric.title} className="border border-[#adb5bf] shadow-sm rounded-none flex flex-col justify-between">
              <div className={`${metric.bg} h-[132px] w-full flex flex-col justify-center px-4`}>
                <div className="text-[44px] font-bold leading-none text-[#111827]">{metric.value}</div>
                <p className="text-[22px] font-semibold leading-none text-[#111827] mt-1">{metric.title}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(metric.href)}
                className={`h-8 w-full ${metric.footer} flex items-center justify-center gap-1 text-[13px] font-semibold text-[#111827] transition-opacity hover:opacity-95`}
              >
                More info <span className="text-[14px]">➔</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="border-b border-[#bcc3cd] pb-3 mb-3">
              <h2 className="text-[34px] font-bold leading-none text-[#263143]">Staff Activity Notes</h2>
            </div>

            <div className="max-h-[260px] space-y-3 overflow-y-auto pt-2 pb-4">
              {staffActivityNotes.map((note, idx) => (
                <div
                  key={note.id}
                  style={{ paddingLeft: idx > 0 ? idx * 12 : 0 }}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#5f6b7c] mb-1">
                    <span>{note.label}</span>
                    <span>{formatTimeAgo(note.createdAt)}</span>
                  </div>
                  <div
                    className={`px-3 py-2 text-[13px] border ${
                      note.source === "alert"
                        ? getStaffAlertTone(note.alertType || "info")
                        : getRecentItemTone(note.activityType || "property")
                    }`}
                  >
                    {note.title}: {note.detail}
                  </div>
                </div>
              ))}

              {staffActivityNotes.length === 0 && (
                <div className="bg-[#eef1f4] border border-[#d2d8e0] px-3 py-8 text-center text-[13px] font-medium text-[#5f6b7c]">
                  No notes available right now.
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-[#bcc3cd]">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Type Message ..."
                  className="h-10 flex-1 border border-[#b6bec8] bg-[#eef1f4] px-3 text-[13px] text-[#1f2937] outline-none transition-colors placeholder:text-[#778396] focus:border-[#8e98a5]"
                />
                <button
                  type="button"
                  onClick={handleSendNote}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-[#f0a500] px-5 text-[12px] font-semibold text-[#1f2937] transition-colors hover:bg-[#da9600]"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2 xl:col-span-4">
            {rightStats.map((card) => (
              <div
                key={card.title}
                className={`${card.bg} flex items-center justify-between rounded-none border border-[#adb4be] px-4 py-3 text-[#111827]`}
              >
                <div className="flex items-center gap-2">
                  {card.icon}
                  <div>
                    <p className="text-[20px] font-bold leading-none">{card.value}</p>
                    <p className="mt-1 text-[20px] font-semibold leading-none">{card.title}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-none border border-[#adb4be] bg-[#eef1f4] px-4 py-3 mt-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5f6b7c]">System</p>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-[#334155]">
                {systemStatus.database ? (
                  <CheckCircle className="h-4 w-4 text-[#2dae49]" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-[#dc3545]" />
                )}
                Database {systemStatus.database ? "Operational" : "Offline"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-[#334155]">
                <Clock className="h-4 w-4 text-[#2fa7bf]" />
                API latency {systemStatus.responseTime}ms
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="flex flex-col gap-3 border-b border-[#bcc3cd] pb-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[34px] font-bold leading-none text-[#263143]">Recent Activities</h2>
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8595]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities..."
                  className="h-9 w-full border border-[#b6bec8] bg-[#eef1f4] pl-9 pr-3 text-[13px] text-[#1f2937] outline-none transition-colors placeholder:text-[#778396] focus:border-[#8e98a5]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">ID</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Activity</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Status</th>
                    <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentItems.slice(0, 7).map((item, index) => {
                    const status = resolveRequestStatus(item);
                    const priority = resolveRequestPriority(item);
                    const userRole = item.type === "user" ? item.subtitle.split("•")[0].trim() : "";

                    return (
                      <tr key={item.id} className="hover:bg-[#e8edf3]">
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#456b96]">
                          {item.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                          <div>{item.title}</div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-[#6b7788]">
                            <span>{item.subtitle}</span>
                            {item.type === "user" && (
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getUserRoleTone(userRole)}`}>
                                {userRole}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                          <span
                            className={`inline-flex px-2 py-1 ${
                              status === "APPROVAL"
                                ? "bg-[#156ad8] text-white"
                                : status === "USER"
                                  ? "bg-[#7b8895] text-white"
                                  : status === "PAYMENT"
                                    ? "bg-[#6a4acb] text-white"
                                    : status === "MAINTENANCE"
                                      ? "bg-[#f3bd11] text-[#1f2937]"
                                      : status === "PROPERTY"
                                        ? "bg-[#27a85b] text-white"
                                        : "bg-[#2fa7bf] text-white"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                          <span
                            className={`inline-flex px-2 py-1 ${
                              priority === "HIGH"
                                ? "bg-[#dc3545] text-white"
                                : priority === "MEDIUM"
                                  ? "bg-[#f3bd11] text-[#1f2937]"
                                  : "bg-[#f7c949] text-[#1f2937]"
                            }`}
                          >
                            {priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRecentItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-[13px] font-medium text-[#5f6b7c]"
                      >
                        No activity rows match this search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="border-b border-[#bcc3cd] pb-3 mb-3">
              <h3 className="text-[32px] font-bold leading-none text-[#263143]">Pipeline Mix</h3>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full" style={{ background: donutGradient }}>
                <div className="h-24 w-24 rounded-full bg-[#d7dce1]" />
              </div>

              <div className="w-full space-y-2 sm:w-auto">
                {pipelineLegend.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-[#334155]">{item.label}</span>
                    </div>
                    <span className="font-semibold text-[#5f6b7c]">({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-none border border-[#c2c9d2] bg-[#edf1f5] px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">Revenue This Month</p>
              <p className="mt-1 text-[20px] font-bold text-[#1f2937]">
                {formatForDisplay(stats.totalRevenue || 0, "KSH", true)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5f6b7c]">
                <Building2 className="h-3.5 w-3.5 text-[#2fa7bf]" />
                {stats.totalProperties} properties
                <Users className="ml-2 h-3.5 w-3.5 text-[#2dae49]" />
                {stats.totalLeases} active leases
                <Wrench className="ml-2 h-3.5 w-3.5 text-[#dc3545]" />
                {stats.pendingMaintenance} maintenance
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge className="bg-[#2f3d51] text-white">Occupancy {stats.occupancyRate}%</Badge>
          <Badge className="bg-[#2dae49] text-white">Collection {Math.round(stats.collectionRate)}%</Badge>
          <Badge className="bg-[#dc3545] text-white">Overdue {stats.overduePayments}</Badge>
          <Badge className="bg-[#2fa7bf] text-white">Units {stats.occupiedUnits}/{stats.totalUnits}</Badge>
        </div>
      </div>

      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl"
            >
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="absolute right-3 top-3 z-10 rounded-md bg-[#2f3d51] p-2 text-white hover:bg-[#243041]"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="max-h-[85vh] overflow-y-auto rounded-2xl border border-[#b7bec8] bg-[#eef1f4] shadow-2xl">
                <SuperAdminProfile />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminDashboard;