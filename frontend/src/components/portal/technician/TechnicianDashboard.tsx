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
  Star, 
  Activity, 
  CheckCircle,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  Shield,
  RefreshCw,
  Briefcase,
  ChevronRight,
  DollarSign,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { technicianService } from '@/services/technicianService';

// Interfaces
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

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  property: {
    id: string;
    name: string;
    address: string;
  };
  unit?: {
    unit_number: string;
  };
  tenant: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  completion_report?: {
    id: string;
    status: string;
  };
  assigned_to_technician_id?: string;
  technician_id?: string;
}

interface DashboardStats {
  activeJobs: number;
  completedJobs: number;
  rating: number;
  earningsThisMonth?: number;
}

export const TechnicianDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [technician, setTechnician] = useState<TechnicianProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ activeJobs: 0, completedJobs: 0, rating: 0 });

  // Job Action States
  const [selectedJob, setSelectedJob] = useState<MaintenanceRequest | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isInProgressOpen, setIsInProgressOpen] = useState(false);
  
  // Progress Forms
  const [startImage, setStartImage] = useState<File | null>(null);
  
  // Completion Report Form
  const [reportData, setReportData] = useState({
    notes: "",
    actualCost: "",
    hoursSpent: "",
    materials: ""
  });
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authUser?.id) {
      loadTechnicianData();
    }
  }, [authUser?.id]);

  const loadTechnicianData = async () => {
    try {
      setLoading(true);
      if (!authUser?.id) throw new Error('User not authenticated');

      const techData = await technicianService.getTechnicianByUserId(authUser.id);
      
      if (techData) {
        setTechnician(techData);
        const reqData = await technicianService.getTechnicianJobs(techData.id);
        setRequests(reqData);

        // Calculate Stats
        const active = reqData.filter(r => ['pending', 'assigned', 'scheduled', 'in_progress'].includes(r.status)).length;
        const completed = techData.total_jobs_completed || 0;
        
        setStats({
          activeJobs: active,
          completedJobs: completed,
          rating: techData.average_rating || 0
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load technician data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, updates: any = {}) => {
    const { error } = await supabase.from('maintenance_requests')
      .update({ status, ...updates })
      .eq('id', id);
    if(error) throw error;
    await loadTechnicianData();
  };

  const handleSchedule = async () => {
    if(!selectedJob || !scheduleDate) return;
    setProcessing(true);
    try {
      await updateStatus(selectedJob.id, 'scheduled', { scheduled_date: new Date(scheduleDate).toISOString() });
      toast.success('Job scheduled');
      setIsScheduleOpen(false);
    } catch(e: any) { toast.error("Failed to schedule: " + e.message); }
    finally { setProcessing(false); }
  };

  const handleStartJob = async () => {
    if(!selectedJob) return;
    setProcessing(true);
    try {
      await updateStatus(selectedJob.id, 'in_progress', { started_at: new Date().toISOString() });
      toast.success('Job started');
      setIsInProgressOpen(false);
    } catch(e: any) { toast.error("Failed to start job: " + e.message); }
    finally { setProcessing(false); }
  };

  const handleCompleteJob = async () => {
    if (!selectedJob || !technician) return;
    
    try {
      setProcessing(true);
      
      let afterUrl = null;
      if (afterImage) {
        const fileExt = afterImage.name.split('.').pop();
        const fileName = `${selectedJob.id}_after_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('property_images')
          .upload(fileName, afterImage);
          
        if (!uploadError) {
            const { data } = supabase.storage.from('property_images').getPublicUrl(fileName);
            afterUrl = data.publicUrl;
        }
      }

      // Create completion report
      const { data: report, error: reportError } = await supabase
        .from('maintenance_completion_reports')
        .insert({
            maintenance_request_id: selectedJob.id,
            technician_id: technician.id,
            property_id: selectedJob.property.id,
            notes: reportData.notes,
            hours_spent: parseFloat(reportData.hoursSpent) || 0,
            materials_used: reportData.materials,
            actual_cost: parseFloat(reportData.actualCost) || 0,
            after_repair_image_url: afterUrl,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // 2. Update Request Status
      await updateStatus(selectedJob.id, 'completed', { 
          completed_at: new Date().toISOString(),
          completion_report_id: report.id,
          completion_status: 'pending_review',
          actual_cost: parseFloat(reportData.actualCost) || 0
      });
      
      toast.success("Job completed and report submitted!");
      setIsCompleteOpen(false); // Close dialog

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to complete job: " + error.message);
    } finally {
      setProcessing(false);
    }
  };


  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
        <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
        <p className="text-slate-600 text-[13px] font-medium">Loading dashboard...</p>
        </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito">
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
                  Technician Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1">
                  <Activity size={10} /> Live Updates
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                {getGreeting()}, <span className="text-[#F96302]">{technician?.profile?.first_name || 'Technician'}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-6 max-w-lg font-medium">
                Specialized in <span className="text-white font-bold">{technician?.category?.name || 'General Maintenance'}</span>. 
                View your active jobs and track your performance here.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={loadTechnicianData}
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
                        Status
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Updated: {formatTimeAgo(new Date().toISOString())}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${technician?.is_available ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {technician?.is_available ? 'Available' : 'Busy'}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Category</span>
                    <span className="text-[12px] font-bold text-slate-800">
                      {technician?.category?.name || 'General'}
                    </span>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[12px] font-bold text-slate-800">
                        {(stats.rating || 5.0).toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100" />
                  
                  <div className="flex items-center justify-between group">
                    <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Technician ID</span>
                    <span className="text-[12px] font-bold text-slate-800">
                      {technician?.user_id?.slice(0, 8)}
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
                Key metrics for <span className="text-[#F96302] font-semibold">{technician?.profile?.first_name}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Active Jobs",
                value: stats.activeJobs,
                icon: <Wrench className="w-5 h-5 text-[#154279]" />,
                subtext: "In Progress / Pending",
                bg: "bg-blue-50",
                text: "text-blue-700"
              },
              {
                title: "Completed Jobs",
                value: stats.completedJobs,
                icon: <CheckCircle className="w-5 h-5 text-emerald-700" />,
                subtext: "All Time Completed",
                bg: "bg-emerald-50",
                text: "text-emerald-700"
              },
              {
                title: "Availability",
                value: technician?.is_available ? 'Yes' : 'No',
                icon: <Clock className="w-5 h-5 text-[#F96302]" />,
                subtext: "Current Status",
                bg: "bg-orange-50",
                text: "text-[#F96302]"
              },
              {
                title: "Rating",
                value: (stats.rating || 5.0).toFixed(1),
                icon: <Star className="w-5 h-5 text-amber-600" />,
                subtext: "Client Satisfaction",
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
             <motion.div className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white opacity-70" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">My Schedule</h3>
                      <p className="text-orange-100 text-xs font-medium">View upcoming appointments</p>
                   </div>
                </div>
             </motion.div>

             <motion.div className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white opacity-70" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">History</h3>
                      <p className="text-blue-100 text-xs font-medium">View past jobs</p>
                   </div>
                </div>
             </motion.div>

             <motion.div className="relative overflow-hidden group cursor-pointer rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative p-6 flex flex-col h-full justify-between min-h-[140px]">
                   <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
                         <Activity className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-white opacity-70" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">Update Status</h3>
                      <p className="text-emerald-100 text-xs font-medium">Change availability</p>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* JOBS SECTION */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Jobs List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#154279] flex items-center gap-2 tracking-tight">
                <Briefcase className="w-5 h-5" />
                Active Assignments
              </h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               {requests.filter(r => !['completed', 'cancelled'].includes(r.status)).length > 0 ? (
                 <div className="divide-y divide-slate-100">
                    {requests.filter(r => !['completed', 'cancelled'].includes(r.status)).map(req => (
                       <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-col sm:flex-row gap-4 justify-between">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getPriorityColor(req.priority)}`}>
                                     {req.priority} Priority
                                   </span>
                                   <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                     <Clock size={10} />
                                     {formatTimeAgo(req.created_at)}
                                   </span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-base mb-1">{req.title}</h3>
                                <p className="text-slate-500 text-sm mb-2">{req.description}</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                   <span className="flex items-center gap-1"><MapPin size={12} /> {req.property.name}</span>
                                   {req.unit && <span>Unit {req.unit.unit_number}</span>}
                                   {req.scheduled_date && (
                                     <span className="text-[#F96302] flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(req.scheduled_date).toLocaleDateString()}
                                     </span>
                                   )}
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2 self-start sm:self-center">
                                {req.status === 'pending' && (
                                   <Dialog open={isScheduleOpen && selectedJob?.id === req.id} onOpenChange={(open) => {
                                      setIsScheduleOpen(open);
                                      if(open) setSelectedJob(req);
                                   }}>
                                     <DialogTrigger asChild>
                                       <Button size="sm" className="bg-[#154279] hover:bg-[#0f325e]">Accept</Button>
                                     </DialogTrigger>
                                     <DialogContent>
                                       <DialogHeader>
                                         <DialogTitle>Schedule Maintenance</DialogTitle>
                                         <DialogDescription>Choose a date and time to visit.</DialogDescription>
                                       </DialogHeader>
                                       <div className="py-4">
                                         <Label>Date & Time</Label>
                                         <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                                       </div>
                                       <DialogFooter>
                                         <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                                         <Button onClick={handleSchedule} disabled={!scheduleDate || processing}>Confirm Schedule</Button>
                                       </DialogFooter>
                                     </DialogContent>
                                   </Dialog>
                                )}

                                {(req.status === 'scheduled' || req.status === 'assigned') && (
                                   <Dialog open={isInProgressOpen && selectedJob?.id === req.id} onOpenChange={(open) => {
                                       setIsInProgressOpen(open);
                                       if(open) setSelectedJob(req);
                                   }}>
                                       <DialogTrigger asChild>
                                          <Button size="sm" className="bg-[#F96302] hover:bg-[#d85502]">Start Work</Button>
                                       </DialogTrigger>
                                       <DialogContent>
                                           <DialogHeader>
                                               <DialogTitle>Start Work</DialogTitle>
                                               <DialogDescription>Upload a "Before" photo to start tracking.</DialogDescription>
                                           </DialogHeader>
                                           <div className="py-4">
                                               <Label>Before Photo</Label>
                                               <Input type="file" accept="image/*" onChange={e => setStartImage(e.target.files?.[0] || null)} />
                                           </div>
                                           <DialogFooter>
                                               <Button onClick={handleStartJob} disabled={processing}>Start Timer</Button>
                                           </DialogFooter>
                                       </DialogContent>
                                   </Dialog>
                                )}

                                {req.status === 'in_progress' && (
                                   <Dialog open={isCompleteOpen && selectedJob?.id === req.id} onOpenChange={(open) => {
                                      setIsCompleteOpen(open);
                                      if(open) setSelectedJob(req);
                                   }}>
                                     <DialogTrigger asChild>
                                       <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Complete</Button>
                                     </DialogTrigger>
                                     <DialogContent className="max-w-lg">
                                       <DialogHeader>
                                         <DialogTitle>Job Completion Report</DialogTitle>
                                         <DialogDescription>Submit details to notify the property manager.</DialogDescription>
                                       </DialogHeader>
                                       <div className="space-y-4 py-2">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label>Hours Spent</Label>
                                              <Input type="number" placeholder="2.5" 
                                                value={reportData.hoursSpent} 
                                                onChange={e => setReportData({...reportData, hoursSpent: e.target.value})} />
                                            </div>
                                            <div>
                                              <Label>Total Cost ($)</Label>
                                              <Input type="number" placeholder="150.00" 
                                                value={reportData.actualCost} 
                                                onChange={e => setReportData({...reportData, actualCost: e.target.value})} />
                                            </div>
                                          </div>
                                          <div>
                                            <Label>Materials Used</Label>
                                            <Textarea placeholder="List parts..." 
                                              value={reportData.materials} 
                                              onChange={e => setReportData({...reportData, materials: e.target.value})} />
                                          </div>
                                          <div>
                                            <Label>Notes</Label>
                                            <Textarea placeholder="Describe the fix..." 
                                              value={reportData.notes} 
                                              onChange={e => setReportData({...reportData, notes: e.target.value})} />
                                          </div>
                                          
                                          <div>
                                               <Label>After Repair Photo</Label>
                                               <Input type="file" accept="image/*" onChange={e => setAfterImage(e.target.files?.[0] || null)} />
                                          </div>
                                       </div>
                                       <DialogFooter>
                                         <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
                                         <Button onClick={handleCompleteJob} disabled={processing}>Submit Report</Button>
                                       </DialogFooter>
                                     </DialogContent>
                                   </Dialog>
                                )}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                  <div className="p-12 text-center text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-sm">No active jobs</p>
                  </div>
               )}
            </div>
          </div>

          {/* Right Column: Profile & Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-[#154279] mb-4 flex items-center gap-2 tracking-tight">
                <Briefcase className="w-5 h-5" />
                 Technician Profile
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Full Name</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {technician?.profile?.first_name} {technician?.profile?.last_name}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Email</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {technician?.profile?.email}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Phone</div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {technician?.profile?.phone || 'N/A'}
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

export default TechnicianDashboard;
