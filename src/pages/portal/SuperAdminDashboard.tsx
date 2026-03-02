// src/pages/portal/SuperAdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Activity,
  Shield,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  UserCheck,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Home,
  Calendar,
  AlertCircle,
  CheckCircle,
  Wrench,
  Database,
  Bell,
  Key,
  MessageSquare,
  Download,
  Filter,
  Search,
  UserPlus,
  FileCheck,
  ShieldCheck,
  Package,
  ChevronRight,
  Target,
  Layers,
  LayoutGrid,
  Settings2,
  X,
  MapPin,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatForDisplay } from "@/utils/formatCurrency";
import { toast } from "sonner";

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SuperAdminProfile from "@/components/portal/super-admin/SuperAdminProfile";

interface DashboardStats {
  totalProperties: number;
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
  systemHealth: number;
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'property' | 'user' | 'payment' | 'maintenance' | 'system' | 'approval' | 'lease';
  time: string;
  action?: string;
  data?: any;
}

interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'error' | 'success' | 'info' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action?: string;
}

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<"executive" | "operations" | "finance">("executive");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60000);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
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
    systemHealth: 100,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    database: true,
    api: true,
    uptime: "99.9%",
    lastChecked: new Date().toISOString(),
    responseTime: 0,
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initDashboard = async () => {
      if (isMounted) {
        await loadDashboardData();
      }
    };

    initDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshIntervalMs]);

  const loadDashboardData = async () => {
    if (refreshing) return;
    
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentItems(),
        loadSystemAlerts(),
        checkSystemStatus(),
      ]);
      
      if (!loading) {
        toast.success("Dashboard data refreshed");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (!loading) {
        toast.error("Failed to refresh dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Fetch properties and unit types separately to avoid PostgREST schema cache issues
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, status");
      
      const { data: unitTypes } = await supabase
        .from("property_unit_types")
        .select("property_id, units_count, price_per_unit");

      // Fetch actual units with their status
      const { data: units = [] } = await supabase
        .from("units")
        .select("id, status");

      const propertiesData = properties || [];
      const unitsData = unitTypes || [];
      
      // Calculate occupied units from actual unit records
      const occupiedUnits = units.filter((u: any) => u.status?.toLowerCase() === 'occupied').length; 
      
      // Calculate total units from actual units table
      const totalUnits = units.length;
      
      // Calculate estimated monthly rent potential from the units
       const estimatedMonthlyRent = propertiesData.reduce((sum, prop: any) => {
          return sum + (prop.property_unit_types || []).reduce((subSum: number, u: any) => subSum + (u.units_count * u.price_per_unit), 0);
       }, 0);
       // We'll map this to 'totalRevenue' or wherever it was used. 
       // Wait, the original code used 'monthly_rent' column. 
       
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      const { count: activeUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: pendingApprovalsCount } = await supabase
        .from("approvals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: pendingMaintenanceCount } = await supabase
        .from("maintenance_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "assigned"]);

      const { count: overduePaymentsCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");

      const { count: totalLeasesCount } = await supabase
        .from("leases")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", startOfMonth.toISOString());

      const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      const totalExpectedRevenue = propertiesData.reduce((sum, p: any) => {
        // Use potential income calculated from unit types
        const potential = (p.property_unit_types || []).reduce((acc: number, u: any) => acc + (u.units_count * u.price_per_unit), 0);
        return sum + potential;
      }, 0);

      const collectionRate = totalExpectedRevenue > 0 ? (totalRevenue / totalExpectedRevenue) * 100 : 0;

      const { count: pendingRequestsCount } = await supabase
        .from("approvals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        totalProperties: propertiesData.length || 0,
        activeUsers: activeUsersCount || 0,
        pendingApprovals: pendingApprovalsCount || 0,
        totalRevenue,
        totalUnits,
        occupiedUnits,
        occupancyRate: parseFloat(occupancyRate.toFixed(1)),
        pendingMaintenance: pendingMaintenanceCount || 0,
        overduePayments: overduePaymentsCount || 0,
        collectionRate: parseFloat(collectionRate.toFixed(1)),
        vacantUnits,
        totalLeases: totalLeasesCount || 0,
        pendingRequests: pendingRequestsCount || 0,
        systemHealth: 100,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadRecentItems = async () => {
    try {
      const items: RecentItem[] = [];

      const { data: recentProperties } = await supabase
        .from("properties")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      
      // Fetch all unit types for manual join
      const { data: allUnitTypes } = await supabase
        .from("property_unit_types")
        .select("property_id, units_count");

      if (recentProperties) {
        recentProperties.forEach((prop: any) => {
          const propUnits = (allUnitTypes || []).filter((u: any) => u.property_id === prop.id);
          const totalUnits = propUnits.reduce((sum: number, u: any) => sum + (u.units_count || 0), 0);
          items.push({
            id: prop.id,
            title: prop.name || 'Unnamed Property',
            subtitle: `${prop.status} • ${totalUnits} units`,
            type: 'property',
            time: formatTimeAgo(prop.created_at),
            action: `/portal/super-admin/properties`,
          });
        });
      }

      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, status, created_at")
        .neq("role", "super_admin")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentUsers) {
        recentUsers.forEach(userItem => {
          items.push({
            id: userItem.id,
            title: `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim() || userItem.email,
            subtitle: `${userItem.role || 'User'} • ${userItem.status || 'active'}`,
            type: 'user',
            time: formatTimeAgo(userItem.created_at),
            action: `/portal/super-admin/users`,
          });
        });
      }

      const { data: recentPayments } = await supabase
        .from("payments")
        .select("id, amount, payment_method, status, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      if (recentPayments) {
        recentPayments.forEach(payment => {
          items.push({
            id: payment.id,
            title: `Payment of ${formatCurrency(payment.amount || 0)}`,
            subtitle: `${payment.payment_method || 'Online'} • ${payment.status}`,
            type: 'payment',
            time: formatTimeAgo(payment.created_at),
            action: `/portal/super-admin/payments`,
          });
        });
      }

      const { data: recentApprovals } = await supabase
        .from("approvals")
        .select(`
          id,
          approval_type,
          status,
          created_at
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentApprovals) {
        recentApprovals.forEach(approval => {
          const titleMap: Record<string, string> = {
            role_change: "Role Assignment",
            manager_assignment: "Manager Assignment",
            tenant_addition: "Tenant Addition",
            tenant_removal: "Tenant Removal",
          };
          
          items.push({
            id: approval.id,
            title: `Approval: ${titleMap[approval.approval_type] || approval.approval_type}`,
            subtitle: `${approval.approval_type} • Pending Review`,
            type: 'approval',
            time: formatTimeAgo(approval.created_at),
            action: `/portal/super-admin/approvals`,
            data: approval,
          });
        });
      }

      setRecentItems(items.slice(0, 10));
    } catch (error) {
      console.error("Error loading recent items:", error);
      setRecentItems([]);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const alerts: SystemAlert[] = [];

      const { data: emergencyMaintenance } = await supabase
        .from("maintenance_requests")
        .select("id, title, description, priority, status")
        .eq("priority", "emergency")
        .eq("status", "pending")
        .limit(3);

      if (emergencyMaintenance && emergencyMaintenance.length > 0) {
        emergencyMaintenance.forEach(req => {
          alerts.push({
            id: `maintenance-${req.id}`,
            title: `Emergency Maintenance: ${req.title}`,
            description: req.description || "Emergency maintenance required",
            type: 'critical',
            priority: 'critical',
            action: `/portal/super-admin/maintenance`
          });
        });
      }

      if (stats.overduePayments > 0) {
        alerts.push({
          id: "overdue-payments",
          title: "Overdue Payments Alert",
          description: `${stats.overduePayments} payments are overdue and require attention`,
          type: 'error',
          priority: 'high',
          action: "/portal/super-admin/payments"
        });
      }

      if (stats.vacantUnits > 0) {
        alerts.push({
          id: "vacant-units",
          title: "Vacant Units",
          description: `${stats.vacantUnits} units are currently vacant and need marketing`,
          type: 'warning',
          priority: 'medium',
          action: "/portal/super-admin/properties"
        });
      }

      if (stats.pendingRequests > 0) {
        alerts.push({
          id: "pending-approvals",
          title: "Pending Approval Requests",
          description: `${stats.pendingRequests} approval requests awaiting review`,
          type: 'warning',
          priority: 'high',
          action: "/portal/super-admin/approvals"
        });
      }

      if (alerts.length === 0) {
        alerts.push({
          id: "system-health",
          title: "System Healthy",
          description: "All systems operating normally. No critical issues detected.",
          type: 'success',
          priority: 'low',
          action: "/portal/super-admin/settings"
        });
      }

      setSystemAlerts(alerts);
    } catch (error) {
      console.error("Error loading system alerts:", error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const startTime = Date.now();
      const { error: dbError } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1);
      const responseTime = Date.now() - startTime;

      setSystemStatus({
        database: !dbError,
        api: responseTime < 2000,
        uptime: "99.9%",
        lastChecked: new Date().toISOString(),
        responseTime,
      });
    } catch (error) {
      console.error("Error checking system status:", error);
      setSystemStatus({
        database: false,
        api: false,
        uptime: "99.9%",
        lastChecked: new Date().toISOString(),
        responseTime: 0,
      });
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}w ago`;
      }
      
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months}m ago`;
      }
      
      return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "Recently";
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigationItems = [
    {
      title: "Users & Approvals",
      icon: <Users className="w-4 h-4" />,
      route: "/portal/super-admin/users",
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined,
      view: "operations"
    },
    {
      title: "Properties",
      icon: <Building className="w-4 h-4" />,
      route: "/portal/super-admin/properties",
      view: "operations"
    },
    {
      title: "Maintenance",
      icon: <Wrench className="w-4 h-4" />,
      route: "/portal/super-admin/maintenance",
      badge: stats.pendingMaintenance > 0 ? stats.pendingMaintenance : undefined,
      view: "operations"
    },
    {
      title: "Payments & Reports",
      icon: <FileBarChart className="w-4 h-4" />,
      route: "/portal/super-admin/reports",
      view: "finance"
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
      route: "/portal/super-admin/analytics",
      view: "executive"
    },
    {
      title: "Settings",
      icon: <Settings className="w-4 h-4" />,
      route: "/portal/super-admin/settings",
      view: "executive"
    }
  ];

  const filteredRecentItems = recentItems.filter((item) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term);
  });

  const topPriorityItems = [
    { label: "Pending approvals", value: stats.pendingApprovals, route: "/portal/super-admin/approvals" },
    { label: "Maintenance backlog", value: stats.pendingMaintenance, route: "/portal/super-admin/maintenance" },
    { label: "Failed payments", value: stats.overduePayments, route: "/portal/super-admin/payments" },
  ].sort((a, b) => b.value - a.value);

  const handleExportSnapshot = () => {
    const snapshotRows = [
      ["Metric", "Value"],
      ["Total Properties", String(stats.totalProperties)],
      ["Total Units", String(stats.totalUnits)],
      ["Occupied Units", String(stats.occupiedUnits)],
      ["Vacant Units", String(stats.vacantUnits)],
      ["Active Users", String(stats.activeUsers)],
      ["Pending Approvals", String(stats.pendingApprovals)],
      ["Pending Maintenance", String(stats.pendingMaintenance)],
      ["Failed Payments", String(stats.overduePayments)],
      ["Revenue (KSH)", String(stats.totalRevenue)],
      ["Collection Rate", `${stats.collectionRate}%`],
      ["Response Time", `${systemStatus.responseTime}ms`],
      ["Database", systemStatus.database ? "Operational" : "Offline"],
      ["API", systemStatus.api ? "Online" : "Unavailable"],
      ["Exported At", new Date().toISOString()],
    ];

    const csvContent = snapshotRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `superadmin-snapshot-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Dashboard snapshot exported");
  };

  const handleSmartSearch = () => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) {
      toast.info("Type something to search");
      return;
    }

    const navMatch = navigationItems.find((item) => item.title.toLowerCase().includes(term));
    if (navMatch) {
      navigate(navMatch.route);
      return;
    }

    const itemMatch = recentItems.find((item) => item.title.toLowerCase().includes(term));
    if (itemMatch?.action) {
      navigate(itemMatch.action);
      return;
    }

    toast.info("No quick matches found");
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'property': return <Building className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'system': return <Database className="w-4 h-4" />;
      case 'approval': return <FileCheck className="w-4 h-4" />;
      case 'lease': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-offwhite font-brand">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-navy" />
          <p className="text-midgray text-[13px] font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-offwhite min-h-screen antialiased text-darkgray font-brand">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 shadow-lg bg-gradient-to-r from-navy via-navy to-cta">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_45%)]" />
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 items-center gap-10">
            <div className="xl:col-span-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/40">
                  System Admin
                </span>
                <span className="text-white/80 text-[10px] font-semibold uppercase tracking-widest">
                  v4.2.0
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                Welcome back, <span className="text-electric">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email?.split('@')[0] || 'Admin'}</span>
              </h1>
              
              <p className="text-sm text-white/85 leading-relaxed mb-8 max-w-lg font-medium">
                Here's your system overview. Monitor properties, users, revenue, and system health in real-time with our modern dashboard.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-white text-navy px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-offwhite transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh
                </button>
                
                <button
                  onClick={() => navigate("/portal/super-admin/reports")}
                  className="group flex items-center gap-2 bg-cta border border-white/30 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-cta/90 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
                >
                  <FileBarChart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Reports
                </button>

                <button
                  onClick={() => setShowProfile(true)}
                  className="group flex items-center gap-2 bg-transparent border border-white/40 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/15 transition-all duration-300 rounded-xl"
                >
                  <UserCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Profile
                </button>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="xl:col-span-5 w-full"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/40 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-navy/10 rounded-xl">
                      <Shield className="w-6 h-6 text-navy" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-darkgray uppercase tracking-wide">
                        System Status
                      </h3>
                      <p className="text-[11px] text-midgray font-medium mt-0.5">Last updated: {formatTimeAgo(systemStatus.lastChecked)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${systemStatus.database ? "bg-electric/10 text-electric border-electric/30" : "bg-cta/10 text-cta border-cta/30"}`}>
                    {systemStatus.uptime} Uptime
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-midgray group-hover:text-darkgray transition-colors">Database</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.database ? 'bg-electric ring-electric/20' : 'bg-cta ring-cta/20'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.database ? 'text-electric' : 'text-cta'}`}>
                        {systemStatus.database ? 'Operational' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-navy/10" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-midgray group-hover:text-darkgray transition-colors">API Service</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.api ? 'bg-electric ring-electric/20' : 'bg-cta ring-cta/20'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.api ? 'text-electric' : 'text-cta'}`}>
                        {systemStatus.api ? 'Online' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-navy/10" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-midgray group-hover:text-darkgray transition-colors">Latency</span>
                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-lg border ${systemStatus.responseTime < 500 ? "bg-electric/10 text-electric border-electric/30" : "bg-cta/10 text-cta border-cta/30"}`}>
                      {systemStatus.responseTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FLOATING QUICK STRIP */}
      <section className="relative -mt-12 z-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                title: "Occupancy",
                value: `${stats.occupancyRate}%`,
                subtitle: `${stats.occupiedUnits}/${stats.totalUnits} units occupied`,
                icon: <Home className="w-5 h-5" />,
                tone: "navy"
              },
              {
                title: "Collection",
                value: `${stats.collectionRate}%`,
                subtitle: `${formatForDisplay(stats.totalRevenue, 'KSH', true)} collected`,
                icon: <TrendingUp className="w-5 h-5" />,
                tone: "cta"
              },
              {
                title: "Pending Actions",
                value: stats.pendingApprovals + stats.pendingMaintenance,
                subtitle: "approvals + maintenance", 
                icon: <Bell className="w-5 h-5" />,
                tone: "dark"
              },
              {
                title: "API Latency",
                value: `${systemStatus.responseTime}ms`,
                subtitle: systemStatus.api ? "service online" : "service degraded",
                icon: <Database className="w-5 h-5" />,
                tone: "electric"
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * index }}
                className={`rounded-2xl border shadow-lg p-5 ${
                  item.tone === "navy" ? "bg-white border-navy/20" :
                  item.tone === "cta" ? "bg-cta text-white border-white/30" :
                  item.tone === "electric" ? "bg-electric text-white border-white/30" :
                  "bg-darkgray text-white border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${item.tone === "navy" ? "text-midgray" : "text-white/85"}`}>{item.title}</span>
                  <span className={`${item.tone === "navy" ? "text-navy" : "text-white"}`}>{item.icon}</span>
                </div>
                <p className={`text-2xl font-bold mb-1 ${item.tone === "navy" ? "text-darkgray" : "text-white"}`}>{item.value}</p>
                <p className={`text-xs ${item.tone === "navy" ? "text-midgray" : "text-white/80"}`}>{item.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTROL HUB */}
      <section className="bg-white border-b border-navy/10 pt-8">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card className="xl:col-span-7 border-navy/20 bg-offwhite">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-darkgray flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-navy" />
                  Dashboard Focus Mode
                </CardTitle>
                <CardDescription className="text-midgray">Switch layout context based on what you’re managing now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "executive", label: "Executive", icon: <Target className="w-3.5 h-3.5" /> },
                    { key: "operations", label: "Operations", icon: <Layers className="w-3.5 h-3.5" /> },
                    { key: "finance", label: "Finance", icon: <DollarSign className="w-3.5 h-3.5" /> },
                  ].map((view) => (
                    <Button
                      key={view.key}
                      type="button"
                      onClick={() => setActiveView(view.key as "executive" | "operations" | "finance")}
                      className={`${activeView === view.key ? "bg-navy text-white hover:bg-navy/90" : "bg-white text-navy border border-navy/20 hover:bg-navy/5"} rounded-lg`}
                    >
                      {view.icon}
                      {view.label}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-midgray absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search activities, modules, tasks..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-navy/20 bg-white text-sm text-darkgray placeholder:text-midgray focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                  </div>
                  <Button onClick={handleSmartSearch} className="bg-cta hover:bg-cta/90 text-white">
                    <Zap className="w-4 h-4" />
                    Smart Go
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-3 border-navy/20 bg-offwhite">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-darkgray flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-navy" />
                  Controls
                </CardTitle>
                <CardDescription className="text-midgray">Automation and export tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-navy/10">
                  <span className="text-xs font-semibold text-midgray uppercase tracking-wide">Auto Refresh</span>
                  <Button
                    type="button"
                    onClick={() => setAutoRefreshEnabled((prev) => !prev)}
                    className={`${autoRefreshEnabled ? "bg-electric hover:bg-electric/90 text-white" : "bg-navy/10 hover:bg-navy/20 text-navy"} h-8 px-3 text-xs`}
                  >
                    {autoRefreshEnabled ? "ON" : "OFF"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-midgray uppercase tracking-wide">Refresh Interval</p>
                  <select
                    value={refreshIntervalMs}
                    onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-navy/20 bg-white text-sm text-darkgray"
                    disabled={!autoRefreshEnabled}
                  >
                    <option value={30000}>Every 30 seconds</option>
                    <option value={60000}>Every 1 minute</option>
                    <option value={300000}>Every 5 minutes</option>
                  </select>
                </div>

                <Button onClick={handleExportSnapshot} className="w-full bg-navy hover:bg-navy/90 text-white">
                  <Download className="w-4 h-4" />
                  Export Snapshot
                </Button>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2 border-navy/20 bg-gradient-to-br from-navy to-navy/90 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-electric" />
                  Pulse
                </CardTitle>
                <CardDescription className="text-white/75">Live command snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-white/10 p-2.5 border border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">Approvals</p>
                  <p className="text-xl font-bold">{stats.pendingApprovals}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5 border border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">Maint. Queue</p>
                  <p className="text-xl font-bold">{stats.pendingMaintenance}</p>
                </div>
                <div className="rounded-lg bg-electric/20 p-2.5 border border-electric/40">
                  <p className="text-[10px] uppercase tracking-wider text-white/80">Health</p>
                  <p className="text-sm font-semibold">{systemStatus.database ? "Stable" : "Attention Needed"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-14 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-7 rounded-2xl border border-navy/15 bg-offwhite px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-midgray font-semibold">Command Center</p>
              <h2 className="text-xl md:text-2xl font-bold text-darkgray mt-1">Critical Operations Deck</h2>
            </div>
            <Badge className="bg-navy text-white px-3 py-1 border-0">{activeView.toUpperCase()} Mode</Badge>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <Card className="border-navy/15">
                <CardHeader>
                  <CardTitle className="text-darkgray">Alerts & Status</CardTitle>
                  <CardDescription className="text-midgray">Critical items requiring your attention.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemAlerts.slice(0, 4).map((alert, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => alert.action && navigate(alert.action)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        alert.type === 'critical' || alert.type === 'error' ? 'bg-cta/10 border-cta/30 hover:border-cta/60' :
                        alert.type === 'warning' ? 'bg-navy/5 border-navy/20 hover:border-navy/50' :
                        'bg-electric/10 border-electric/30 hover:border-electric/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          alert.type === 'critical' || alert.type === 'error' ? 'bg-cta/20 text-cta' :
                          alert.type === 'warning' ? 'bg-navy/15 text-navy' :
                          'bg-electric/20 text-electric'
                        }`}>
                          {alert.type === 'critical' || alert.type === 'error' ? <AlertCircle className="w-4 h-4" /> : alert.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-darkgray">{alert.title}</p>
                          <p className="text-[12px] text-midgray">{alert.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-navy/15 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-darkgray">Recent Activity</CardTitle>
                    <CardDescription className="text-midgray">Filtered by your current search and focus mode.</CardDescription>
                  </div>
                  {filteredRecentItems.length > 0 && (
                    <Button onClick={() => navigate("/portal/super-admin/activity-logs")} className="bg-cta hover:bg-cta/90 text-white">
                      View All
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-navy/10">
                    {filteredRecentItems.length > 0 ? (
                      filteredRecentItems.slice(0, 6).map((item, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => item.action && navigate(item.action)}
                          className="w-full text-left flex items-start gap-4 p-5 hover:bg-offwhite transition-colors"
                        >
                          <div className={`mt-1 p-2.5 rounded-lg shrink-0 ${
                            item.type === 'property' ? 'bg-navy/15 text-navy' :
                            item.type === 'user' ? 'bg-electric/20 text-electric' :
                            item.type === 'payment' ? 'bg-cta/15 text-cta' :
                            'bg-navy/10 text-navy'
                          }`}>
                            {getItemIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-darkgray truncate">{item.title}</p>
                            <p className="text-[12px] text-midgray mb-1.5 truncate font-medium">{item.subtitle}</p>
                            <span className="text-[11px] text-midgray/80 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" /> {item.time}
                            </span>
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-center py-14 px-6">
                        <div className="bg-navy/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-7 h-7 text-navy/50" />
                        </div>
                        <p className="text-darkgray text-sm font-bold">No matching activity</p>
                        <p className="text-midgray text-xs mt-1 font-medium">Try another search term or clear the filter.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-6 self-start">
              <Card className="border-navy/15 bg-offwhite">
                <CardHeader>
                  <CardTitle className="text-darkgray flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cta" />
                    Priority Queue
                  </CardTitle>
                  <CardDescription className="text-midgray">What needs immediate follow-up today.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {topPriorityItems.map((task) => (
                    <button
                      key={task.label}
                      onClick={() => navigate(task.route)}
                      className="w-full p-3 rounded-lg border border-navy/15 bg-white hover:border-cta/40 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-midgray font-medium">{task.label}</span>
                        <Badge className={`${task.value > 0 ? "bg-cta text-white" : "bg-electric/15 text-electric"} border-0`}>{task.value}</Badge>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-navy/15">
                <CardHeader>
                  <CardTitle className="text-darkgray flex items-center gap-2">
                    <Plus className="w-4 h-4 text-navy" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-midgray">Launch common admin actions in one click.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => navigate("/portal/super-admin/properties")} className="w-full justify-start bg-navy hover:bg-navy/90 text-white">
                    <Building className="w-4 h-4" />
                    Add / Manage Property
                  </Button>
                  <Button onClick={() => navigate("/portal/super-admin/users")} className="w-full justify-start bg-cta hover:bg-cta/90 text-white">
                    <UserPlus className="w-4 h-4" />
                    Invite / Manage Users
                  </Button>
                  <Button onClick={() => navigate("/portal/super-admin/approvals")} className="w-full justify-start bg-white border border-navy/20 text-navy hover:bg-navy/5">
                    <ShieldCheck className="w-4 h-4" />
                    Review Approvals
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto backdrop-blur-sm"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full m-4"
            >
              <div className="bg-offwhite rounded-2xl shadow-2xl border border-navy/15 max-w-4xl mx-auto relative">
                <button
                  onClick={() => setShowProfile(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-navy/10 rounded-lg transition-colors z-10"
                >
                  <X className="w-5 h-5 text-midgray" />
                </button>
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
