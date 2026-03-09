import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Download, Filter, Eye, Mail } from 'lucide-react';
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

interface Invoice {
  id: string;
  reference_number: string;
  amount: number;
  due_date: string;
  issued_date: string;
  status: string;
  notes?: string;
  items?: any;
  tenant_id: string;
  property_id: string;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    name: string;
  };
}

const AccountantInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTenants, setActiveTenants] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWrapperOpen, setIsWrapperOpen] = useState(false); // For new invoice dialog

  useEffect(() => {
    fetchInvoices();
    fetchActiveTenants();
  }, []);

  const fetchActiveTenants = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('role', 'tenant');
    if (data) setActiveTenants(data);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
            *,
            tenant:tenant_id(first_name, last_name, email),
            property:property_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Could not fetch invoices:", error);
        setInvoices([]);
      } else {
        setInvoices(data || []);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.tenant?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.tenant?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.property?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    outstanding: invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.amount), 0),
    paid_this_month: invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount), 0),
    overdue: invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.amount), 0),
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      // Here you would send email notification
      // For now, just log and show alert
      console.log(`Sending invoice ${invoice.reference_number} to ${invoice.tenant?.email}`);
      alert(`Invoice sent to ${invoice.tenant?.email}`);
    } catch (err) {
      console.error('Error sending invoice:', err);
      alert('Failed to send invoice');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
           <p className="text-gray-500">Create, manage and track all property invoices.</p>
        </div>
        <Dialog open={isWrapperOpen} onOpenChange={setIsWrapperOpen}>
           <DialogTrigger asChild>
             <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
               <Plus className="w-4 h-4" /> Create Invoice
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Create New Invoice</DialogTitle>
               <DialogDescription>
                 Fill in the details to generate a new invoice.
               </DialogDescription>
             </DialogHeader>
             <CreateInvoiceForm 
               tenants={activeTenants} 
               onClose={() => setIsWrapperOpen(false)} 
               onSuccess={fetchInvoices} 
             />
           </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card>
            <CardContent className="p-6 flex items-center gap-4">
               <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                  <h3 className="text-2xl font-bold">KES {stats.outstanding.toLocaleString()}</h3>
               </div>
            </CardContent>
         </Card>
         <Card>
            <CardContent className="p-6 flex items-center gap-4">
               <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Paid (This Month)</p>
                  <h3 className="text-2xl font-bold">KES {stats.paid_this_month.toLocaleString()}</h3>
               </div>
            </CardContent>
         </Card>
         <Card>
            <CardContent className="p-6 flex items-center gap-4">
               <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <FileText className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <h3 className="text-2xl font-bold">KES {stats.overdue.toLocaleString()}</h3>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex items-center gap-2 max-w-sm bg-white p-2 rounded-lg border shadow-sm flex-1">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <Input 
             placeholder="Search invoices by number or tenant..." 
             className="border-0 focus-visible:ring-0" 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-0 focus:ring-0 text-sm"
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading invoices...</TableCell>
                 </TableRow>
              ) : filteredInvoices.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                       <div className="flex flex-col items-center justify-center text-gray-500">
                          <FileText className="w-12 h-12 mb-2 opacity-20" />
                          <p>No invoices found</p>
                       </div>
                    </TableCell>
                 </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.reference_number}</TableCell>
                    <TableCell>{inv.tenant?.first_name} {inv.tenant?.last_name}</TableCell>
                    <TableCell>{inv.property?.name || '-'}</TableCell>
                    <TableCell>{format(new Date(inv.issued_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(inv.due_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-bold">KES {Number(inv.amount).toLocaleString()}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className={
                          inv.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                          inv.status === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                          inv.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                       }>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex gap-2 justify-end">
                         <Dialog open={isPreviewOpen && selectedInvoice?.id === inv.id} onOpenChange={setIsPreviewOpen}>
                           <DialogTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="gap-1"
                               onClick={() => setSelectedInvoice(inv)}
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-2xl">
                             <DialogHeader>
                               <DialogTitle>Invoice Preview</DialogTitle>
                             </DialogHeader>
                             {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
                           </DialogContent>
                         </Dialog>
                         
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="gap-1"
                           onClick={() => handleSendInvoice(inv)}
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


interface CreateInvoiceFormProps {
  tenants: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateInvoiceForm({ tenants, onClose, onSuccess }: CreateInvoiceFormProps) {
  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !amount || !dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Ideally fetch property_id from tenant's assignment
      // For now, we'll fetch it here
      const checkRes = await supabase
         .from('tenants')
         .select('unit_id, unit:unit_id(property_id)')
         .eq('user_id', tenantId)
         .maybeSingle();
         
      const propertyId = checkRes.data?.unit?.property_id;

      const { error } = await supabase
        .from('invoices')
        .insert({
          reference_number: invoiceNumber,
          tenant_id: tenantId,
          amount: Number(amount),
          due_date: dueDate,
          issued_date: new Date().toISOString().split('T')[0],
          status: 'unpaid',
          notes: notes,
          items: [{ description: 'Rent/Service', amount: Number(amount), quantity: 1 }],
          property_id: propertyId
        });

      if (error) throw error;
      
      onSuccess();
      onClose();
      alert('Invoice created successfully!');
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Tenant</label>
        <select 
          className="w-full p-2 border rounded-md text-sm"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          required
        >
          <option value="">Select a tenant...</option>
          {tenants.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name} ({t.email})
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
        <Input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0.00" 
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <Input 
          type="date" 
          value={dueDate} 
          onChange={(e) => setDueDate(e.target.value)} 
          required 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <Input 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder="Optional notes..." 
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
};

interface InvoicePreviewProps {
  invoice: Invoice;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  return (
    <div className="bg-white p-8 border rounded-lg">
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Invoice Number</h3>
          <p className="text-lg font-bold text-indigo-600">{invoice.reference_number}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-700">Invoice Date</h3>
          <p className="text-lg">
            {format(new Date(invoice.issued_date), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Bill To</h4>
          <p className="font-semibold">{invoice.tenant?.first_name} {invoice.tenant?.last_name}</p>
          <p className="text-sm text-gray-600">{invoice.tenant?.email}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Property</h4>
          <p className="font-semibold">{invoice.property?.name || 'N/A'}</p>
          <p className="text-sm text-gray-600">Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
        </div>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
          <div>Description</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Amount</div>
        </div>
        <div className="grid grid-cols-3 gap-4 font-semibold">
          <div>Rent/Service</div>
          <div className="text-right">1</div>
          <div className="text-right">KES {Number(invoice.amount).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <div className="w-48">
          <div className="flex justify-between py-2 border-t-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">KES {Number(invoice.amount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Notes</h4>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <p>Status: <span className="font-semibold capitalize">{invoice.status}</span></p>
      </div>
    </div>
  );
};

export default AccountantInvoices;
