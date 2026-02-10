import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Loader2, CheckCircle, Clock, XCircle, Home, MapPin, DollarSign, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LeaseApplication {
  id: string;
  applicant_id: string;
  property_id: string;
  unit_id: string;
  status: string;
  notes?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  properties?: {
    name: string;
    location: string;
  };
  units?: {
    unit_number: string;
    price: number;
    status: string;
  };
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Get manager's assigned property
      const { data: assignment, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .single();

      if (assignError) {
          // If no assignment found (PGRST116), just show empty
          if (assignError.code === 'PGRST116') {
             setApplications([]);
             setLoading(false);
             return;
          }
          throw assignError;
      }

      const propertyId = assignment.property_id;

      // Fetch lease applications for this property
      const { data, error } = await supabase
        .from('lease_applications')
        .select(`
          *,
          profiles:applicant_id (
            first_name,
            last_name,
            email,
            phone
          ),
          properties:property_id (
             name,
             location
          ),
          units:unit_id (
             unit_number,
             price,
             status
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setApplications(data || []);

    } catch (err) {
      console.error('Error loading applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from('lease_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(
        applications.map((app) =>
          app.id === applicationId 
            ? { ...app, status: newStatus } 
            : app
        )
      );

      toast.success(`Application marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredApplications = applications.filter(app => {
    const searchString = searchTerm.toLowerCase();
    const profile = app.profiles || {};
    const searchMatch = 
      (profile.email?.toLowerCase().includes(searchString)) ||
      (profile.first_name?.toLowerCase().includes(searchString)) ||
      (profile.last_name?.toLowerCase().includes(searchString));
    
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;

    return searchMatch && statusMatch;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Lease Applications</h1>
            <p className="text-slate-500">Manage incoming tenant applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, color: 'from-blue-500 to-blue-600' },
          { label: 'Pending Review', value: stats.pending, color: 'from-orange-400 to-orange-500' },
          { label: 'Approved', value: stats.approved, color: 'from-green-500 to-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-red-600' },
        ].map((stat, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${stat.color} text-white border-none shadow-md`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
             <div className="flex items-center gap-2"> 
                <ClipboardCheck className="w-4 h-4" />
                <SelectValue placeholder="All Status" />
             </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-sm mb-4">
                    <ClipboardCheck className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No applications found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    {searchTerm || filterStatus !== 'all' 
                      ? "Try adjusting your filters or search terms." 
                      : "Incoming lease applications will appear here."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                          {app.units?.unit_number ? `Unit ${app.units.unit_number}` : 'General Application'}
                       </Badge>
                       <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(app.created_at).toLocaleDateString()}
                       </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      {app.profiles?.first_name} {app.profiles?.last_name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                         <div className="flex items-center gap-1.5">
                             <Mail className="w-3.5 h-3.5" />
                             {app.profiles?.email}
                         </div>
                         {app.profiles?.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                {app.profiles?.phone}
                            </div>
                         )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                       <Badge className={`${getStatusColor(app.status)} px-3 py-1`}>
                            <div className="flex items-center gap-1.5">
                                {getStatusIcon(app.status)}
                                <span className="capitalize">{app.status}</span>
                            </div>
                       </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 uppercase">Property</p>
                        <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <Home className="w-4 h-4 text-slate-400" />
                            {app.properties?.name}
                        </p>
                        <p className="text-sm text-slate-500 pl-5">{app.properties?.location}</p>
                    </div>

                    <div className="space-y-1">
                         <p className="text-xs font-medium text-slate-500 uppercase">Unit Details</p>
                         <p className="font-semibold text-slate-800">
                            {app.units?.unit_number}
                         </p>
                         <p className="text-sm text-slate-600 font-medium">
                            {app.units?.price ? `KSh ${app.units.price.toLocaleString()}` : 'Price not set'} 
                            <span className="text-slate-400 font-normal">/mo</span>
                         </p>
                    </div>

                    <div className="pl-0 md:pl-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0">
                         <p className="text-xs font-medium text-slate-500 uppercase mb-2">Actions</p>
                         <Select
                            value={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value)}
                            disabled={updatingId === app.id}
                            >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Mark Pending</SelectItem>
                                <SelectItem value="approved">Approve Application</SelectItem>
                                <SelectItem value="rejected">Reject Application</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 {app.notes && (
                    <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100 italic">
                        " {app.notes} "
                    </div>
                 )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerApplications;
