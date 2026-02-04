import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Application {
  id: string;
  applicant_id: string;
  property_id: string;
  unit_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  application_date: string;
  notes?: string;
  applicant?: any;
  unit?: any;
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [propertyId, setPropertyId] = useState<string>('');

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
        .single();

      if (assignError || !assignments) {
        toast.error('No property assigned to you');
        return;
      }

      setPropertyId(assignments.property_id);

      // Fetch lease applications for this property
      const { data, error } = await supabase
        .from('lease_applications')
        .select('*, applicant:profiles(*), unit:property_unit_types(*)')
        .eq('property_id', assignments.property_id)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('lease_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application approved');
      loadApplications();
    } catch (err) {
      console.error('Error approving application:', err);
      toast.error('Failed to approve application');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('lease_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);

      if (error) throw error;
      toast.success('Application rejected');
      loadApplications();
    } catch (err) {
      console.error('Error rejecting application:', err);
      toast.error('Failed to reject application');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.applicant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Lease Applications</h1>
          </div>
          <p className="text-slate-600">Review and manage tenant lease applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Total Applications</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-slate-600 mb-2">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by applicant name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<Search size={16} className="text-slate-400" />}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-400" />
            <p className="text-slate-600 text-lg">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <div key={app.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        {app.applicant?.first_name} {app.applicant?.last_name}
                      </h3>
                      {getStatusIcon(app.status)}
                    </div>
                    <p className="text-sm text-slate-600">{app.applicant?.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600">Application Date</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(app.application_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Unit</p>
                    <p className="font-semibold text-slate-900">
                      {app.unit?.unit_number || 'Any Available'}
                    </p>
                  </div>
                  {app.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600">Notes</p>
                      <p className="text-sm text-slate-900">{app.notes}</p>
                    </div>
                  )}
                </div>

                {app.status === 'pending' || app.status === 'under_review' ? (
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(app.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle size={16} className="mr-2" />
                      Approve
                    </Button>
                    <Button onClick={() => handleReject(app.id)} variant="destructive">
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" disabled>
                    {app.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerApplications;
