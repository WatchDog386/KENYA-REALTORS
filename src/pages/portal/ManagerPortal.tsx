import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Users,
  DollarSign,
  Wrench,
  AlertTriangle,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Loader2,
  RefreshCw,
  ChevronRight,
  BarChart3,
  CheckCircle,
  Clock,
  Bell,
  Settings,
  Plus,
  Activity,
  Shield,
  Building,
  CreditCard,
  FileCheck,
  Search
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useManager } from "@/hooks/useManager";
import { formatCurrency, formatForDisplay } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AssignmentStatus from "@/components/portal/manager/AssignmentStatus";

const ManagerPortal = () => {
  const {
    stats,
    pendingTasks,
    upcomingEvents,
    profile,
    loading,
    error,
    refetch,
    getAssignedProperties,
  } = useManager();

  const [properties, setProperties] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Load custom fonts
  useEffect(() => {
    // Add Nunito font to match SuperAdminDashboard
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      body { font-family: 'Nunito', sans-serif; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (stats?.properties) {
      setProperties(stats.properties.slice(0, 3)); // Show only first 3 properties
    }

    // Fetch recent payments
    fetchRecentPayments();
  }, [stats]);

  const fetchRecentPayments = async () => {
    try {
      if (!stats?.properties || stats.properties.length === 0) {
        setRecentPayments([]);
        return;
      }
      
      // Get property IDs managed by this manager
      const propertyIds = stats.properties.map(p => p.id);
      
      // Query payments for tenants in assigned properties only
      const { data: paymentsData, error } = await supabase
        .from("rent_payments")
        .select("*, property:property_id(name)")
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Manually fetch tenant profiles since no direct FK to profiles exists yet
      let payments = [];
      if (paymentsData) {
          const tenantIds = [...new Set(paymentsData.map((p: any) => p.tenant_id).filter(Boolean))];
          const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', tenantIds);
          
          payments = paymentsData.map((p: any) => {
              const tenant = profiles?.find(prof => prof.id === p.tenant_id);
              return {
                  ...p,
                  tenant: tenant ? {
                      first_name: tenant.first_name,
                      last_name: tenant.last_name,
                      email: tenant.email
                  } : { first_name: 'Unknown', last_name: 'Tenant', email: '' }
              };
          });
      }
      
      setRecentPayments(payments);
    } catch (err) {
      console.error("Error fetching payments:", err);
      // Don't clear payments on error to avoid flash, just log
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await fetchRecentPayments();
    setTimeout(() => setRefreshing(false), 500);
    toast.success("Dashboard data refreshed");
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
      
      return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    } catch {
      return "Recently";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shadow-none hover:bg-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 shadow-none hover:bg-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "overdue":
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 shadow-none hover:bg-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-[13px] font-medium">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button asChild>
            <Link to="/portal">Go to Portal Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const metrics = stats ? [
    {
      title: "Managed Properties",
      value: stats.managedProperties,
      icon: <Building className="w-8 h-8 text-[#154279]" />,
      metric: `${stats.properties?.reduce((acc, p) => acc + (p.total_units || 0), 0) || 0} Units`,
      progress: stats.occupancyRate || 0,
      label: "Occupancy",
      route: "/portal/manager/properties",
      primaryColor: "#3b82f6",
      accentColor: "from-blue-50 via-blue-50/30 to-white",
      borderHover: "hover:border-blue-400 hover:shadow-blue-500/20"
    },
    {
      title: "Active Tenants",
      value: stats.activeTenants,
      icon: <Users className="w-8 h-8 text-[#154279]" />,
      metric: `Tenants`, // Generic for now
      progress: 95, // Placeholder
      label: "Satisfaction",
      route: "/portal/manager/tenants",
      primaryColor: "#0ea5e9",
      accentColor: "from-cyan-50 via-cyan-50/30 to-white",
      borderHover: "hover:border-cyan-400 hover:shadow-cyan-500/20"
    },
    {
      title: "Pending Rent",
      value: formatForDisplay(stats.pendingRent, 'KSH', true),
      icon: <DollarSign className="w-8 h-8 text-[#F96302]" />,
      metric: "Outstanding",
      progress: (1 - (stats.pendingRent / (stats.pendingRent + 100000))) * 100, // Roughly estimated
      label: "Collected",
      route: "/portal/manager/payments",
      primaryColor: "#10b981",
      accentColor: "from-emerald-50 via-emerald-50/30 to-white",
      borderHover: "hover:border-emerald-400 hover:shadow-emerald-500/20"
    },
    {
      title: "Maintenance",
      value: stats.maintenanceCount,
      icon: <Wrench className="w-8 h-8 text-[#F96302]" />,
      metric: "Requests",
      progress: 100 - Math.min(stats.maintenanceCount * 10, 100),
      label: "Efficiency",
      route: "/portal/manager/maintenance",
      primaryColor: "#f59e0b",
      accentColor: "from-amber-50 via-amber-50/30 to-white",
      borderHover: "hover:border-amber-400 hover:shadow-amber-500/20"
    }
  ] : [];

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg relative">
        <div className="absolute inset-0 bg-[#F96302]/5"></div>
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  Manager Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  v2.4.0
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                Welcome back, <span className="text-[#F96302]">{profile?.user ? `${profile.user.first_name} ${profile.user.last_name}` : 'Manager'}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                Here's your property management overview. Monitor properties, tenants, maintenance, and payments efficiently.
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
                  <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
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
                        Overview Status
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Updated: Just now</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200`}>
                    ACTIVE
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Pending Tasks</span>
                    <div className="flex items-center gap-2.5">
                       <span className={`text-[12px] font-bold ${pendingTasks.length > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {pendingTasks.length} Tasks
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Occupancy Rate</span>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ring-4 ${(stats?.occupancyRate || 0) > 90 ? 'bg-emerald-500 ring-emerald-100' : 'bg-amber-500 ring-amber-100'}`} />
                      <span className={`text-[12px] font-bold ${(stats?.occupancyRate || 0) > 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {stats?.occupancyRate || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Experience</span>
                    <span className="text-[12px] font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {profile?.experience_years || 0} Years
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KEY METRICS SECTION */}
      <section className="bg-slate-50 py-14">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#154279] tracking-tight mb-2">
                Performance Metrics
              </h2>
              <p className="text-sm text-slate-600 font-medium max-w-2xl">
                Real-time metrics for your managed properties and tenant activities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
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
                        whileInView={{ width: `${Math.min(metric.progress || 0, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: metric.primaryColor }}
                      />
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ASSIGNMENT STATUS SECTION */}
      <section className="bg-white border-b border-slate-200 py-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <AssignmentStatus properties={properties} loading={loading} />
        </div>
      </section>

      {/* RECENT ACTIVITY & LISTS */}
      <section className="bg-slate-50 pb-20">
         <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Properties & Payments */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Properties */}
                <Card className="border-0 shadow-lg ring-1 ring-slate-200 overflow-hidden">
                   <CardHeader className="bg-white border-b border-slate-100 py-6 px-8">
                      <div className="flex items-center justify-between">
                         <div>
                            <CardTitle className="text-[#154279] text-xl font-bold">Managed Properties</CardTitle>
                            <CardDescription className="text-slate-500 mt-1">
                               Top performing properties
                            </CardDescription>
                         </div>
                         <Button variant="outline" size="sm" asChild className="hover:bg-[#154279] hover:text-white border-slate-200">
                           <Link to="/portal/manager/properties">View All</Link>
                         </Button>
                      </div>
                   </CardHeader>
                   <CardContent className="p-0 bg-white">
                      {properties.length > 0 ? (
                         <div className="divide-y divide-slate-100">
                           {properties.map((property) => (
                             <div key={property.id} className="group p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#154279] group-hover:bg-[#154279] group-hover:text-white transition-colors">
                                      <Home size={20} />
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-slate-900 group-hover:text-[#154279] transition-colors">{property.name}</h4>
                                      <p className="text-xs text-slate-500 font-medium mt-1">
                                        {property.property_unit_types?.reduce((acc:any, u:any) => acc + (u.units_count || 0), 0) || 0} Units • {property.status}
                                      </p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <Link 
                                      to={`/portal/manager/properties/${property.id}`}
                                      className="text-xs font-bold uppercase tracking-wider text-[#154279] hover:text-[#F96302] flex items-center gap-1"
                                   >
                                      Details <ChevronRight size={14} />
                                   </Link>
                                </div>
                             </div>
                           ))}
                         </div>
                      ) : (
                         <div className="p-12 text-center text-slate-500">
                            <Building className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <p className="font-medium">No properties assigned</p>
                         </div>
                      )}
                   </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card className="border-0 shadow-lg ring-1 ring-slate-200 overflow-hidden">
                   <CardHeader className="bg-white border-b border-slate-100 py-6 px-8">
                       <div className="flex items-center justify-between">
                         <div>
                            <CardTitle className="text-[#154279] text-xl font-bold">Recent Transactions</CardTitle>
                            <CardDescription className="text-slate-500 mt-1">
                               Latest received payments
                            </CardDescription>
                         </div>
                         <Button variant="outline" size="sm" asChild className="hover:bg-[#154279] hover:text-white border-slate-200">
                           <Link to="/portal/manager/payments">All Payments</Link>
                         </Button>
                      </div>
                   </CardHeader>
                   <CardContent className="p-0 bg-white">
                      {recentPayments.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {recentPayments.map((payment) => (
                             <div key={payment.id} className="group p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                      <DollarSign size={18} />
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-slate-900">{formatCurrency(payment.amount)}</h4>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                                         {payment.tenant?.first_name} {payment.tenant?.last_name} • {payment.property?.name}
                                      </p>
                                   </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                   {getPaymentStatusBadge(payment.status)}
                                   <span className="text-[10px] text-slate-400 font-medium">{formatTimeAgo(payment.created_at)}</span>
                                </div>
                             </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-slate-500">
                           <CreditCard className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                           <p className="font-medium">No recent transactions</p>
                        </div>
                      )}
                   </CardContent>
                </Card>

              </div>

              {/* Right Column - Tasks */}
              <div className="space-y-8">
                 <Card className="border-0 shadow-lg ring-1 ring-slate-200 overflow-hidden h-full">
                    <CardHeader className="bg-white border-b border-slate-100 py-6 px-8 flex justify-between items-center">
                       <CardTitle className="text-[#154279] text-xl font-bold">Pending Tasks</CardTitle>
                       <Badge className="bg-[#154279] hover:bg-[#F96302] transition-colors">{pendingTasks.length}</Badge>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                       {pendingTasks.length > 0 ? (
                          <div className="divide-y divide-slate-100">
                             {pendingTasks.slice(0, 6).map((task) => (
                                <Link 
                                  key={task.id} 
                                  to={task.type === "maintenance" ? `/portal/manager/maintenance/${task.id}` : "/portal/manager"}
                                  className="block p-5 hover:bg-slate-50 transition-colors group"
                                >
                                   <div className="flex justify-between items-start mb-2">
                                      <Badge variant="outline" className={`${getPriorityColor(task.priority)} uppercase text-[9px] font-bold tracking-wider`}>
                                         {task.priority}
                                      </Badge>
                                      <ChevronRight size={14} className="text-slate-300 group-hover:text-[#F96302] transition-colors" />
                                   </div>
                                   <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-[#154279] transition-colors">{task.task}</h4>
                                   <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                      <Clock size={12} />
                                      <span>Due: {task.due}</span>
                                   </div>
                                </Link>
                             ))}
                             <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <Button variant="outline" className="w-full bg-white hover:bg-white border-slate-200 text-[#154279] hover:text-[#F96302] hover:border-[#F96302]" asChild>
                                   <Link to="/portal/manager/maintenance">Manage All Tasks</Link>
                                </Button>
                             </div>
                          </div>
                       ) : (
                          <div className="p-12 text-center text-slate-500">
                             <CheckCircle className="mx-auto h-12 w-12 text-emerald-300 mb-4" />
                             <p className="font-medium">All tasks completed</p>
                             <p className="text-xs mt-1">Great job!</p>
                          </div>
                       )}
                    </CardContent>
                 </Card>

                 {/* Quick Actions */}
                 <div className="bg-gradient-to-br from-[#154279] to-[#0f325e] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10">
                       <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => navigate("/portal/manager/maintenance/new")} className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/10">
                             <Wrench size={20} className="text-[#F96302]" />
                             <span className="text-xs font-bold uppercase tracking-wide">Maintenance</span>
                          </button>
                          <button onClick={() => toast.info("Feature coming soon")} className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/10">
                             <MessageSquare size={20} className="text-[#F96302]" />
                             <span className="text-xs font-bold uppercase tracking-wide">Message</span>
                          </button>
                          <button onClick={() => toast.info("Feature coming soon")} className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/10">
                             <Calendar size={20} className="text-[#F96302]" />
                             <span className="text-xs font-bold uppercase tracking-wide">Inspection</span>
                          </button>
                          <button onClick={() => toast.info("Feature coming soon")} className="bg-white/10 hover:bg-white/20 transition-all p-3 rounded-xl flex flex-col items-center justify-center gap-2 border border-white/10">
                             <FileCheck size={20} className="text-[#F96302]" />
                             <span className="text-xs font-bold uppercase tracking-wide">Notice</span>
                          </button>
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

export default ManagerPortal;
