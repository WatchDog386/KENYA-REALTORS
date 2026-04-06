import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleX, RefreshCw, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { leaveRequestService, LeaveRequestRecord, LeaveRequestStatus } from '@/services/leaveRequestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusClasses: Record<LeaveRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};

const SuperAdminLeaveRequestsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | LeaveRequestStatus>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await leaveRequestService.getLeaveRequestsForReview();
      setRequests(data || []);
    } catch (error: any) {
      console.error('Failed to load leave requests:', error);
      setFetchError(error?.message || 'Failed to fetch leave requests');
      toast.error(error?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    if (activeFilter === 'all') return requests;
    return requests.filter((request) => request.status === activeFilter);
  }, [activeFilter, requests]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((request) => request.status === 'pending').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      rejected: requests.filter((request) => request.status === 'rejected').length,
      cancelled: requests.filter((request) => request.status === 'cancelled').length,
    };
  }, [requests]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((request) => {
      const role = String(request.requester?.role || request.role || 'unknown').toLowerCase();
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [requests]);

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(requestId);
      await leaveRequestService.reviewLeaveRequest(requestId, {
        status,
        manager_notes: status === 'approved' ? 'Approved by Super Admin dashboard' : 'Rejected by Super Admin dashboard',
        share_with_proprietor: status === 'approved',
      });
      toast.success(`Leave request ${status}`);
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    'Super Admin';

  const avatarSrc =
    user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1f6fa4&color=ffffff&bold=true&size=128`;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-[#eef2f7] p-4 md:p-6 lg:p-8 text-[#12314f]">
      <div className="rounded-xl border border-[#d4dde8] bg-[#f7f9fc] px-4 py-4 shadow-[0_4px_14px_rgba(15,39,65,0.06)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f839b]">Workspace View</div>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#0f2741]">Welcome back, <span className="text-[#1f6fa4]">{fullName.toUpperCase()}</span></h1>
            <p className="mt-1 text-sm text-[#5f7690]">
              Leave Requests dashboard now receives requests from tenants, property managers, and all other system roles.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <img
              src={avatarSrc}
              alt="Super Admin"
              className="h-20 w-20 rounded-lg border border-[#b9cde2] object-cover shadow-[0_8px_20px_rgba(15,39,65,0.16)]"
            />
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5a7390]">Super Admin</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Total Requests</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.total}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Pending</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.pending}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Approved</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.approved}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
        <div className="rounded-xl border border-[#d4dde8] bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,39,65,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(15,39,65,0.1)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f839b]">Rejected</div>
          <div className="mt-1 text-4xl font-bold text-[#0f2741]">{stats.rejected}</div>
          <div className="mt-1 text-xs text-[#6f839b]">Current snapshot</div>
        </div>
      </div>

      {fetchError && (
        <div className="flex items-center gap-2 rounded-lg border border-[#e4b4b4] bg-[#f5dddd] px-4 py-3 text-[#8f3333] shadow-[0_3px_10px_rgba(143,51,51,0.08)]">
          <AlertTriangle className="h-4 w-4" />
          <span>{fetchError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 overflow-hidden rounded-xl border border-[#d4dde8] bg-white shadow-[0_6px_18px_rgba(15,39,65,0.08)]">
          <div className="flex items-center justify-between border-b border-[#cfd8e3] bg-[#e3e9f1] px-4 py-3">
            <h2 className="text-[30px] leading-none font-bold tracking-tight text-[#102b45] md:text-[32px]">Leave Requests Dashboard</h2>
            <Button variant="outline" onClick={loadRequests}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[#d6dfeb] bg-[#f8fbff] p-4">
            {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as const).map((status) => (
              <Button
                key={status}
                variant={activeFilter === status ? 'default' : 'outline'}
                className={activeFilter === status ? 'bg-[#154279] hover:bg-[#10355f]' : ''}
                onClick={() => setActiveFilter(status)}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-10 text-center text-[#677f99]">
              <UserCircle2 className="mx-auto h-10 w-10 text-[#9cb0c6]" />
              <p className="mt-3 text-sm font-medium">No leave requests found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full text-sm">
                <thead>
                  <tr className="bg-[#e7edf5] text-[11px] uppercase tracking-[0.14em] text-[#56708c]">
                    <th className="px-4 py-3 text-left">Requester</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">Date Range</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Reason</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const requesterName =
                      `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() ||
                      request.requester?.email ||
                      'Employee';

                    return (
                      <tr key={request.id} className="border-t border-[#d5dfeb] hover:bg-[#f7fafe]">
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{requesterName}</div>
                          <div className="text-xs text-[#5d7791]">{request.requester?.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge variant="outline" className="uppercase">{request.requester?.role || request.role}</Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#12314f]">{request.property?.name || 'General'}</div>
                          <div className="text-xs text-[#5d7791]">{request.property?.location || '-'}</div>
                        </td>
                        <td className="px-4 py-3 align-top text-[#12314f]">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          <div className="text-xs text-[#5d7791]">{request.days_requested} day(s)</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge className={statusClasses[request.status]}>{request.status}</Badge>
                        </td>
                        <td className="px-4 py-3 align-top text-[#12314f] max-w-[260px]">
                          <div className="line-clamp-2">{request.reason}</div>
                          {request.manager_notes && (
                            <div className="mt-1 text-xs text-[#5d7791]">Note: {request.manager_notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {request.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() => handleReview(request.id, 'approved')}
                                disabled={processingId === request.id}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9"
                                onClick={() => handleReview(request.id, 'rejected')}
                                disabled={processingId === request.id}
                              >
                                <CircleX className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-[#5d7791]">No pending action</span>
                          )}
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
              <h3 className="text-[28px] leading-none font-bold tracking-tight text-[#102b45] md:text-[30px]">Role Breakdown</h3>
            </div>
            <div className="space-y-3 p-4">
              {roleCounts.length === 0 ? (
                <p className="text-sm text-[#5f7690]">No role data available.</p>
              ) : (
                roleCounts.map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-[#d6dfeb] bg-[#f8fbff] px-3 py-2">
                    <span className="text-sm font-medium uppercase text-[#12314f]">{role.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-[#1f6fa4]">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#d4dde8] bg-white shadow-[0_6px_18px_rgba(15,39,65,0.08)]">
            <div className="border-b border-[#cfd8e3] bg-[#e3e9f1] px-4 py-3">
              <h3 className="text-[28px] leading-none font-bold tracking-tight text-[#102b45] md:text-[30px]">Dashboard Actions</h3>
            </div>
            <div className="space-y-2 p-4">
              <Button className="w-full justify-start bg-[#154279] hover:bg-[#10355f]" onClick={() => navigate('/portal/super-admin/applications')}>
                Open Applications
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/users')}>
                Open User Management
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/properties')}>
                Open Properties
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/approvals')}>
                Open Approvals Queue
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/utilities')}>
                Open Billing & Invoicing
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/portal/super-admin/reports')}>
                Open Reports
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SuperAdminLeaveRequestsDashboard;
