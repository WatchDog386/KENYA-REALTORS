import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  Wrench, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Activity, 
  RefreshCw,
  Shield,
  CheckCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroBackground } from '@/components/ui/HeroBackground';

interface TechnicianProfile {
  id: string;
  user_id: string;
  category_id: string;
  is_available: boolean;
  status: string;
  average_rating?: number;
  total_jobs_completed: number;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
}

interface AssignedProperty {
  id: string;
  technician_id: string;
  property_id: string;
  assigned_at: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    status: string;
  };
}

export const TechnicianDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [technician, setTechnician] = useState<TechnicianProfile | null>(null);
  const [assignedProperties, setAssignedProperties] = useState<AssignedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser?.id) {
      loadTechnicianProfile();
    }
  }, [authUser?.id]);

  const loadTechnicianProfile = async () => {
    try {
      setLoading(true);

      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Get technician profile with all related data
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select(`
          id,
          user_id,
          category_id,
          is_available,
          status,
          average_rating,
          total_jobs_completed,
          profiles:user_id(id, first_name, last_name, email, phone, avatar_url),
          technician_categories:category_id(id, name, description, icon)
        `)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (techError) {
        console.error('Error fetching technician:', techError);
        throw techError;
      }

      if (!techData) {
        throw new Error('No technician profile found. Please contact admin.');
      }

      const mappedTech = {
        ...techData,
        profile: techData.profiles,
        category: techData.technician_categories
      };

      setTechnician(mappedTech);
      console.log('Technician loaded:', mappedTech.id);

      // Get assigned properties with better error handling
      const { data: assignments, error: assignError } = await supabase
        .from('technician_property_assignments')
        .select(`
          id,
          technician_id,
          property_id,
          assigned_at,
          is_active,
          property:properties(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            location,
            status
          )
        `)
        .eq('technician_id', techData.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        // Don't throw - continue with empty properties
        setAssignedProperties([]);
      } else {
        const mappedProps = (assignments || [])
          .filter(p => p.property) // Filter out null properties
          .map(p => ({
            ...p,
            property: p.property
          }));

        console.log('Properties loaded:', mappedProps.length);
        setAssignedProperties(mappedProps);
      }
    } catch (error: any) {
      console.error('Error loading technician profile:', error);
      // Still set loading to false to show error state
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No technician profile found</p>
          </CardContent>
        </Card>
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
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8">
        <HeroBackground />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  Technician Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} /> Live Schedule
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                {getGreeting()}, <span className="text-[#F96302]">{getTechnicianName()}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                Manage your assignments and track your performance. You have <span className="text-white font-bold">{assignedProperties.length} active assignments</span>.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={loadTechnicianProfile}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh Board
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
                        Technician Status
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Updated: {formatTimeAgo(new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${technician.is_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {technician.is_available ? 'Available' : 'Busy'}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Specialization</span>
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                      <Wrench className="w-3 h-3 mr-1" />
                      {technician.category?.name || 'General'}
                    </Badge>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Performance Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-bold text-slate-800">
                        {technician.average_rating ? technician.average_rating.toFixed(1) : 'N/A'} <span className="text-slate-400 font-normal">/ 5.0</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Total Jobs</span>
                    <span className="text-[12px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {technician.total_jobs_completed} Completed
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
        {/* Contact Info Card - Optional or merged? Lets keep it simpler than before */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column: Quick Stats or Contact */}
           <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                   <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-slate-500" />
                      Your Profile
                   </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                            {technician.profile?.first_name?.[0] || 'T'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{getTechnicianName()}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{technician.profile?.email}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                         {technician.profile?.phone && (
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span>{technician.profile.phone}</span>
                            </div>
                         )}
                         <div className="flex items-center gap-3 text-sm text-slate-600">
                             <Mail className="w-4 h-4 text-slate-400" />
                             <span className="truncate">{technician.profile?.email}</span>
                         </div>
                    </div>

                    {technician.category?.description && (
                      <div className="pt-2">
                        <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">
                          "{technician.category.description}"
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
           </div>

           {/* Right Column: Assignments */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#154279]" />
                  Assigned Properties
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{assignedProperties.length}</span>
                </h2>
              </div>

              {assignedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedProperties.map((assignment, index) => (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                    <Card className="group border shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:border-blue-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <Building className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant={assignment.property?.status === 'available' ? 'secondary' : 'outline'} className="font-semibold">
                                    {assignment.property?.status}
                                </Badge>
                            </div>
                            
                            <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                                {assignment.property?.name || 'Unknown Property'}
                            </h3>
                            
                            <div className="flex items-start gap-1.5 text-slate-500 text-xs mb-4 min-h-[40px]">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                    {assignment.property?.address}, {assignment.property?.city}, {assignment.property?.state}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                </div>
                                <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    View Details <Wrench className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Properties Assigned</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      You are not currently assigned to any properties. New assignments will appear here automatically.
                    </p>
                  </CardContent>
                </Card>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default TechnicianDashboard;
