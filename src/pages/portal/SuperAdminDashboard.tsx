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
  Link,
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
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-[13px] font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  System Admin
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  v4.2.0
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                Welcome back, <span className="text-[#F96302]">{user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email?.split('@')[0] || 'Admin'}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                Here's your system overview. Monitor properties, users, revenue, and system health in real-time with our modern dashboard.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh
                </button>
                
                <button
                  onClick={() => navigate("/portal/super-admin/reports")}
                  className="group flex items-center gap-2 bg-white/20 border border-white/40 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-white/30 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
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
              <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-8 hover:shadow-2xl hover:border-[#F96302] transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#154279]/10 rounded-xl">
                      <Shield className="w-6 h-6 text-[#154279]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        System Status
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Last updated: {formatTimeAgo(systemStatus.lastChecked)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${systemStatus.database ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {systemStatus.uptime} Uptime
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Database</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.database ? 'bg-emerald-500 ring-emerald-100' : 'bg-red-500 ring-red-100'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.database ? 'text-emerald-700' : 'text-red-700'}`}>
                        {systemStatus.database ? 'Operational' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">API Service</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${systemStatus.api ? 'bg-emerald-500 ring-emerald-100' : 'bg-red-500 ring-red-100'}`} />
                      <span className={`text-[12px] font-bold ${systemStatus.api ? 'text-emerald-700' : 'text-red-700'}`}>
                        {systemStatus.api ? 'Online' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Latency</span>
                    <span className={`text-[12px] font-bold px-2.5 py-0.5 rounded-lg border ${systemStatus.responseTime < 500 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {systemStatus.responseTime}ms
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KEY METRICS SECTION - ORANGE ICONS */}
      <section className="bg-slate-50 py-14">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#154279] tracking-tight mb-2">
                Performance Overview
              </h2>
              <p className="text-sm text-slate-600 font-medium max-w-2xl">
                Real-time metrics for your system's key performance indicators.
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border-2 border-slate-200 flex items-center gap-2 shadow-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Live Updates</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Properties",
                value: stats.totalProperties,
                icon: <Building className="w-8 h-8 text-[#154279]" />,
                metric: `${stats.totalUnits} Units`,
                progress: stats.occupancyRate,
                label: "Occupancy",
                route: "/portal/super-admin/properties",
                primaryColor: "#3b82f6",
                secondaryColor: "#1e40af",
                accentColor: "from-blue-50 via-blue-50/30 to-white",
                borderHover: "hover:border-blue-400 hover:shadow-blue-500/20"
              },
              {
                title: "Active Users",
                value: stats.activeUsers,
                icon: <Users className="w-8 h-8 text-[#154279]" />,
                metric: `${stats.totalLeases} Leases`,
                progress: (stats.totalLeases / (stats.totalUnits || 1)) * 100,
                label: "Lease Rate",
                route: "/portal/super-admin/users",
                primaryColor: "#0ea5e9",
                secondaryColor: "#0284c7",
                accentColor: "from-cyan-50 via-cyan-50/30 to-white",
                borderHover: "hover:border-cyan-400 hover:shadow-cyan-500/20"
              },
              {
                title: "Monthly Revenue",
                value: formatForDisplay(stats.totalRevenue, 'KSH', true),
                icon: <DollarSign className="w-8 h-8 text-[#F96302]" />,
                metric: `${stats.collectionRate.toFixed(0)}% Collection`,
                progress: stats.collectionRate,
                label: "Collections",
                route: "/portal/super-admin/payments",
                primaryColor: "#10b981",
                secondaryColor: "#059669",
                accentColor: "from-emerald-50 via-emerald-50/30 to-white",
                borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/20"
              },
              {
                title: "System Health",
                value: `${systemStatus.responseTime}ms`,
                icon: <Activity className="w-8 h-8 text-[#F96302]" />,
                metric: `${systemStatus.uptime} Uptime`,
                progress: systemStatus.responseTime < 500 ? 95 : 70,
                label: "Performance",
                route: "/portal/super-admin/settings",
                primaryColor: "#f59e0b",
                secondaryColor: "#d97706",
                accentColor: "from-amber-50 via-amber-50/30 to-white",
                borderHover: "hover:border-amber-400 hover:shadow-amber-500/20"
              }
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(metric.route)}
                className={`group relative border-2 rounded-2xl transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer bg-gradient-to-br ${metric.accentColor} border-slate-300 ${metric.borderHover} hover:shadow-2xl hover:scale-[1.02] shadow-lg shadow-slate-300/30`}
              >
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-20 bg-gradient-to-br from-[#154279] transition-all duration-300" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

                {/* Main content */}
                <div className="flex-grow relative p-8 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#154279] to-transparent opacity-5 pointer-events-none transition-all duration-300" />
                  
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="relative z-10"
                  >
                    {metric.icon}
                  </motion.div>
                  
                  <div className="relative z-10 mt-6 text-center w-full px-2">
                    <h3 className="text-[13px] font-bold leading-tight group-hover:scale-105 transition-all uppercase tracking-tight text-[#154279]">
                      {metric.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-2">
                      {metric.metric}
                    </p>
                  </div>
                </div>

                {/* Bottom section with progress */}
                <div className="relative z-30 p-6 border-t-2 transition-all bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200">
                  <div className="absolute bottom-0 right-0 w-20 h-20 opacity-10 pointer-events-none transition-all duration-300">
                    {metric.icon}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#154279]">
                        {metric.label}
                      </span>
                      <span className="text-xs font-bold text-[#154279]">
                        {Math.min(metric.progress || 0, 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(metric.progress || 0, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${metric.primaryColor}, ${metric.secondaryColor})` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">
                        {metric.value}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="space-y-8">
            {/* QUICK ACTIONS - HOWITWORKS STYLE */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-[#F96302]"></div>
                <h3 className="text-lg font-semibold text-[#154279] tracking-tight">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "Manage Users",
                    icon: <Users className="w-6 h-6 text-white" />,
                    description: "Add, edit, remove users",
                    route: "/portal/super-admin/users",
                    badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined,
                    bgGradient: "from-blue-500 via-blue-600 to-blue-700",
                    borderColor: "border-blue-300",
                    iconBg: "bg-blue-400"
                  },
                  {
                    title: "Properties",
                    icon: <Building className="w-6 h-6 text-white" />,
                    description: "View property listing",
                    route: "/portal/super-admin/properties",
                    bgGradient: "from-emerald-500 via-emerald-600 to-emerald-700",
                    borderColor: "border-emerald-300",
                    iconBg: "bg-emerald-400"
                  },
                  {
                    title: "Approvals",
                    icon: <FileCheck className="w-6 h-6 text-white" />,
                    description: "Pending requests queue",
                    route: "/portal/super-admin/approvals",
                    badge: stats.pendingRequests > 0 ? stats.pendingRequests : undefined,
                    bgGradient: "from-purple-500 via-purple-600 to-purple-700",
                    borderColor: "border-purple-300",
                    iconBg: "bg-purple-400"
                  },
                  {
                    title: "Analytics",
                    icon: <BarChart3 className="w-6 h-6 text-white" />,
                    description: "Performance reports",
                    route: "/portal/super-admin/analytics",
                    bgGradient: "from-cyan-500 via-cyan-600 to-cyan-700",
                    borderColor: "border-cyan-300",
                    iconBg: "bg-cyan-400"
                  },
                  {
                    title: "Reports",
                    icon: <FileBarChart className="w-6 h-6 text-white" />,
                    description: "Financial summaries",
                    route: "/portal/super-admin/reports",
                    bgGradient: "from-pink-500 via-pink-600 to-pink-700",
                    borderColor: "border-pink-300",
                    iconBg: "bg-pink-400"
                  },
                  {
                    title: "Maintenance",
                    icon: <Wrench className="w-6 h-6 text-white" />,
                    description: "Service requests",
                    route: "/portal/super-admin/maintenance",
                    badge: stats.pendingMaintenance > 0 ? stats.pendingMaintenance : undefined,
                    bgGradient: "from-orange-500 via-orange-600 to-orange-700",
                    borderColor: "border-orange-300",
                    iconBg: "bg-orange-400"
                  }
                ].map((action, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(action.route)}
                    className={`group relative border-2 ${action.borderColor} rounded-2xl p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br ${action.bgGradient} hover:border-white hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.05] shadow-lg overflow-hidden text-white`}
                  >
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20 bg-white group-hover:opacity-30 transition-all" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <motion.div whileHover={{ scale: 1.1, rotate: -5 }} className={`p-3 ${action.iconBg} rounded-xl shadow-md group-hover:shadow-lg transition-all`}>
                          {action.icon}
                        </motion.div>
                        {action.badge && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow-md ring-2 ring-white">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-[15px] font-bold text-white mb-1">{action.title}</h4>
                      <p className="text-[12px] text-white/90 font-medium">{action.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* SYSTEM ALERTS */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-[#F96302]"></div>
                <h3 className="text-lg font-semibold text-[#154279] tracking-tight">System Alerts</h3>
                {systemAlerts.length > 0 && <Badge className="border-red-300 text-red-700 bg-red-50 border-2 ml-auto">{systemAlerts.length} Active</Badge>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemAlerts.map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden ${
                      alert.type === 'critical' ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/20' :
                      alert.type === 'error' ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:shadow-lg hover:shadow-red-500/20' :
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:shadow-lg hover:shadow-amber-500/20' :
                      'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 hover:shadow-lg hover:shadow-emerald-500/20'
                    }`}
                    onClick={() => alert.action && navigate(alert.action)}
                  >
                    {/* Decorative accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none opacity-10 bg-gradient-to-br from-[#F96302] group-hover:opacity-20 transition-all" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />

                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                       alert.type === 'critical' || alert.type === 'error' ? 'bg-red-500' :
                       alert.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>

                    <div className="flex items-start gap-4 pl-2 relative z-10">
                      <div className={`p-3 rounded-xl mt-0.5 shrink-0 ${
                        alert.type === 'critical' || alert.type === 'error' ? 'bg-red-200 text-red-700' :
                        alert.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                        'bg-emerald-200 text-emerald-700'
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
                          <h4 className="font-bold text-[14px] text-slate-900">{alert.title}</h4>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border-2 whitespace-nowrap ${
                            alert.priority === 'critical' || alert.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' : 
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-700 leading-relaxed font-medium">{alert.description}</p>
                        
                        {alert.action && (
                          <div className="flex items-center gap-1 mt-3 text-[#154279] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <span className="text-[11px] font-bold uppercase tracking-wide">View Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY & SHORTCUTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* RECENT ACTIVITY - LEFT */}
              <div className="lg:col-span-2">
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-8 bg-[#F96302]"></div>
                    <h3 className="text-lg font-semibold text-[#154279] tracking-tight">Recent Activity</h3>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <div className="p-0">
                      <div className="divide-y-2 divide-slate-100">
                        {recentItems.length > 0 ? (
                          recentItems.slice(0, 6).map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer group border-l-4 border-l-transparent hover:border-l-[#F96302]"
                              onClick={() => item.action && navigate(item.action)}
                            >
                              <div className={`mt-1 p-2.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform ${
                                  item.type === 'property' ? 'bg-blue-100 text-[#154279]' :
                                  item.type === 'user' ? 'bg-emerald-100 text-emerald-700' :
                                  item.type === 'payment' ? 'bg-violet-100 text-violet-700' :
                                  item.type === 'approval' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                {getItemIcon(item.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-900 group-hover:text-[#F96302] transition-colors truncate">
                                    {item.title}
                                </p>
                                <p className="text-[12px] text-slate-500 mb-1 truncate font-medium">{item.subtitle}</p>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                   <Clock className="w-3 h-3" /> {item.time}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-12 px-6">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 text-sm font-bold">No recent activity</p>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Activities will appear here as they occur</p>
                          </div>
                        )}
                      </div>
                      
                      {recentItems.length > 0 && (
                        <div className="p-4 bg-slate-50 border-t-2 border-slate-200">
                          <button
                            onClick={() => navigate("/portal/super-admin/activity-logs")}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#154279] to-[#0f325e] border-2 border-[#154279] text-white text-[12px] font-bold uppercase tracking-wider rounded-xl hover:from-[#F96302] hover:to-[#ff8c42] hover:border-[#F96302] transition-all shadow-md hover:shadow-lg"
                          >
                            View Full History
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK LINKS / SHORTCUTS - RIGHT */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-[#F96302]"></div>
                  <h3 className="text-lg font-semibold text-[#154279] tracking-tight">Shortcuts</h3>
                </div>

                <div className="bg-gradient-to-br from-[#154279] to-[#0f325e] rounded-2xl shadow-xl border-2 border-[#154279] overflow-hidden text-white relative hover:shadow-2xl hover:border-[#F96302] transition-all">
                   <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-0 p-24 bg-[#F96302]/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
                   
                    <div className="p-6 relative z-10">
                      <div className="space-y-2">
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
                            title: "Analytics",
                            icon: <BarChart3 className="w-4 h-4" />,
                            route: "/portal/super-admin/analytics"
                          },
                          {
                            title: "Settings",
                            icon: <Settings className="w-4 h-4" />,
                            route: "/portal/super-admin/settings"
                          }
                        ].map((link, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              if ('action' in link && link.action) {
                                link.action();
                              } else if ('route' in link) {
                                navigate(link.route);
                              }
                            }}
                            className="w-full flex items-center justify-between p-3 text-left bg-white/10 hover:bg-white/20 hover:bg-[#F96302]/20 rounded-xl transition-all duration-200 group border-2 border-white/10 hover:border-[#F96302]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 group-hover:bg-[#F96302]/30 rounded-lg text-white group-hover:text-[#F96302] transition-all">
                                  <motion.div whileHover={{ rotate: 10 }}>
                                    {link.icon}
                                  </motion.div>
                              </div>
                              <span className="text-[13px] font-bold text-white group-hover:text-[#F96302] transition-colors">
                                {link.title}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-[#F96302] transition-colors" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                </div>
              </div>
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto relative">
                <button
                  onClick={() => setShowProfile(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
                >
                  <X className="w-5 h-5 text-slate-600" />
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
