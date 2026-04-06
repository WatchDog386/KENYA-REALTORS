import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Send } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import {
  leaveRequestService,
  LeavePropertyOption,
  LeaveRequestRecord,
  LeaveRequestStatus,
} from '@/services/leaveRequestService';
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

const LeaveRequestsPage = () => {
  const { user, getUserRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<LeavePropertyOption[]>([]);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [formData, setFormData] = useState({
    property_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const roleLabel = useMemo(() => {
    const role = getUserRole();
    if (role === 'property_manager') return 'Manager';
    if (role === 'technician') return 'Technician';
    if (role === 'caretaker') return 'Caretaker';
    if (role === 'accountant') return 'Accountant';
    if (role === 'supplier') return 'Supplier';
    return 'Employee';
  }, [getUserRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [availableProperties, myRequests] = await Promise.all([
        leaveRequestService.getAssignableProperties(),
        leaveRequestService.getMyLeaveRequests(),
      ]);

      setProperties(availableProperties);
      setRequests(myRequests);

      if (!formData.property_id && availableProperties.length === 1) {
        setFormData((prev) => ({ ...prev, property_id: availableProperties[0].id }));
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load leave request data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent) => {
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

      setFormData({
        property_id: formData.property_id,
        start_date: '',
        end_date: '',
        reason: '',
      });

      toast.success('Leave request submitted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-[#154279] flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-[#F96302]" />
              Leave Requests
            </CardTitle>
            <p className="text-sm text-slate-600">
              Submit and track leave as {roleLabel.toLowerCase()}. Requests are recorded for you and your manager,
              and may be shared with proprietors when management allows it.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="leave-property">Property (optional)</Label>
                <select
                  id="leave-property"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                <Label htmlFor="leave-start">Start Date</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, start_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave-end">End Date</Label>
                <Input
                  id="leave-end"
                  type="date"
                  value={formData.end_date}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, end_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="leave-reason">Reason</Label>
                <Textarea
                  id="leave-reason"
                  rows={4}
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
          <CardHeader>
            <CardTitle className="text-xl text-[#154279] flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-[#F96302]" />
              Request History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading leave requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-500">No leave requests submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-12 gap-3"
                  >
                    <div className="md:col-span-3">
                      <p className="text-xs text-slate-500">Date Range</p>
                      <p className="font-semibold text-slate-800">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-500">Days</p>
                      <p className="font-semibold text-slate-800">{request.days_requested}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge className={statusClasses[request.status]}>{request.status}</Badge>
                    </div>
                    <div className="md:col-span-5">
                      <p className="text-xs text-slate-500">Reason</p>
                      <p className="text-sm text-slate-700">{request.reason}</p>
                      {request.manager_notes && (
                        <p className="text-xs text-slate-600 mt-1">
                          Manager note: {request.manager_notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveRequestsPage;
