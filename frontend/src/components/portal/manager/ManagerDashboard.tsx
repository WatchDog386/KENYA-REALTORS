import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id: string;
  name: string;
  location: string;
  image_url?: string;
}

interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenancePending: number;
  maintenanceInProgress: number;
  leasesExpiringSoon: number;
  totalRevenueMonth: number;
  occupancyRate: number;
  monthlyPayments: number;
  overduePayments: number;
}

interface RecentActivity {
  id: string;
  type: "payment" | "maintenance" | "tenant" | "lease";
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  priority?: string;
  action?: string;
}

interface SystemStatus {
  database: boolean;
  api: boolean;
  responseTime: number;
  lastChecked: string;
}

const EMPTY_STATS: DashboardStats = {
  totalUnits: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  maintenancePending: 0,
  maintenanceInProgress: 0,
  leasesExpiringSoon: 0,
  totalRevenueMonth: 0,
  occupancyRate: 0,
  monthlyPayments: 0,
  overduePayments: 0,
};

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignedProperty, setAssignedProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [userName, setUserName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: true,
    api: true,
    responseTime: 0,
    lastChecked: new Date().toISOString(),
  });

  useEffect(() => {
    fetchUserProfile();
    loadManagerData();
  }, [user?.id]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (data) {
      const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
      setUserName(fullName || "Manager");
    }
  };

  const checkSystemStatus = async () => {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);

      const responseTime = Date.now() - startTime;

      setSystemStatus({
        database: !error,
        api: responseTime < 2000,
        responseTime,
        lastChecked: new Date().toISOString(),
      });
    } catch {
      setSystemStatus({
        database: false,
        api: false,
        responseTime: 0,
        lastChecked: new Date().toISOString(),
      });
    }
  };

  const loadManagerData = async () => {
    if (!user?.id) return;

    try {
      if (!refreshing) setLoading(true);

      let propertyId = id;

      if (!propertyId) {
        const { data: assignment } = await supabase
          .from("property_manager_assignments")
          .select("property_id")
          .eq("property_manager_id", user.id)
          .maybeSingle();

        propertyId = assignment?.property_id;
      }

      if (!propertyId) {
        setAssignedProperty(null);
        setStats(EMPTY_STATS);
        setRecentActivities([]);
        return;
      }

      const { data: property } = await supabase
        .from("properties")
        .select("id, name, location, image_url")
        .eq("id", propertyId)
        .single();

      if (!property) {
        setAssignedProperty(null);
        setStats(EMPTY_STATS);
        setRecentActivities([]);
        return;
      }

      setAssignedProperty(property as Property);

      const todayIso = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        unitsRes,
        pendingMaintenanceRes,
        inProgressMaintenanceRes,
        monthlyPaymentsRes,
        overduePaymentsRes,
        recentPaymentsRes,
        recentMaintenanceRes,
      ] = await Promise.all([
        supabase.from("units").select("id, status").eq("property_id", propertyId),
        supabase
          .from("maintenance_requests")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId)
          .eq("status", "pending"),
        supabase
          .from("maintenance_requests")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId)
          .eq("status", "in_progress"),
        supabase
          .from("rent_payments")
          .select("id, amount, amount_paid, status, created_at")
          .eq("property_id", propertyId)
          .gte("created_at", startOfMonth.toISOString()),
        supabase
          .from("rent_payments")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId)
          .in("status", ["pending", "partial"])
          .lt("due_date", todayIso),
        supabase
          .from("rent_payments")
          .select("id, amount, amount_paid, status, created_at")
          .eq("property_id", propertyId)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("maintenance_requests")
          .select("id, title, description, status, priority, created_at")
          .eq("property_id", propertyId)
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const units = unitsRes.data || [];
      const totalUnits = units.length;
      const occupiedUnits = units.filter((unit: any) => String(unit.status || "").toLowerCase() === "occupied").length;
      const vacantUnits = units.filter((unit: any) => String(unit.status || "").toLowerCase() === "vacant").length;

      const monthlyPayments = monthlyPaymentsRes.data || [];
      const totalRevenueMonth = monthlyPayments.reduce((sum: number, payment: any) => {
        const paidAmount = Number(payment.amount_paid || 0);
        const fallbackAmount = Number(payment.amount || 0);
        return sum + (paidAmount || fallbackAmount);
      }, 0);

      setStats({
        totalUnits,
        occupiedUnits,
        vacantUnits,
        maintenancePending: pendingMaintenanceRes.count || 0,
        maintenanceInProgress: inProgressMaintenanceRes.count || 0,
        leasesExpiringSoon: 0,
        totalRevenueMonth,
        occupancyRate: totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0,
        monthlyPayments: monthlyPayments.length,
        overduePayments: overduePaymentsRes.count || 0,
      });

      const paymentItems: RecentActivity[] = (recentPaymentsRes.data || []).map((payment: any) => {
        const amount = Number(payment.amount_paid || payment.amount || 0);
        const status = String(payment.status || "pending").toLowerCase();

        return {
          id: `payment-${payment.id}`,
          type: "payment",
          title: `Payment KES ${amount.toLocaleString()}`,
          description: `Payment status: ${status}`,
          date: payment.created_at,
          amount,
          status,
          priority: status === "pending" || status === "partial" ? "HIGH" : "NORMAL",
          action: "/portal/manager/payments",
        };
      });

      const maintenanceItems: RecentActivity[] = (recentMaintenanceRes.data || []).map((request: any) => {
        const status = String(request.status || "pending").toLowerCase();
        const priority = String(request.priority || "normal").toLowerCase();

        return {
          id: `maintenance-${request.id}`,
          type: "maintenance",
          title: request.title || "Maintenance request",
          description: request.description || `Maintenance status: ${status}`,
          date: request.created_at,
          status,
          priority: priority === "emergency" || priority === "high" ? "HIGH" : "MEDIUM",
          action: "/portal/manager/maintenance",
        };
      });

      setRecentActivities(
        [...maintenanceItems, ...paymentItems]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 12),
      );

      await checkSystemStatus();

      if (refreshing) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("Error loading manager dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadManagerData();
  };

  const handleSendNote = () => {
    if (!noteDraft.trim()) {
      toast.info("Type a note first");
      return;
    }

    toast.success("Note queued for manager activity log");
    setNoteDraft("");
  };

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

      return date.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const formatCompactRevenue = (amount: number): string => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const filteredRecentActivities = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return recentActivities;

    return recentActivities.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        String(item.status || "").toLowerCase().includes(term),
    );
  }, [recentActivities, searchQuery]);

  const pipelineLegend = useMemo(() => {
    const data = [
      { label: "Occupied", value: Math.max(stats.occupiedUnits, 0), color: "#2dae49" },
      { label: "Vacant", value: Math.max(stats.vacantUnits, 0), color: "#f3bd11" },
      { label: "Pending Maint.", value: Math.max(stats.maintenancePending, 0), color: "#dc3545" },
      { label: "In Progress", value: Math.max(stats.maintenanceInProgress, 0), color: "#2fa7bf" },
      { label: "Payments Due", value: Math.max(stats.overduePayments, 0), color: "#6a4acb" },
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return data.map((item) => ({ ...item, percent: 20 }));
    }

    return data.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [stats]);

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

  if (!assignedProperty) {
    return (
      <div className="min-h-screen bg-[#d7dce1] p-6 font-['Poppins','Segoe_UI',sans-serif]">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="mx-auto mt-10 max-w-2xl border border-[#e6bf6f] bg-[#fff4d8] p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[#9a5d00]" />
            <div>
              <h3 className="text-lg font-bold text-[#7a3f00]">No Property Assigned</h3>
              <p className="mt-1 text-sm text-[#8a4a00]">
                You are not assigned to a property yet. Contact Super Admin to complete assignment before using this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topMetrics = [
    {
      title: "Units",
      value: stats.totalUnits.toLocaleString(),
      bg: "bg-[#2aa8bf]",
      footer: "bg-[#1f93a8]",
      href: "/portal/manager/properties/units",
    },
    {
      title: "Occupied",
      value: stats.occupiedUnits.toLocaleString(),
      bg: "bg-[#2daf4a]",
      footer: "bg-[#24933d]",
      href: "/portal/manager/properties/units",
    },
    {
      title: "Payments",
      value: stats.monthlyPayments.toLocaleString(),
      bg: "bg-[#f3bd11]",
      footer: "bg-[#d6a409]",
      href: "/portal/manager/payments",
    },
    {
      title: "Maintenance",
      value: stats.maintenancePending.toLocaleString(),
      bg: "bg-[#dc3545]",
      footer: "bg-[#c12c3a]",
      href: "/portal/manager/maintenance",
    },
  ];

  const rightStats = [
    {
      title: "Tenants",
      value: stats.occupiedUnits.toLocaleString(),
      bg: "bg-[#f3bd11]",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Properties",
      value: "1",
      bg: "bg-[#dc3545]",
      icon: <Building className="h-5 w-5" />,
    },
    {
      title: "Payments Due",
      value: stats.overduePayments.toLocaleString(),
      bg: "bg-[#2dae49]",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Approvals Pending",
      value: stats.maintenancePending.toLocaleString(),
      bg: "bg-[#2fa7bf]",
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 font-['Poppins','Segoe_UI',sans-serif] text-[#243041] md:p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#bcc3cd] pb-4">
        <div>
          <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Dashboard</h1>
          <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[#5f6b7c]">
            Welcome back, {userName || "Manager"} - {assignedProperty.name}
          </p>
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
            onClick={() => navigate("/portal/manager/profile")}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2f3d51] bg-[#2f3d51] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#243041]"
          >
            <UserCheck className="h-3.5 w-3.5" />
            Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {topMetrics.map((metric) => (
          <div key={metric.title} className="flex flex-col justify-between rounded-none border border-[#adb5bf] shadow-sm">
            <div className={`${metric.bg} flex h-[132px] w-full flex-col justify-center px-4`}>
              <div className="text-[44px] font-bold leading-none text-[#111827]">{metric.value}</div>
              <p className="mt-1 text-[22px] font-semibold leading-none text-[#111827]">{metric.title}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(metric.href)}
              className={`h-8 w-full ${metric.footer} flex items-center justify-center gap-1 text-[13px] font-semibold text-[#111827] transition-opacity hover:opacity-95`}
            >
              More info <span className="text-[14px]">-&gt;</span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="mb-3 border-b border-[#bcc3cd] pb-3">
            <h2 className="text-[34px] font-bold leading-none text-[#263143]">Staff Activity Notes</h2>
          </div>

          <div className="max-h-[260px] space-y-3 overflow-y-auto pb-4 pt-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-[#5f6b7c]">
                <span>vacancies</span>
                <span>Now</span>
              </div>
              <div className="border border-[#78a7ce] bg-[#eaf4ff] px-3 py-2 text-[13px] text-[#21486f]">
                Vacant units: {stats.vacantUnits} unit(s) are currently vacant.
              </div>
            </div>

            {recentActivities.slice(0, 3).map((item, idx) => (
              <div key={item.id} style={{ paddingLeft: idx > 0 ? idx * 24 : 0 }}>
                <div className="mb-1 flex items-center justify-between text-[11px] text-[#5f6b7c]">
                  <span>{item.type}</span>
                  <span>{formatTimeAgo(item.date)}</span>
                </div>
                <div
                  className={`border px-3 py-2 text-[13px] ${
                    item.type === "maintenance"
                      ? "border-[#e0a838] bg-[#fff4d8] text-[#6b4c05]"
                      : "border-[#9d88e0] bg-[#efeaff] text-[#3f2a80]"
                  }`}
                >
                  {item.title}: {item.description}
                </div>
              </div>
            ))}

            {recentActivities.length === 0 && (
              <div className="border border-[#d2d8e0] bg-[#eef1f4] px-3 py-8 text-center text-[13px] font-medium text-[#5f6b7c]">
                No notes available right now.
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-[#bcc3cd] pt-4">
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

          <div className="mt-4 rounded-none border border-[#adb4be] bg-[#eef1f4] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5f6b7c]">System</p>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-[#334155]">
              {systemStatus.database ? (
                <CheckCircle className="h-4 w-4 text-[#2dae49]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[#dc3545]" />
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
          <div className="mb-3 flex flex-col gap-3 border-b border-[#bcc3cd] pb-3 sm:flex-row sm:items-center sm:justify-between">
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
            <table className="min-w-[660px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#d7dee6] text-[11px] uppercase tracking-wide text-[#5f6b7c]">
                  <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">ID</th>
                  <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Activity</th>
                  <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Status</th>
                  <th className="border-b border-[#c2c9d2] px-4 py-2.5 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentActivities.slice(0, 7).map((item) => {
                  const status = item.type === "maintenance" ? "MAINTENANCE" : item.type === "payment" ? "PAYMENT" : "ACTIVITY";
                  const priority = item.priority || "NORMAL";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#e8edf3] cursor-pointer"
                      onClick={() => item.action && navigate(item.action)}
                    >
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#456b96]">
                        {item.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[12px] font-semibold text-[#2d3748]">
                        <div>{item.title}</div>
                        <div className="mt-1 text-[11px] font-medium text-[#6b7788]">{item.description}</div>
                      </td>
                      <td className="border-b border-[#cfd6df] px-4 py-3 text-[11px] font-bold">
                        <span
                          className={`inline-flex px-2 py-1 ${
                            status === "MAINTENANCE"
                              ? "bg-[#f3bd11] text-[#1f2937]"
                              : status === "PAYMENT"
                                ? "bg-[#6a4acb] text-white"
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

                {filteredRecentActivities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[13px] font-medium text-[#5f6b7c]">
                      No activity rows match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="mb-3 border-b border-[#bcc3cd] pb-3">
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
            <p className="mt-1 text-[20px] font-bold text-[#1f2937]">KES {stats.totalRevenueMonth.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5f6b7c]">
              <Building className="h-3.5 w-3.5 text-[#2fa7bf]" />
              1 property
              <Users className="ml-2 h-3.5 w-3.5 text-[#2dae49]" />
              {stats.occupiedUnits} occupied
              <Wrench className="ml-2 h-3.5 w-3.5 text-[#dc3545]" />
              {stats.maintenancePending} pending
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-[#2f3d51] text-white">Occupancy {stats.occupancyRate}%</Badge>
        <Badge className="bg-[#2dae49] text-white">Revenue KES {formatCompactRevenue(stats.totalRevenueMonth)}</Badge>
        <Badge className="bg-[#dc3545] text-white">Overdue {stats.overduePayments}</Badge>
        <Badge className="bg-[#2fa7bf] text-white">Units {stats.occupiedUnits}/{stats.totalUnits}</Badge>
      </div>
    </div>
  );
};

export default ManagerDashboard;