const fs = require("fs");
let code = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");

const targetMethod = "  const downloadReceiptPdf = (tenant: TenantWithReadings) => {";
const start = code.indexOf(targetMethod);
const end = code.indexOf("  const handleSendInvoice = async () => {");

if (start !== -1 && end !== -1) {
    const toReplace = code.substring(start, end);
    const newMethod = `  const downloadReceiptPdf = (tenant: TenantWithReadings) => {
    if (!tenant.latest_receipt) {
      toast.error("No receipt found yet for this tenant");
      return;
    }

    // Embed missing metadata directly from the tenant object
    const enrichedReceipt = {
      ...tenant.latest_receipt,
      metadata: {
        ...(tenant.latest_receipt.metadata || {}),
        tenant_name: tenant.tenant_name,
        property_name: tenant.property_name,
        unit_number: tenant.unit_number || "N/A"
      }
    };

    const receiptData = formatReceiptData(enrichedReceipt, {
      name: "KENYA REALTORS",
      address: "Nairobi, Kenya",
      phone: "+254 700 000 000",
    });

    try {
        const pdfeBlob = generateReceiptPDF(receiptData);
        saveAs(pdfeBlob, \\\`Receipt_\\\${tenant.tenant_name.replace(/\\\\s+/g, "_")}_\\\${new Date().toISOString().split("T")[0]}.pdf\\\`);
        toast.success("Receipt downloaded successfully");
    } catch(err) {
        // Fallback to older import pattern if needed
        console.error("Using fallback download Receipt PDF");
        downloadReceiptPDF(receiptData);
    }
  };

`;
    fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", code.replace(toReplace, newMethod));
    console.log("Replaced downloadReceiptPdf");
} else {
    console.log("Failed to find replace block", start, end);
}
