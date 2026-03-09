import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  MoreHorizontal,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/utils/formatCurrency';

interface Receipt {
  id: string;
  tenant_id?: string;
  property_id?: string;
  unit_id?: string;
  receipt_number: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  metadata?: any;
  generated_by: string;
  created_at: string;
  tenant?: { first_name?: string; last_name?: string; email?: string };
  property?: { name?: string; address?: string };
  unit?: { unit_number?: string; property_unit_types?: { unit_type_name?: string } };
}

const SuperAdminReceiptsManagement = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [stats, setStats] = useState({
    total_receipts: 0,
    total_amount: 0,
    sent_count: 0,
    pending_count: 0
  });

  useEffect(() => {
    fetchAllReceipts();
  }, []);

  const fetchAllReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          tenant:tenant_id(first_name, last_name, email),
          property:property_id(name, address),
          unit:unit_id(unit_number, property_unit_types(unit_type_name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReceipts(data || []);

      // Calculate stats
      const stats = {
        total_receipts: data?.length || 0,
        total_amount: data?.reduce((sum, r) => sum + r.amount_paid, 0) || 0,
        sent_count: data?.filter(r => r.status === 'sent').length || 0,
        pending_count: data?.filter(r => r.status === 'generated').length || 0
      };
      setStats(stats);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        const receiptHTML = generateReceiptHTML(receipt);
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();

        await supabase
          .from('receipts')
          .update({ status: 'downloaded', updated_at: new Date().toISOString() })
          .eq('id', receipt.id);

        await fetchAllReceipts();
      }
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast.error('Failed to download receipt');
    }
  };

  const generateReceiptHTML = (receipt: Receipt) => {
    const items = receipt.metadata?.items || [];
    const tenantName = receipt.metadata?.tenant_name || `${receipt.tenant?.first_name || ''} ${receipt.tenant?.last_name || ''}`.trim() || 'N/A';
    const propertyName = receipt.metadata?.property_name || receipt.property?.name || 'N/A';
    const houseNumber = receipt.metadata?.house_number || receipt.unit?.unit_number || 'N/A';
    const houseType = receipt.metadata?.unit_type || receipt.unit?.property_unit_types?.unit_type_name || 'N/A';
    const transactionRef = receipt.metadata?.transaction_reference || receipt.id;

    const itemsHTML = items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
          ${item.description}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          KSh ${parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `
      )
      .join('');

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
              <div class="detail-label">House Number</div>
              <div class="detail-value">${houseNumber}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">House Type</div>
              <div class="detail-value">${houseType}</div>
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
                ${itemsHTML}
                <tr class="total-row">
                  <td>Total Amount</td>
                  <td style="text-align: right;" class="total-amount">
                    KSh ${parseFloat(receipt.amount_paid.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          ` : `
            <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #154279;">
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">Total Amount Paid</div>
              <div style="font-size: 28px; font-weight: bold; color: #154279;">
                KSh ${parseFloat(receipt.amount_paid.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          `}

          <div class="footer">
            <strong style="color: #10b981;">✓ Payment Successfully Processed</strong>
            <p>This receipt confirms that payment has been received and processed.</p>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>;
      case 'generated':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" /> Generated</Badge>;
      case 'viewed':
        return <Badge className="bg-purple-100 text-purple-800"><Eye className="w-3 h-3 mr-1" /> Viewed</Badge>;
      case 'downloaded':
        return <Badge className="bg-indigo-100 text-indigo-800"><Download className="w-3 h-3 mr-1" /> Downloaded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch =
      receipt.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      receipt.metadata?.tenant_name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.tenant?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.tenant?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.tenant?.email?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.metadata?.property_name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.property?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-[#154279] tracking-tight">Receipts Management</h1>
        <p className="text-gray-600 text-[13px] font-medium">View and manage all payment receipts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_receipts}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
            <p className="text-xs text-gray-500">Receipted payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent_count}</div>
            <p className="text-xs text-gray-500">To tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_count}</div>
            <p className="text-xs text-gray-500">To be sent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Receipt Records</CardTitle>
              <CardDescription>
                {filteredReceipts.length} of {receipts.length} receipts
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search receipts..."
                  className="pl-9 w-full sm:w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="downloaded">Downloaded</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-sm font-semibold">{receipt.receipt_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {receipt.metadata?.tenant_name || `${receipt.tenant?.first_name || ''} ${receipt.tenant?.last_name || ''}`.trim() || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">{receipt.tenant?.email || 'N/A'}</span>
                        <span className="text-xs text-gray-500">{receipt.metadata?.property_name || receipt.property?.name || 'N/A'} · House {receipt.metadata?.house_number || receipt.unit?.unit_number || 'N/A'} · {receipt.metadata?.unit_type || receipt.unit?.property_unit_types?.unit_type_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(receipt.amount_paid)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{format(new Date(receipt.payment_date), 'MMM dd, yyyy')}</span>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(receipt.created_at), { addSuffix: true })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{receipt.payment_method}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReceipt(receipt)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              Receipt #{selectedReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tenant</p>
                  <p className="font-semibold">
                    {selectedReceipt.metadata?.tenant_name || `${selectedReceipt.tenant?.first_name || ''} ${selectedReceipt.tenant?.last_name || ''}`.trim() || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">{selectedReceipt.tenant?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedReceipt.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="font-semibold">{selectedReceipt.metadata?.property_name || selectedReceipt.property?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">House</p>
                  <p className="font-semibold">{selectedReceipt.metadata?.house_number || selectedReceipt.unit?.unit_number || 'N/A'} · {selectedReceipt.metadata?.unit_type || selectedReceipt.unit?.property_unit_types?.unit_type_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedReceipt.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-semibold">{format(new Date(selectedReceipt.payment_date), 'MMMM dd, yyyy')}</p>
                </div>
              </div>

              {selectedReceipt.metadata?.items && selectedReceipt.metadata.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-3">Payment Items</h4>
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    {selectedReceipt.metadata.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span className="font-mono font-semibold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadReceipt(selectedReceipt)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminReceiptsManagement;
