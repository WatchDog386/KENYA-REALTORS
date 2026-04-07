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
  tenant_id?: string;
  property_id?: string;
  unit_id?: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  status: string;
  created_at: string;
  metadata?: any;
  tenant?: { first_name?: string; last_name?: string; email?: string };
  property?: { name?: string; address?: string; location?: string };
  unit?: { unit_number?: string; property_id?: string; property_unit_types?: { unit_type_name?: string } };
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

    // Subscribe to real-time receipt updates
    const generatedByChannel = supabase
      .channel(`receipts_generated_by_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `generated_by=eq.${tenantId}`
        },
        () => fetchReceipts()
      )
      .subscribe();

    const tenantIdChannel = supabase
      .channel(`receipts_tenant_id_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => fetchReceipts()
      )
      .subscribe();

    return () => {
      generatedByChannel.unsubscribe();
      tenantIdChannel.unsubscribe();
    };
  }, [tenantId]);

  const createReceiptNumber = () => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${randomPart}`;
  };

  const ensureMissingReceipts = async () => {
    try {
      if (!tenantId) return;

      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('id, property_id, unit_id')
        .eq('user_id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      if (!tenantRow) return;

      const [{ data: profile }, { data: property }, { data: unit }, { data: existingReceipts }] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', tenantId)
          .maybeSingle(),
        supabase
          .from('properties')
          .select('name')
          .eq('id', tenantRow.property_id)
          .maybeSingle(),
        supabase
          .from('units')
          .select('unit_number, property_unit_types(unit_type_name)')
          .eq('id', tenantRow.unit_id)
          .maybeSingle(),
        supabase
          .from('receipts')
          .select('id, metadata')
          .eq('generated_by', tenantId),
      ]);

      const tenantName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
      const propertyName = property?.name || null;
      const unitNumber = unit?.unit_number || null;
      // @ts-ignore
      const unitType = unit?.property_unit_types?.unit_type_name || null;

      const existingSourceKeys = new Set(
        (existingReceipts || [])
          .map((receipt: any) => {
            const sourceType = receipt?.metadata?.source_type;
            const sourceId = receipt?.metadata?.source_id;
            return sourceType && sourceId ? `${sourceType}:${sourceId}` : null;
          })
          .filter(Boolean)
      );

      let rentPayments: any[] = [];
      {
        let { data, error } = await supabase
          .from('rent_payments')
          .select('id, amount_paid, paid_date, payment_method, transaction_id, status, property_id, unit_id')
          .or(`tenant_id.eq.${tenantId},tenant_id.eq.${tenantRow.id}`)
          .gt('amount_paid', 0);

        // If payment_method or transaction_id fail, try without them
        if (error && (String(error.message || '').toLowerCase().includes('payment_method') || String(error.message || '').toLowerCase().includes('transaction_id'))) {
          ({ data, error } = await supabase
            .from('rent_payments')
            .select('id, amount_paid, paid_date, status, property_id, unit_id')
            .or(`tenant_id.eq.${tenantId},tenant_id.eq.${tenantRow.id}`)
            .gt('amount_paid', 0));
        }

        // If still failing, try minimal columns
        if (error) {
          ({ data, error } = await supabase
            .from('rent_payments')
            .select('id, amount_paid, status, unit_id, property_id')
            .or(`tenant_id.eq.${tenantId},tenant_id.eq.${tenantRow.id}`)
            .gt('amount_paid', 0));
        }

        if (error) {
          console.warn('Could not fetch rent payments:', error);
          rentPayments = [];
        } else {
          rentPayments = (data || []).map((row: any) => ({
            id: row.id,
            amount_paid: row.amount_paid,
            paid_date: row.paid_date || null,
            payment_method: row.payment_method || null,
            transaction_id: row.transaction_id || null,
            status: row.status,
            property_id: row.property_id,
            unit_id: row.unit_id,
          }));
        }
      }

      let billPayments: any[] = [];
      {
        const { data, error } = await supabase
          .from('bills_and_utilities')
          .select('id, paid_amount, due_date, status, property_id, unit_id, bill_type')
          .eq('unit_id', tenantRow.unit_id)
          .gt('paid_amount', 0);

        if (error) {
          console.warn('Could not fetch bill payments:', error);
          billPayments = [];
        } else {
          billPayments = (data || []).map((row: any) => ({
            id: row.id,
            paid_amount: row.paid_amount,
            due_date: row.due_date || null,
            payment_method: row.payment_method || null,
            payment_reference: row.payment_reference || null,
            status: row.status,
            property_id: row.property_id,
            unit_id: row.unit_id,
            bill_type: row.bill_type || 'utility',
          }));
        }
      }

      const pendingCreations: Array<{
        sourceType: 'rent_payment' | 'bill_payment';
        sourceId: string;
        amount: number;
        paymentDate: string;
        paymentMethod: string;
        transactionReference: string;
        items: any[];
        propertyId?: string;
        unitId?: string;
      }> = [];

      for (const rent of rentPayments || []) {
        const sourceKey = `rent_payment:${rent.id}`;
        const amount = Math.abs(Number(rent.amount_paid) || 0);
        if (!amount || existingSourceKeys.has(sourceKey)) continue;

        pendingCreations.push({
          sourceType: 'rent_payment',
          sourceId: rent.id,
          amount,
          paymentDate: rent.paid_date || new Date().toISOString(),
          paymentMethod: rent.payment_method || 'paystack',
          transactionReference: rent.transaction_id || `rent-backfill-${rent.id}`,
          items: [{ description: 'Rent Payment', amount, type: 'rent' }],
          propertyId: rent.property_id || tenantRow.property_id,
          unitId: rent.unit_id || tenantRow.unit_id,
        });
      }

      for (const bill of billPayments || []) {
        const sourceKey = `bill_payment:${bill.id}`;
        const amount = Math.abs(Number(bill.paid_amount) || 0);
        if (!amount || existingSourceKeys.has(sourceKey)) continue;

        const rawType = bill.bill_type || 'utility';
        const label = rawType.charAt(0).toUpperCase() + rawType.slice(1);

        pendingCreations.push({
          sourceType: 'bill_payment',
          sourceId: bill.id,
          amount,
          paymentDate: bill.due_date || new Date().toISOString(),
          paymentMethod: bill.payment_method || 'paystack',
          transactionReference: bill.payment_reference || `bill-backfill-${bill.id}`,
          items: [{ description: `${label} Bill`, amount, type: rawType }],
          propertyId: bill.property_id || tenantRow.property_id,
          unitId: bill.unit_id || tenantRow.unit_id,
        });
      }

      for (const payment of pendingCreations) {
        const { data: createdReceipt, error: receiptError } = await supabase
          .from('receipts')
          .insert([
            {
              receipt_number: createReceiptNumber(),
              tenant_id: tenantId,
              generated_by: tenantId,
              property_id: payment.propertyId,
              unit_id: payment.unitId,
              amount_paid: payment.amount,
              payment_method: payment.paymentMethod,
              payment_date: payment.paymentDate,
              transaction_reference: payment.transactionReference,
              status: 'generated',
              metadata: {
                items: payment.items,
                tenant_name: tenantName || null,
                property_name: propertyName,
                unit_number: unitNumber,
                house_number: unitNumber,
                unit_type: unitType,
                transaction_reference: payment.transactionReference,
                source_type: payment.sourceType,
                source_id: payment.sourceId,
              },
            },
          ])
          .select('id')
          .single();

        if (receiptError || !createdReceipt?.id) {
          console.warn('Failed to backfill receipt:', payment.sourceType, payment.sourceId, receiptError);
          continue;
        }

        // Optional linking if receipt_id columns exist in this deployment
        try {
          if (payment.sourceType === 'rent_payment') {
            const { error: linkError } = await supabase
              .from('rent_payments')
              .update({ receipt_id: createdReceipt.id } as any)
              .eq('id', payment.sourceId);
            // Silently ignore if receipt_id column doesn't exist
            if (linkError && !String(linkError.message || '').toLowerCase().includes('receipt_id')) {
              console.warn('Unexpected error linking rent payment:', linkError);
            }
          } else {
            const { error: linkError } = await supabase
              .from('bills_and_utilities')
              .update({ receipt_id: createdReceipt.id } as any)
              .eq('id', payment.sourceId);
            // Silently ignore if receipt_id column doesn't exist
            if (linkError && !String(linkError.message || '').toLowerCase().includes('receipt_id')) {
              console.warn('Unexpected error linking bill payment:', linkError);
            }
          }
        } catch (err) {
          // Ignore link failure on schemas without receipt_id columns
          console.debug('Exception during receipt linking:', err);
        }
      }
    } catch (error) {
      console.error('Error generating missing receipts:', error);
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      await ensureMissingReceipts();

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .or(`generated_by.eq.${tenantId},tenant_id.eq.${tenantId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch receipts:', error);
        setReceipts([]);
      } else {
        const receiptRows = data || [];

        const tenantIds = [...new Set(receiptRows.map((row: any) => row.tenant_id).filter(Boolean))];
        const propertyIds = [...new Set(receiptRows.map((row: any) => row.property_id).filter(Boolean))];
        const unitIds = [...new Set(receiptRows.map((row: any) => row.unit_id).filter(Boolean))];

        const [profilesRes, propertiesRes, unitsRes] = await Promise.all([
          tenantIds.length
            ? supabase.from('profiles').select('id, first_name, last_name, email').in('id', tenantIds)
            : Promise.resolve({ data: [], error: null } as any),
          propertyIds.length
            ? supabase.from('properties').select('id, name, location').in('id', propertyIds)
            : Promise.resolve({ data: [], error: null } as any),
          unitIds.length
            ? supabase.from('units').select('id, unit_number, property_id, property_unit_types(unit_type_name)').in('id', unitIds)
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        const profileMap = new Map((profilesRes.data || []).map((profile: any) => [profile.id, profile]));
        const propertyMap = new Map((propertiesRes.data || []).map((property: any) => [property.id, property]));
        const unitMap = new Map((unitsRes.data || []).map((unit: any) => [unit.id, unit]));

        const missingPropertyIds = [...new Set(
          (unitsRes.data || [])
            .map((unit: any) => unit.property_id)
            .filter((id: string | undefined) => id && !propertyMap.has(id))
        )] as string[];

        if (missingPropertyIds.length > 0) {
          const { data: additionalProperties } = await supabase
            .from('properties')
            .select('id, name, location')
            .in('id', missingPropertyIds);

          (additionalProperties || []).forEach((property: any) => {
            propertyMap.set(property.id, property);
          });
        }

        const enriched = receiptRows.map((row: any) => {
          const unit = unitMap.get(row.unit_id) as any;
          const property = propertyMap.get(row.property_id) || (unit?.property_id ? propertyMap.get(unit.property_id) : undefined);

          return {
            ...row,
            tenant: profileMap.get(row.tenant_id),
            property,
            unit,
          };
        });

        setReceipts(enriched);
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
      tenantName: receipt.metadata?.tenant_name || `${receipt.tenant?.first_name || ''} ${receipt.tenant?.last_name || ''}`.trim() || 'N/A',
      propertyName: receipt.metadata?.property_name || receipt.property?.name || 'N/A',
      houseNumber: receipt.metadata?.house_number || receipt.metadata?.unit_number || receipt.unit?.unit_number || 'N/A',
      houseType: receipt.metadata?.unit_type || receipt.unit?.property_unit_types?.unit_type_name || 'N/A',
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
                <div class="detail-label">House Number</div>
                <div class="detail-value">${receiptData.houseNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">House Type</div>
                <div class="detail-value">${receiptData.houseType}</div>
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
                <div>
                  <p className="text-sm text-slate-600">Tenant</p>
                  <p className="font-semibold">
                    {selectedReceipt.metadata?.tenant_name || `${selectedReceipt.tenant?.first_name || ''} ${selectedReceipt.tenant?.last_name || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Property</p>
                  <p className="font-semibold">{selectedReceipt.metadata?.property_name || selectedReceipt.property?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">House Number</p>
                  <p className="font-semibold">{selectedReceipt.metadata?.house_number || selectedReceipt.metadata?.unit_number || selectedReceipt.unit?.unit_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">House Type</p>
                  <p className="font-semibold">{selectedReceipt.metadata?.unit_type || selectedReceipt.unit?.property_unit_types?.unit_type_name || 'N/A'}</p>
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
