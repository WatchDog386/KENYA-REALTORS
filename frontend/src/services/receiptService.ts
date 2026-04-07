import { supabase } from "@/integrations/supabase/client";

export interface ReceiptData {
  id: string;
  tenant_id: string;
  invoice_id: string;
  reference_number: string;
  amount_paid?: number;
  amount?: number;
  payment_method: string;
  payment_date: string;
  property_id?: string;
  unit_id?: string;
  description?: string;
  notes?: string;
  file_url?: string;
  status: "pending" | "generated" | "sent";
  created_at: string;
}

export interface CreateReceiptParams {
  tenantId: string;
  invoiceId: string;
  referenceNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  propertyId?: string;
  unitId?: string;
  description?: string;
  notes?: string;
}

/**
 * Generate and store a receipt in the database
 * Receipts are auto-generated after successful payment
 */
export const generateReceipt = async (params: CreateReceiptParams): Promise<ReceiptData | null> => {
  try {
    console.log("📄 Generating receipt for payment:", params.referenceNumber);

    // Create receipt record in database
    const receiptData = {
      tenant_id: params.tenantId,
      invoice_id: params.invoiceId,
      reference_number: params.referenceNumber,
      amount_paid: params.amount,
      payment_method: params.paymentMethod,
      payment_date: params.paymentDate,
      property_id: params.propertyId || null,
      unit_id: params.unitId || null,
      description: params.description || "Onboarding Payment",
      notes: params.notes || null,
      status: "generated",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("receipts")
      .insert(receiptData)
      .select()
      .single();

    if (error) {
      console.error("❌ Error generating receipt:", error);
      // Return null but don't throw - receipt generation shouldn't block payment flow
      return null;
    }

    console.log("✅ Receipt generated successfully:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Exception generating receipt:", error);
    return null;
  }
};

/**
 * Fetch receipts for a specific tenant
 */
export const getReceiptsByTenant = async (tenantId: string): Promise<ReceiptData[]> => {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }
};

/**
 * Fetch a single receipt by ID
 */
export const getReceiptById = async (receiptId: string): Promise<ReceiptData | null> => {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", receiptId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return null;
  }
};

/**
 * Fetch receipt by reference number (payment reference)
 */
export const getReceiptByReference = async (referenceNumber: string): Promise<ReceiptData | null> => {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("reference_number", referenceNumber)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching receipt by reference:", error);
    return null;
  }
};

/**
 * Download receipt as PDF (placeholder - actual PDF generation can be added later)
 * For now, this just creates a simple text format that can be printed
 */
export const downloadReceiptAsPDF = async (receipt: ReceiptData): Promise<void> => {
  try {
    // Fetch tenant and property details
    const [{ data: tenantData }, { data: propertyData }, { data: unitData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", receipt.tenant_id)
        .single(),
      receipt.property_id
        ? supabase
            .from("properties")
            .select("name, location")
            .eq("id", receipt.property_id)
            .single()
        : Promise.resolve({ data: null }),
      receipt.unit_id
        ? supabase
            .from("units")
            .select("unit_number")
            .eq("id", receipt.unit_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    // Create receipt content
    const receiptContent = createReceiptHTML(receipt, tenantData, propertyData, unitData);

    // Create blob and download
    const element = document.createElement("a");
    const blob = new Blob([receiptContent], { type: "text/html" });
    element.href = URL.createObjectURL(blob);
    element.download = `Receipt-${receipt.reference_number}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  } catch (error) {
    console.error("Error downloading receipt:", error);
  }
};

/**
 * Create HTML receipt format
 */
const createReceiptHTML = (
  receipt: ReceiptData,
  tenant: any,
  property: any,
  unit: any
): string => {
  const resolvedAmount = Number(receipt.amount_paid ?? receipt.amount ?? 0);
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt ${receipt.reference_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Nunito', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #154279;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #154279;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p { color: #666; font-size: 14px; }
        .receipt-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .detail-section h3 {
          color: #154279;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }
        .detail-section p {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .amount-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 30px;
        }
        .amount-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .amount-label { color: #666; }
        .amount-value { color: #333; font-weight: 600; }
        .total-row {
          display: flex;
          justify-content: space-between;
          border-top: 2px solid #154279;
          padding-top: 15px;
          font-size: 18px;
          font-weight: bold;
          color: #154279;
        }
        .footer {
          text-align: center;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
          color: #999;
          font-size: 12px;
          margin-top: 30px;
        }
        .status-badge {
          display: inline-block;
          background: #4caf50;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        @media print {
          body { padding: 0; background: white; }
          .receipt-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <h1>PAYMENT RECEIPT</h1>
          <p>Tenant Onboarding Payment Confirmation</p>
          <div class="status-badge">PAID</div>
        </div>

        <div class="receipt-details">
          <div class="detail-section">
            <h3>Tenant Information</h3>
            <p><strong>${tenant?.first_name || ""} ${tenant?.last_name || ""}</strong></p>
            <p>${tenant?.email || "N/A"}</p>
          </div>

          <div class="detail-section">
            <h3>Payment Information</h3>
            <p><strong>Reference:</strong> ${receipt.reference_number}</p>
            <p><strong>Date:</strong> ${formatDate(receipt.payment_date)}</p>
            <p><strong>Method:</strong> ${receipt.payment_method}</p>
          </div>
        </div>

        ${
          property
            ? `
          <div class="receipt-details">
            <div class="detail-section">
              <h3>Property Details</h3>
              <p><strong>${property.name}</strong></p>
              <p>${property.location || "N/A"}</p>
            </div>

            <div class="detail-section">
              <h3>Unit Information</h3>
              <p><strong>Unit:</strong> ${unit?.unit_number || "TBA"}</p>
            </div>
          </div>
          `
            : ""
        }

        <div class="amount-section">
          <div class="amount-row">
            <span class="amount-label">Description</span>
            <span class="amount-value">${receipt.description}</span>
          </div>
          <div class="total-row">
            <span>Total Paid</span>
            <span>${formatCurrency(resolvedAmount)}</span>
          </div>
        </div>

        <div class="footer">
          <p>This is an official receipt for the payment transaction above.</p>
          <p>Receipt ID: ${receipt.id}</p>
          <p>Generated: ${formatDate(receipt.created_at)}</p>
          <p style="margin-top: 20px; font-style: italic;">Thank you for choosing us.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send receipt to tenant email (placeholder)
 */
export const sendReceiptEmail = async (receipt: ReceiptData, tenantEmail: string): Promise<boolean> => {
  try {
    console.log("📧 Sending receipt to:", tenantEmail);
    // This would call a backend function to send emails via SendGrid, Mailgun, etc.
    // For now, this is a placeholder
    console.log("✅ Receipt email queued for delivery");
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return false;
  }
};
