// src/utils/receiptGenerator.ts
// Utility for generating PDF receipts for successful payments

import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Set default font
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Header section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'PROPERTY MANAGEMENT SYSTEM', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (data.companyAddress) {
    doc.text(data.companyAddress, margin, yPosition);
    yPosition += 5;
  }
  
  if (data.companyPhone) {
    doc.text(`Phone: ${data.companyPhone}`, margin, yPosition);
    yPosition += 5;
  }

  // Receipt title
  yPosition += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', margin, yPosition);

  // Receipt number and date
  yPosition += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Receipt #: ${data.receiptNumber}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Date: ${new Date(data.paidDate).toLocaleDateString()}`, margin, yPosition);

  // Separator line
  yPosition += 8;
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  // Tenant information section
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TENANT INFORMATION', margin, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${data.tenantName}`, margin, yPosition);

  yPosition += 5;
  doc.text(`Property: ${data.propertyName}`, margin, yPosition);

  yPosition += 5;
  doc.text(`Unit: ${data.unitNumber}`, margin, yPosition);

  // Payment details section
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PAYMENT DETAILS', margin, yPosition);

  // Create table for payment details
  const tableData = [
    ['Description', 'Amount'],
    ['Rent Payment', `KES ${parseFloat(data.amount.toString()).toFixed(2)}`],
  ];

  (doc as any).autoTable({
    startY: yPosition + 6,
    head: [tableData[0]],
    body: [tableData[1]],
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Total amount (highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const totalText = `TOTAL PAID: KES ${parseFloat(data.amount.toString()).toFixed(2)}`;
  const textWidth = doc.getTextWidth(totalText);
  
  doc.setDrawColor(66, 139, 202);
  doc.rect(
    pageWidth - margin - textWidth - 8,
    yPosition - 5,
    textWidth + 8,
    8,
    'F'
  );
  
  doc.setTextColor(255, 255, 255);
  doc.text(totalText, pageWidth - margin - textWidth - 4, yPosition);
  
  doc.setTextColor(0, 0, 0);

  // Additional details
  yPosition += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  const detailsStartY = yPosition;
  
  if (data.invoiceDate) {
    doc.text(`Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }

  if (data.dueDate) {
    doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
  }

  doc.text(`Payment Method: ${data.paymentMethod}`, margin, yPosition);
  yPosition += 5;
  
  doc.text(`Transaction Reference: ${data.transactionReference}`, margin, yPosition);

  // Footer
  yPosition = pageHeight - margin - 15;
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 5;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'This is a receipt for your rent payment. Keep it for your records.',
    margin,
    yPosition,
    { align: 'center', maxWidth: pageWidth - 2 * margin }
  );

  yPosition += 5;
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    margin,
    yPosition,
    { align: 'center', maxWidth: pageWidth - 2 * margin }
  );

  // Return as blob
  return doc.output('blob');
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
