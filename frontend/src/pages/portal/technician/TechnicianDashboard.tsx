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
  CheckCircle,
  Calendar,
  Clock,
  Camera,
  FileText,
  DollarSign,
  Upload,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroBackground } from '@/components/ui/HeroBackground';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
}

export const TechnicianDashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const [technician, setTechnician] = useState<TechnicianProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

      // 1. Get Technician Profile
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select(`
          *,
          profile:profiles!technicians_user_id_fkey(*), 
          category:technician_categories(*)
        `)
        .eq('user_id', authUser.id)
        .maybeSingle(); 

      if (techError) {
        console.error("Error fetching technician:", techError);
      }
      
      if (techData) {
        setTechnician(techData);

        // 2. Get Requests
        // Using the logic: assigned to me OR (unassigned AND my category AND my property assignment)
        
        const { data: reqData, error: reqError } = await supabase
            .from('maintenance_requests')
            .select(`
              *,
              property:properties(id, name, address),
              unit:units(unit_number),
              tenant:profiles!maintenance_requests_tenant_id_fkey(first_name, last_name, phone),
              completion_report:maintenance_completion_reports(id, status)
            `)
            .or(`assigned_to_technician_id.eq.${techData.id},and(assigned_to_technician_id.is.null,category_id.eq.${techData.category_id})`)
            .order('created_at', { ascending: false });

            if (reqError) console.error("Error fetching requests:", reqError);
            setRequests(reqData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedJob?.id}_${prefix}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('maintenance-images').upload(fileName, file);
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('maintenance-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const updateStatus = async (requestId: string, newStatus: string, additionalData: any = {}) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus, 
          assigned_to_technician_id: technician?.id,
          updated_at: new Date().toISOString(),
          ...additionalData 
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast.success(`Request updated to ${newStatus}`);
      loadTechnicianData(); 
      setIsScheduleOpen(false);
      setIsInProgressOpen(false);
      setIsCompleteOpen(false);
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedJob || !scheduleDate) return;
    await updateStatus(selectedJob.id, 'scheduled', { scheduled_date: scheduleDate });
  };

  const handleStartJob = async () => {
    if (!selectedJob) return;
    setProcessing(true);
    try {
        let startUrl = null;
        if (startImage) {
            startUrl = await uploadImage(startImage, 'start');
        }
        
        await updateStatus(selectedJob.id, 'in_progress', { 
            work_start_photo: startUrl,
            work_started_at: new Date().toISOString()
        });
        
    } catch (e: any) {
        toast.error(e.message);
        setProcessing(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!selectedJob || !technician) return;
    
    setProcessing(true);
    try {
      let afterUrl = null;
      if (afterImage) {
        afterUrl = await uploadImage(afterImage, 'after');
      }

      // 1. Create Completion Report
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

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to complete job: " + error.message);
    } finally {
      setProcessing(false);
    }
  };


  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <HeroBackground className="h-48" />
      
      <div className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                   {technician?.profile?.avatar_url ? (
                     <img src={technician.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                   ) : (
                     <Wrench className="h-8 w-8 text-primary" />
                   )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {technician?.profile?.first_name} {technician?.profile?.last_name}
                  </h1>
                  <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2">
                    <Building className="h-4 w-4" />
                    {technician?.category?.name || 'General Technician'} 
                    <span className="mx-2">•</span>
                    ID: {technician?.user_id?.slice(0, 8)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{technician?.total_jobs_completed || 0}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Jobs Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{(technician?.average_rating || 5.0).toFixed(1)}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Rating</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Active Jobs</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map(req => (
              <Card key={req.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-white border-b pb-4">
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex gap-2 mb-2">
                           <Badge className={`${getPriorityColor(req.priority)} text-white border-none`}>
                             {req.priority.toUpperCase()}
                           </Badge>
                           <Badge variant="outline" className="uppercase text-xs">{req.status.replace('_', ' ')}</Badge>
                        </div>
                        <CardTitle className="text-xl">{req.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1 truncate">
                          <MapPin className="h-3 w-3" />
                          {req.property.name}, Unit {req.unit?.unit_number || 'Common Area'}
                        </CardDescription>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-700">
                    {req.description}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(req.created_at).toLocaleDateString()}
                    </div>
                    {req.tenant && (
                        <div className="flex items-center gap-2">
                           <Phone className="h-4 w-4" />
                           Tenant: {req.tenant.first_name} ({req.tenant.phone})
                        </div>
                    )}
                    {req.scheduled_date && (
                       <div className="flex items-center gap-2 text-primary font-medium">
                         <Clock className="h-4 w-4" />
                         Scheduled: {new Date(req.scheduled_date).toLocaleString()}
                       </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t mt-2">
                    {req.status === 'pending' && (
                       <Dialog open={isScheduleOpen && selectedJob?.id === req.id} onOpenChange={(open) => {
                          setIsScheduleOpen(open);
                          if(open) setSelectedJob(req);
                       }}>
                         <DialogTrigger asChild>
                           <Button className="w-full sm:w-auto">
                            <Calendar className="mr-2 h-4 w-4" /> Accept & Schedule
                           </Button>
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
                              <Button className="w-full sm:w-auto">
                                <Activity className="mr-2 h-4 w-4" /> Start Work
                              </Button>
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
                           <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                             <CheckCircle className="mr-2 h-4 w-4" /> Complete Job
                           </Button>
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
                </CardContent>
              </Card>
            ))}
            {requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed text-gray-500">
                    <CheckCircle className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    No active maintenance requests.
                </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
             <div className="space-y-4">
               {requests.filter(r => r.status === 'completed' || r.status === 'cancelled').map(req => (
                  <Card key={req.id}>
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-medium text-lg">{req.title}</p>
                          <p className="text-sm text-gray-500">{req.property.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Completed: {new Date(req.updated_at || req.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={req.status === 'completed' ? 'default' : 'destructive'}>
                            {req.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </Badge>
                      </CardContent>
                  </Card>
               ))}
               {requests.filter(r => r.status === 'completed' || r.status === 'cancelled').length === 0 && (
                <div className="text-center py-10 text-gray-500">No completed jobs yet.</div>
               )}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
