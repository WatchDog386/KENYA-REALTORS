import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReceiptData {
  tenant_id: string;
  property_id: string;
  unit_id: string;
  payment_amount: number;
  payment_method: string;
  transaction_reference: string;
  payment_date: string;
  items: Array<{
    description: string;
    amount: number;
    type: 'rent' | 'electricity' | 'water' | 'garbage' | 'security' | 'service' | 'other';
  }>;
  rent_payment_id?: string;
  bill_payment_id?: string;
}

/**
 * Generate a unique receipt number based on date and sequence
 */
export const generateReceiptNumber = async (): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  const dateStart = `${year}-${month}-${day}T00:00:00Z`;
  const dateEnd = `${year}-${month}-${day}T23:59:59Z`;

  // Get count of receipts created today
  const { count } = await supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dateStart)
    .lte('created_at', dateEnd);

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `RCP-${datePrefix}-${sequence}`;
};

/**
 * Create a receipt in the database
 */
export const createReceipt = async (data: ReceiptData) => {
  try {
    const receiptNumber = await generateReceiptNumber();

    // Get tenant and property info
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id, user_id')
      .eq('user_id', data.tenant_id)
      .single();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', data.tenant_id)
      .single();

    const { data: propertyData } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', data.property_id)
      .single();

    // Create receipt record
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert([
        {
          receipt_number: receiptNumber,
          amount_paid: data.payment_amount,
          payment_method: data.payment_method,
          payment_date: data.payment_date,
          generated_by: data.tenant_id, // The tenant who made the payment
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Store additional data as JSON
          metadata: {
            items: data.items,
            unit_id: data.unit_id,
            tenant_email: userProfile?.email,
            tenant_name: `${userProfile?.first_name} ${userProfile?.last_name}`,
            property_name: propertyData?.name,
            transaction_reference: data.transaction_reference,
            rent_payment_id: data.rent_payment_id,
            bill_payment_id: data.bill_payment_id,
          }
        }
      ])
      .select('*')
      .single();

    if (insertError) throw insertError;

    return {
      success: true,
      receipt: receipt,
      receiptNumber: receiptNumber,
      tenantEmail: userProfile?.email,
      tenantName: `${userProfile?.first_name} ${userProfile?.last_name}`,
      propertyName: propertyData?.name,
    };
  } catch (err) {
    console.error('Error creating receipt:', err);
    throw err;
  }
};

/**
 * Send receipt email to tenant
 */
export const sendReceiptEmail = async (
  tenantEmail: string,
  tenantName: string,
  receiptNumber: string,
  receiptData: ReceiptData,
  receiptId: string
) => {
  try {
    // Call edge function to send email
    const { data, error } = await supabase.functions.invoke('send-payment-receipt', {
      body: {
        to_email: tenantEmail,
        tenant_name: tenantName,
        receipt_number: receiptNumber,
        amount: receiptData.payment_amount,
        items: receiptData.items,
        payment_date: receiptData.payment_date,
        payment_method: receiptData.payment_method,
        transaction_reference: receiptData.transaction_reference,
        receipt_id: receiptId,
      }
    });

    if (error) {
      console.warn('Email sending failed:', error);
      // Don't throw - receipt was still created successfully
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error sending receipt email:', err);
    return { success: false, error: String(err) };
  }
};

/**
 * Complete payment and generate receipt
 */
export const processPaymentWithReceipt = async (
  tenantId: string,
  propertyId: string,
  unitId: string,
  paymentAmount: number,
  paymentMethod: string,
  transactionReference: string,
  items: ReceiptData['items'],
  rentPaymentId?: string,
  billPaymentId?: string
) => {
  const paymentDate = new Date().toISOString();

  const receiptData: ReceiptData = {
    tenant_id: tenantId,
    property_id: propertyId,
    unit_id: unitId,
    payment_amount: paymentAmount,
    payment_method: paymentMethod,
    transaction_reference: transactionReference,
    payment_date: paymentDate,
    items: items,
    rent_payment_id: rentPaymentId,
    bill_payment_id: billPaymentId,
  };

  // Create receipt
  const receiptResult = await createReceipt(receiptData);

  if (receiptResult.success && receiptResult.tenantEmail) {
    // Send email
    await sendReceiptEmail(
      receiptResult.tenantEmail,
      receiptResult.tenantName,
      receiptResult.receiptNumber,
      receiptData,
      receiptResult.receipt.id
    );
  }

  return receiptResult;
};

/**
 * Format receipt as displayable object
 */
export const formatReceiptForDisplay = (receipt: any) => {
  return {
    id: receipt.id,
    receiptNumber: receipt.receipt_number,
    amount: receipt.amount_paid,
    paymentDate: receipt.payment_date,
    paymentMethod: receipt.payment_method,
    status: receipt.status || 'generated',
    items: receipt.metadata?.items || [],
    tenantName: receipt.metadata?.tenant_name || 'N/A',
    propertyName: receipt.metadata?.property_name || 'N/A',
    transactionRef: receipt.metadata?.transaction_reference || 'N/A',
  };
};
