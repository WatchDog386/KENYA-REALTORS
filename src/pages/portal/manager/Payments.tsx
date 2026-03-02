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

    return () => {
      supabase.removeChannel(rentPaymentChannel);
      supabase.removeChannel(utilityReadingChannel);
      supabase.removeChannel(billsUtilitiesChannel);
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
          amount_paid,
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
        .order('payment_date', { ascending: false });

      // Then fetch utility payments from bills_and_utilities
      const { data: billPayments, error: billError } = await supabase
        .from('bills_and_utilities')
        .select(`
          id,
          total_amount,
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
        .order('payment_date', { ascending: false });

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

      if (rentError) throw rentError;
      if (billError) throw billError;
      if (utilityError) throw utilityError;

      // Combine all payment types
      const combinedPayments = [
        ...(rentPayments || []).map(p => ({
          ...p,
          amount: p.amount_paid,
          type: 'rent'
        })),
        ...(billPayments || []).map(p => ({
          ...p,
          amount: p.total_amount,
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
      const collected = combinedPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending = combinedPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
      const overdue = combinedPayments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
        return p.status === 'pending' && diffDays > 5;
      }).reduce((sum, p) => sum + p.amount, 0) || 0;

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
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={`${payment.type}-${payment.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{payment.tenant?.first_name} {payment.tenant?.last_name}</span>
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
                    <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
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
                              ? 'bg-green-100 text-green-800'
                              : payment.receipt.status === 'generated'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }>
                            <FileText className="w-3 h-3 mr-1" />
                            {payment.receipt.status || 'Generated'}
                          </Badge>
                          <span className="text-xs text-gray-500">{payment.receipt.receipt_number}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">No Receipt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.receipt && (
                          <Dialog open={isReceiptDialogOpen && selectedReceipt?.id === payment.receipt.id} onOpenChange={setIsReceiptDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
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
                        {payment.status === 'pending' && (
                          <Button size="sm" onClick={() => markAsPaid(payment.id)}>
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerPayments;