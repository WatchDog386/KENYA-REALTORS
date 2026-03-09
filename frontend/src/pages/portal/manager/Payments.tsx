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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatCurrency';
import { useManager } from '@/hooks/useManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ManagerPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    collected: 0,
    pending: 0,
    overdue: 0,
    total: 0
  });

  useEffect(() => {
    fetchPayments();
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

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          tenant:users!payments_tenant_id_fkey (
            first_name,
            last_name,
            email
          ),
          property:properties!payments_property_id_fkey (
            name,
            address
          )
        `)
        .in('property_id', propIds)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      setPayments(data || []);

      // Calculate stats
      const collected = data?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending = data?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
      const overdue = data?.filter(p => {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{payment.tenant?.first_name} {payment.tenant?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>{payment.property?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.payment_method || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell>
                    {payment.status === 'completed' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Paid
                      </Badge>
                    ) : payment.status === 'pending' ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline">{payment.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === 'pending' && (
                      <Button size="sm" onClick={() => markAsPaid(payment.id)}>
                        Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerPayments;