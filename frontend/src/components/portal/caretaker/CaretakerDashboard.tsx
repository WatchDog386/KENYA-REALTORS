import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../integrations/supabase/client';
import { caretakerService } from '../../../services/caretakerService';
import { maintenanceService } from '../../../services/maintenanceService';
import {
  UserCog,
  MapPin,
  AlertCircle,
  CheckCircle,
  Wrench,
  Star,
  Phone,
  Mail,
  Trophy,
  Activity,
  Calendar,
  Clock,
  Briefcase,
  RefreshCw,
  Loader2,
  Shield,
  DollarSign,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

interface CaretakerStats {
  propertyName: string;
  location: string;
  status: string;
  performanceRating: number;
  pendingIssues: number;
  completedTasks: number;
  assignedSince: string;
}

const CaretakerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CaretakerStats | null>(null);
  const [caretakerInfo, setCaretakerInfo] = useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Get caretaker info using service for robustness
      const caretaker = await caretakerService.getCaretakerByUserId(user.id);

      if (!caretaker) {
        setError('No caretaker profile found. Please contact admin.');
        console.warn('No caretaker profile for user:', user.id);
        return;
      }

      setCaretakerInfo(caretaker);
      console.log('Caretaker loaded:', caretaker.id);

      // If caretaker has a property assigned, get maintenance requests
      if (caretaker.property_id) {
        try {
          // Verify maintenance service functionality
          const maintenance = await maintenanceService.getPropertyMaintenanceRequests(caretaker.property_id);
          setMaintenanceRequests(maintenance || []);

          // Calculate stats from real data
          const pending = maintenance?.filter((m: any) => 
            m.status === 'pending' || m.status === 'assigned' || m.status === 'in_progress'
          ).length || 0;
          const completed = maintenance?.filter((m: any) => m.status === 'completed').length || 0;

          setStats({
            propertyName: caretaker.property?.name || 'Assigned Property',
            location: caretaker.property?.location || '',
            status: caretaker.status || 'active',
            performanceRating: caretaker.performance_rating || 0,
            pendingIssues: pending,
            completedTasks: completed,
            assignedSince: caretaker.assignment_date ? new Date(caretaker.assignment_date).toLocaleDateString() : 'N/A'
          });
        } catch (error) {
          console.error("Error fetching maintenance:", error);
           setStats({
            propertyName: caretaker.property?.name || 'N/A',
            location: caretaker.property?.location || 'N/A',
            status: caretaker.status || 'active',
            performanceRating: caretaker.performance_rating || 0,
            pendingIssues: 0,
            completedTasks: 0,
            assignedSince: caretaker.assignment_date ? new Date(caretaker.assignment_date).toLocaleDateString() : 'N/A'
          });
        }

      } else {
        setError('No property assigned. Please contact admin.');
        setStats({
          propertyName: 'N/A',
          location: 'N/A',
          status: caretaker.status || 'active',
          performanceRating: caretaker.performance_rating || 0,
          pendingIssues: 0,
          completedTasks: 0,
          assignedSince: 'N/A'
        });
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      setError(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8 font-nunito bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  Caretaker Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} /> Live Updates
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                {getGreeting()}, <span className="text-[#F96302]">{caretakerInfo?.profile?.first_name || 'Caretaker'}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                Currently managing <span className="text-white font-bold">{stats?.propertyName}</span>. Keep track of maintenance requests and reports here.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={loadDashboardData}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh
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
                        Assignment Status
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Updated: {formatTimeAgo(new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${stats?.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {stats?.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Property Name</span>
                    <span className="text-[12px] font-bold text-slate-800">
                      {stats?.propertyName}
                    </span>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Performance Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-bold text-slate-800">
                        {stats?.performanceRating?.toFixed(1) || 'N/A'} / 5.0
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Assigned Since</span>
                    <span className="text-[12px] font-bold text-slate-800">
                      {stats?.assignedSince}
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
                Key metrics for <span className="text-[#F96302] font-semibold">{stats?.propertyName}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Active Jobs",
                value: stats?.pendingIssues || 0,
                icon: <Wrench className="w-5 h-5 text-[#154279]" />,
                subtext: "Pending Maintenance",
                bg: "bg-blue-50",
                text: "text-blue-700"
              },
              {
                title: "Completed Tasks",
                value: stats?.completedTasks || 0,
                icon: <CheckCircle className="w-5 h-5 text-emerald-700" />,
                subtext: "All Time Completed",
                bg: "bg-emerald-50",
                text: "text-emerald-700"
              },
              {
                title: "Properties",
                value: caretakerInfo?.property_id ? 1 : 0,
                icon: <Briefcase className="w-5 h-5 text-[#F96302]" />,
                subtext: "Currently Managing",
                bg: "bg-orange-50",
                text: "text-[#F96302]"
              },
              {
                title: "Rating",
                value: stats?.performanceRating ? stats.performanceRating.toFixed(1) : 'N/A',
                icon: <Star className="w-5 h-5 text-amber-600" />,
                subtext: "Performance Score",
                bg: "bg-amber-50",
                text: "text-amber-700"
              }
            ].map((metric, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${metric.bg}`}>
                      {metric.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{metric.title}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-1 group-hover:text-[#154279] transition-colors">{metric.value}</h3>
                  <p className={`text-[10px] font-bold ${metric.text} flex items-center gap-1`}>
                    {metric.subtext}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS SECTION */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-[#F96302]"></div>
            <h3 className="text-lg font-bold text-[#154279] tracking-tight">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <Wrench className="w-6 h-6 text-white" />
                      </div>
                      <div className="p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                   </div>
                   
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">Log Maintenance</h3>
                      <p className="text-orange-100 text-xs font-medium">Record new issues & repairs</p>
                   </div>
                </div>
             </motion.div>

             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <ClipboardList className="w-6 h-6 text-white" />
                      </div>
                      <div className="p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                   </div>
                   
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">Daily Reports</h3>
                      <p className="text-blue-100 text-xs font-medium">Submit status updates</p>
                   </div>
                </div>
             </motion.div>

             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div className="p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <ChevronRight className="w-4 h-4 text-white" />
                      </div>
                   </div>
                   
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">Contact Manager</h3>
                      <p className="text-emerald-100 text-xs font-medium">Messages & notifications</p>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Maintenance Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#154279] flex items-center gap-2 tracking-tight">
                <Wrench className="w-5 h-5" />
                Recent Maintenance Requests
              </h2>
              <button 
                className="text-[11px] font-bold text-[#F96302] hover:text-[#e05800] uppercase tracking-wider border border-[#F96302]/20 hover:border-[#F96302] hover:bg-[#F96302]/10 px-3 py-1.5 rounded-lg transition-all"
              >
                View All
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {maintenanceRequests.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {maintenanceRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="p-5 hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock size={10} />
                              {formatTimeAgo(request.created_at)}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-[#154279] transition-colors">{request.title}</h3>
                          <p className="text-slate-500 text-xs line-clamp-1 font-medium">{request.description}</p>
                        </div>
                        <div className="hidden sm:block text-right">
                          <div className="bg-slate-100 px-3 py-1 rounded-lg inline-block">
                             <div className="text-[10px] font-bold text-slate-700">
                               {request.unit?.unit_number || 'Unit N/A'}
                             </div>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {request.priority || 'Normal'} Priority
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">No pending maintenance requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6">
            {/* Property Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-[#154279] mb-4 flex items-center gap-2 tracking-tight">
                <Briefcase className="w-5 h-5" />
                 Assignment Details
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Your Role</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <UserCog size={14} className="text-[#F96302]" />
                    Property Caretaker
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Reporting To</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <UserCog size={14} className="text-[#154279]" />
                    {caretakerInfo?.property_manager?.first_name 
                      ? `${caretakerInfo.property_manager.first_name} ${caretakerInfo.property_manager.last_name}`
                      : 'Property Manager'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Location</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <MapPin size={14} className="text-emerald-600" />
                    {stats?.location || 'Not designated'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerDashboard;
