import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Receipt, Download, Filter, Eye, Mail, Plus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatCurrency';

interface Receipt {
  id: string;
  receipt_number: string;
  invoice_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  generated_by: string;
  metadata?: any;
  invoice?: {
    reference_number: string;
    amount: number;
    tenant_id: string;
    tenant?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface Invoice {
  id: string;
  reference_number: string;
  amount: number;
  due_date: string;
  issued_date: string;
  status: string;
  tenant_id: string;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AccountantReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [activeInvoices, setActiveInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false); // For new receipt dialog

  useEffect(() => {
    fetchReceipts();
    fetchActiveInvoices();
  }, []);

  const fetchActiveInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('id, reference_number, amount, tenant_id, tenant:tenant_id(first_name, last_name, email)')
      .eq('status', 'unpaid') // Only fetch unpaid/partially paid
      .order('created_at', { ascending: false });
    if (data) setActiveInvoices(data);
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipts')
        .select(`
             *,
             invoice:invoice_id(
                 reference_number,
                 amount,
                 tenant_id,
                 tenant:tenant_id(first_name, last_name, email)
             )
        `)
        .order('created_at', { ascending: false });

      if (error) {
         console.warn("Could not fetch receipts:", error);
         setReceipts([]);
      } else {
         setReceipts(data || []);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(rcpt => 
    rcpt.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    rcpt.invoice?.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
    rcpt.invoice?.tenant?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    rcpt.invoice?.tenant?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = receipts.reduce((sum, r) => sum + Number(r.amount_paid), 0);

  const handleSendReceipt = async (receipt: Receipt) => {
    try {
      const tenantEmail = receipt.metadata?.tenant_email || receipt.invoice?.tenant?.email;
      if (!tenantEmail) {
        toast.error('Tenant email not found');
        return;
      }

      try {
        // Call edge function to send receipt email
        const { data, error } = await supabase.functions.invoke('send-payment-receipt', {
          body: {
            to_email: tenantEmail,
            receipt_id: receipt.id,
            receipt_number: receipt.receipt_number,
            tenant_name: receipt.metadata?.tenant_name || `${receipt.invoice?.tenant?.first_name} ${receipt.invoice?.tenant?.last_name}`,
            amount: receipt.amount_paid,
            payment_date: receipt.payment_date,
            payment_method: receipt.payment_method,
            transaction_reference: receipt.metadata?.transaction_reference,
            items: receipt.metadata?.items || [],
            resend: true,
          }
        });

        if (error) {
          console.error('Email sending error:', error);
          // Don't fail completely - just warn user
          toast.warning('Receipt copied to clipboard, but email could not be sent');
        } else {
          console.log('Email sent successfully:', data);
        }
      } catch (emailErr) {
        console.error('Email function error:', emailErr);
        // Continue with status update even if email fails
        toast.warning('Receipt ready to send, but email service may be unavailable');
      }

      // Always update receipt status even if email fails
      await supabase
        .from('receipts')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', receipt.id);

      toast.success(`Receipt marked as sent to ${tenantEmail}`);
      await fetchReceipts();
    } catch (err) {
      console.error('Error sending receipt:', err);
      toast.error('Failed to update receipt status');
    }
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      // Generate printable HTML version
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        const receiptHTML = generateReceiptHTML(receipt);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();

        // Update receipt status
        await supabase
          .from('receipts')
          .update({ status: 'downloaded' })
          .eq('id', receipt.id);
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast.error('Failed to download receipt');
    }
  };

  const generateReceiptHTML = (receipt: Receipt) => {
    const items = receipt.metadata?.items || [];
    const tenantName = receipt.metadata?.tenant_name || `${receipt.invoice?.tenant?.first_name} ${receipt.invoice?.tenant?.last_name}`;
    const propertyName = receipt.metadata?.property_name || 'Property';
    const transactionRef = receipt.metadata?.transaction_reference || receipt.id;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #154279; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #154279; font-size: 32px; }
            .receipt-number { color: #666; font-size: 14px; margin-top: 5px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .detail-item { }
            .detail-label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .detail-value { font-size: 16px; margin-top: 8px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background-color: #154279; color: white; padding: 12px; text-align: left; font-weight: bold; }
            td { padding: 10px 12px; border-bottom: 1px solid #ddd; }
            tr:last-child td { border-bottom: 2px solid #154279; }
            .total-row { background-color: #f5f5f5; font-weight: bold; }
            .total-amount { font-size: 18px; color: #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .success-badge { color: #10b981; font-weight: bold; font-size: 16px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PAYMENT RECEIPT</h1>
            <div class="receipt-number">Receipt #${receipt.receipt_number}</div>
          </div>
          
          <div class="details">
            <div class="detail-item">
              <div class="detail-label">Property</div>
              <div class="detail-value">${propertyName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Tenant Name</div>
              <div class="detail-value">${tenantName}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Date</div>
              <div class="detail-value">${format(new Date(receipt.payment_date), 'MMMM dd, yyyy hh:mm a')}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Method</div>
              <div class="detail-value">${receipt.payment_method.toUpperCase()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Transaction Ref</div>
              <div class="detail-value">${transactionRef}</div>
            </div>
          </div>

          ${items.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">KSh ${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>TOTAL PAID</td>
                  <td style="text-align: right;" class="total-amount">KSh ${parseFloat(receipt.amount_paid.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p class="success-badge">✓ Payment Successfully Processed</p>
            <p>This receipt confirms payment has been received.</p>
            <p>Please keep it for your records.</p>
            <p style="margin-top: 20px; color: #999;">Document generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Receipts</h2>
           <p className="text-gray-500">View, generate and send payment receipts to tenants.</p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Generate Receipt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Receipt from Invoice</DialogTitle>
              <DialogDescription>
                Select an invoice to generate a payment receipt.
              </DialogDescription>
            </DialogHeader>
            <GenerateReceiptForm 
              invoices={activeInvoices}
              onGenerate={async () => {
                setIsGenerateOpen(false);
                await fetchReceipts();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <h3 className="text-2xl font-bold">KES {totalCollected.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Receipts Generated</p>
              <h3 className="text-2xl font-bold">{receipts.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unpaid Invoices</p>
              <h3 className="text-2xl font-bold">{activeInvoices.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="flex items-center gap-2 max-w-sm bg-white p-2 rounded-lg border shadow-sm">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <Input 
           placeholder="Search receipts..." 
           className="border-0 focus-visible:ring-0" 
           value={search}
           onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-700">Receipt #</TableHead>
                <TableHead className="font-bold text-slate-700">Property</TableHead>
                <TableHead className="font-bold text-slate-700">Tenant Name</TableHead>
                <TableHead className="font-bold text-slate-700">Date</TableHead>
                <TableHead className="font-bold text-slate-700">Method</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Amount</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading receipts...</TableCell>
                 </TableRow>
              ) : filteredReceipts.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                       <div className="flex flex-col items-center justify-center text-gray-500">
                          <Receipt className="w-12 h-12 mb-2 opacity-20" />
                          <p>No receipts generated yet</p>
                       </div>
                    </TableCell>
                 </TableRow>
              ) : (
                filteredReceipts.map((rcpt) => (
                  <TableRow key={rcpt.id}>
                    <TableCell className="font-mono font-semibold text-[#154279]">{rcpt.receipt_number}</TableCell>
                    <TableCell>
                        {rcpt.metadata?.property_name ? (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">{rcpt.metadata.property_name}</Badge>
                        ) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                        {rcpt.metadata?.tenant_name || `${rcpt.invoice?.tenant?.first_name} ${rcpt.invoice?.tenant?.last_name}`}
                    </TableCell>
                    <TableCell>{format(new Date(rcpt.payment_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        {rcpt.payment_method?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">{formatCurrency(rcpt.amount_paid)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Dialog open={isPreviewOpen && selectedReceipt?.id === rcpt.id} onOpenChange={setIsPreviewOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedReceipt(rcpt)}
                              className="h-8 text-blue-600 hover:bg-blue-50"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Receipt Preview - {rcpt.receipt_number}</DialogTitle>
                            </DialogHeader>
                            {selectedReceipt && <ReceiptPreview receipt={selectedReceipt} />}
                          </DialogContent>
                        </Dialog>
                         
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSendReceipt(rcpt)}
                          className="h-8 text-purple-600 hover:bg-purple-50"
                          title="Send to email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadReceipt(rcpt)}
                          className="h-8 text-green-600 hover:bg-green-50"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

interface GenerateReceiptFormProps {
  invoices: Invoice[];
  onGenerate: () => Promise<void>;
}

const GenerateReceiptForm: React.FC<GenerateReceiptFormProps> = ({ invoices, onGenerate }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice || !amountPaid) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNumber = `RCP-${Date.now()}`;
      const currentUser = await supabase.auth.getUser();

      const { error } = await supabase
        .from('receipts')
        .insert([
          {
            receipt_number: receiptNumber,
            invoice_id: selectedInvoice,
            amount_paid: parseFloat(amountPaid),
            payment_method: paymentMethod,
            payment_date: new Date().toISOString(),
            generated_by: currentUser.data?.user?.id,
          }
        ]);

      if (error) throw error;

      // Update invoice status to paid if full amount
      const invoice = invoices.find(inv => inv.id === selectedInvoice);
      if (invoice && Number(amountPaid) >= invoice.amount) {
        await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', selectedInvoice);
      }

      alert('Receipt generated successfully!');
      await onGenerate();
    } catch (err) {
      console.error('Error generating receipt:', err);
      alert('Failed to generate receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Invoice *
        </label>
        <select
          value={selectedInvoice}
          onChange={(e) => setSelectedInvoice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">-- Choose an invoice --</option>
          {invoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.reference_number} - {inv.tenant?.first_name} {inv.tenant?.last_name} (KES {Number(inv.amount).toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount Paid (KES) *
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="other">Other</option>
        </select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Generating...' : 'Generate Receipt'}
      </Button>
    </form>
  );
};

interface ReceiptPreviewProps {
  receipt: Receipt;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipt }) => {
  const items = receipt.metadata?.items || [];
  const tenantName = receipt.metadata?.tenant_name || `${receipt.invoice?.tenant?.first_name} ${receipt.invoice?.tenant?.last_name}`;
  const propertyName = receipt.metadata?.property_name || 'Property';
  const tenantEmail = receipt.metadata?.tenant_email || receipt.invoice?.tenant?.email;
  const transactionRef = receipt.metadata?.transaction_reference || receipt.id;

  return (
    <div className="bg-white p-8 border rounded-lg max-h-[600px] overflow-y-auto">
      <div className="text-center mb-8 pb-4 border-b-2 border-[#154279]">
        <h2 className="text-3xl font-bold text-[#154279] mb-1">PAYMENT RECEIPT</h2>
        <p className="text-sm text-gray-600 font-mono">{receipt.receipt_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1 tracking-wide">Receipt Number</h3>
          <p className="text-lg font-bold font-mono">{receipt.receipt_number}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1 tracking-wide">Date</h3>
          <p className="text-lg">
            {format(new Date(receipt.payment_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded mb-6 border border-slate-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Received From</h4>
        <p className="font-semibold text-lg">{tenantName}</p>
        <p className="text-sm text-gray-600">{tenantEmail}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded mb-6 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">Property Details</h4>
        <p className="font-semibold text-blue-900">{propertyName}</p>
      </div>

      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className="flex justify-between">
          <span className="text-gray-700">Transaction Reference:</span>
          <span className="font-mono font-semibold">{transactionRef}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Payment Method:</span>
          <span className="font-semibold badge bg-green-100 text-green-800 px-3 py-1 rounded text-sm">{receipt.payment_method.toUpperCase()}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Items Paid</h4>
          <div className="space-y-2">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-700">{item.description}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-3 px-4 border-t-2 border-b-2 border-[#154279] bg-green-50">
            <span className="font-semibold text-gray-900">Amount Paid</span>
            <span className="font-bold text-2xl text-green-600">{formatCurrency(receipt.amount_paid)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-500 text-center border-t pt-4">
        <p className="text-green-600 font-semibold">✓ Payment Successfully Processed</p>
        <p>Thank you for your payment!</p>
        <p>This is a system-generated receipt and requires no signature.</p>
      </div>
    </div>
  );
};

export default AccountantReceipts;
