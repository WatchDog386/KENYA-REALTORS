// src/utils/receiptGenerator.ts
// Utility for generating PDF receipts for successful payments

import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

export interface ReceiptItem {
  description: string;
  amount: number;
  type: 'rent' | 'water' | 'electricity' | 'garbage' | 'other' | string;
}

export interface ReceiptData {
  receiptNumber: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  houseNumber?: string;
  houseType?: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  paidDate: string;
  invoiceDate?: string;
  dueDate?: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  items?: ReceiptItem[];
}

/**
 * Generate a PDF receipt for a payment
 * @param data - Receipt data
 * @returns PDF blob
 */
export const generateReceiptPDF = (data: ReceiptData): Blob => {
  const doc = new jsPDF();
  const receiptNumber = data.receiptNumber || "RCP-" + new Date().getFullYear();
  const paidDate = new Date(data.paidDate || new Date()).toLocaleDateString();
  const primaryColor = [21, 66, 121];

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.rect(12, 10, 30, 30);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont(undefined, "bold");
  doc.text(data.companyName || "KENYA REALTORS", 48, 18);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Billing and Invoicing Department", 48, 25);
  doc.text(data.companyAddress || "Nairobi, Kenya", 48, 31);

  doc.setFont(undefined, "bold");
  doc.setFontSize(22);
  doc.text("RECEIPT", 154, 20);
  doc.setFontSize(9.5);
  doc.setFont(undefined, "normal");
  doc.text("Receipt #: " + receiptNumber, 144, 29);
  doc.text("Payment Date: " + paidDate, 144, 34.5);
  doc.text("Ref: " + (data.transactionReference || "N/A"), 144, 40);

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(9.5);
  doc.text("Received From", 16, 66);
  doc.text("Payment Details", 112, 66);

  doc.setTextColor(51, 65, 85);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8.5);
  doc.text(data.tenantName || "N/A", 16, 73);
  doc.text("Unit " + (data.unitNumber || "N/A") + " • " + (data.propertyName || "N/A"), 16, 78);
  doc.text("Method: " + (data.paymentMethod || "N/A"), 112, 73);
  doc.text("Currency: KES", 112, 78);

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(12, 90, 186, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.text("Description", 16, 97);
  doc.text("Amount", 180, 97, { align: "right" });

  let y = 108;
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "normal");
  
  const formatAmount = (amt: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amt || 0);
  const amountStr = formatAmount(Number(data.amount || 0));

  if (data.items && data.items.length > 0) {
    data.items.forEach((item: any) => {
      doc.text(item.description, 16, y);
      doc.text(formatAmount(item.amount), 180, y, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.line(12, y + 4, 198, y + 4);
      y += 10;
    });
    // add small padding buffer
    y += 5;
  } else {
    doc.text("Payment Received", 16, y);
    doc.text(formatAmount(Number(data.amount)), 180, y, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.line(12, y + 4, 198, y + 4);
    y += 15;
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, y + 6, 78, 22, 2, 2, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text("TOTAL PAID:", 124, y + 20);
  doc.text(amountStr, 194, y + 20, { align: "right" });

  const footerY = 270;
  doc.setDrawColor(226, 232, 240);
  doc.line(12, footerY - 5, 198, footerY - 5);
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("KENYA REALTORS", 105, footerY, { align: "center" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Thank you for your payment!", 105, footerY + 6, { align: "center" });
  doc.text("Generated: " + new Date().toLocaleDateString(), 105, footerY + 12, { align: "center" });

  return doc.output("blob");
};

/**
 * Download receipt PDF to user's device
 * @param data - Receipt data
 * @param filename - Optional filename for the download
 */
export const downloadReceiptPDF = (
  data: ReceiptData,
  filename?: string
): void => {
  const blob = generateReceiptPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `receipt-${data.receiptNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Get receipt data from payment and invoice records
 * @param payment - Payment record with relations
 * @param receipt - Receipt record
 * @returns Formatted receipt data
 */
export const formatReceiptData = (
  receipt: any,
  companyInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    logo?: string;
  }
): ReceiptData => {
  const metadata = receipt.metadata || {};
  return {
    receiptNumber: receipt.receipt_number,
    tenantName: metadata.tenant_name || receipt.tenant_name || 'N/A',
    propertyName: metadata.property_name || receipt.property_name || 'N/A',
    unitNumber: metadata.unit_number || receipt.unit_number || 'N/A',
    houseNumber: metadata.house_number || metadata.unit_number || receipt.unit_number,
    houseType: metadata.unit_type || 'N/A',
    amount: receipt.amount_paid || receipt.amount || 0,
    paymentMethod: receipt.payment_method || 'Paystack',
    transactionReference: receipt.transaction_reference || metadata.transaction_reference || 'N/A',
    paidDate: receipt.payment_date || receipt.generated_at || new Date().toISOString(),
    items: metadata.items || [],
    companyName: companyInfo?.name || 'Property Management System',
    companyAddress: companyInfo?.address,
    companyPhone: companyInfo?.phone,
    companyLogo: companyInfo?.logo,
  };
};

/**
 * Create receipt record after payment succeeds
 */
export const processPaymentWithReceipt = async (
  userId: string,
  propertyId: string,
  unitId: string,
  paymentAmount: number,
  paymentMethod: string,
  transactionReference: string,
  items: ReceiptItem[],
  rentPaymentId?: string,
  billPaymentId?: string
): Promise<any> => {
  // receipts.tenant_id references auth.users(id), so use the authenticated user ID
  const tenantId = userId;

  const [tenantProfileResult, propertyResult, unitResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('properties')
      .select('name')
      .eq('id', propertyId)
      .maybeSingle(),
    supabase
      .from('units')
      .select('unit_number, property_unit_types(unit_type_name)')
      .eq('id', unitId)
      .maybeSingle(),
  ]);

  const tenantName = [tenantProfileResult.data?.first_name, tenantProfileResult.data?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const propertyName = propertyResult.data?.name || null;
  // @ts-ignore
  const unitType = unitResult.data?.property_unit_types?.unit_type_name || null;
  const unitNumber = unitResult.data?.unit_number || null;

  // Generate a unique receipt number using timestamp + random component to avoid collisions
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const receiptNumber = `RCP-${timestamp}-${randomPart}`;

  console.log('💾 Inserting receipt into database:', {
    receiptNumber,
    tenantId,
    userId,
    propertyId,
    unitId,
    amount: paymentAmount,
    method: paymentMethod
  });

  const { data, error } = await supabase
    .from('receipts')
    .insert([
      {
        receipt_number: receiptNumber,
        tenant_id: tenantId,
        generated_by: userId,
        property_id: propertyId,
        unit_id: unitId,
        amount_paid: paymentAmount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        transaction_reference: transactionReference,
        status: 'generated',
        metadata: {
          items,
          tenant_name: tenantName || null,
          property_name: propertyName,
          unit_number: unitNumber,
          house_number: unitNumber,
          unit_type: unitType,
          transaction_reference: transactionReference,
          rent_payment_id: rentPaymentId,
          bill_payment_id: billPaymentId,
        },
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('❌ Receipt insert failed:', {
      code: (error as any)?.code,
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      status: (error as any)?.status
    });
    throw error;
  }

  console.log('✅ Receipt inserted successfully:', data);
  return data;
};
