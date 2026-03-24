import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, DollarSign, Download, CheckCircle, XCircle, Clock, Filter, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  reference_number: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  invoice?: {
    reference_number: string;
    status: string;
    tenant?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface MaintenanceProcurement {
  id: string;
  maintenance_request_id: string;
  lpo_number: string;
  invoice_number: string;
  supplier_name: string;
  supplier_email?: string;
  supplier_phone?: string;
  cost_estimate: number;
  actual_cost?: number;
  paid_amount?: number;
  status: string;
  submitted_at?: string;
  paid_at?: string;
  property_id: string;
  accountant_notes?: string;
  maintenance_request?: {
    title: string;
  };
  property?: {
    name: string;
  };
}

const AccountantPayments = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [procurements, setProcurements] = useState<MaintenanceProcurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [procurementLoading, setProcurementLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
    fetchProcurements();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch all receipts as transactions
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          id,
          reference_number:receipt_number,
          invoice_id,
          amount:amount_paid,
          payment_date,
          payment_method,
          invoice:invoice_id(
            reference_number,
            status,
            tenant:tenant_id(first_name, last_name, email)
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) {
        console.warn("Could not fetch transactions:", error);
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcurements = async () => {
    try {
      setProcurementLoading(true);
      const { data, error } = await supabase
        .from('maintenance_completion_reports')
        .select(`
          id,
          maintenance_request_id,
          lpo_number,
          invoice_number,
          supplier_name,
          supplier_email,
          supplier_phone,
          cost_estimate,
          actual_cost,
          status,
          submitted_at,
          paid_at,
          property_id,
          accountant_notes,
          maintenance_request:maintenance_requests(title),
          property:properties(name)
        `)
        .not('lpo_number', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch maintenance procurements:', error);
        setProcurements([]);
      } else {
        setProcurements(data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance procurements:', error);
      setProcurements([]);
    } finally {
      setProcurementLoading(false);
    }
  };

  const approveProcurement = async (report: MaintenanceProcurement) => {
    try {
      setProcessingId(report.id);
      const { data: authData } = await supabase.auth.getUser();
      const approverId = authData.user?.id;

      const approvedCost = Number(report.actual_cost || report.cost_estimate || 0);

      const { error } = await supabase
        .from('maintenance_completion_reports')
        .update({
          status: 'accountant_approved',
          actual_cost: approvedCost,
          cost_approved_at: new Date().toISOString(),
          approved_by_accountant_id: approverId || null,
        })
        .eq('id', report.id);

      if (error) throw error;

      await supabase
        .from('invoices')
        .update({
          status: 'unpaid',
          amount: approvedCost,
          notes: `${report.accountant_notes || ''}\nACCOUNTANT_APPROVED:true`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('reference_number', report.invoice_number);

      await fetchProcurements();
    } catch (error) {
      console.error('Error approving procurement:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const payProcurement = async (report: MaintenanceProcurement) => {
    try {
      setProcessingId(report.id);
      const paidAmount = Number(report.actual_cost || report.cost_estimate || 0);
      const nowIso = new Date().toISOString();

      const { error: reportError } = await supabase
        .from('maintenance_completion_reports')
        .update({
          status: 'paid',
          paid_at: nowIso,
          paid_amount: paidAmount,
        })
        .eq('id', report.id)
        .eq('status', 'accountant_approved');

      if (reportError) throw reportError;

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, transaction_id')
        .eq('reference_number', report.invoice_number)
        .maybeSingle();

      if (invoice?.id) {
        await supabase
          .from('invoices')
          .update({ status: 'paid', updated_at: nowIso })
          .eq('id', invoice.id);

        await supabase
          .from('receipts')
          .insert({
            receipt_number: `RCPT-MNT-${Date.now()}`,
            invoice_id: invoice.id,
            transaction_id: invoice.transaction_id || null,
            payment_method: 'bank_transfer',
            amount_paid: paidAmount,
            payment_date: nowIso,
            generated_by: (await supabase.auth.getUser()).data.user?.id || null,
          });
      }

      await fetchTransactions();
      await fetchProcurements();
    } catch (error) {
      console.error('Error paying procurement:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      tx.invoice?.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      tx.invoice?.tenant?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.invoice?.tenant?.last_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || tx.payment_method === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  const stats = {
    total_collected: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    total_transactions: transactions.length,
    avg_transaction: transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length
      : 0,
    maintenance_cost_paid: procurements
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.paid_amount || p.actual_cost || p.cost_estimate || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions & Payments</h2>
          <p className="text-gray-500">Review and monitor all financial transactions and payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Collected</p>
              <h3 className="text-2xl font-bold">KES {stats.total_collected.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <h3 className="text-2xl font-bold">{stats.total_transactions}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Transaction</p>
              <h3 className="text-2xl font-bold">KES {stats.avg_transaction.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance LPO / Invoice Approval</CardTitle>
          <CardDescription>
            Technicians submit repair needs as LPO/Invoice. Approve first, then pay through system to track maintenance costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {procurementLoading ? (
            <div className="text-sm text-gray-500">Loading procurement reports...</div>
          ) : procurements.length === 0 ? (
            <div className="text-sm text-gray-500">No maintenance LPO/Invoice reports submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LPO</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Property / Repair</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procurements.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.lpo_number || '-'}</TableCell>
                      <TableCell>{report.invoice_number || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">{report.property?.name || '-'}</div>
                        <div className="text-xs text-slate-500">{report.maintenance_request?.title || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{report.supplier_name || '-'}</div>
                        <div className="text-xs text-slate-500">{report.supplier_email || report.supplier_phone || ''}</div>
                      </TableCell>
                      <TableCell>
                        KES {Number(report.actual_cost || report.cost_estimate || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          report.status === 'paid'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : report.status === 'accountant_approved'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status === 'submitted' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={processingId === report.id}
                            onClick={() => approveProcurement(report)}
                          >
                            Approve
                          </Button>
                        )}
                        {report.status === 'accountant_approved' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={processingId === report.id}
                            onClick={() => payProcurement(report)}
                          >
                            Pay
                          </Button>
                        )}
                        {report.status === 'paid' && (
                          <span className="text-xs text-green-700 font-semibold">Paid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 text-sm font-semibold text-slate-700">
            Tracked maintenance cost paid: KES {stats.maintenance_cost_paid.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex items-center gap-2 max-w-sm bg-white p-2 rounded-lg border shadow-sm flex-1">
          <Search className="w-4 h-4 text-gray-400 ml-2" />
          <Input 
            placeholder="Search transactions..." 
            className="border-0 focus-visible:ring-0" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border-0 focus:ring-0 text-sm"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Loading transactions...</TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <DollarSign className="w-12 h-12 mb-2 opacity-20" />
                      <p>No transactions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.reference_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.invoice?.reference_number}</Badge>
                    </TableCell>
                    <TableCell>
                      {tx.invoice?.tenant?.first_name} {tx.invoice?.tenant?.last_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(tx.payment_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="capitalize">{tx.payment_method || '-'}</TableCell>
                    <TableCell className="font-bold">KES {Number(tx.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Confirmed
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Download className="w-4 h-4" />
                      </Button>
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

export default AccountantPayments;
