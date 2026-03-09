import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Plus,
  Search,
  Filter,
  User,
  DollarSign,
  Calendar,
  Loader2,
  FileText,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useManager } from '@/hooks/useManager';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ManagerMaintenance = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalCost: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // We need more complex join than useManager provides, so querying supabase directly
      // But filtering by properties managed by this user.
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get properties this manager manages
      const { data: assignments } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', userData.user.id);
        
      const propertyIds = assignments?.map(a => a.property_id) || [];

      if (propertyIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
            *,
            property:properties(id, name, address),
            unit:units(unit_number),
            tenant:profiles!maintenance_requests_tenant_id_fkey(first_name, last_name, phone, avatar_url),
            technician:technicians(
              id,
              user:profiles!technicians_user_id_fkey(first_name, last_name, phone, avatar_url)
            ),
            completion_report:maintenance_completion_reports(*)
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);

      // Calculate stats
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const inProgress = data?.filter(r => r.status === 'in_progress' || r.status === 'scheduled' || r.status === 'assigned').length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const totalCost = data?.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.actual_cost || 0), 0) || 0;

      setStats({ pending, inProgress, completed, totalCost });
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-none">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">Medium</Badge>;
      case 'low': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'assigned': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none"><User className="w-3 h-3 mr-1" /> Assigned</Badge>;
      case 'scheduled': return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none"><Calendar className="w-3 h-3 mr-1" /> Scheduled</Badge>;
      case 'in_progress': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none"><Activity className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenReport = (report: any) => {
      setSelectedReport(report);
      setIsReportOpen(true);
  };

  const filteredRequests = requests.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tenant?.first_name + ' ' + r.tenant?.last_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg p-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Maintenance</h1>
            <p className="text-blue-100 text-sm mt-1">Track repairs and technician reports</p>
          </div>
        </div>
        <Button className="bg-white text-primary hover:bg-gray-100 shadow-sm" asChild>
          <Link to="/portal/manager/maintenance/new">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-gray-500">Awaiting action</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-gray-500">Active jobs</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
            <p className="text-xs text-gray-500">Completed work</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>
                {requests.length} total requests found
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                   placeholder="Search requests..." 
                   className="pl-9 w-full sm:w-64" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {filteredRequests.map(req => (
                    <div key={req.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">{req.title}</span>
                                    {getPriorityBadge(req.priority)}
                                    {getStatusBadge(req.status)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Wrench className="w-3 h-3" />
                                        Unit {req.unit?.unit_number || 'General'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                    {req.technician && (
                                        <span className="flex items-center gap-1 text-primary font-medium">
                                            <User className="w-3 h-3" />
                                            Start by: {req.technician.user.first_name} {req.technician.user.last_name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{req.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {req.status === 'completed' && req.completion_report && (
                                    <Button variant="outline" size="sm" onClick={() => handleOpenReport(req.completion_report)}>
                                        <FileText className="w-4 h-4 mr-2" /> View Report
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm">Details</Button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {filteredRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No requests found matching your search.
                    </div>
                )}
            </div>
        </CardContent>
      </Card>

      {/* Completion Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Completion Report</DialogTitle>
                  <DialogDescription>Details submitted by the technician.</DialogDescription>
              </DialogHeader>
              {selectedReport && (
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                              <p className="text-sm text-gray-500">Actual Cost</p>
                              <p className="text-xl font-bold">{formatCurrency(selectedReport.actual_cost)}</p>
                          </div>
                          <div>
                              <p className="text-sm text-gray-500">Hours Spent</p>
                              <p className="text-xl font-bold">{selectedReport.hours_spent} hrs</p>
                          </div>
                      </div>
                      
                      <div>
                          <p className="font-medium mb-1">Materials Used</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedReport.materials_used || "None listed."}</p>
                      </div>

                      <div>
                          <p className="font-medium mb-1">Technician Notes</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedReport.notes || "No notes."}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          {selectedReport.before_work_image_url && (
                              <div>
                                  <p className="font-medium mb-2 text-sm">Before</p>
                                  <img 
                                      src={selectedReport.before_work_image_url} 
                                      alt="Before Work" 
                                      className="w-full h-32 object-cover rounded-md border" 
                                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image')}
                                  />
                              </div>
                          )}
                          {selectedReport.after_repair_image_url && (
                              <div>
                                  <p className="font-medium mb-2 text-sm">After</p>
                                  <img 
                                      src={selectedReport.after_repair_image_url} 
                                      alt="After Repair" 
                                      className="w-full h-32 object-cover rounded-md border" 
                                      onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image')}
                                  />
                              </div>
                          )}
                      </div>
                  </div>
              )}
              <DialogFooter>
                  <Button onClick={() => setIsReportOpen(false)}>Close</Button>
                  {/* Could add Approve/Invoice buttons here later */}
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerMaintenance;
