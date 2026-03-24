import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CheckCircle2, CircleX, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { leaveRequestService, LeaveRequestRecord, LeaveRequestStatus } from '@/services/leaveRequestService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    loadRequests();
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

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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
