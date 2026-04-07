import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, CircleX, RefreshCw, Send, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { leaveRequestService, LeavePropertyOption, LeaveRequestRecord, LeaveRequestStatus } from '@/services/leaveRequestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const ManagerLeaveRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | LeaveRequestStatus>('pending');
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [shareById, setShareById] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<LeavePropertyOption[]>([]);
  const [formData, setFormData] = useState({
    property_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await leaveRequestService.getLeaveRequestsForReview();
      setRequests(data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const availableProperties = await leaveRequestService.getAssignableProperties();
      setProperties(availableProperties);

      if (!formData.property_id && availableProperties.length === 1) {
        setFormData((prev) => ({ ...prev, property_id: availableProperties[0].id }));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load properties for leave request');
    }
  };

  useEffect(() => {
    loadRequests();
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    };
  }, [requests]);

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(requestId);
      await leaveRequestService.reviewLeaveRequest(requestId, {
        status,
        manager_notes: notesById[requestId] || '',
        share_with_proprietor: shareById[requestId] || false,
      });

      toast.success(`Leave request ${status}`);
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to process leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitLeaveRequest = async (event: FormEvent) => {
    event.preventDefault();

    if (!formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error('Start date, end date and reason are required');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      await leaveRequestService.submitLeaveRequest({
        property_id: formData.property_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
      });

      setFormData((prev) => ({
        ...prev,
        start_date: '',
        end_date: '',
        reason: '',
      }));

      toast.success('Leave request submitted successfully');
      await loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 text-[#243041] md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="border border-[#bcc3cd] bg-[#eef1f4] px-4 py-4 md:px-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-[2px] w-8 bg-[#154279]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#154279]">Manager Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1f2937] md:text-4xl">
            Leave <span className="text-[#154279]">Control Center</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-[#5f6b7c]">
            Submit your own leave and review staff leave requests in one workspace.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border border-[#bcc3cd] bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Total Requests</p>
            <p className="text-3xl font-bold text-[#1f2937]">{stats.total}</p>
          </div>
          <div className="border border-[#b4c5d9] bg-[#f4f8fc] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#154279]">Pending</p>
            <p className="text-3xl font-bold text-[#154279]">{stats.pending}</p>
          </div>
          <div className="border border-[#d2e3d8] bg-[#f4fbf6] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#157347]">Approved</p>
            <p className="text-3xl font-bold text-[#157347]">{stats.approved}</p>
          </div>
          <div className="border border-[#e7c9c9] bg-[#fff7f7] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b42318]">Rejected</p>
            <p className="text-3xl font-bold text-[#b42318]">{stats.rejected}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="border border-[#bcc3cd] bg-white xl:col-span-1">
            <div className="border-b border-[#bcc3cd] bg-[#e8edf3] px-4 py-3">
              <h2 className="text-lg font-bold uppercase tracking-wide text-[#154279]">Submit Leave Request</h2>
            </div>

            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="manager-leave-property" className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">
                  Property (Optional)
                </Label>
                <select
                  id="manager-leave-property"
                  className="h-10 w-full border border-[#b9c3cf] bg-white px-3 text-sm text-[#243041]"
                  value={formData.property_id}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, property_id: event.target.value }))
                  }
                >
                  <option value="">General / Not property-specific</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}{property.location ? ` - ${property.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="manager-leave-start" className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">
                    Start Date
                  </Label>
                  <Input
                    id="manager-leave-start"
                    type="date"
                    className="h-10 rounded-none border-[#b9c3cf]"
                    value={formData.start_date}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, start_date: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manager-leave-end" className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">
                    End Date
                  </Label>
                  <Input
                    id="manager-leave-end"
                    type="date"
                    className="h-10 rounded-none border-[#b9c3cf]"
                    value={formData.end_date}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, end_date: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manager-leave-reason" className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">
                  Reason
                </Label>
                <Textarea
                  id="manager-leave-reason"
                  rows={4}
                  className="rounded-none border-[#b9c3cf] px-3 py-2"
                  value={formData.reason}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="State why you are requesting leave."
                />
              </div>

              <Button
                type="submit"
                className="h-10 w-full border-b-2 border-[#123863] bg-[#154279] font-semibold uppercase tracking-wide text-white hover:bg-[#10355f]"
                disabled={submitting}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </form>
          </section>

          <section className="border border-[#bcc3cd] bg-white xl:col-span-2">
            <div className="flex flex-col gap-3 border-b border-[#bcc3cd] bg-[#e8edf3] px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#154279]">
                  <CalendarCheck2 className="h-5 w-5 text-[#F96302]" />
                  Employee Leave Requests
                </h2>
                <p className="mt-1 text-sm text-[#5f6b7c]">
                  Review requests and decide when approved leave is visible to proprietors.
                </p>
              </div>
              <Button variant="outline" onClick={loadRequests} className="h-10 rounded-none border-[#b9c3cf] bg-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="border-b border-[#d7dde6] bg-[#f7f9fc] p-3">
              <div className="flex flex-wrap gap-2">
                {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as const).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    onClick={() => setActiveFilter(status)}
                    className={`h-9 rounded-none border px-4 font-semibold ${
                      activeFilter === status
                        ? 'border-[#154279] bg-[#154279] text-white hover:bg-[#10355f]'
                        : 'border-[#c8d1dc] bg-white text-[#4b5563] hover:bg-[#eef2f7]'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 p-3 md:p-4">
              {loading ? (
                <p className="text-sm font-medium text-[#5f6b7c]">Loading leave requests...</p>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-[#c7d0db] bg-[#f9fbfd] px-4 py-10 text-center">
                  <UserCircle2 className="h-10 w-10 text-[#94a3b8]" />
                  <p className="mt-2 text-sm font-medium text-[#5f6b7c]">No leave requests found for this filter.</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const requesterName = `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() || request.requester?.email || 'Employee';

                  return (
                    <article key={request.id} className="border border-[#d7dde6] bg-[#fbfcfe] p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b8798]">Employee</p>
                          <p className="font-semibold text-[#1f2937]">{requesterName}</p>
                          <p className="text-xs text-[#64748b]">{request.requester?.role || request.role}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b8798]">Property</p>
                          <p className="font-semibold text-[#1f2937]">{request.property?.name || 'General'}</p>
                          <p className="text-xs text-[#64748b]">{request.property?.location || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b8798]">Date Range</p>
                          <p className="font-semibold text-[#1f2937]">
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </p>
                          <p className="text-xs text-[#64748b]">{request.days_requested} day(s)</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b8798]">Status</p>
                          <Badge className={statusClasses[request.status]}>{request.status}</Badge>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7b8798]">Reason</p>
                          <p className="text-sm text-[#334155]">{request.reason}</p>
                          {request.manager_notes && (
                            <p className="mt-1 text-xs text-[#64748b]">Note: {request.manager_notes}</p>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="mt-4 space-y-3 border-t border-[#d7dde6] pt-4">
                          <div className="space-y-1.5">
                            <Label htmlFor={`notes-${request.id}`} className="text-[11px] font-semibold uppercase tracking-wide text-[#5f6b7c]">
                              Manager Notes
                            </Label>
                            <Textarea
                              id={`notes-${request.id}`}
                              rows={2}
                              className="rounded-none border-[#b9c3cf]"
                              value={notesById[request.id] || ''}
                              onChange={(event) =>
                                setNotesById((prev) => ({ ...prev, [request.id]: event.target.value }))
                              }
                              placeholder="Optional notes for employee and records"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-sm text-[#334155]">
                            <input
                              type="checkbox"
                              checked={shareById[request.id] || false}
                              onChange={(event) =>
                                setShareById((prev) => ({ ...prev, [request.id]: event.target.checked }))
                              }
                            />
                            Allow sharing this approved leave with proprietor
                          </label>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="h-9 rounded-none border-b-2 border-emerald-800 bg-emerald-600 font-semibold uppercase tracking-wide text-white hover:bg-emerald-700"
                              disabled={processingId === request.id}
                              onClick={() => handleReview(request.id, 'approved')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              className="h-9 rounded-none border-b-2 border-red-800 font-semibold uppercase tracking-wide"
                              disabled={processingId === request.id}
                              onClick={() => handleReview(request.id, 'rejected')}
                            >
                              <CircleX className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ManagerLeaveRequestsPage;
