// src/components/portal/accounting/CompletionReportsCostApproval.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { maintenanceService } from '@/services/maintenanceService';
import { getCompletionReportImageUrl } from '@/utils/supabaseStorage';

export const CompletionReportsCostApproval: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actualCost, setActualCost] = useState('');
  const [costNotes, setCostNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    fetchApprovedReports();
  }, []);

  const fetchApprovedReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_completion_reports')
        .select(`
          *,
          technician:technicians(id, profile:profiles(id, first_name, last_name, email, phone)),
          property:properties(id, name, location),
          maintenance_request:maintenance_requests(id, title, description, priority, status)
        `)
        .eq('status', 'approved')
        .is('cost_approved_at', null)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load pending cost approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCost = async () => {
    if (!selectedReport || !actualCost) {
      toast.error('Please enter the actual cost');
      return;
    }
    setIsApproving(true);
    try {
      await maintenanceService.approveCostReport(selectedReport.id, parseFloat(actualCost), costNotes);
      toast.success('Cost approved successfully!');
      setIsDetailsOpen(false);
      fetchApprovedReports();
      setActualCost('');
      setCostNotes('');
    } catch (error) {
      console.error('Error approving cost:', error);
      toast.error('Failed to approve cost');
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#154279] mb-2" />
        <p className="text-slate-500">Loading pending approvals...</p>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">No pending cost approvals</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-[#154279]">Property</TableHead>
                <TableHead className="font-bold text-[#154279]">Job</TableHead>
                <TableHead className="font-bold text-[#154279]">Technician</TableHead>
                <TableHead className="font-bold text-[#154279]">Est. Cost</TableHead>
                <TableHead className="text-right font-bold text-[#154279]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-800">{report.property?.name}</TableCell>
                  <TableCell className="text-sm text-slate-700">{report.maintenance_request?.title}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {report.technician?.profile?.first_name} {report.technician?.profile?.last_name}
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600">${report.cost_estimate?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setActualCost(report.cost_estimate?.toString() || '');
                        setIsDetailsOpen(true);
                      }}
                      className="bg-[#154279] hover:bg-[#0f325e]"
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#154279]">
              Cost Approval - {selectedReport?.maintenance_request?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Enter verified actual cost"
              min="0"
              step="0.01"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              className="border-slate-200"
            />
            <Textarea
              placeholder="Add cost approval notes..."
              value={costNotes}
              onChange={(e) => setCostNotes(e.target.value)}
              rows={3}
              className="border-slate-200"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApproveCost}
              disabled={isApproving || !actualCost}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Approve Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
