import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Search, Loader2, CheckCircle, Clock, XCircle, Home, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createOrEnsureMoveInInvoiceForApplication } from '@/services/tenantOnboardingService';
import { getManagerAssignedPropertyIds } from '@/services/managerPropertyAssignmentService';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  applicant_id: string | null;
  property_id: string;
  unit_id: string;
  status: string;
  notes?: string;
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
  telephone_numbers?: string;
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
    unit_type_id?: string | null;
    property_unit_types?: {
      name?: string | null;
      unit_type_name?: string | null;
    } | null;
  };
}

const ManagerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sortByNewest = (items: LeaseApplication[]) => {
    return [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const autoApproveIncomingApplications = async (items: LeaseApplication[]) => {
    const appsToApprove = items.filter((app) =>
      ['pending', 'under_review'].includes(String(app.status || '').toLowerCase())
    );
    const idsToApprove = appsToApprove.map((app) => app.id);

    if (idsToApprove.length === 0) {
      return items;
    }

    const { error } = await supabase
      .from('lease_applications')
      .update({ status: 'approved' })
      .in('id', idsToApprove);

    if (error) {
      console.error('Failed to auto-approve incoming applications:', error);
      return items;
    }

    const approvedSet = new Set(idsToApprove);
    const updatedItems = items.map((app) =>
      approvedSet.has(app.id) ? { ...app, status: 'approved' } : app
    );

    for (const app of updatedItems) {
      if (String(app.status || '').toLowerCase() !== 'approved') continue;
      if (!app.property_id || !app.unit_id) continue;

      try {
        await createOrEnsureMoveInInvoiceForApplication({
          id: app.id,
          applicant_id: app.applicant_id || undefined,
          property_id: app.property_id,
          unit_id: app.unit_id,
          applicant_name: app.applicant_name,
          applicant_email: app.applicant_email,
          telephone_numbers: app.telephone_numbers,
          unit_number: app.units?.unit_number,
          unit_type_id: app.units?.unit_type_id,
          unit_type_name:
            app.units?.property_unit_types?.name ||
            app.units?.property_unit_types?.unit_type_name ||
            null,
          property_name: app.properties?.name,
        });
      } catch (invoiceError) {
        console.warn('Manager auto-approve invoice fallback failed for application:', app.id, invoiceError);
      }
    }

    return updatedItems;
  };

  const loadApplications = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const propertyIds = await getManagerAssignedPropertyIds(user.id);

      if (propertyIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch lease applications for manager properties
      const { data, error } = await supabase
        .from('lease_applications')
        .select(`
          *,
          properties:property_id (
             name,
             location
          )
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: unitsData } = await supabase
        .from('units')
        .select('id, unit_number, price, status, unit_type_id, property_unit_types:unit_type_id(name, unit_type_name)')
        .in('property_id', propertyIds);

      const applicationsWithUnits = (data || []).map(app => {
        const unit = unitsData?.find(u => u.id === app.unit_id);
        return {
          ...app,
          units: unit || null
        };
      });

      const autoApprovedApplications = await autoApproveIncomingApplications(applicationsWithUnits);
      setApplications(sortByNewest(autoApprovedApplications));
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
      let finalStatus = newStatus;

      const { error } = await supabase
        .from('lease_applications')
        .update({ status: finalStatus })
        .eq('id', applicationId);

      if (error) throw error;
      
      if (finalStatus === 'approved') {
        toast.success('Application approved. First-time invoice is generated from the Super Admin workflow.');
      } else if (finalStatus === 'under_review') {
        toast.success('Application moved to under review.');
      } else {
        toast.success(`Application marked as ${finalStatus}`);
      }

      setApplications((prev) =>
        sortByNewest(
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: finalStatus } : app
          )
        )
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      if (err.message?.includes("409") || err.code === "409" || (typeof err === 'object' && JSON.stringify(err).includes("409"))) {
        toast.error("User is already a tenant elsewhere. Cannot assign.");
      } else if (err?.code === '42501' || String(err?.message || '').toLowerCase().includes('permission') || String(err?.message || '').includes('403')) {
        toast.error('Permission denied while updating application status.');
      } else {
        toast.error(`Failed to update status: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'under_review': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredApplications = sortByNewest(applications).filter(app => {
    const searchString = searchTerm.toLowerCase();
    const profile = app.profiles || {};
    const unit = app.units || {};
      
    const searchMatch = 
      (app.applicant_name?.toLowerCase().includes(searchString)) ||
      (app.applicant_email?.toLowerCase().includes(searchString)) ||
      (profile.email?.toLowerCase().includes(searchString)) ||
      (profile.first_name?.toLowerCase().includes(searchString)) ||
      (profile.last_name?.toLowerCase().includes(searchString)) ||
      (unit.unit_number?.toLowerCase().includes(searchString));
        
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;

    return searchMatch && statusMatch;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 min-h-screen bg-gradient-to-b from-zinc-100 via-slate-50 to-stone-100/70">
      <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 md:p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Lease Applications</h1>
            </div>
            <p className="text-slate-600">Manage incoming tenant applications in newest-first order.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium">
              {stats.total} Total
            </span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
              Latest On Top
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, tone: 'text-slate-800 bg-slate-50 border-slate-200' },
          { label: 'Pending', value: stats.pending, tone: 'text-amber-800 bg-amber-50 border-amber-200' },
          { label: 'Under Review', value: stats.under_review, tone: 'text-blue-800 bg-blue-50 border-blue-200' },
          { label: 'Approved', value: stats.approved, tone: 'text-green-800 bg-green-50 border-green-200' },
          { label: 'Rejected', value: stats.rejected, tone: 'text-red-800 bg-red-50 border-red-200' },
        ].map((stat, idx) => (
          <Card key={idx} className={`border shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)] ${stat.tone}`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold leading-none">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.45)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-300 focus-visible:ring-emerald-500"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[220px] border-slate-300">
             <div className="flex items-center gap-2"> 
                <ClipboardCheck className="w-4 h-4" />
                <SelectValue placeholder="All Status" />
             </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
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
          <Card className="bg-slate-50 border-dashed border-slate-300">
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
            <Card key={app.id} className="transition-shadow border-slate-200/90 hover:shadow-[0_14px_28px_-22px_rgba(15,23,42,0.65)]">
              <CardHeader className="pb-3 border-b bg-slate-50/70">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">
                          {app.units?.unit_number ? `Unit ${app.units.unit_number}` : 'General Application'}
                       </Badge>
                       <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(app.created_at).toLocaleString('en-GB')}
                       </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      {app.applicant_name || (app.profiles ? `${app.profiles.first_name} ${app.profiles.last_name}` : "Unknown")}
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                         <div className="flex items-center gap-1.5">
                             <Mail className="w-3.5 h-3.5" />
                             {app.applicant_email || app.profiles?.email || "N/A"}
                         </div>
                         {(app.telephone_numbers || app.profiles?.phone) && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                {app.telephone_numbers || app.profiles?.phone || "N/A"}
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
                          {app.properties?.name || 'Unknown Property'}
                        </p>
                        <p className="text-sm text-slate-500 pl-5">{app.properties?.location || '-'}</p>
                    </div>

                    <div className="space-y-1">
                         <p className="text-xs font-medium text-slate-500 uppercase">Unit Details</p>
                         <p className="font-semibold text-slate-800">
                          {app.units?.unit_number || 'Not assigned'}
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
                            <SelectTrigger className="w-full border-slate-300 focus:ring-emerald-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Mark Pending</SelectItem>
                              <SelectItem value="under_review">Move to Under Review</SelectItem>
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






