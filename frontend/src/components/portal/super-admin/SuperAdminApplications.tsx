import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, ClipboardCheck, Loader2, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  applicant_name?: string | null;
  applicant_email?: string | null;
  telephone_numbers?: string | null;
  property_id: string;
  unit_id: string;
  status: string;
  notes?: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  properties?: {
    name?: string;
    location?: string;
  };
  units?: {
    unit_number?: string;
    price?: number;
    status?: string;
  };
}

type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

const statusClassName: Record<ApplicationStatus, string> = {
  pending: 'border-[#3aa8c6] bg-[#ddf4fb] text-[#11627a]',
  under_review: 'border-[#f1c451] bg-[#fff4cf] text-[#8b6807]',
  approved: 'border-[#4ebf74] bg-[#dcf5e3] text-[#186437]',
  rejected: 'border-[#e47a7a] bg-[#fae2e2] text-[#8f2f2f]',
};

const statusLabel: Record<ApplicationStatus, string> = {
  pending: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const statusStageLabel: Record<ApplicationStatus, string> = {
  pending: 'Awaiting Review',
  under_review: 'Manager/QA Review',
  approved: 'Ready for Move-In',
  rejected: 'Closed',
};

const getStatusKey = (status?: string): ApplicationStatus => {
  if (status === 'approved' || status === 'rejected' || status === 'under_review') {
    return status;
  }
  return 'pending';
};

const SuperAdminApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<LeaseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draftStatusById, setDraftStatusById] = useState<Record<string, ApplicationStatus>>({});

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const loadApplications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setFetchError(null);

      const { data, error } = await supabase
        .from('lease_applications')
        .select(`
          *,
          properties:property_id (
            name,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: unitsData } = await supabase
        .from('units')
        .select('id, unit_number, price, status');

      const applicationsWithUnits = (data || []).map((app: any) => {
        const unit = (unitsData || []).find((u: any) => u.id === app.unit_id);
        return {
          ...app,
          units: unit || null,
        };
      });

      setApplications(applicationsWithUnits);
      setDraftStatusById(
        applicationsWithUnits.reduce((acc: Record<string, ApplicationStatus>, app: LeaseApplication) => {
          acc[app.id] = getStatusKey(app.status);
          return acc;
        }, {})
      );
    } catch (err) {
      console.error('Error loading applications:', err);
      setFetchError('Failed to fetch application data from the server.');
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    setUpdatingId(id);
    try {
      const { data, error } = await supabase
        .from('lease_applications')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Deletion failed: Permission denied or record not found.');
        return;
      }

      setApplications((prev) => prev.filter((item) => item.id !== id));
      toast.success('Application deleted successfully');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error(`Failed to delete application: ${error?.message || 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from('lease_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      if (newStatus === 'approved') {
        const app = applications.find((item) => item.id === applicationId);
        if (app && app.applicant_id && app.unit_id && app.property_id) {
          const now = new Date().toISOString();

          const { data: existingTenant, error: checkError } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', app.applicant_id)
            .limit(1)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(`Database check failed: ${checkError.message}`);
          }

          if (existingTenant) {
            const { error: updateError } = await supabase
              .from('tenants')
              .update({
                property_id: app.property_id,
                unit_id: app.unit_id,
                move_in_date: now,
                status: 'active',
              })
              .eq('user_id', app.applicant_id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('tenants')
              .insert({
                user_id: app.applicant_id,
                property_id: app.property_id,
                unit_id: app.unit_id,
                move_in_date: now,
                status: 'active',
              });

            if (insertError) throw insertError;
          }

          const rentAmount = Number(app.units?.price || 0);
          const { error: leaseError } = await supabase
            .from('tenant_leases')
            .insert({
              unit_id: app.unit_id,
              tenant_id: app.applicant_id,
              start_date: now,
              rent_amount: rentAmount,
              status: 'active',
            });

          if (leaseError) throw leaseError;

          const { error: unitError } = await supabase
            .from('units')
            .update({ status: 'occupied' })
            .eq('id', app.unit_id);

          if (unitError) throw unitError;

          toast.success('Application approved and tenant assigned to the unit');
        } else {
          toast.error('Application data missing. Tenant could not be auto-assigned.');
        }
      } else {
        toast.success(`Application marked as ${newStatus}`);
      }

      setApplications((prev) =>
        prev.map((item) =>
          item.id === applicationId
            ? { ...item, status: newStatus }
            : item
        )
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      if (
        err?.message?.includes('409') ||
        err?.code === '409' ||
        (typeof err === 'object' && JSON.stringify(err).includes('409'))
      ) {
        toast.error('User is already a tenant elsewhere. Cannot assign.');
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const resolveApplicantName = (app: LeaseApplication) => {
    const profileName = `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.trim();
    return app.applicant_name || profileName || 'Applicant';
  };

  const resolveApplicantEmail = (app: LeaseApplication) => {
    return app.applicant_email || app.profiles?.email || 'N/A';
  };

  const resolveReference = (app: LeaseApplication) => `APP-${String(app.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const searchString = searchTerm.toLowerCase();
      const applicantName = resolveApplicantName(app).toLowerCase();
      const applicantEmail = resolveApplicantEmail(app).toLowerCase();
      const unitNumber = String(app.units?.unit_number || '').toLowerCase();
      const propertyName = String(app.properties?.name || '').toLowerCase();

      const searchMatch =
        applicantName.includes(searchString) ||
        applicantEmail.includes(searchString) ||
        unitNumber.includes(searchString) ||
        propertyName.includes(searchString);

      const statusMatch = filterStatus === 'all' || app.status === filterStatus;
      return searchMatch && statusMatch;
    });
  }, [applications, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => getStatusKey(item.status) === 'pending').length,
      underReview: applications.filter((item) => getStatusKey(item.status) === 'under_review').length,
      approved: applications.filter((item) => getStatusKey(item.status) === 'approved').length,
      rejected: applications.filter((item) => getStatusKey(item.status) === 'rejected').length,
    };
  }, [applications]);

  const propertyPipeline = useMemo(() => {
    const map = new Map<string, { property: string; total: number; pending: number; approved: number }>();

    filteredApplications.forEach((item) => {
      const property = item.properties?.name || 'Unassigned Property';
      const current = map.get(property) || { property, total: 0, pending: 0, approved: 0 };
      current.total += 1;
      if (getStatusKey(item.status) === 'pending' || getStatusKey(item.status) === 'under_review') current.pending += 1;
      if (getStatusKey(item.status) === 'approved') current.approved += 1;
      map.set(property, current);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filteredApplications]);

  const needsAction = stats.pending + stats.underReview;
  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  const handleDraftChange = (applicationId: string, status: string) => {
    setDraftStatusById((prev) => ({
      ...prev,
      [applicationId]: getStatusKey(status),
    }));
  };

  const handleApplyStatus = async (application: LeaseApplication) => {
    const nextStatus = draftStatusById[application.id] || getStatusKey(application.status);
    if (nextStatus === application.status) {
      toast.info('No status change to apply');
      return;
    }
    await handleStatusChange(application.id, nextStatus);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-[#eef2f7] p-4 md:p-6 lg:p-8 text-[#12314f]">
      <div className="rounded-xl border border-[#d4dde8] bg-[#f7f9fc] px-4 py-4 shadow-[0_4px_14px_rgba(15,39,65,0.06)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f839b]">Workspace View</div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0f2741]">Kenya Realtors Applications</h1>
            <p className="mt-1 text-sm text-[#5f7690]">Live tenant application pipeline with real property, unit, and applicant records.</p>
          </div>
          <Badge className="border border-[#2a6ea1] bg-[#1f6fa4] text-white uppercase tracking-wider">Super Admin</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Incoming Applications</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.total}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Approved</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.approved}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Under Review</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.underReview}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Rejected</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.rejected}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#26a8ae] bg-[#26a8ae] px-4 py-3 text-white shadow-[0_6px_16px_rgba(38,168,174,0.3)] transition-all duration-200 hover:-translate-y-[1px]">
          <div className="text-4xl font-black">{needsAction}</div>
          <div className="text-lg font-semibold">Needs Action</div>
          <div className="mt-2 text-xs uppercase tracking-[0.12em] text-white/85">Live team view</div>
        </div>
        <div className="rounded-xl border border-[#2eaa52] bg-[#2eaa52] px-4 py-3 text-white shadow-[0_6px_16px_rgba(46,170,82,0.3)] transition-all duration-200 hover:-translate-y-[1px]">
          <div className="text-4xl font-black">{approvalRate}%</div>
          <div className="text-lg font-semibold">Approval Rate</div>
          <div className="mt-2 text-xs uppercase tracking-[0.12em] text-white/85">Live team view</div>
        </div>
        <div className="rounded-xl border border-[#e8b232] bg-[#e8b232] px-4 py-3 text-[#3d2d05] shadow-[0_6px_16px_rgba(232,178,50,0.28)] transition-all duration-200 hover:-translate-y-[1px]">
          <div className="text-4xl font-black">{stats.pending}</div>
          <div className="text-lg font-semibold">Submitted</div>
          <div className="mt-2 text-xs uppercase tracking-[0.12em] text-[#665211]">Live team view</div>
        </div>
        <div className="rounded-xl border border-[#de435c] bg-[#de435c] px-4 py-3 text-white shadow-[0_6px_16px_rgba(222,67,92,0.28)] transition-all duration-200 hover:-translate-y-[1px]">
          <div className="text-4xl font-black">{propertyPipeline.length}</div>
          <div className="text-lg font-semibold">Active Properties</div>
          <div className="mt-2 text-xs uppercase tracking-[0.12em] text-white/85">Live team view</div>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#e4b4b4] bg-[#f5dddd] px-4 py-3 text-[#8f3333] shadow-[0_3px_10px_rgba(143,51,51,0.08)]">
          <AlertTriangle className="h-4 w-4" />
          <span>{fetchError}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-[#d4dde8] bg-white p-4 shadow-[0_4px_14px_rgba(15,39,65,0.06)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by applicant, email, property, or unit"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[220px]">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 overflow-hidden rounded-xl border border-[#d4dde8] bg-white shadow-[0_6px_18px_rgba(15,39,65,0.08)]">
          <div className="flex items-center justify-between border-b border-[#cfd8e3] bg-[#e3e9f1] px-4 py-3">
            <h2 className="text-[30px] leading-none font-bold tracking-tight text-[#102b45] md:text-[32px]">Application Console</h2>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a7390]">
              {filteredApplications.length} Request(s)
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-10 text-center text-[#677f99]">
              <ClipboardCheck className="mx-auto h-10 w-10 text-[#9cb0c6]" />
              <p className="mt-3 text-sm font-medium">No applications found for the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-sm">
                <thead>
                  <tr className="bg-[#e7edf5] text-[11px] uppercase tracking-[0.14em] text-[#56708c]">
                    <th className="px-4 py-3 text-left">Request</th>
                    <th className="px-4 py-3 text-left">Applicant</th>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Update</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => {
                    const statusKey = getStatusKey(application.status);
                    const draftStatus = draftStatusById[application.id] || statusKey;

                    return (
                      <tr key={application.id} className="border-t border-[#d5dfeb] hover:bg-[#f7fafe]">
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{resolveReference(application)}</div>
                          <div className="text-xs text-[#5d7791]">
                            {new Date(application.created_at).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{resolveApplicantName(application)}</div>
                          <div className="text-xs text-[#5d7791]">{resolveApplicantEmail(application)}</div>
                          {(application.telephone_numbers || application.profiles?.phone) && (
                            <div className="text-xs text-[#5d7791]">{application.telephone_numbers || application.profiles?.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{application.properties?.name || 'Unassigned Property'}</div>
                          <div className="text-xs text-[#5d7791]">{application.properties?.location || '-'}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{application.units?.unit_number || '-'}</div>
                          <div className="text-xs text-[#5d7791]">
                            {application.units?.price ? `KES ${Number(application.units.price).toLocaleString()}/mo` : 'Rate not set'}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge className={`border ${statusClassName[statusKey]}`}>{statusLabel[statusKey]}</Badge>
                        </td>
                        <td className="px-4 py-3 align-top text-[#12314f]">{statusStageLabel[statusKey]}</td>
                        <td className="px-4 py-3 align-top">
                          <Select
                            value={draftStatus}
                            onValueChange={(value) => handleDraftChange(application.id, value)}
                            disabled={updatingId === application.id}
                          >
                            <SelectTrigger className="h-9 border-[#c9d7e6] bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Submitted</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-9 bg-[#4daec8] text-white hover:bg-[#2e8eaa]"
                              onClick={() => handleApplyStatus(application)}
                              disabled={updatingId === application.id}
                            >
                              Apply
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handleDelete(application.id)}
                              disabled={updatingId === application.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[#d4dde8] bg-white shadow-[0_6px_18px_rgba(15,39,65,0.08)]">
            <div className="border-b border-[#cfd8e3] bg-[#e3e9f1] px-4 py-3">
              <h3 className="text-[28px] leading-none font-bold tracking-tight text-[#102b45] md:text-[30px]">Property Pipeline</h3>
            </div>
            <div className="space-y-4 p-4">
              {propertyPipeline.length === 0 ? (
                <p className="text-sm text-[#5f7690]">No property application data available.</p>
              ) : (
                propertyPipeline.map((item) => {
                  const ratio = item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0;
                  return (
                    <div key={item.property}>
                      <div className="flex items-center justify-between text-sm text-[#12314f]">
                        <span className="font-medium">{item.property}</span>
                        <span className="text-[#597591]">{item.total} total</span>
                      </div>
                      <div className="mt-1 h-3 bg-[#d7e0eb]">
                        <div className="h-3 bg-[#2d90c6]" style={{ width: `${ratio}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-[#5f7690]">Pending: {item.pending} | Approved: {item.approved}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#d4dde8] bg-white shadow-[0_6px_18px_rgba(15,39,65,0.08)]">
            <div className="border-b border-[#cfd8e3] bg-[#e3e9f1] px-4 py-3">
              <h3 className="text-[28px] leading-none font-bold tracking-tight text-[#102b45] md:text-[30px]">Quick Actions</h3>
            </div>
            <div className="space-y-2 p-4">
              <Button className="w-full justify-start bg-[#154279] hover:bg-[#10355f]" onClick={() => navigate('/portal/super-admin/properties')}>
                <Building2 className="mr-2 h-4 w-4" /> Open Properties
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/approvals')}>
                <ClipboardCheck className="mr-2 h-4 w-4" /> Open Approval Queue
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/leave-requests')}>
                Open Leave Dashboard
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SuperAdminApplications;
