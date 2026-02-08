import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Loader2, CheckCircle, Clock, XCircle, Home, MapPin, DollarSign } from 'lucide-react';
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

interface RentalApplication {
  id: string;
  user_id: string;
  application_type: string;
  property_title?: string;
  property_type?: string;
  property_location?: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  preferred_unit_type?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  occupancy_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  profiles?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      // Get manager's assigned property
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id)
        .limit(1)
        .single();

      if (assignError || !assignments) {
        toast.error('No property assigned to you');
        setApplications([]);
        return;
      }

      setPropertyId(assignments.property_id);

      // Fetch rental applications - looking for rental type that match this property's locations
      const { data: propertyData } = await supabase
        .from('properties')
        .select('name, location')
        .eq('id', assignments.property_id)
        .single();

      const { data, error } = await supabase
        .from('rental_applications')
        .select(`
          *,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `)
        .eq('application_type', 'looking_for_rental')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter applications that prefer this location
      const filtered = (data || []).filter((app: RentalApplication) => {
        if (!app.preferred_locations || app.preferred_locations.length === 0) return false;
        return app.preferred_locations.some(loc => 
          propertyData?.name?.toLowerCase().includes(loc.toLowerCase()) ||
          propertyData?.location?.toLowerCase().includes(loc.toLowerCase())
        );
      });

      setApplications(filtered);
    } catch (err) {
      console.error('Error loading applications:', err);
      toast.error('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from('rental_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(
        applications.map((app) =>
          app.id === applicationId 
            ? { ...app, status: newStatus as 'pending' | 'approved' | 'rejected' | 'under_review' } 
            : app
        )
      );

      toast.success('Application status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update application status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'under_review':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter(app => {
    const searchMatch = 
      app.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const typeMatch = filterType === 'all' || app.application_type === filterType;

    return searchMatch && statusMatch && typeMatch;
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: stats.total, color: 'from-blue-500 to-blue-600' },
          { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-yellow-600' },
          { label: 'Approved', value: stats.approved, color: 'from-green-500 to-green-600' },
          { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-red-600' },
        ].map((stat, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${stat.color} text-white`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by applicant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No applications found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <Badge variant="outline">Looking for Rental</Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {app.profiles?.first_name} {app.profiles?.last_name}
                    </CardTitle>
                    <CardDescription>
                      {app.profiles?.email} • Applied {new Date(app.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    {getStatusIcon(app.status)}
                    <span className="ml-1">{app.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Application Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {app.budget_min && app.budget_max && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600">Budget Range</p>
                          <p className="font-medium">
                            KSH {app.budget_min.toLocaleString()} - {app.budget_max.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {app.preferred_unit_type && (
                      <div className="flex items-start gap-2">
                        <Home className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-600">Unit Type</p>
                          <p className="font-medium">{app.preferred_unit_type}</p>
                        </div>
                      </div>
                    )}
                    {app.occupancy_date && (
                      <div className="text-sm">
                        <p className="text-xs text-gray-600">Occupancy Date</p>
                        <p className="font-medium">{new Date(app.occupancy_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {app.preferred_locations && app.preferred_locations.length > 0 && (
                      <div className="text-sm">
                        <p className="text-xs text-gray-600">Preferred Locations</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.preferred_locations.map((loc) => (
                            <Badge key={loc} variant="outline" className="text-xs">
                              {loc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-600 uppercase mb-2">Update Status</p>
                    <Select
                      value={app.status}
                      onValueChange={(value) => handleStatusChange(app.id, value)}
                      disabled={updatingId === app.id}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerApplications;
