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

const AccountantPayments = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
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
