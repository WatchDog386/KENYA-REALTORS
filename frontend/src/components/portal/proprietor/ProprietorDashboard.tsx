// src/components/portal/proprietor/ProprietorDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Building2, 
  Loader2, 
  TrendingUp, 
  RefreshCw,
  Home,
  Users,
  DollarSign,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  ChevronRight,
  User,
  Search,
  FileBarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Card, CardContent } from '@/components/ui/card';

interface ProprietorProfile {
  id: string;
  user_id: string;
  business_name?: string;
  status: string;
  properties_count: number;
  profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  totalRevenueMonth: number;
  occupancyRate: number;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'maintenance' | 'tenant' | 'lease' | 'report' | 'message';
  title: string;
  description: string;
  date: string;
  amount?: number;
  status?: string;
  action?: string;
}

const ProprietorDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [proprietor, setProprietor] = useState<ProprietorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    totalRevenueMonth: 0,
    occupancyRate: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // System Status
  const systemStatus = {
      database: true,
      api: true,
      uptime: "99.9%",
      lastChecked: new Date().toISOString(),
      responseTime: 24,
  };

  useEffect(() => {
    if (authUser?.id) {
      loadProprietorData();
    }
  }, [authUser?.id]);

  const loadProprietorData = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Get proprietor profile
      const { data: propData, error: propError } = await supabase
        .from('proprietors')
        .select('*')
        .eq('user_id', authUser?.id)
        .maybeSingle();

      if (propError && propError.code !== 'PGRST116') throw propError;

      // Get the user profile separately
      let profileData = null;
      if (propData) {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .eq('id', authUser?.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Could not fetch profile:', profileError);
        }
        profileData = userProfile;
      }

      const mappedProp = propData ? {
        ...propData,
        profile: profileData
      } : null;

      setProprietor(mappedProp);

      if (mappedProp) {
        // Get owned properties
        const { data: propsData, error: propsError } = await supabase
            .from('proprietor_properties')
            .select(`
            ownership_percentage,
            properties(
                id,
                name,
                monthly_rent,
                occupied_units,
                total_units
            )
            `)
            .eq('proprietor_id', mappedProp.id)
            .eq('is_active', true);

        if (propsError) throw propsError;

        const mappedProps = (propsData || []).map(p => ({
            ...p,
            property: p.properties
        }));

        // Calculate Stats
        const totalProperties = mappedProps.length;
        const totalUnits = mappedProps.reduce((sum, p) => sum + (p.property?.total_units || 0), 0);
        const occupiedUnits = mappedProps.reduce((sum, p) => sum + (p.property?.occupied_units || 0), 0);
        
        const totalRevenueMonth = mappedProps.reduce(
            (sum, p) => sum + ((p.property?.monthly_rent || 0) * (p.ownership_percentage / 100)),
            0
        );

        setStats({
            totalProperties,
            totalUnits,
            occupiedUnits,
            totalRevenueMonth,
            occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
        });

        // Mock Activities
        setRecentActivities([
            {
                id: '1', type: 'report', title: 'Monthly Report Generated', description: 'February 2026 Financials',
                date: new Date().toISOString(), status: 'completed', action: '/portal/proprietor/reports'
            },
            {
                id: '2', type: 'payment', title: 'Disbursement Processed', description: 'Q1 Dividends',
                date: new Date(Date.now() - 86400000).toISOString(), amount: totalRevenueMonth * 0.8, status: 'completed'
            },
            {
                id: '3', type: 'message', title: 'New Message from Manager', description: 'Regarding Maintenance Approval',
                date: new Date(Date.now() - 172800000).toISOString(), status: 'unread', action: '/portal/proprietor/messages'
            }
        ]);
      }

      if (refreshing) {
          toast.success("Dashboard refreshed successfully");
      }

    } catch (error: any) {
      console.error('Error loading proprietor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProprietorData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getProprietorName = () => {
    if (!proprietor) return "Proprietor";
    const profile = proprietor.profile;
    if (profile && profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile && profile.first_name) return profile.first_name;
    return proprietor.business_name || 'Proprietor';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const getItemIcon = (type: string) => {
      switch (type) {
        case 'payment': return <DollarSign className="w-4 h-4" />;
        case 'message': return <MessageSquare className="w-4 h-4" />;
        case 'report': return <FileText className="w-4 h-4" />;
        default: return <Clock className="w-4 h-4" />;
      }
  };

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
            <p className="text-slate-600 text-[13px] font-medium">Loading portfolio...</p>
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
                  Proprietor Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  v2.4.0
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                {getGreeting()}, <span className="text-[#F96302] font-black">{getProprietorName()}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                You have <span className="text-white font-bold">{stats.totalProperties} properties</span> in your portfolio. Monitor performance and reports in real-time.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                  Refresh
                </button>
                
                <button
                  onClick={() => navigate("/portal/proprietor/reports")}
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
                Portfolio Overview
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-2xl">
                Key metrics for your <span className="text-[#F96302] font-semibold">Real Estate Holdings</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
                {
                  title: "Total Properties",
                  value: stats.totalProperties,
                  icon: <Building2 className="w-5 h-5 text-[#154279]" />,
                  subtext: `${stats.totalUnits} Total Units`,
                  bg: "bg-blue-50",
                  text: "text-blue-700"
                },
                {
                  title: "Occupancy Rate",
                  value: `${stats.occupancyRate}%`,
                  icon: <Users className="w-5 h-5 text-emerald-700" />,
                  subtext: `${stats.occupiedUnits} Occupied Units`,
                  bg: "bg-emerald-50",
                  text: "text-emerald-700"
                },
                {
                  title: "Est. Monthly Revenue",
                  value: stats.totalRevenueMonth > 1000 ? `${(stats.totalRevenueMonth / 1000).toFixed(1)}k` : stats.totalRevenueMonth,
                  icon: <DollarSign className="w-5 h-5 text-[#F96302]" />,
                  subtext: "Based on Ownership",
                  bg: "bg-orange-50",
                  text: "text-[#F96302]"
                },
                {
                  title: "Active Leases",
                  value: stats.occupiedUnits, // Proxy for leases
                  icon: <FileText className="w-5 h-5 text-purple-600" />,
                  subtext: "Tenants in Good Standing",
                  bg: "bg-purple-50",
                  text: "text-purple-700"
                }
             ].map((metric, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                  onClick={() => {
                     if(metric.title === "Total Properties") navigate("/portal/proprietor/properties");
                     // Other navigations can be added here
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
                      title: "My Properties",
                      icon: <Building2 className="w-6 h-6 text-white" />,
                      description: "View and manage listings",
                      route: "/portal/proprietor/properties",
                      bgGradient: "from-blue-500 via-blue-600 to-blue-700",
                      borderColor: "border-blue-300",
                      iconBg: "bg-blue-400"
                    },
                    {
                      title: "Reports Center",
                      icon: <FileBarChart className="w-6 h-6 text-white" />,
                      description: "Financial performance",
                      route: "/portal/proprietor/reports",
                      bgGradient: "from-orange-500 via-orange-600 to-orange-700",
                      borderColor: "border-orange-300",
                      iconBg: "bg-orange-400"
                    },
                    {
                      title: "Messages",
                      icon: <MessageSquare className="w-6 h-6 text-white" />,
                      description: "Inbox & Communications",
                      route: "/portal/proprietor/messages",
                      badge: recentActivities.filter(a => a.type === 'message' && a.status === 'unread').length,
                      bgGradient: "from-emerald-500 via-emerald-600 to-emerald-700",
                      borderColor: "border-emerald-300",
                      iconBg: "bg-emerald-400"
                    },
                    {
                      title: "Profile Settings",
                      icon: <User className="w-6 h-6 text-white" />,
                      description: "Update personal details",
                      route: "/portal/proprietor/profile",
                      bgGradient: "from-purple-500 via-purple-600 to-purple-700",
                      borderColor: "border-purple-300",
                      iconBg: "bg-purple-400"
                    },
                    // Add more if needed or keep it clean
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
                          {action.badge ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow-md ring-2 ring-white">
                              {action.badge}
                            </span>
                          ) : null}
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
                                    item.type === 'report' ? 'bg-orange-100 text-orange-700' :
                                    item.type === 'message' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-[#154279]'
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
                                      +{formatCurrency(item.amount)}
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

                {/* SHORTCUTS - RIGHT (Actually User Profile Quick View or Similar) */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px w-8 bg-[#F96302]"></div>
                    <h3 className="text-lg font-semibold text-[#154279] tracking-tight">Navigation</h3>
                  </div>
  
                  <div className="bg-gradient-to-br from-[#154279] to-[#0f325e] rounded-2xl shadow-xl border-2 border-[#154279] overflow-hidden text-white relative hover:shadow-2xl hover:border-[#F96302] transition-all">
                     <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 p-24 bg-[#F96302]/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
                     
                      <div className="p-6 relative z-10">
                        <div className="space-y-2">
                          {[
                            {
                              title: "My Properties",
                              icon: <Building2 className="w-4 h-4" />,
                              route: "/portal/proprietor/properties"
                            },
                            {
                              title: "Reports",
                              icon: <FileBarChart className="w-4 h-4" />,
                              route: "/portal/proprietor/reports"
                            },
                            {
                              title: "Messages",
                              icon: <MessageSquare className="w-4 h-4" />,
                              route: "/portal/proprietor/messages"
                            },
                            {
                              title: "Documents",
                              icon: <FileText className="w-4 h-4" />,
                              route: "/portal/proprietor/documents"
                            },
                            {
                              title: "My Profile",
                              icon: <Shield className="w-4 h-4" />,
                              route: "/portal/proprietor/profile"
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

export default ProprietorDashboard;
