import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, CircleX, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';

import { leaveRequestService, LeavePropertyOption, LeaveRequestRecord, LeaveRequestStatus } from '@/services/leaveRequestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#154279]">Submit Leave Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitLeaveRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="manager-leave-property">Property (optional)</Label>
                <select
                  id="manager-leave-property"
                  className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
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

              <div className="space-y-2">
                <Label htmlFor="manager-leave-start">Start Date</Label>
                <Input
                  id="manager-leave-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, start_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager-leave-end">End Date</Label>
                <Input
                  id="manager-leave-end"
                  type="date"
                  value={formData.end_date}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, end_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="manager-leave-reason">Reason</Label>
                <Textarea
                  id="manager-leave-reason"
                  rows={3}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                  value={formData.reason}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="State why you are requesting leave."
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="bg-[#154279] hover:bg-[#10355f]" disabled={submitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold text-[#154279] flex items-center gap-2">
                <CalendarCheck2 className="w-6 h-6 text-[#F96302]" />
                Employee Leave Requests
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Review employee leave requests and choose when approved requests are visible to proprietors.
              </p>
            </div>
            <Button variant="outline" onClick={loadRequests} className="w-fit">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as const).map((status) => (
                <Button
                  key={status}
                  variant={activeFilter === status ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(status)}
                  className={activeFilter === status ? 'bg-[#154279] hover:bg-[#10355f]' : ''}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading leave requests...</p>
            ) : filteredRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No leave requests found for this filter.</p>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const requesterName = `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() || request.requester?.email || 'Employee';

                  return (
                    <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Employee</p>
                          <p className="font-semibold text-slate-800">{requesterName}</p>
                          <p className="text-xs text-slate-500">{request.requester?.role || request.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Property</p>
                          <p className="font-semibold text-slate-800">{request.property?.name || 'General'}</p>
                          <p className="text-xs text-slate-500">{request.property?.location || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Dates</p>
                          <p className="font-semibold text-slate-800">
                            {formatDate(request.start_date)} - {formatDate(request.end_date)}
                          </p>
                          <p className="text-xs text-slate-500">{request.days_requested} day(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <Badge className={statusClasses[request.status]}>{request.status}</Badge>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500">Reason</p>
                          <p className="text-sm text-slate-700">{request.reason}</p>
                          {request.manager_notes && (
                            <p className="text-xs text-slate-600 mt-1">Note: {request.manager_notes}</p>
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                          <div>
                            <Label htmlFor={`notes-${request.id}`}>Manager Notes</Label>
                            <Textarea
                              id={`notes-${request.id}`}
                              rows={2}
                              value={notesById[request.id] || ''}
                              onChange={(event) =>
                                setNotesById((prev) => ({ ...prev, [request.id]: event.target.value }))
                              }
                              placeholder="Optional notes for employee and records"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-sm text-slate-700">
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
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={processingId === request.id}
                              onClick={() => handleReview(request.id, 'approved')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={processingId === request.id}
                              onClick={() => handleReview(request.id, 'rejected')}
                            >
                              <CircleX className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerLeaveRequestsPage;
