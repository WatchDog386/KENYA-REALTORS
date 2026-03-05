import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Download,
  Filter,
  Search,
  Calendar,
  User,
  Home,
  Loader2,
  Eye,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatCurrency';
import { useManager } from '@/hooks/useManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ManagerPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [allReceipts, setAllReceipts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("payments");
  const [searchReceipts, setSearchReceipts] = useState("");
  const [stats, setStats] = useState({
    collected: 0,
    pending: 0,
    overdue: 0,
    total: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    // Set up real-time subscriptions to auto-update when payments are made
    const rentPaymentChannel = supabase
      .channel('rent_payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rent_payments'
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    const utilityReadingChannel = supabase
      .channel('utility_readings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_readings'
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    const billsUtilitiesChannel = supabase
      .channel('bills_utilities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills_and_utilities'
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    const receiptsChannel = supabase
      .channel('receipts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts'
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rentPaymentChannel);
      supabase.removeChannel(utilityReadingChannel);
      supabase.removeChannel(billsUtilitiesChannel);
      supabase.removeChannel(receiptsChannel);
    };
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get manager's properties first
      const { data: propertyIds } = await supabase
        .from('properties')
        .select('id')
        .eq('property_manager_id', user.id);

      const propIds = propertyIds?.map(p => p.id) || [];

      // First fetch rent payments
      const { data: rentPayments, error: rentError } = await supabase
        .from('rent_payments')
        .select(`
          id,
          amount,
          amount_paid,
          due_date,
          created_at,
          payment_date,
          paid_date,
          payment_method,
          status,
          receipt_id,
          tenant_id,
          property_id,
          receipt:receipt_id (
            id,
            receipt_number,
            status,
            metadata
          ),
          tenant:tenant_id (
            first_name,
            last_name,
            email
          ),
          property:property_id (
            name,
            address
          )
        `)
        .in('property_id', propIds)
        .order('created_at', { ascending: false });

      // Then fetch utility payments from bills_and_utilities
      const { data: billPayments, error: billError } = await supabase
        .from('bills_and_utilities')
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          created_at,
          payment_date,
          payment_method,
          status,
          receipt_id,
          tenant_id,
          property_id,
          receipt:receipt_id (
            id,
            receipt_number,
            status,
            metadata
          ),
          tenant:tenant_id (
            first_name,
            last_name,
            email
          ),
          property:property_id (
            name,
            address
          )
        `)
        .in('property_id', propIds)
        .order('created_at', { ascending: false });

      // Also fetch utility readings payments for manager's properties
      const { data: unitIds } = await supabase
        .from('units')
        .select('id')
        .in('property_id', propIds);

      const uIds = unitIds?.map(u => u.id) || [];

      const { data: utilityReadings, error: utilityError } = await supabase
        .from('utility_readings')
        .select(`
          id,
          unit_id,
          reading_month,
          status,
          total_bill,
          unit:unit_id (
            unit_number,
            property_id,
            property:property_id (
              name,
              address
            ),
            tenants (
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('unit_id', uIds)
        .order('reading_month', { ascending: false });

      // Fetch recent receipts (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          tenant_id,
          property_id,
          unit_id,
          amount_paid,
          payment_method,
          payment_date,
          transaction_reference,
          status,
          metadata,
          tenant:tenant_id (
            first_name,
            last_name,
            email
          ),
          property:property_id (
            name,
            address
          ),
          unit:unit_id (
            unit_number,
            property_unit_types(unit_type_name)
          )
        `)
        .in('property_id', propIds)
        .gte('payment_date', yesterday)
        .order('payment_date', { ascending: false });

      // Also fetch ALL receipts for the receipts tab
      const { data: allReceiptsData, error: allReceiptsError } = await supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          tenant_id,
          property_id,
          unit_id,
          amount_paid,
          payment_method,
          payment_date,
          transaction_reference,
          status,
          metadata,
          created_at,
          tenant:tenant_id (
            first_name,
            last_name,
            email
          ),
          property:property_id (
            name,
            address
          ),
          unit:unit_id (
            unit_number,
            property_unit_types(unit_type_name)
          )
        `)
        .in('property_id', propIds)
        .order('payment_date', { ascending: false });

      if (rentError) throw rentError;
      if (billError) throw billError;
      if (utilityError) throw utilityError;
      if (receiptsError) throw receiptsError;
      if (allReceiptsError) throw allReceiptsError;

      setRecentReceipts(receiptsData || []);
      setAllReceipts(allReceiptsData || []);

      // Combine all payment types
      const combinedPayments = [
        ...(rentPayments || []).map(p => ({
          ...p,
          amount: Number(p.amount_paid || 0),
          expected_amount: Number(p.amount || 0),
          payment_date: p.payment_date || p.paid_date || p.created_at || p.due_date,
          type: 'rent'
        })),
        ...(billPayments || []).map(p => ({
          ...p,
          amount: Number(p.paid_amount || 0),
          expected_amount: Number(p.amount || 0),
          payment_date: p.payment_date || p.created_at || p.due_date,
          type: 'utilities'
        })),
        ...(utilityReadings || []).map(ur => ({
          id: ur.id,
          amount: ur.total_bill,
          payment_date: ur.reading_month,
          status: ur.status,
          type: 'utility_reading',
          tenant_id: ur.unit?.tenants?.[0]?.id,
          property_id: ur.unit?.property_id,
          receipt: null,
          tenant: ur.unit?.tenants?.[0] || { first_name: 'Unknown', last_name: '', email: '' },
          property: ur.unit?.property || { name: 'Unknown', address: '' }
        }))
      ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

      setPayments(combinedPayments);

      // Calculate stats
      const collected = combinedPayments
        .filter(p => ['completed', 'paid', 'partial'].includes(String(p.status).toLowerCase()))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

      const pending = combinedPayments
        .filter(p => ['pending', 'open', 'overdue'].includes(String(p.status).toLowerCase()))
        .reduce((sum, p) => {
          const expectedAmount = Number(p.expected_amount) || Number(p.amount) || 0;
          const paidAmount = Number(p.amount) || 0;
          return sum + Math.max(0, expectedAmount - paidAmount);
        }, 0) || 0;

      const overdue = combinedPayments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        return ['pending', 'open', 'overdue'].includes(String(p.status).toLowerCase()) && diffDays > 5;
      }).reduce((sum, p) => {
        const expectedAmount = Number(p.expected_amount) || Number(p.amount) || 0;
        const paidAmount = Number(p.amount) || 0;
        return sum + Math.max(0, expectedAmount - paidAmount);
      }, 0) || 0;

      setStats({
        collected,
        pending,
        overdue,
        total: collected + pending
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success('Payment marked as completed');
      fetchPayments();
    } catch (err) {
      console.error('Error updating payment:', err);
      toast.error('Failed to update payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">Payments</h1>
          <p className="text-gray-600 text-[13px] font-medium">Track and manage rent payments</p>
        </div>
        <Button asChild className="bg-[#D85C2C] text-white px-6 py-3 text-[10px] font-black uppercase tracking-[1.5px] hover:bg-[#b84520] transition-colors rounded-md shadow-sm">
          <Link to="/portal/manager/payments/collect">
            <DollarSign className="w-4 h-4 mr-2" />
            Collect Payment
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.collected)}</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-gray-500">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-gray-500">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-gray-500">Collected + Pending</p>
          </CardContent>
        </Card>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6 mt-6">
          {/* Recent Receipts Section - Auto-fill Feature */}
          {recentReceipts.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-900">🎉 Recent Payments Received</CardTitle>
                    <CardDescription className="text-emerald-700">
                      {recentReceipts.length} receipt(s) issued in the last 24 hours - automatically synced to payments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentReceipts.map((receipt) => (
                    <div key={receipt.id} className="bg-white rounded-lg border border-emerald-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-[#00356B]">{receipt.receipt_number}</p>
                          <p className="text-xs text-slate-600">
                            {new Date(receipt.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800">Synced</Badge>
                      </div>
                      <div className="space-y-2 mb-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {receipt.metadata?.tenant_name || `${receipt.tenant?.first_name || ''} ${receipt.tenant?.last_name || ''}`.trim() || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600">{receipt.metadata?.property_name || receipt.property?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">
                          House {receipt.metadata?.house_number || receipt.unit?.unit_number || 'N/A'} · {receipt.metadata?.unit_type || receipt.unit?.property_unit_types?.unit_type_name || 'N/A'}
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatCurrency(receipt.amount_paid)}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => {
                          setSelectedReceipt(receipt);
                          setIsReceiptDialogOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Receipt
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    {payments.length} payment records
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Search payments..." className="pl-9 w-full sm:w-64" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => {
                      const expectedAmount = Number(payment.expected_amount) || Number(payment.amount) || 0;
                      const paidAmount = Number(payment.amount) || 0;
                      const balance = Math.max(0, expectedAmount - paidAmount);
                      const isPaid = balance === 0 && paidAmount > 0;
                      const isPartial = paidAmount > 0 && balance > 0;
                      
                      return (
                        <TableRow 
                          key={`${payment.type}-${payment.id}`}
                          className={isPaid ? 'bg-emerald-50 hover:bg-emerald-100' : ''}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{payment.tenant?.first_name} {payment.tenant?.last_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{payment.property?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.type === 'rent' ? 'default' : 'secondary'}>
                              {payment.type === 'rent' ? 'Rent' : 'Utilities'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(expectedAmount)}</TableCell>
                          <TableCell className={paidAmount > 0 ? 'font-bold text-emerald-600' : 'text-gray-500'}>
                            {formatCurrency(paidAmount)}
                          </TableCell>
                          <TableCell className={balance > 0 ? 'font-semibold text-red-600' : 'text-emerald-600'}>
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            {isPaid ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <Badge className="bg-emerald-100 text-emerald-800">Paid</Badge>
                              </div>
                            ) : isPartial ? (
                              <Badge className="bg-blue-100 text-blue-800">Partial</Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.receipt ? (
                              <div className="flex flex-col gap-1">
                                <Badge className={
                                  payment.receipt.status === 'sent' 
                                    ? 'bg-green-100 text-green-800 text-xs'
                                    : payment.receipt.status === 'generated'
                                    ? 'bg-blue-100 text-blue-800 text-xs'
                                    : 'bg-gray-100 text-gray-800 text-xs'
                                }>
                                  <FileText className="w-3 h-3 mr-1" />
                                  {payment.receipt.status || 'Generated'}
                                </Badge>
                                <span className="text-xs text-gray-500 truncate">{payment.receipt.receipt_number}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {payment.receipt && (
                                <Dialog open={isReceiptDialogOpen && selectedReceipt?.id === payment.receipt.id} onOpenChange={setIsReceiptDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="text-xs"
                                      onClick={() => setSelectedReceipt(payment.receipt)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Receipt Details</DialogTitle>
                                    <DialogDescription>
                                      Receipt #{selectedReceipt?.receipt_number}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-600">Receipt Number</p>
                                        <p className="font-mono font-bold">{selectedReceipt?.receipt_number}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <Badge className={
                                          selectedReceipt?.status === 'sent' 
                                            ? 'bg-green-100 text-green-800'
                                            : selectedReceipt?.status === 'generated'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }>
                                          {selectedReceipt?.status || 'Generated'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Tenant</p>
                                        <p className="font-semibold">
                                          {selectedReceipt?.metadata?.tenant_name || `${selectedReceipt?.tenant?.first_name || ''} ${selectedReceipt?.tenant?.last_name || ''}`.trim() || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">Property</p>
                                        <p className="font-semibold">{selectedReceipt?.metadata?.property_name || selectedReceipt?.property?.name || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">House Number</p>
                                        <p className="font-semibold">{selectedReceipt?.metadata?.house_number || selectedReceipt?.unit?.unit_number || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-600">House Type</p>
                                        <p className="font-semibold">{selectedReceipt?.metadata?.unit_type || selectedReceipt?.unit?.property_unit_types?.unit_type_name || 'N/A'}</p>
                                      </div>
                                    </div>
                                    {selectedReceipt?.metadata && (
                                      <div className="space-y-2 border-t pt-4">
                                        <h4 className="font-semibold text-sm">Payment Details</h4>
                                        {selectedReceipt.metadata.items && (
                                          <div className="bg-gray-50 p-3 rounded">
                                            <p className="text-xs font-semibold text-gray-700 mb-2">Items</p>
                                            <ul className="space-y-1 text-xs">
                                              {selectedReceipt.metadata.items.map((item: any, idx: number) => (
                                                <li key={idx} className="flex justify-between">
                                                  <span>{item.description}</span>
                                                  <span className="font-mono">{formatCurrency(item.amount)}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Receipts</CardTitle>
                  <CardDescription>
                    {allReceipts.length} receipt(s) issued
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Search receipts..." 
                      className="pl-9 w-full sm:w-64"
                      value={searchReceipts}
                      onChange={(e) => setSearchReceipts(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No receipts found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allReceipts
                        .filter(receipt =>
                          searchReceipts === '' ||
                          receipt.receipt_number.toLowerCase().includes(searchReceipts.toLowerCase()) ||
                          receipt.tenant?.first_name?.toLowerCase().includes(searchReceipts.toLowerCase()) ||
                          receipt.tenant?.last_name?.toLowerCase().includes(searchReceipts.toLowerCase()) ||
                          receipt.property?.name?.toLowerCase().includes(searchReceipts.toLowerCase())
                        )
                        .map((receipt) => (
                          <TableRow key={receipt.id}>
                            <TableCell className="font-mono font-bold text-[#00356B]">{receipt.receipt_number}</TableCell>
                            <TableCell>
                              <span className="text-sm">{receipt.metadata?.tenant_name || `${receipt.tenant?.first_name || ''} ${receipt.tenant?.last_name || ''}`.trim() || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{receipt.metadata?.property_name || receipt.property?.name || 'N/A'}</div>
                                <div className="text-xs text-slate-500">House {receipt.metadata?.house_number || receipt.unit?.unit_number || 'N/A'} · {receipt.metadata?.unit_type || receipt.unit?.property_unit_types?.unit_type_name || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">{formatCurrency(receipt.amount_paid)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{receipt.payment_method}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{new Date(receipt.payment_date).toLocaleDateString()}</span>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                receipt.status === 'sent' 
                                  ? 'bg-green-100 text-green-800'
                                  : receipt.status === 'generated'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }>
                                {receipt.status || 'Generated'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setIsReceiptDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagerPayments;
