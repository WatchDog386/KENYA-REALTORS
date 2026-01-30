// src/pages/portal/SuperAdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Link,
  Settings2,
  X,
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
import { Progress } from "@/components/ui/progress";
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
    
    const interval = setInterval(() => {
      if (isMounted) {
        loadDashboardData();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("total_units, occupied_units, monthly_rent, status");

      const propertiesData = properties || [];
      
      const totalUnits = propertiesData.reduce((sum, p) => sum + (p.total_units || 0), 0);
      const occupiedUnits = propertiesData.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      const { count: activeUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: pendingApprovalsCount } = await supabase
        .from("approval_queue")
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

      const totalExpectedRevenue = propertiesData.reduce((sum, p) => {
        return sum + ((p.occupied_units || 0) * (p.monthly_rent || 0));
      }, 0);

      const collectionRate = totalExpectedRevenue > 0 ? (totalRevenue / totalExpectedRevenue) * 100 : 0;

      const { count: pendingRequestsCount } = await supabase
        .from("approval_queue")
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
        .select("id, name, status, total_units, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentProperties) {
        recentProperties.forEach(prop => {
          items.push({
            id: prop.id,
            title: prop.name || 'Unnamed Property',
            subtitle: `${prop.status} • ${prop.total_units || 0} units`,
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
        .from("approval_queue")
        .select(`
          id,
          request_type,
          status,
          created_at
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentApprovals) {
        recentApprovals.forEach(approval => {
          const titleMap: Record<string, string> = {
            role_assignment: "Role Assignment",
            manager_assignment: "Manager Assignment",
            tenant_addition: "Tenant Addition",
            tenant_removal: "Tenant Removal",
          };
          
          items.push({
            id: approval.id,
            title: `Approval: ${titleMap[approval.request_type] || approval.request_type}`,
            subtitle: `${approval.request_type} • Pending Review`,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600 text-[13px] font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* HERO SECTION */}
      <section className="bg-slate-50 overflow-hidden py-10 border-b border-gray-200/60">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-[#00356B]/10 text-[#00356B] text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-[#00356B]/20">
                  System Admin
                </span>
                <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">
                  v4.2.0
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-light text-[#00356B] mb-3 leading-[1.2] tracking-tight">
                Welcome back, <span className="font-bold">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email?.split('@')[0] || 'Admin'}</span>
              </h1>
              
              <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-lg font-medium">
                Here's your system overview. Monitor properties, users, revenue, and system health in real-time with our new polished dashboard.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-[#00356B] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#002a55] transition-all duration-300 rounded-lg shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh
                </button>
                
                <button
                  onClick={() => navigate("/portal/super-admin/reports")}
                  className="group flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-[#00356B] hover:text-[#00356B] transition-all duration-300 rounded-lg shadow-sm hover:shadow-md"
                >
                  <FileBarChart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  Reports
                </button>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="md:w-1/2 w-full"
            >
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50/80 rounded-xl">
                      <Shield className="w-6 h-6 text-[#00356B]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        System Status
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Last updated: {formatTimeAgo(systemStatus.lastChecked)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${systemStatus.database ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                    {systemStatus.uptime} Uptime
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Database</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.database ? 'bg-green-500 ring-green-100' : 'bg-red-500 ring-red-100'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.database ? 'text-green-700' : 'text-red-700'}`}>
                        {systemStatus.database ? 'Operational' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-gray-50" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">API Service</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.api ? 'bg-green-500 ring-green-100' : 'bg-red-500 ring-red-100'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.api ? 'text-green-700' : 'text-red-700'}`}>
                        {systemStatus.api ? 'Online' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-50" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Latency</span>
                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded ${systemStatus.responseTime < 500 ? "bg-slate-50 text-slate-700 border border-slate-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                      {systemStatus.responseTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KEY METRICS SECTION */}
      <section className="bg-white py-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">
                Performance Overview
              </h2>
              <p className="text-sm text-gray-500 font-medium max-w-2xl">
                Real-time metrics for your system's key performance indicators.
              </p>
            </div>
            <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Live Updates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Properties",
                value: stats.totalProperties,
                icon: <Building className="w-6 h-6 text-white" />,
                bgGradient: "bg-gradient-to-br from-blue-600 to-blue-500",
                borderColor: "border-blue-500/50",
                iconBg: "bg-white/20",
                metric: `${stats.totalUnits} Total Units`,
                progress: stats.occupancyRate,
                label: "Occupancy Rate",
                route: "/portal/super-admin/properties",
                textColor: "text-white",
                mutedTextColor: "text-blue-50",
                progressColor: "bg-white",
                progressBg: "bg-black/20"
              },
              {
                title: "Active Users",
                value: stats.activeUsers,
                icon: <Users className="w-6 h-6 text-white" />,
                bgGradient: "bg-gradient-to-br from-emerald-600 to-emerald-500",
                borderColor: "border-emerald-500/50",
                iconBg: "bg-white/20",
                metric: `${stats.totalLeases} Active Leases`,
                progress: (stats.totalLeases / (stats.totalUnits || 1)) * 100,
                label: "Lease Rate",
                route: "/portal/super-admin/users",
                textColor: "text-white",
                mutedTextColor: "text-emerald-50",
                progressColor: "bg-white",
                progressBg: "bg-black/20"
              },
              {
                title: "Monthly Revenue",
                value: formatForDisplay(stats.totalRevenue, 'KSH', true),
                icon: <DollarSign className="w-6 h-6 text-white" />,
                bgGradient: "bg-gradient-to-br from-violet-600 to-violet-500",
                borderColor: "border-violet-500/50",
                iconBg: "bg-white/20",
                metric: `${stats.collectionRate.toFixed(1)}% Collection Rate`,
                progress: stats.collectionRate,
                label: "Collection Progress",
                route: "/portal/super-admin/payments",
                textColor: "text-white",
                mutedTextColor: "text-violet-50",
                progressColor: "bg-white",
                progressBg: "bg-black/20"
              },
              {
                title: "System Health",
                value: systemStatus.uptime,
                icon: <Activity className="w-6 h-6 text-white" />,
                bgGradient: "bg-gradient-to-br from-amber-500 to-amber-400",
                borderColor: "border-amber-400/50",
                iconBg: "bg-white/20",
                metric: `${systemStatus.responseTime}ms Avg Response`,
                progress: systemStatus.responseTime < 500 ? 98 : 65,
                label: "Performance Score",
                route: "/portal/super-admin/settings",
                textColor: "text-white",
                mutedTextColor: "text-amber-50",
                progressColor: "bg-white",
                progressBg: "bg-black/20"
              }
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="group cursor-pointer"
                onClick={() => navigate(metric.route)}
              >
                <div className={`h-full ${metric.bgGradient} rounded-2xl p-6 border ${metric.borderColor} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden backdrop-blur-sm`}>
                  <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-full w-24 h-24 -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-3 rounded-xl ${metric.iconBg} backdrop-blur-md shadow-inner`}>
                      {metric.icon}
                    </div>
                     <ChevronRight className={`w-5 h-5 ${metric.mutedTextColor} opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                  </div>
                  
                  <div className="mb-6 relative z-10">
                    <h3 className={`text-3xl font-black ${metric.textColor} mb-1 tracking-tight drop-shadow-sm`}>{metric.value}</h3>
                    <p className={`text-sm font-bold ${metric.mutedTextColor} opacity-90`}>{metric.title}</p>
                  </div>

                  <div className="mt-auto relative z-10">
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-[11px] font-black ${metric.mutedTextColor} uppercase tracking-wider opacity-80`}>{metric.label}</span>
                       <span className={`text-xs font-black ${metric.textColor}`}>{Math.min(metric.progress || 0, 100).toFixed(0)}%</span>
                    </div>
                    <div className={`h-2 w-full ${metric.progressBg} rounded-full overflow-hidden`}>
                       <div 
                        className={`h-full rounded-full ${metric.progressColor} shadow-[0_0_10px_rgba(255,255,255,0.5)]`} 
                        style={{ width: `${Math.min(metric.progress || 0, 100)}%` }}
                      ></div>
                    </div>
                     <p className={`text-[12px] ${metric.mutedTextColor} mt-3 font-bold flex items-center gap-1.5 opacity-90`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${metric.progressColor}`}></span>
                      {metric.metric}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN - 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              {/* QUICK ACTIONS */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden" style={{ backgroundColor: 'white' }}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2" style={{ color: '#111827' }}>
                       <LayoutGrid className="w-5 h-5 text-gray-400" />
                       Quick Actions
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1 pl-7" style={{ color: '#6b7280' }}>
                      Frequently used administrative tasks
                    </p>
                  </div>
                  <button className="text-[12px] font-semibold text-[#00356B] hover:underline">Customize</button>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        title: "Manage Users",
                        icon: <Users className="w-5 h-5" />,
                        color: "border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-50",
                        description: "Add, edit, remove users",
                        route: "/portal/super-admin/users",
                        badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined
                      },
                      {
                        title: "Properties",
                        icon: <Building className="w-5 h-5" />,
                        color: "border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50",
                        description: "View property listing",
                        route: "/portal/super-admin/properties"
                      },
                      {
                        title: "Approvals",
                        icon: <FileCheck className="w-5 h-5" />,
                        color: "border-amber-100 bg-amber-50/50 text-amber-600 hover:bg-amber-50",
                        description: "Pending requests queue",
                        route: "/portal/super-admin/approvals",
                        badge: stats.pendingRequests > 0 ? stats.pendingRequests : undefined
                      },
                      {
                        title: "Analytics",
                        icon: <BarChart3 className="w-5 h-5" />,
                        color: "border-violet-100 bg-violet-50/50 text-violet-600 hover:bg-violet-50",
                        description: "Performance reports",
                        route: "/portal/super-admin/analytics"
                      },
                      {
                        title: "Reports",
                        icon: <FileBarChart className="w-5 h-5" />,
                        color: "border-orange-100 bg-orange-50/50 text-orange-600 hover:bg-orange-50",
                        description: "Financial summaries",
                        route: "/portal/super-admin/reports"
                      },
                      {
                        title: "Maintenance",
                        icon: <Wrench className="w-5 h-5" />,
                        color: "border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-50",
                        description: "Service requests",
                        route: "/portal/super-admin/maintenance",
                        badge: stats.pendingMaintenance > 0 ? stats.pendingMaintenance : undefined
                      }
                    ].map((action, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-md ${action.color}`}
                        onClick={() => navigate(action.route)}
                      >
                        <div className="flex justify-between items-start mb-2">
                           {action.icon}
                           {action.badge && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[13px] font-bold text-gray-900 mb-0.5">{action.title}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">{action.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SYSTEM ALERTS */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden" style={{ backgroundColor: 'white' }}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2" style={{ color: '#111827' }}>
                       <Bell className="w-5 h-5 text-gray-400" />
                       System Alerts
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1 pl-7" style={{ color: '#6b7280' }}>
                      Important notifications requiring attention
                    </p>
                  </div>
                  {systemAlerts.length > 0 && <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">{systemAlerts.length} Active</Badge>}
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {systemAlerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${
                          alert.type === 'critical' ? 'bg-red-50/50 border-red-100 hover:bg-red-50' :
                          alert.type === 'error' ? 'bg-red-50/30 border-red-100 hover:bg-red-50/50' :
                          alert.type === 'warning' ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-50' :
                          'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50'
                        }`}
                        onClick={() => alert.action && navigate(alert.action)}
                      >
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            alert.type === 'critical' || alert.type === 'error' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                         }`}></div>
                         
                        <div className="flex items-start gap-4 pl-2">
                          <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                            alert.type === 'critical' || alert.type === 'error' ? 'bg-red-100 text-red-600' :
                            alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {alert.type === 'critical' || alert.type === 'error' ? 
                              <AlertCircle className="w-5 h-5" /> :
                              alert.type === 'warning' ? 
                              <AlertTriangle className="w-5 h-5" /> :
                              <CheckCircle className="w-5 h-5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-[14px] text-gray-900 truncate pr-2" style={{ color: '#111827' }}>{alert.title}</h4>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                alert.priority === 'critical' || alert.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' : 
                                'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                {alert.priority}
                              </span>
                            </div>
                            <p className="text-[13px] text-gray-600 leading-relaxed" style={{ color: '#374151' }}>{alert.description}</p>
                            
                            {alert.action && (
                              <div className="flex items-center gap-1 mt-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="text-[11px] font-bold uppercase tracking-wide">Take Action</span>
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - 1/3 width */}
            <div className="space-y-8">
              {/* RECENT ACTIVITY */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden sticky top-6" style={{ backgroundColor: 'white' }}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2" style={{ color: '#111827' }}>
                      <Clock className="w-5 h-5 text-gray-400" />
                      Recent Activity
                    </h3>
                    <p className="text-[13px] text-gray-500 mt-1 pl-7" style={{ color: '#6b7280' }}>
                      Latest system timeline
                    </p>
                  </div>
                </div>
                
                <div className="p-0">
                  <div className="divide-y divide-gray-50">
                    {recentItems.length > 0 ? (
                      recentItems.slice(0, 6).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => item.action && navigate(item.action)}
                        >
                          <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                              item.type === 'property' ? 'bg-blue-50 text-blue-600' :
                              item.type === 'user' ? 'bg-emerald-50 text-emerald-600' :
                              item.type === 'payment' ? 'bg-violet-50 text-violet-600' :
                              item.type === 'approval' ? 'bg-amber-50 text-amber-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {getItemIcon(item.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate" style={{ color: '#111827' }}>
                                {item.title}
                            </p>
                            <p className="text-[12px] text-gray-500 mb-1 truncate" style={{ color: '#6b7280' }}>{item.subtitle}</p>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                               <Clock className="w-3 h-3" /> {item.time}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 px-6">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Clock className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-900 text-sm font-semibold" style={{ color: '#111827' }}>No recent activity</p>
                        <p className="text-gray-500 text-xs mt-1" style={{ color: '#6b7280' }}>Activities will appear here as they occur</p>
                      </div>
                    )}
                  </div>
                  
                  {recentItems.length > 0 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                      <button
                        onClick={() => navigate("/portal/super-admin/activity-logs")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold uppercase tracking-wider rounded-lg hover:border-[#00356B] hover:text-[#00356B] transition-all shadow-sm"
                      >
                        View Full History
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK LINKS */}
              <div className="bg-[#00356B] rounded-2xl shadow-lg border border-[#00356B] overflow-hidden text-white relative">
                 <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 p-24 bg-blue-400/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
                 
                <div className="p-6 border-b border-blue-800/50 relative z-10">
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Link className="w-5 h-5 text-blue-300" />
                    Shortcuts
                  </h3>
                  <p className="text-[12px] text-blue-200 mt-1 pl-7 opacity-80">
                    Fast access to common pages
                  </p>
                </div>
                
                <div className="p-4 relative z-10">
                  <div className="space-y-1">
                    {[
                      {
                        title: "Add New User",
                        icon: <UserPlus className="w-4 h-4" />,
                        route: "/portal/super-admin/users"
                      },
                      {
                        title: "My Profile",
                        icon: <Shield className="w-4 h-4" />,
                        action: () => setShowProfile(true)
                      },
                      {
                        title: "Add Property",
                        icon: <Home className="w-4 h-4" />,
                        route: "/portal/super-admin/properties"
                      },
                      {
                        title: "Rental Report",
                        icon: <FileBarChart className="w-4 h-4" />,
                        route: "/portal/super-admin/reports"
                      },
                      {
                        title: "Analytics Dashboard",
                        icon: <BarChart3 className="w-4 h-4" />,
                        route: "/portal/super-admin/analytics"
                      },
                      {
                        title: "System Configuration",
                        icon: <Settings className="w-4 h-4" />,
                        route: "/portal/super-admin/settings"
                      }
                    ].map((link, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if ('action' in link && link.action) {
                            link.action();
                          } else if ('route' in link) {
                            navigate(link.route);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 text-left bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group border border-white/5 hover:border-white/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-white/10 rounded-lg text-white group-hover:text-white group-hover:bg-blue-500 transition-colors">
                              {link.icon}
                          </div>
                          <span className="text-[13px] font-medium text-white group-hover:text-white">
                            {link.title}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="w-full m-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto relative">
              <button
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <SuperAdminProfile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
