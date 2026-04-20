import { useEffect, useMemo, useState } from 'react';
import { Loader2, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supplierService, SupplierProcurementRow } from '@/services/supplierService';
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
      return 'border-[#5db77b] bg-[#e5f8eb] text-[#1f5f35]';
    case 'accountant_approved':
      return 'border-[#72a8e5] bg-[#e8f2ff] text-[#184f8f]';
    case 'supplier_submitted':
      return 'border-[#9d88e0] bg-[#efeaff] text-[#3f2a80]';
    case 'submitted':
      return 'border-[#9aa5b5] bg-[#edf1f6] text-[#2f3f55]';
    default:
      return 'border-[#e0a838] bg-[#fff4d8] text-[#6b4c05]';
  }
};

const formatStatusLabel = (status: string) =>
  String(status || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<SupplierProcurementRow[]>([]);
  const [fullName, setFullName] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SupplierProcurementRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceAmount, setSupplierInvoiceAmount] = useState('');
  const [supplierInvoiceNotes, setSupplierInvoiceNotes] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null);

  const loadData = async (opts?: { silent?: boolean }) => {
    if (!user?.id) return;

    try {
      if (!opts?.silent) {
        setLoading(true);
      }

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
      if (!opts?.silent) {
        setLoading(false);
      }
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

  const statTiles = [
    {
      title: 'Total LPOs',
      value: stats.totalLpo.toLocaleString(),
      bg: 'bg-[#2aa8bf]',
      footer: 'bg-[#1f93a8]',
      subtitle: 'Assigned requests',
    },
    {
      title: 'Awaiting Invoice',
      value: stats.awaitingInvoice.toLocaleString(),
      bg: 'bg-[#6a4acb]',
      footer: 'bg-[#563ca8]',
      subtitle: 'Action required',
    },
    {
      title: 'Awaiting Payment',
      value: stats.awaitingPayment.toLocaleString(),
      bg: 'bg-[#f3bd11]',
      footer: 'bg-[#d6a409]',
      subtitle: 'With accountant',
    },
    {
      title: 'Paid Requests',
      value: stats.paidCount.toLocaleString(),
      bg: 'bg-[#2dae49]',
      footer: 'bg-[#24933d]',
      subtitle: 'Completed payouts',
    },
    {
      title: 'Total Paid',
      value: `KES ${stats.paidAmount.toLocaleString()}`,
      bg: 'bg-[#dc3545]',
      footer: 'bg-[#c12c3a]',
      subtitle: 'Receipted amount',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData({ silent: true });
    setRefreshing(false);
    toast.success('Supplier dashboard refreshed');
  };

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
      await loadData({ silent: true });
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
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#2f3d51]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading supplier dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 font-['Poppins','Segoe_UI',sans-serif] text-[#243041] md:p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#bcc3cd] pb-4">
        <div>
          <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">Supplier Dashboard</h1>
          <p className="mt-1 text-[13px] text-[#5f6b7c]">
            Welcome, {fullName}. Manage LPO requests, submit invoices, and track payment progress.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[#9aa4b1] bg-[#eef1f4] px-3 text-[11px] font-semibold uppercase tracking-wide text-[#334155] transition-colors hover:bg-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {statTiles.map((tile) => (
          <div key={tile.title} className="flex flex-col justify-between rounded-none border border-[#adb5bf] shadow-sm">
            <div className={`${tile.bg} flex h-[132px] w-full flex-col justify-center px-4`}>
              <div className="text-[30px] font-bold leading-tight text-[#111827]">{tile.value}</div>
              <p className="mt-1 text-[22px] font-semibold leading-none text-[#111827]">{tile.title}</p>
            </div>
            <div className={`${tile.footer} flex h-8 w-full items-center justify-center text-[12px] font-semibold text-[#111827]`}>
              {tile.subtitle}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-none border border-[#bcc3cd] bg-white shadow-sm">
        <div className="border-b border-[#c4cad3] px-4 py-3">
          <h2 className="text-[26px] font-bold leading-none text-[#263143]">LPO and Invoice Queue</h2>
          <p className="mt-1 text-[12px] text-[#5f6b7c]">
            Supplier actions are linked to technician LPO reports and accountant approval and payment processing.
          </p>
        </div>

        <div className="p-4">
          {rows.length === 0 ? (
            <div className="border border-[#d2d8e0] bg-[#eef1f4] px-3 py-8 text-center text-[13px] font-medium text-[#5f6b7c]">
              No supplier-linked LPO records found for your account.
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#c8ced7] bg-[#f6f8fa]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#e7ebf0]">
                    <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wide text-[#334155]">LPO</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#334155]">Property / Request</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#334155]">Supplier Invoice</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#334155]">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-[#334155]">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-[#334155]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="border-[#d6dde6] hover:bg-[#edf1f6]">
                      <TableCell className="font-semibold text-[#1f2937]">{row.lpo_number || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium text-[#1f2937]">{row.property?.name || '-'}</div>
                        <div className="text-xs text-[#5f6b7c]">{row.maintenance_request?.title || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[#1f2937]">{row.supplier_invoice_number || row.invoice_number || '-'}</div>
                        <div className="text-xs text-[#5f6b7c]">
                          {row.supplier_submitted_at
                            ? `Submitted ${new Date(row.supplier_submitted_at).toLocaleDateString()}`
                            : 'Not submitted'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#263143]">
                          KES {Number(row.supplier_invoice_amount || row.actual_cost || row.cost_estimate || 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(row.status)}>
                          {formatStatusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {['submitted'].includes(row.status) ? (
                          <Button
                            size="sm"
                            onClick={() => openSubmitDialog(row)}
                            className="rounded-none bg-[#2f3d51] text-white hover:bg-[#243041]"
                          >
                            <Upload className="mr-1 h-4 w-4" /> Submit Invoice
                          </Button>
                        ) : row.status === 'supplier_submitted' ? (
                          <span className="text-xs font-semibold text-[#3f2a80]">Awaiting Accountant</span>
                        ) : row.status === 'accountant_approved' ? (
                          <span className="text-xs font-semibold text-[#184f8f]">Approved, awaiting payment</span>
                        ) : row.status === 'paid' ? (
                          <span className="text-xs font-semibold text-[#1f5f35]">Paid</span>
                        ) : (
                          <span className="text-xs text-[#5f6b7c]">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-[#bcc3cd] bg-[#f5f7fa]">
          <DialogHeader>
            <DialogTitle className="text-[#263143]">Submit Supplier Invoice</DialogTitle>
            <DialogDescription className="text-[#5f6b7c]">
              Provide your invoice details so the accountant can approve and process payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceNumber" className="text-[#334155]">Invoice Number</Label>
              <Input
                id="supplierInvoiceNumber"
                value={supplierInvoiceNumber}
                onChange={(event) => setSupplierInvoiceNumber(event.target.value)}
                className="border-[#b6bec8] bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceAmount" className="text-[#334155]">Invoice Amount (KES)</Label>
              <Input
                id="supplierInvoiceAmount"
                type="number"
                min="0"
                value={supplierInvoiceAmount}
                onChange={(event) => setSupplierInvoiceAmount(event.target.value)}
                className="border-[#b6bec8] bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceNotes" className="text-[#334155]">Invoice Notes</Label>
              <Textarea
                id="supplierInvoiceNotes"
                rows={3}
                value={supplierInvoiceNotes}
                onChange={(event) => setSupplierInvoiceNotes(event.target.value)}
                placeholder="Describe supplied items and quantities"
                className="border-[#b6bec8] bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierInvoiceImage" className="text-[#334155]">Invoice / Item Photo (Optional)</Label>
              <Input
                id="supplierInvoiceImage"
                type="file"
                accept="image/*"
                onChange={(event) => setInvoiceImage(event.target.files?.[0] || null)}
                className="border-[#b6bec8] bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting} className="border-[#9aa4b1] bg-[#eef1f4] text-[#334155] hover:bg-white">
              Cancel
            </Button>
            <Button onClick={submitInvoice} disabled={submitting} className="bg-[#2f3d51] text-white hover:bg-[#243041]">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierDashboard;
