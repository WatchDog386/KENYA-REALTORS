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
  Home,
  User,
  DollarSign,
  Calendar,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useManager } from '@/hooks/useManager';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ManagerMaintenance = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalCost: 0
  });

  const { getMaintenanceRequests } = useManager();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceRequests();
      setRequests(data || []);

      // Calculate stats
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const inProgress = data?.filter(r => r.status === 'in_progress' || r.status === 'assigned').length || 0;
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

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' ? { completed_date: new Date().toISOString() } : {})
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request marked as ${newStatus}`);
      fetchRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Failed to update request');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'assigned': return <Badge className="bg-blue-100 text-blue-800"><User className="w-3 h-3 mr-1" /> Assigned</Badge>;
      case 'in_progress': return <Badge className="bg-purple-100 text-purple-800"><Wrench className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D85C2C] to-[#D85C2C]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Maintenance</h1>
            <p className="text-orange-100 text-sm mt-1">Manage property maintenance requests</p>
          </div>
        </div>
        <Button className="bg-white text-[#D85C2C] hover:bg-gray-100" asChild>
          <Link to="/portal/manager/maintenance/new">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-gray-500">Awaiting action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-gray-500">Being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
        <Card>
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
                {requests.length} requests total
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search requests..." className="pl-9 w-full sm:w-64" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Link to={`/portal/manager/maintenance/${request.id}`} className="font-medium hover:text-blue-600">
                      {request.title}
                    </Link>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">{request.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>{request.property?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.tenant ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{request.tenant.first_name} {request.tenant.last_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.estimated_cost ? (
                      <span className="font-medium">{formatCurrency(request.estimated_cost)}</span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'pending' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'assigned')}>
                          Assign
                        </Button>
                      )}
                      {request.status === 'assigned' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')}>
                          Start Work
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button size="sm" onClick={() => updateStatus(request.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerMaintenance;