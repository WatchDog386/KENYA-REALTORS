import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Receipt, Download, Filter, Eye, Mail, Plus } from 'lucide-react';
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

interface Receipt {
  id: string;
  receipt_number: string;
  invoice_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  generated_by: string;
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
      console.log(`Sending receipt ${receipt.receipt_number} to ${receipt.invoice?.tenant?.email}`);
      alert(`Receipt sent to ${receipt.invoice?.tenant?.email}`);
    } catch (err) {
      console.error('Error sending receipt:', err);
      alert('Failed to send receipt');
    }
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
                <TableHead>Receipt #</TableHead>
                <TableHead>Linked Invoice</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Date Paid</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="font-medium">{rcpt.receipt_number}</TableCell>
                    <TableCell>
                        {rcpt.invoice?.reference_number ? (
                            <Badge variant="outline">{rcpt.invoice.reference_number}</Badge>
                        ) : '-'}
                    </TableCell>
                    <TableCell>
                        {rcpt.invoice?.tenant?.first_name} {rcpt.invoice?.tenant?.last_name}
                    </TableCell>
                    <TableCell>{format(new Date(rcpt.payment_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="capitalize">{rcpt.payment_method || '-'}</TableCell>
                    <TableCell className="font-bold">KES {Number(rcpt.amount_paid).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex gap-2 justify-end">
                         <Dialog open={isPreviewOpen && selectedReceipt?.id === rcpt.id} onOpenChange={setIsPreviewOpen}>
                           <DialogTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm"
                               onClick={() => setSelectedReceipt(rcpt)}
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl">
                             <DialogHeader>
                               <DialogTitle>Receipt Preview</DialogTitle>
                             </DialogHeader>
                             {selectedReceipt && <ReceiptPreview receipt={selectedReceipt} />}
                           </DialogContent>
                         </Dialog>
                         
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => handleSendReceipt(rcpt)}
                         >
                           <Mail className="w-4 h-4" />
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
  return (
    <div className="bg-white p-8 border rounded-lg">
      <div className="text-center mb-8 pb-4 border-b">
        <h2 className="text-3xl font-bold text-indigo-600 mb-1">RECEIPT</h2>
        <p className="text-sm text-gray-600">Payment Receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1">Receipt Number</h3>
          <p className="text-lg font-bold">{receipt.receipt_number}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-1">Date</h3>
          <p className="text-lg">
            {format(new Date(receipt.payment_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Received From</h4>
        <p className="font-semibold">
          {receipt.invoice?.tenant?.first_name} {receipt.invoice?.tenant?.last_name}
        </p>
        <p className="text-sm text-gray-600">{receipt.invoice?.tenant?.email}</p>
      </div>

      <div className="space-y-3 mb-6 pb-6 border-b">
        <div className="flex justify-between">
          <span className="text-gray-700">Invoice Reference:</span>
          <span className="font-semibold">{receipt.invoice?.reference_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Invoice Amount:</span>
          <span className="font-semibold">KES {Number(receipt.invoice?.amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Payment Method:</span>
          <span className="font-semibold capitalize">{receipt.payment_method || 'Not specified'}</span>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-3 border-t-2 border-b-2">
            <span className="font-semibold">Amount Paid</span>
            <span className="font-bold text-2xl text-green-600">KES {Number(receipt.amount_paid).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-500 text-center border-t pt-4">
        <p>Thank you for your payment!</p>
        <p>This is a system-generated receipt and requires no signature.</p>
      </div>
    </div>
  );
};

export default AccountantReceipts;
