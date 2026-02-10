// src/components/portal/manager/ManagerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Users,
  DollarSign,
  Wrench,
  Activity,
  Shield,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Database,
  ChevronRight,
  Home,
  FileBarChart,
  CreditCard,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Interface Definitions
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
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'maintenance' | 'tenant' | 'lease';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  action?: string;
}

const ManagerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignedProperty, setAssignedProperty] = useState<Property | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      maintenancePending: 0,
      maintenanceInProgress: 0,
      leasesExpiringSoon: 0,
      totalRevenueMonth: 0,
      occupancyRate: 0
    });
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [userName, setUserName] = useState('');
  
    // System Status Mock (to match Super Admin aesthetics)
    // In a real app, this might come from a prop or context
    const systemStatus = {
        database: true,
        api: true,
        uptime: "99.9%",
        lastChecked: new Date().toISOString(),
        responseTime: 24,
    };
  
    useEffect(() => {
      loadManagerData();
      fetchUserProfile();
    }, [user?.id]);
  
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      if (data) setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Manager');
    };
  
    const loadManagerData = async () => {
      if (!user?.id) return;
  
      try {
        if (!refreshing) setLoading(true); // Don't show full loader on refresh
        let propertyId = id;
  
        // 1. Get Assigned Property
        if (!propertyId) {
          const { data: assignment } = await supabase
            .from('property_manager_assignments')
            .select('property_id')
            .eq('property_manager_id', user.id)
            .maybeSingle();
  
          if (assignment) {
            propertyId = assignment.property_id;
          }
        }
  
        // 2. Fetch Property Details
        if (propertyId) {
            const { data: property } = await supabase
              .from('properties')
              .select('*')
              .eq('id', propertyId)
              .single();
            
            if (property) setAssignedProperty(property);
  
            // 3. Fetch Units & Occupancy
            const { data: units } = await supabase
              .from('units')
              .select('id, status')
              .eq('property_id', propertyId);
  
            const totalUnits = units?.length || 0;
            const occupiedUnits = units?.filter(u => u.status?.toLowerCase() === 'occupied').length || 0;
            const vacantUnits = units?.filter(u => u.status?.toLowerCase() === 'vacant').length || 0;
            
            // 4. Fetch Maintenance Stats
            const { count: pendingMaintenance } = await supabase
              .from('maintenance_requests')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', propertyId)
              .eq('status', 'pending');
  
            const { count: inProgressMaintenance } = await supabase
              .from('maintenance_requests')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', propertyId)
              .eq('status', 'in_progress');
  
            // 5. Fetch Revenue (Current Month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
  
            const { data: monthlyPayments } = await supabase
              .from('rent_payments')
              .select('amount')
              .gte('payment_date', startOfMonth.toISOString());
            
            let revenueMonth = 0;
            if (monthlyPayments) {
               revenueMonth = monthlyPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            }
  
            setStats({
              totalUnits,
              occupiedUnits,
              vacantUnits,
              maintenancePending: pendingMaintenance || 0,
              maintenanceInProgress: inProgressMaintenance || 0,
              leasesExpiringSoon: 0, // Placeholder
              totalRevenueMonth: revenueMonth,
              occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
            });
        }
  
        // 7. Recent Activity (Mocked + Real Mix equivalent)
        // In production, fetch this from a 'activity_logs' or union of tables
        setRecentActivities([
          {
            id: '1', type: 'payment', title: 'Rent Payment Received', description: 'Unit 4B - John Doe',
            date: new Date().toISOString(), amount: 45000, status: 'completed'
          },
          {
            id: '2', type: 'maintenance', title: 'Leaking Faucet Reported', description: 'Unit 2A - Kitchen Sink',
            date: new Date(Date.now() - 86400000).toISOString(), status: 'pending'
          },
          {
            id: '3', type: 'lease', title: 'Lease Expiring Soon', description: 'Unit 1C - Sarah Smith',
            date: new Date(Date.now() - 172800000).toISOString(), status: 'warning'
          },
          {
            id: '4', type: 'tenant', title: 'New Tenant Onboarded', description: 'Unit 5F - Mike Ross',
            date: new Date(Date.now() - 259200000).toISOString(), status: 'success'
          }
        ]);

        if (refreshing) {
            toast.success("Dashboard refreshed successfully");
        }
  
      } catch (error) {
        console.error('Error loading manager data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadManagerData();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimeAgo = (dateString: string): string => {
        try {
          const date = new Date(dateString);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
    
          if (diffMins < 1) return "Just now";
          if (diffMins < 60) return `${diffMins}m ago`;
          if (diffHours < 24) return `${diffHours}h ago`;
          return date.toLocaleDateString();
        } catch {
          return "Recently";
        }
    };
    
    // Helper for icons
    const getItemIcon = (type: string) => {
        switch (type) {
          case 'payment': return <DollarSign className="w-4 h-4" />;
          case 'maintenance': return <Wrench className="w-4 h-4" />;
          case 'tenant': return <Users className="w-4 h-4" />;
          case 'lease': return <FileText className="w-4 h-4" />;
          default: return <Clock className="w-4 h-4" />;
        }
    };
  
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
            <p className="text-slate-600 text-[13px] font-medium">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    if (!assignedProperty) {
      return (
        <div className="p-8 bg-slate-50 min-h-screen font-nunito">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 shadow-md max-w-2xl mx-auto mt-10">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-amber-800 mb-1">No Property Assigned</h3>
                  <p className="text-amber-700 leading-relaxed text-sm">
                    You haven't been assigned to manage any properties yet. Please contact your super admin to assign you a property so you can start managing via this dashboard.
                  </p>
               </div>
            </div>
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
                    Property Manager
                  </span>
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                    v2.4.0
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  {getGreeting()}, <span className="text-[#F96302]">{userName}</span>
                </h1>
                
                <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                  Currently managing <span className="text-white font-bold">{assignedProperty.name}</span>. Monitor units, maintenance, and revenue in real-time.
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
                    onClick={() => navigate("/portal/manager/reports")}
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
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-slate-200 p-8 hover:shadow-2xl hover:border-[#F96302] transition-all duration-300 transform hover:-translate-y-1">
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
  
        {/* KEY METRICS SECTION */}
        <section className="bg-slate-50 py-8">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#154279] tracking-tight mb-1">
                  Performance Overview
                </h2>
                <p className="text-xs text-slate-600 font-medium max-w-2xl">
                  Key metrics for <span className="text-[#F96302] font-semibold">{assignedProperty.name}</span>
                </p>
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Total Units",
                  value: stats.totalUnits,
                  icon: <Building className="w-5 h-5 text-[#154279]" />,
                  subtext: `${stats.vacantUnits} Currently Vacant`,
                  bg: "bg-blue-50",
                  text: "text-blue-700"
                },
                {
                  title: "Occupied Units",
                  value: stats.occupiedUnits,
                  icon: <Users className="w-5 h-5 text-emerald-700" />,
                  subtext: `${stats.occupancyRate}% Occupancy Rate`,
                  bg: "bg-emerald-50",
                  text: "text-emerald-700"
                },
                {
                  title: "Monthly Revenue",
                  value: `KES ${(stats.totalRevenueMonth / 1000).toFixed(1)}k`,
                  icon: <DollarSign className="w-5 h-5 text-[#F96302]" />,
                  subtext: "Current Month Income",
                  bg: "bg-orange-50",
                  text: "text-[#F96302]"
                },
                {
                  title: "Maintenance",
                  value: stats.maintenancePending,
                  icon: <Wrench className="w-5 h-5 text-amber-600" />,
                  subtext: `${stats.maintenanceInProgress} In Progress`,
                  bg: "bg-amber-50",
                  text: "text-amber-700"
                }
              ].map((metric, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                  onClick={() => {
                     if(metric.title === "Total Units" || metric.title === "Occupied Units") navigate("/portal/manager/properties/units");
                     if(metric.title === "Monthly Revenue") navigate("/portal/manager/payments");
                     if(metric.title === "Maintenance") navigate("/portal/manager/maintenance");
                  }}
                >
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">{metric.title}</p>
                    <h3 className="text-2xl font-extrabold text-slate-800 group-hover:text-[#154279] transition-colors">
                      {metric.value}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">
                      {metric.subtext}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${metric.bg} group-hover:scale-110 transition-transform`}>
                    {metric.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* MAIN CONTENT */}
        <section className="py-12 bg-white">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="space-y-8">
              {/* QUICK ACTIONS */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-8 bg-[#F96302]"></div>
                  <h3 className="text-lg font-semibold text-[#154279] tracking-tight">Quick Actions</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Manage Tenants",
                      icon: <Users className="w-6 h-6 text-white" />,
                      description: "Add, edit, view tenants",
                      route: "/portal/manager/tenants",
                      bgGradient: "from-blue-500 via-blue-600 to-blue-700",
                      borderColor: "border-blue-300",
                      iconBg: "bg-blue-400"
                    },
                    {
                      title: "Maintenance",
                      icon: <Wrench className="w-6 h-6 text-white" />,
                      description: "Handle service requests",
                      route: "/portal/manager/maintenance",
                      badge: stats.maintenancePending > 0 ? stats.maintenancePending : undefined,
                      bgGradient: "from-orange-500 via-orange-600 to-orange-700",
                      borderColor: "border-orange-300",
                      iconBg: "bg-orange-400"
                    },
                    {
                      title: "Payments",
                      icon: <CreditCard className="w-6 h-6 text-white" />,
                      description: "Record rent payments",
                      route: "/portal/manager/payments",
                      bgGradient: "from-emerald-500 via-emerald-600 to-emerald-700",
                      borderColor: "border-emerald-300",
                      iconBg: "bg-emerald-400"
                    },
                    {
                      title: "Unit Management",
                      icon: <Building className="w-6 h-6 text-white" />,
                      description: "Status and pricing",
                      route: "/portal/manager/properties/units",
                      bgGradient: "from-purple-500 via-purple-600 to-purple-700",
                      borderColor: "border-purple-300",
                      iconBg: "bg-purple-400"
                    },
                    {
                      title: "Reports",
                      icon: <FileBarChart className="w-6 h-6 text-white" />,
                      description: "Financial summaries",
                      route: "/portal/manager/reports",
                      bgGradient: "from-cyan-500 via-cyan-600 to-cyan-700",
                      borderColor: "border-cyan-300",
                      iconBg: "bg-cyan-400"
                    },
                    {
                      title: "Vacancy Notices",
                      icon: <FileText className="w-6 h-6 text-white" />,
                      description: "Manage move-outs",
                      route: "/portal/manager/vacation-notices",
                      bgGradient: "from-pink-500 via-pink-600 to-pink-700",
                      borderColor: "border-pink-300",
                      iconBg: "bg-pink-400"
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
                      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20 bg-white group-hover:opacity-30 transition-all" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
  
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
                          {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 6).map((item, index) => (
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
                                    item.type === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                                    item.type === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                                    item.type === 'lease' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-[#154279]'
                                  }`}>
                                  {getItemIcon(item.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-bold text-slate-900 group-hover:text-[#F96302] transition-colors truncate">
                                      {item.title}
                                  </p>
                                  <p className="text-[12px] text-slate-500 mb-1 truncate font-medium">{item.description}</p>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                     <Clock className="w-3 h-3" /> {formatTimeAgo(item.date)}
                                  </span>
                                </div>
                                {item.amount && (
                                   <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                                      +{(item.amount).toLocaleString()}
                                   </Badge>
                                )}
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
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* SHORTCUTS - RIGHT */}
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
                              title: "Add Tenant",
                              icon: <UserPlus className="w-4 h-4" />,
                              route: "/portal/manager/tenants"
                            },
                            {
                              title: "Property Profile",
                              icon: <Home className="w-4 h-4" />,
                              route: "/portal/manager/properties"
                            },
                            {
                              title: "Log Maintenance",
                              icon: <Wrench className="w-4 h-4" />,
                              route: "/portal/manager/maintenance"
                            },
                            {
                              title: "Financials",
                              icon: <DollarSign className="w-4 h-4" />,
                              route: "/portal/manager/payments"
                            },
                            {
                              title: "Reports Center",
                              icon: <FileBarChart className="w-4 h-4" />,
                              route: "/portal/manager/reports"
                            },
                            {
                              title: "My Profile",
                              icon: <Shield className="w-4 h-4" />,
                              route: "/portal/manager/profile"
                            }
                          ].map((link, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ x: 4 }}
                              onClick={() => {
                                if ('route' in link) {
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
      </div>
    );
};
  
export default ManagerDashboard;
