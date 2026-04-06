import { useEffect, useMemo, useState } from 'react';
import { Loader2, Package, FileText, Clock3, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supplierService, SupplierProcurementRow } from '@/services/supplierService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'accountant_approved':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'supplier_submitted':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'submitted':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SupplierProcurementRow[]>([]);
  const [fullName, setFullName] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SupplierProcurementRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceAmount, setSupplierInvoiceAmount] = useState('');
  const [supplierInvoiceNotes, setSupplierInvoiceNotes] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const identityEmail = profile?.email || user.email || '';
      const identityName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      setFullName(identityName || 'Supplier');

      const supplierRows = await supplierService.getSupplierProcurements({
        email: identityEmail,
        fullName: identityName,
      });

      setRows(supplierRows);
    } catch (error: any) {
      console.error('Error loading supplier dashboard:', error);
      toast.error(error?.message || 'Failed to load supplier dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const awaitingInvoice = rows.filter((row) => row.status === 'submitted').length;
    const awaitingPayment = rows.filter((row) => ['supplier_submitted', 'accountant_approved'].includes(row.status)).length;
    const paidRows = rows.filter((row) => row.status === 'paid');
    const paidAmount = paidRows.reduce(
      (sum, row) => sum + Number(row.paid_amount || row.actual_cost || row.cost_estimate || 0),
      0
    );

    return {
      totalLpo: rows.length,
      awaitingInvoice,
      awaitingPayment,
      paidCount: paidRows.length,
      paidAmount,
    };
  }, [rows]);

  const openSubmitDialog = (row: SupplierProcurementRow) => {
    setSelectedRow(row);
    setSupplierInvoiceNumber(row.supplier_invoice_number || row.invoice_number || '');
    setSupplierInvoiceAmount(String(row.supplier_invoice_amount || row.actual_cost || row.cost_estimate || ''));
    setSupplierInvoiceNotes(row.supplier_invoice_notes || '');
    setInvoiceImage(null);
    setDialogOpen(true);
  };

  const submitInvoice = async () => {
    if (!selectedRow) return;
    if (!supplierInvoiceNumber.trim()) {
      toast.error('Supplier invoice number is required');
      return;
    }

    const invoiceAmount = Number(supplierInvoiceAmount || 0);
    if (!invoiceAmount || invoiceAmount <= 0) {
      toast.error('Invoice amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);

      let imageUrl: string | null = null;
      if (invoiceImage) {
        const ext = invoiceImage.name.split('.').pop();
        const fileName = `supplier-invoices/${selectedRow.property_id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('property_images')
          .upload(fileName, invoiceImage);

        if (!uploadError) {
          const { data } = supabase.storage.from('property_images').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      await supplierService.submitSupplierInvoice({
        reportId: selectedRow.id,
        supplierInvoiceNumber: supplierInvoiceNumber.trim(),
        supplierInvoiceAmount: invoiceAmount,
        supplierInvoiceNotes: supplierInvoiceNotes.trim() || undefined,
        supplierInvoiceImageUrl: imageUrl,
      });

      toast.success('Supplier invoice submitted to accountant workflow');
      setDialogOpen(false);
      setSelectedRow(null);
      await loadData();
    } catch (error: any) {
      console.error('Error submitting supplier invoice:', error);
      const message = String(error?.message || 'Failed to submit supplier invoice');
      if (message.toLowerCase().includes('supplier_invoice_number')) {
        toast.error('Database migration required: supplier invoice columns are missing.');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#154279]">Supplier Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome, {fullName}. Manage LPO requests, submit supplier invoices, and track payments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total LPOs</CardDescription>
            <CardTitle className="text-2xl">{stats.totalLpo}</CardTitle>
          </CardHeader>
          <CardContent>
            <Package className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Invoice</CardDescription>
            <CardTitle className="text-2xl">{stats.awaitingInvoice}</CardTitle>
          </CardHeader>
          <CardContent>
            <FileText className="h-5 w-5 text-indigo-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Payment</CardDescription>
            <CardTitle className="text-2xl">{stats.awaitingPayment}</CardTitle>
          </CardHeader>
          <CardContent>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid Requests</CardDescription>
            <CardTitle className="text-2xl">{stats.paidCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl">KES {stats.paidAmount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-slate-500">Receipted supplier payouts</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LPO and Invoice Queue</CardTitle>
          <CardDescription>
            Supplier actions are linked to technician LPO reports and accountant approval/payment processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No supplier-linked LPO records found for your account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LPO</TableHead>
                    <TableHead>Property / Request</TableHead>
                    <TableHead>Supplier Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.lpo_number || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.property?.name || '-'}</div>
                        <div className="text-xs text-slate-500">{row.maintenance_request?.title || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{row.supplier_invoice_number || row.invoice_number || '-'}</div>
                        <div className="text-xs text-slate-500">
                          {row.supplier_submitted_at
                            ? `Submitted ${new Date(row.supplier_submitted_at).toLocaleDateString()}`
                            : 'Not submitted'}
                        </div>
                      </TableCell>
                      <TableCell>
                        KES {Number(row.supplier_invoice_amount || row.actual_cost || row.cost_estimate || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(row.status)}>
                          {row.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {['submitted'].includes(row.status) ? (
                          <Button size="sm" onClick={() => openSubmitDialog(row)}>
                            <Upload className="mr-1 h-4 w-4" /> Submit Invoice
                          </Button>
                        ) : row.status === 'supplier_submitted' ? (
                          <span className="text-xs font-semibold text-indigo-700">Awaiting Accountant</span>
                        ) : row.status === 'accountant_approved' ? (
                          <span className="text-xs font-semibold text-blue-700">Approved, awaiting payment</span>
                        ) : row.status === 'paid' ? (
                          <span className="text-xs font-semibold text-emerald-700">Paid</span>
                        ) : (
                          <span className="text-xs text-slate-500">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Supplier Invoice</DialogTitle>
            <DialogDescription>
              Provide your invoice details so the accountant can approve and process payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceNumber">Invoice Number</Label>
              <Input
                id="supplierInvoiceNumber"
                value={supplierInvoiceNumber}
                onChange={(event) => setSupplierInvoiceNumber(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceAmount">Invoice Amount (KES)</Label>
              <Input
                id="supplierInvoiceAmount"
                type="number"
                min="0"
                value={supplierInvoiceAmount}
                onChange={(event) => setSupplierInvoiceAmount(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceNotes">Invoice Notes</Label>
              <Textarea
                id="supplierInvoiceNotes"
                rows={3}
                value={supplierInvoiceNotes}
                onChange={(event) => setSupplierInvoiceNotes(event.target.value)}
                placeholder="Describe supplied items and quantities"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceImage">Invoice / Item Photo (Optional)</Label>
              <Input
                id="supplierInvoiceImage"
                type="file"
                accept="image/*"
                onChange={(event) => setInvoiceImage(event.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitInvoice} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierDashboard;
