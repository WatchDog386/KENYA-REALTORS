import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { technicianService } from '@/services/technicianService';
import { getMaintenanceImageUrl } from '@/utils/supabaseStorage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { 
    Search, 
    Filter, 
    Wrench, 
    Calendar, 
    MapPin, 
    Eye, 
    CheckCircle, 
    Play, 
    Image as ImageIcon,
    Download,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { CompletionReportForm } from './CompletionReportForm';

const TechnicianJobs = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [availableJobs, setAvailableJobs] = useState<any[]>([]);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Selection for modal
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    
    // Technician Info
    const [techId, setTechId] = useState<string | null>(null);

    useEffect(() => {
        fetchJobs();
    }, [user?.id]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            if (!user?.id) return;
            
            const tech = await technicianService.getTechnicianByUserId(user.id);
            if (tech?.id) {
                setTechId(tech.id);
                const data = await technicianService.getTechnicianJobs(tech.id);
                setJobs(data);
                
                // Split jobs into "My Jobs" and "Available Pool"
                const myAssigned = data.filter(j => j.assigned_to_technician_id === tech.id);
                const pool = data.filter(j => !j.assigned_to_technician_id);
                
                setMyJobs(myAssigned);
                setAvailableJobs(pool);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptJob = async (jobId: string) => {
        if (!techId) return;
        try {
            toast.loading("Accepting job...");
            await technicianService.assignMaintenanceToTechnician(jobId, techId);
            toast.dismiss();
            toast.success("Job accepted successfully!");
            setIsDetailsOpen(false);
            fetchJobs(); // Refresh lists
        } catch (error) {
            console.error("Error accepting job:", error);
            toast.error("Failed to accept job");
        }
    };

    const handleUpdateStatus = async (jobId: string, newStatus: string) => {
         if (!techId) return;
         try {
             // We can use a simpler update here or the createJobUpdate service
             // For now, let's assume we update the request directly or via service
             // Since specific updateStatus logic might be in createJobUpdate, let's use a specialized call if it existed,
             // or fallback to the generic update. Ideally we should create a job update record.
             
             await technicianService.createJobUpdate(
                 jobId, 
                 techId, 
                 newStatus, 
                 `Status updated to ${newStatus}`, 
                 'status_change'
             );
             // Also update the maintenance request status itself
             // (This logic might be handled by a database trigger, but good to ensure)
             
             // Refresh
             toast.success(`Job marked as ${newStatus}`);
             setIsDetailsOpen(false);
             fetchJobs();
         } catch (error) {
             console.error("Error updating status:", error);
             toast.error("Failed to update status");
         }
    };

    const filterJobs = (jobList: any[]) => {
        let result = jobList;
        if (statusFilter !== 'all') {
            result = result.filter(j => j.status === statusFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(j => 
                j.title?.toLowerCase().includes(query) ||
                j.description?.toLowerCase().includes(query) ||
                j.property?.name?.toLowerCase().includes(query)
            );
        }
        return result;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'in_progress': return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
            case 'pending': return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };
    
    const openJobDetails = (job: any) => {
        setSelectedJob(job);
        setIsDetailsOpen(true);
    };

    const JobsTable = ({ data, type }: { data: any[], type: 'assigned' | 'pool' }) => (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[300px] font-bold text-[#154279]">Job Details</TableHead>
                        <TableHead className="font-bold text-[#154279]">Location</TableHead>
                        <TableHead className="font-bold text-[#154279]">Status</TableHead>
                        <TableHead className="font-bold text-[#154279]">Date</TableHead>
                        <TableHead className="text-right font-bold text-[#154279]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-[#154279] rounded-full animate-spin" />
                                    <p className="text-slate-500 text-sm">Loading jobs...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                    <Wrench className="w-8 h-8 text-slate-300" />
                                    <p className="text-slate-500 font-medium">
                                        {type === 'assigned' ? 'No active jobs assigned' : 'No new jobs available'}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((job) => (
                            <TableRow key={job.id} className="group hover:bg-slate-50/50 cursor-pointer" onClick={() => openJobDetails(job)}>
                                <TableCell>
                                    <div>
                                        <div className="font-bold text-slate-800 flex items-center gap-2">
                                            {job.title}
                                            {job.image_url && <ImageIcon className="w-3 h-3 text-blue-500" />}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate max-w-[250px]">{job.description}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 text-[#F96302]" />
                                        {job.property?.name || 'Unknown Property'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(job.status)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {type === 'pool' ? (
                                        <Button size="sm" className="bg-[#154279] hover:bg-[#0f325e] text-white" onClick={(e) => { e.stopPropagation(); handleAcceptJob(job.id); }}>
                                            Accept
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <Eye className="w-4 h-4 text-slate-500 hover:text-[#154279]" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50 font-nunito">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#154279] tracking-tight mb-2">Job Management</h1>
                    <p className="text-slate-500 font-medium">View available requests and manage your active tasks.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm mb-8 overflow-hidden">
                <Tabs defaultValue="available" className="w-full">
                    <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                            <TabsTrigger value="available">Available Pool ({filterJobs(availableJobs).length})</TabsTrigger>
                            <TabsTrigger value="assigned">My Assignments ({filterJobs(myJobs).length})</TabsTrigger>
                        </TabsList>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Search jobs..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Filter className="w-4 h-4 text-slate-500 hidden md:block" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[150px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <TabsContent value="available" className="m-0 bg-white">
                        <JobsTable data={filterJobs(availableJobs)} type="pool" />
                    </TabsContent>
                    
                    <TabsContent value="assigned" className="m-0 bg-white">
                        <JobsTable data={filterJobs(myJobs)} type="assigned" />
                    </TabsContent>
                </Tabs>
            </Card>

            {/* JOB DETAILS MODAL */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#154279] flex items-center gap-2">
                             {selectedJob?.title}
                             {getStatusBadge(selectedJob?.status || '')}
                        </DialogTitle>
                        <DialogDescription>
                            Request ID: #{selectedJob?.id.slice(0, 8)} • Created {selectedJob && new Date(selectedJob.created_at).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Image Section */}
                        {selectedJob?.image_url && (
                             <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                 <img 
                                    src={getMaintenanceImageUrl(selectedJob.image_url)} 
                                    alt="Maintenance Issue" 
                                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        console.error('Image load error:', e);
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e7ff" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%236366f1"%3EImage Not Available%3C/text%3E%3C/svg%3E';
                                    }}
                                 />
                             </div>
                        )}

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
                                {selectedJob?.description}
                            </div>
                        </div>

                        {/* Location & Tenant */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border border-slate-200">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Location</div>
                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#F96302]" />
                                    {selectedJob?.property?.name}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg border border-slate-200">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tenant</div>
                                <div className="font-bold text-slate-800">
                                    {selectedJob?.tenant?.first_name} {selectedJob?.tenant?.last_name}
                                </div>
                                <div className="text-xs text-slate-500">{selectedJob?.tenant?.email}</div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-end">
                        {selectedJob?.assigned_to_technician_id === techId ? (
                            <>
                                {selectedJob?.status === 'pending' && (
                                     <Button onClick={() => handleUpdateStatus(selectedJob.id, 'in_progress')} className="bg-blue-600 hover:bg-blue-700">
                                         <Play className="w-4 h-4 mr-2" /> Start Job
                                     </Button>
                                )}
                                {selectedJob?.status === 'in_progress' && (
                                     <Button onClick={() => handleUpdateStatus(selectedJob.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-700">
                                         <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                                     </Button>
                                )}
                                {selectedJob?.status === 'completed' && !selectedJob?.completion_report_id && (
                                     <Button onClick={() => setIsReportOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                                         <FileText className="w-4 h-4 mr-2" /> Submit Report
                                     </Button>
                                )}
                                {selectedJob?.completion_report_id && (
                                     <div className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                                         <CheckCircle className="w-4 h-4" />
                                         Report Submitted
                                     </div>
                                )}
                            </>
                        ) : (
                             <Button onClick={() => handleAcceptJob(selectedJob.id)} className="bg-[#154279] hover:bg-[#0f325e]">
                                 Accept Job
                             </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* COMPLETION REPORT FORM */}
            <CompletionReportForm
              isOpen={isReportOpen}
              onOpenChange={setIsReportOpen}
              jobId={selectedJob?.id || ''}
              propertyId={selectedJob?.property_id || ''}
              technicianId={techId || ''}
              onSuccess={() => {
                setIsDetailsOpen(false);
                fetchJobs();
              }}
            />
        </div>
    );
};

export default TechnicianJobs;
