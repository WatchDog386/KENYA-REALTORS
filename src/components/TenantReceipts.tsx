import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Receipt, Download, Mail, Eye, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReceiptRecord {
  id: string;
  receipt_number: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  created_at: string;
  metadata?: any;
}

interface TenantReceiptsProps {
  tenantId: string;
}

const TenantReceipts: React.FC<TenantReceiptsProps> = ({ tenantId }) => {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, [tenantId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('generated_by', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch receipts:', error);
        setReceipts([]);
      } else {
        setReceipts(data || []);
      }
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (receipt: ReceiptRecord) => {
    // Generate PDF or download receipt
    const receiptData = {
      receiptNumber: receipt.receipt_number,
      amount: receipt.amount_paid,
      paymentDate: format(new Date(receipt.payment_date), 'PPp'),
      paymentMethod: receipt.payment_method,
      items: receipt.metadata?.items || [],
      tenantName: receipt.metadata?.tenant_name || 'N/A',
      propertyName: receipt.metadata?.property_name || 'N/A',
      transactionRef: receipt.metadata?.transaction_reference || 'N/A',
    };

    // Create printable HTML
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${receiptData.receiptNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #154279; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { margin: 0; color: #154279; }
              .receipt-number { color: #666; font-size: 14px; margin-top: 5px; }
              .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
              .detail-item { }
              .detail-label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
              .detail-value { font-size: 16px; margin-top: 5px; color: #000; }
              table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              th { background-color: #154279; color: white; padding: 12px; text-align: left; font-weight: bold; }
              td { padding: 10px 12px; border-bottom: 1px solid #ddd; }
              tr:last-child td { border-bottom: 2px solid #154279; }
              .total-row { background-color: #f5f5f5; font-weight: bold; }
              .total-amount { font-size: 18px; color: #F96302; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .success-badge { color: #10b981; font-weight: bold; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PAYMENT RECEIPT</h1>
              <div class="receipt-number">Receipt #${receiptData.receiptNumber}</div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Property</div>
                <div class="detail-value">${receiptData.propertyName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Tenant Name</div>
                <div class="detail-value">${receiptData.tenantName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Payment Date</div>
                <div class="detail-value">${receiptData.paymentDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Payment Method</div>
                <div class="detail-value">${receiptData.paymentMethod.toUpperCase()}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Transaction Reference</div>
                <div class="detail-value">${receiptData.transactionRef}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.items.map((item: any) => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">KSh ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>TOTAL PAID</td>
                  <td style="text-align: right;" class="total-amount">KSh ${receiptData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <p class="success-badge">✓ Payment Successfully Processed</p>
              <p>This receipt confirms payment has been received. Please keep it for your records.</p>
              <p style="margin-top: 20px; color: #999;">Document generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = async (receipt: ReceiptRecord) => {
    try {
      // Trigger send email function
      const { error } = await supabase.functions.invoke('send-payment-receipt', {
        body: {
          receipt_id: receipt.id,
          receipt_number: receipt.receipt_number,
          resend: true,
        }
      });

      if (error) {
        console.error('Error sending email:', error);
      } else {
        // Success notification
        alert('Receipt sent to email successfully!');
      }
    } catch (err) {
      console.error('Error triggering email:', err);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading receipts...</div>
        </CardContent>
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No payment receipts yet.</p>
            <p className="text-sm text-slate-400 mt-1">Your receipts will appear here after you make a payment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white border border-slate-200 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#154279] to-[#1a5a96] text-white p-6">
          <div className="flex items-center gap-3">
            <Receipt size={24} />
            <div>
              <CardTitle className="text-white">Payment Receipts</CardTitle>
              <p className="text-blue-100 text-sm">Manage and download your payment receipts</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Receipt #</TableHead>
                <TableHead className="font-bold text-slate-700">Amount</TableHead>
                <TableHead className="font-bold text-slate-700">Payment Method</TableHead>
                <TableHead className="font-bold text-slate-700">Date</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt, idx) => (
                <TableRow key={receipt.id} className="hover:bg-slate-50/50 border-b border-slate-100">
                  <TableCell className="font-mono font-semibold text-[#154279]">{receipt.receipt_number}</TableCell>
                  <TableCell className="font-bold text-slate-900">{formatCurrency(receipt.amount_paid)}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {receipt.payment_method.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {format(new Date(receipt.payment_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setIsViewOpen(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50 h-8"
                      title="View details"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(receipt)}
                      className="text-green-600 hover:bg-green-50 h-8"
                      title="Download"
                    >
                      <Download size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendEmail(receipt)}
                      className="text-purple-600 hover:bg-purple-50 h-8"
                      title="Send to email"
                    >
                      <Mail size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receipt Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.receipt_number}
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Receipt Number</p>
                  <p className="font-mono font-bold">{selectedReceipt.receipt_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Amount Paid</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedReceipt.amount_paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Method</p>
                  <p className="font-semibold">{selectedReceipt.payment_method.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Date</p>
                  <p className="font-semibold">{format(new Date(selectedReceipt.payment_date), 'PPp')}</p>
                </div>
              </div>

              {selectedReceipt.metadata?.items && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">Items Paid</h3>
                  <div className="space-y-2">
                    {selectedReceipt.metadata.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-700">{item.description}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <Button
                  onClick={() => handleDownload(selectedReceipt)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download size={16} className="mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleSendEmail(selectedReceipt)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail size={16} className="mr-2" />
                  Send to Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TenantReceipts;
