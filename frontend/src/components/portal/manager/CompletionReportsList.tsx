// src/components/portal/manager/CompletionReportsList.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Eye, Calendar, User, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { maintenanceService } from '@/services/maintenanceService';
import { getCompletionReportImageUrl } from '@/utils/supabaseStorage';

interface CompletionReportsListProps {
  propertyId: string;
}

export const CompletionReportsList: React.FC<CompletionReportsListProps> = ({ propertyId }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [propertyId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await maintenanceService.getPropertyCompletionReports(propertyId);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load completion reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReport) return;

    setIsApproving(true);
    try {
      await maintenanceService.approveCompletionReport(selectedReport.id, approvalNotes);
      toast.success('Report approved successfully!');
      setIsDetailsOpen(false);
      fetchReports();
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReport) return;

    setIsApproving(true);
    try {
      await maintenanceService.rejectCompletionReport(selectedReport.id, approvalNotes);
      toast.success('Report rejected. Technician has been notified.');
      setIsDetailsOpen(false);
      fetchReports();
      setApprovalNotes('');
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pending = reports.filter(r => r.status === 'submitted');
  const approved = reports.filter(r => r.status === 'approved');
  const rejected = reports.filter(r => r.status === 'rejected');

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#154279] mb-2" />
        <p className="text-slate-500">Loading completion reports...</p>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500 font-medium">No completion reports yet</p>
        <p className="text-sm text-slate-400">Reports will appear here once technicians submit their work completion documentation.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <div className="mb-6">
          <TabsList className="grid w-full md:w-[450px] grid-cols-3">
            <TabsTrigger value="pending">
              Pending Review ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejected.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="m-0">
          <ReportsTable
            reports={pending}
            onSelectReport={(report) => {
              setSelectedReport(report);
              setIsDetailsOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="approved" className="m-0">
          <ReportsTable
            reports={approved}
            onSelectReport={(report) => {
              setSelectedReport(report);
              setIsDetailsOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="rejected" className="m-0">
          <ReportsTable
            reports={rejected}
            onSelectReport={(report) => {
              setSelectedReport(report);
              setIsDetailsOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* REPORT DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#154279]">
              Completion Report - {selectedReport?.maintenance_request?.title}
            </DialogTitle>
            <DialogDescription>
              Request ID: #{selectedReport?.maintenance_request?.id?.slice(0, 8)} •
              {getStatusBadge(selectedReport?.status)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Technician & Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Technician</span>
                </div>
                <div className="font-bold text-slate-800">
                  {selectedReport?.technician?.profile?.first_name}{' '}
                  {selectedReport?.technician?.profile?.last_name}
                </div>
              </Card>

              <Card className="p-4 border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 uppercase">Submitted</span>
                </div>
                <div className="font-bold text-slate-800">
                  {selectedReport?.submitted_at
                    ? new Date(selectedReport.submitted_at).toLocaleDateString()
                    : 'N/A'}
                </div>
              </Card>
            </div>

            {/* Work Details */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-4">Work Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="p-4 border-slate-200">
                  <div className="text-xs font-bold text-slate-600 uppercase mb-1">Hours Spent</div>
                  <div className="text-2xl font-bold text-[#154279]">
                    {selectedReport?.hours_spent || '-'}
                  </div>
                </Card>

                <Card className="p-4 border-slate-200">
                  <div className="text-xs font-bold text-slate-600 uppercase mb-1">Cost Estimate</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ${selectedReport?.cost_estimate?.toFixed(2) || '0.00'}
                  </div>
                </Card>

                <Card className="p-4 border-slate-200">
                  <div className="text-xs font-bold text-slate-600 uppercase mb-1">Actual Cost</div>
                  <div className="text-2xl font-bold text-slate-800">
                    ${selectedReport?.actual_cost?.toFixed(2) || 'Pending'}
                  </div>
                </Card>
              </div>

              {selectedReport?.materials_used && (
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Materials Used</label>
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 text-sm text-slate-700">
                    {selectedReport.materials_used}
                  </div>
                </div>
              )}

              {selectedReport?.notes && (
                <div className="mt-4">
                  <label className="text-sm font-bold text-slate-700 block mb-2">Work Notes</label>
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 text-sm text-slate-700">
                    {selectedReport.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Work Photos */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-4">Work Photos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedReport?.before_work_image_url && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Before Work</label>
                    <img
                      src={getCompletionReportImageUrl(selectedReport.before_work_image_url)}
                      alt="Before work"
                      className="w-full h-48 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                )}

                {selectedReport?.in_progress_image_url && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">During Work</label>
                    <img
                      src={getCompletionReportImageUrl(selectedReport.in_progress_image_url)}
                      alt="During work"
                      className="w-full h-48 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                )}

                {selectedReport?.after_repair_image_url && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">After Repair</label>
                    <img
                      src={getCompletionReportImageUrl(selectedReport.after_repair_image_url)}
                      alt="After repair"
                      className="w-full h-48 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Approval Section */}
            {selectedReport?.status === 'submitted' && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-bold text-slate-900 mb-4">Manager Review</h3>
                
                <Textarea
                  placeholder="Add optional notes (e.g., work quality assessment, follow-up required, etc.)"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={4}
                  className="border-slate-200"
                />
              </div>
            )}

            {/* Previous Notes */}
            {selectedReport?.manager_notes && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-xs font-bold text-blue-600 uppercase mb-2">Manager Notes</div>
                <div className="text-sm text-blue-900">{selectedReport.manager_notes}</div>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            {selectedReport?.status === 'submitted' ? (
              <>
                <Button
                  onClick={handleReject}
                  disabled={isApproving}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isApproving ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isApproving ? 'Processing...' : 'Approve'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper table component
interface ReportsTableProps {
  reports: any[];
  onSelectReport: (report: any) => void;
}

const ReportsTable: React.FC<ReportsTableProps> = ({ reports, onSelectReport }) => {
  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No reports found</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-[#154279]">Job</TableHead>
              <TableHead className="font-bold text-[#154279]">Technician</TableHead>
              <TableHead className="font-bold text-[#154279]">Submitted</TableHead>
              <TableHead className="font-bold text-[#154279]">Hours</TableHead>
              <TableHead className="font-bold text-[#154279]">Cost Estimate</TableHead>
              <TableHead className="text-right font-bold text-[#154279]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-slate-50 cursor-pointer">
                <TableCell>
                  <div className="font-bold text-slate-800">
                    {report.maintenance_request?.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    #{report.maintenance_request?.id?.slice(0, 8)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-slate-700">
                    {report.technician?.profile?.first_name} {report.technician?.profile?.last_name}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {new Date(report.submitted_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-bold text-slate-800">
                  {report.hours_spent}h
                </TableCell>
                <TableCell className="font-bold text-emerald-600">
                  ${report.cost_estimate?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectReport(report)}
                  >
                    <Eye className="w-4 h-4 text-[#154279]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
