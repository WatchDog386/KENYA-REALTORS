import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Phone, Mail, User, Wallet, FileText, AlertCircle } from 'lucide-react';
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
import { toast } from "sonner";

interface Tenant {
  id: string;
  user_id: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  unit?: {
    unit_number: string;
    price: number;
    unit_type?: {
        name: string;
    };
    property?: {
      name: string;
      id: string;
    };
  };
}

interface PaymentStatus {
  total_invoiced: number;
  total_paid: number;
  pending_amount: number;
  invoice_count: number;
}

const AccountantTenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<Record<string, PaymentStatus>>({});
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      // Fetch all tenants from the tenants table with their profile and unit/property details
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          user_id,
          user:user_id (
            first_name,
            last_name,
            email,
            phone
          ),
          unit:unit_id (
            unit_number,
            price,
            property:property_id (
              name,
              id
            ),
            unit_type:unit_type_id (
                name
            )
          )
        `)
        .not('unit_id', 'is', null);

      if (error) throw error;
      
      // Transform data to match our interface if needed, but the select structure already matches well
      // We cast it to unknown first because Supabase types might be slightly different
      const typedData = (data as unknown) as Tenant[];
      setTenants(typedData || []);
      
      // Fetch payment status for each tenant
      if (typedData && typedData.length > 0) {
        await fetchPaymentStatuses(typedData);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatuses = async (tenantList: Tenant[]) => {
    try {
      const statuses: Record<string, PaymentStatus> = {};
      
      for (const tenant of tenantList) {
        // Query invoices using the user_id (profile id) as most systems link invoices to user_id
        // However, if invoices use tenant_id, we should use tenant.id
        // Based on other files, it seems tenant_id in invoices table refers to profile.id
        const targetId = tenant.user_id; 

        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('id, amount, status')
          .eq('tenant_id', targetId);

        if (!error && invoices) {
          const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
          const totalPaid = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.amount), 0);
          const pendingAmount = totalInvoiced - totalPaid;

          statuses[tenant.id] = {
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            pending_amount: pendingAmount,
            invoice_count: invoices.length,
          };
        } else {
          statuses[tenant.id] = {
            total_invoiced: 0,
            total_paid: 0,
            pending_amount: 0,
            invoice_count: 0,
          };
        }
      }
      setPaymentStatus(statuses);
    } catch (err) {
      console.error('Error fetching payment statuses:', err);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateInvoice = async (tenant: Tenant, invoiceData: any) => {
    try {
      setIsCreatingInvoice(true);
      
      if (!tenant.unit) {
        toast.error('Tenant has no assigned unit');
        return;
      }

      const property = tenant.unit.property;
      
      const invoiceNumber = `INV-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            reference_number: invoiceNumber,
            tenant_id: tenant.user_id, // Linking to user_id as per assumption
            property_id: property?.id,
            amount: invoiceData.amount,
            due_date: invoiceData.due_date,
            issued_date: new Date().toISOString().split('T')[0],
            status: 'unpaid',
            notes: invoiceData.notes,
            items: invoiceData.items,
          }
        ]);

      if (error) throw error;
      
      toast.success('Invoice created successfully!');
      setSelectedTenant(null);
      await fetchTenants(); // Refresh the list
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Failed to create invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Tenant Directory</h2>
           <p className="text-gray-500">Manage and view all registered tenants across properties.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tenants</p>
            <h3 className="text-2xl font-bold">{tenants.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Assigned Units</p>
            <h3 className="text-2xl font-bold">
              {tenants.filter(t => t.unit).length}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Invoiced</p>
            <h3 className="text-2xl font-bold">
              KES {Object.values(paymentStatus).reduce((sum, s) => sum + s.total_invoiced, 0).toLocaleString()}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Payment</p>
            <h3 className="text-2xl font-bold text-red-600">
              KES {Object.values(paymentStatus).reduce((sum, s) => sum + s.pending_amount, 0).toLocaleString()}
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 max-w-sm bg-white p-2 rounded-lg border shadow-sm">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <Input 
           placeholder="Search tenants..." 
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
                <TableHead>Tenant Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Property / Unit</TableHead>
                <TableHead>Invoiced</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading tenants...</TableCell>
                 </TableRow>
              ) : filteredTenants.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No tenants found.</TableCell>
                 </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                           <User className="w-4 h-4" />
                        </div>
                        <div>
                           {tenant.user?.first_name} {tenant.user?.last_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {tenant.user?.email}</span>
                          {tenant.user?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {tenant.user?.phone}</span>}
                       </div>
                    </TableCell>
                    <TableCell>
                       {tenant.unit ? (
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                                <Wallet className="w-3 h-3" />
                                {tenant.unit.property?.name} - Unit {tenant.unit.unit_number}
                             </div>
                             <div className="text-xs text-gray-500 pl-1">
                                {tenant.unit.unit_type?.name || 'N/A'} • KES {tenant.unit.price?.toLocaleString() || '0'}
                             </div>
                          </div>
                       ) : (
                          <span className="text-gray-400 text-sm italic">Not assigned</span>
                       )}
                    </TableCell>
                    <TableCell>
                       <div className="text-sm">
                         <p className="font-semibold">KES {(paymentStatus[tenant.id]?.total_invoiced || 0).toLocaleString()}</p>
                         <p className="text-xs text-gray-500">{paymentStatus[tenant.id]?.invoice_count || 0} invoices</p>
                       </div>
                    </TableCell>
                    <TableCell>
                       {paymentStatus[tenant.id]?.pending_amount > 0 ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Pending
                            </Badge>
                            <span className="text-sm font-semibold text-red-600">
                              KES {(paymentStatus[tenant.id]?.pending_amount || 0).toLocaleString()}
                            </span>
                          </div>
                       ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Fully Paid</Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button variant="outline" size="sm" className="gap-1">
                             <FileText className="w-4 h-4" />
                             Create Invoice
                           </Button>
                         </DialogTrigger>
                         <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Invoice for {tenant.user?.first_name} {tenant.user?.last_name}</DialogTitle>
                            <DialogDescription>
                              Generate a new invoice for this tenant.
                            </DialogDescription>
                          </DialogHeader>
                          <InvoiceForm 
                            tenant={tenant} 
                            onSubmit={handleCreateInvoice}
                          />
                        </DialogContent>
                       </Dialog>
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

interface InvoiceFormProps {
  tenant: Tenant;
  onSubmit: (tenant: Tenant, data: any) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ tenant, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(tenant, {
      amount: parseFloat(amount),
      due_date: dueDate,
      notes,
      items: [],
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (KES)
        </label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date
        </label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <Input
          placeholder="Add any notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Invoice'}
      </Button>
    </form>
  );
};

export default AccountantTenants;
