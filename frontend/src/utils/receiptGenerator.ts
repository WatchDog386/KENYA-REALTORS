// src/utils/receiptGenerator.ts
// Receipt generation utility for Flutterwave payments

export interface ReceiptData {
  receiptNumber: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  transactionReference: string;
  invoiceNumber: string;
  invoiceDueDate: Date;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
}

/**
 * Generate a simple HTML receipt that can be converted to PDF
 */
export const generateReceiptHTML = (data: ReceiptData): string => {
  const formattedDate = data.paymentDate.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedAmount = data.amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${data.receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          background-color: #f5f5f5;
        }
        
        .receipt-container {
          max-width: 800px;
          margin: 20px auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .receipt-header {
          border-bottom: 3px solid #154279;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .company-info {
          margin-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #154279;
          margin-bottom: 8px;
        }
        
        .company-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        
        .receipt-title {
          text-align: right;
          font-size: 32px;
          font-weight: bold;
          color: #154279;
          margin-bottom: 10px;
        }
        
        .receipt-number {
          text-align: right;
          font-size: 14px;
          color: #666;
          margin-bottom: 30px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #154279;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .property-info,
        .tenant-info {
          font-size: 13px;
          line-height: 1.8;
        }
        
        .info-label {
          color: #888;
          font-weight: 500;
        }
        
        .info-value {
          color: #333;
          font-weight: 600;
        }
        
        .payment-details {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 30px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 14px;
        }
        
        .detail-row.total {
          border-top: 2px solid #ddd;
          padding-top: 15px;
          font-weight: bold;
          font-size: 16px;
          color: #154279;
        }
        
        .detail-label {
          color: #666;
        }
        
        .detail-value {
          text-align: right;
          color: #333;
          font-weight: 500;
        }
        
        .amount-highlight {
          color: #F96302;
          font-size: 24px;
          font-weight: bold;
        }
        
        .footer {
          border-top: 1px solid #ddd;
          padding-top: 20px;
          margin-top: 40px;
          font-size: 12px;
          color: #666;
          text-align: center;
          line-height: 1.8;
        }
        
        .thank-you {
          text-align: center;
          font-size: 14px;
          color: #154279;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .status-badge {
          display: inline-block;
          background-color: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        @media print {
          body {
            background-color: white;
          }
          
          .receipt-container {
            box-shadow: none;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <div class="company-info">
            <div class="company-name">${data.companyName || "Realtor Kenya"}</div>
            <div class="company-details">
              ${data.companyAddress ? `<div>${data.companyAddress}</div>` : ""}
              ${data.companyPhone ? `<div>Phone: ${data.companyPhone}</div>` : ""}
              ${data.companyEmail ? `<div>Email: ${data.companyEmail}</div>` : ""}
            </div>
          </div>
          <div class="receipt-title">RECEIPT</div>
          <div class="receipt-number">#${data.receiptNumber}</div>
        </div>
        
        <div class="status-badge">✓ PAID</div>
        
        <div class="section">
          <div class="two-column">
            <div class="tenant-info">
              <div class="section-title">TENANT INFORMATION</div>
              <div><span class="info-label">Name:</span> <span class="info-value">${data.tenantName}</span></div>
              <div><span class="info-label">Email:</span> <span class="info-value">${data.tenantEmail}</span></div>
            </div>
            <div class="property-info">
              <div class="section-title">PROPERTY INFORMATION</div>
              <div><span class="info-label">Property:</span> <span class="info-value">${data.propertyName}</span></div>
              <div><span class="info-label">Unit:</span> <span class="info-value">${data.unitNumber}</span></div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">PAYMENT DETAILS</div>
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${data.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invoice Due Date:</span>
              <span class="detail-value">${data.invoiceDueDate.toLocaleDateString("en-KE")}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${data.paymentMethod}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transaction Reference:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${data.transactionReference}</span>
            </div>
            <div class="detail-row total">
              <span>Amount Paid:</span>
              <span><span class="amount-highlight">${data.currency} ${formattedAmount}</span></span>
            </div>
          </div>
        </div>
        
        <div class="thank-you">
          Thank you for your payment
        </div>
        
        <div class="footer">
          <p>This is an automated receipt generated by our payment system.</p>
          <p>For any inquiries, please contact us at the above details.</p>
          <p style="margin-top: 20px; color: #999; font-size: 11px;">
            Generated on ${new Date().toLocaleString("en-KE")}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Create a receipt object with HTML content
 * In production, this would be converted to PDF and stored in Supabase Storage
 */
export const createReceipt = async (data: ReceiptData): Promise<{ html: string; receiptNumber: string }> => {
  try {
    const html = generateReceiptHTML(data);

    return {
      html,
      receiptNumber: data.receiptNumber,
    };
  } catch (error) {
    console.error("Error creating receipt:", error);
    throw error;
  }
};

/**
 * Download receipt as HTML file
 */
export const downloadReceiptHTML = (html: string, receiptNumber: string): void => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/html;charset=utf-8," + encodeURIComponent(html)
  );
  element.setAttribute("download", `receipt-${receiptNumber}.html`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Open receipt in new window for printing/PDF save
 */
export const openReceiptForPrint = (html: string): void => {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }
};
