import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Home,
  Loader2,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUp,
  Printer
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/formatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Receipt {
  id: string;
  receipt_number: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  transaction_reference: string;
  status: string;
  metadata?: any;
  tenant?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  property?: {
    name: string;
    address: string;
  };
  unit?: {
    unit_number: string;
  };
}

const ManagerReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalReceipts: 0,
    totalAmount: 0,
    thisMonth: 0,
    thisMonthAmount: 0
  });

  useEffect(() => {
    fetchReceipts();
    
    // Subscribe to receipt changes
    const channel = supabase
      .channel('receipts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts'
        },
        () => {
          fetchReceipts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get manager's properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('property_manager_id', user.id);

      const propIds = properties?.map(p => p.id) || [];

      if (propIds.length === 0) {
        setReceipts([]);
        return;
      }

      // Fetch receipts with relations
      const { data, error } = await supabase
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
            unit_number
          )
        `)
        .in('property_id', propIds)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const receiptsList = (data || []) as Receipt[];
      setReceipts(receiptsList);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthReceipts = receiptsList.filter(r => 
        new Date(r.payment_date) >= startOfMonth
      );

      setStats({
        totalReceipts: receiptsList.length,
        totalAmount: receiptsList.reduce((sum, r) => sum + (r.amount_paid || 0), 0),
        thisMonth: thisMonthReceipts.length,
        thisMonthAmount: thisMonthReceipts.reduce((sum, r) => sum + (r.amount_paid || 0), 0)
      });

    } catch (err) {
      console.error('Error fetching receipts:', err);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || receipt.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'generated':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Generated</Badge>;
      case 'downloaded':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Downloaded</Badge>;
      case 'emailed':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Emailed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Receipts & Documents</h1>
          <p className="text-slate-600 mt-1">View and manage payment receipts issued to tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchReceipts}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00356B]">{stats.totalReceipts}</div>
            <p className="text-[12px] text-slate-500 mt-1">All generated receipts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00356B]">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-[12px] text-slate-500 mt-1">Total collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.thisMonth}</div>
            <p className="text-[12px] text-slate-500 mt-1">Receipts issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Month Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.thisMonthAmount)}</div>
            <p className="text-[12px] text-slate-500 mt-1">This month's total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by receipt #, tenant name, or property..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm font-medium"
            >
              <option value="">All Statuses</option>
              <option value="generated">Generated</option>
              <option value="downloaded">Downloaded</option>
              <option value="emailed">Emailed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Receipts {filteredReceipts.length > 0 && `(${filteredReceipts.length})`}
          </CardTitle>
          <CardDescription>
            {filteredReceipts.length === 0 ? 'No receipts found' : 'Click on a receipt to view details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No receipts found</p>
              <p className="text-slate-500 text-sm">Receipts will appear here after tenant payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono font-bold text-[#00356B]">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {receipt.tenant?.first_name} {receipt.tenant?.last_name}
                          </p>
                          <p className="text-[12px] text-slate-500">{receipt.tenant?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">
                          {receipt.unit?.unit_number || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{receipt.property?.name}</p>
                          <p className="text-[12px] text-slate-500">{receipt.property?.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(receipt.amount_paid)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{receipt.payment_method || 'Paystack'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(receipt.payment_date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receipt.status)}
                      </TableCell>
                      <TableCell>
                        <Dialog open={isReceiptDialogOpen && selectedReceipt?.id === receipt.id} onOpenChange={setIsReceiptDialogOpen}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setIsReceiptDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Receipt Details</DialogTitle>
                              <DialogDescription>
                                Receipt #{receipt.receipt_number}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedReceipt && (
                              <div className="space-y-6">
                                {/* Receipt Header */}
                                <div className="border-b pb-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-slate-600">Receipt #</p>
                                      <p className="font-bold text-lg">{selectedReceipt.receipt_number}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-slate-600">Date</p>
                                      <p className="font-bold text-lg">
                                        {format(new Date(selectedReceipt.payment_date), 'dd MMM yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Tenant Information */}
                                <div>
                                  <h3 className="font-semibold text-slate-900 mb-3">Tenant Information</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-600">Name</p>
                                      <p className="font-medium">
                                        {selectedReceipt.tenant?.first_name} {selectedReceipt.tenant?.last_name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Email</p>
                                      <p className="font-medium">{selectedReceipt.tenant?.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Unit</p>
                                      <p className="font-medium">{selectedReceipt.unit?.unit_number}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Property</p>
                                      <p className="font-medium">{selectedReceipt.property?.name}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Details */}
                                <div className="bg-slate-50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-slate-900 mb-3">Payment Details</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-600">Amount</p>
                                      <p className="font-bold text-lg text-emerald-600">
                                        {formatCurrency(selectedReceipt.amount_paid)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Payment Method</p>
                                      <p className="font-medium">{selectedReceipt.payment_method}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Transaction Ref</p>
                                      <p className="font-mono text-xs">{selectedReceipt.transaction_reference}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-600">Status</p>
                                      {getStatusBadge(selectedReceipt.status)}
                                    </div>
                                  </div>
                                </div>

                                {/* Items from metadata */}
                                {selectedReceipt.metadata?.items && selectedReceipt.metadata.items.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-slate-900 mb-3">Payment Items</h3>
                                    <div className="space-y-2">
                                      {selectedReceipt.metadata.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                          <span className="text-sm">{item.description}</span>
                                          <span className="font-medium text-slate-900">
                                            {formatCurrency(item.amount)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                  <Button className="flex-1" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                  </Button>
                                  <Button className="flex-1" variant="outline">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerReceipts;
