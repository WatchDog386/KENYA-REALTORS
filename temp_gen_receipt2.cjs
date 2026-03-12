const fs = require("fs");
let code = fs.readFileSync("src/utils/receiptGenerator.ts", "utf8");

const tStart = code.indexOf("export const generateReceiptPDF = (data: ReceiptData): Blob => {");
const endStr = "return doc.output(";
const tEndPos = code.indexOf(endStr, tStart);
const tEnd = code.indexOf("};", tEndPos);

if (tStart !== -1 && tEnd !== -1) {
    const toReplace = code.substring(tStart, tEnd + 2);
    
    const newGenerate = `export const generateReceiptPDF = (data: ReceiptData): Blob => {
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
  doc.text("Payment Received", 16, y);
  const amountStr = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(Number(data.amount) || 0);
  doc.text(amountStr, 180, y, { align: "right" });
  doc.setDrawColor(226, 232, 240);
  doc.line(12, y + 4, 198, y + 4);

  y += 15;
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
};`;

    fs.writeFileSync("src/utils/receiptGenerator.ts", code.replace(toReplace, newGenerate));
    console.log("Successfully replaced generateReceiptPDF");
} else {
    console.log("Could not find generateReceiptPDF limits", tStart, tEnd);
}
