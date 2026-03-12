const fs = require("fs");
const content = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");
const pStart = content.indexOf("const downloadReceiptPdf = (tenant: TenantWithReadings) => {");
const pEnd = content.indexOf("const handleSendInvoice", pStart);

const toReplace = content.substring(pStart, pEnd);

const replacement = `const downloadReceiptPdf = (tenant: TenantWithReadings) => {
    if (!tenant.latest_receipt) {
      toast.error("No receipt found yet for this tenant");
      return;
    }

    // Attempt to pull exact breakdown from latest reading
    const items = [];
    if (tenant.rent_amount > 0) {
      items.push({ description: "Rent (Fixed from Unit Price)", amount: tenant.rent_amount, type: "rent" });
    }
    if (tenant.latest_reading?.electricity_bill !== undefined) {
      items.push({ description: "Electricity", amount: tenant.latest_reading.electricity_bill, type: "electricity" });
    }
    if (tenant.latest_reading?.water_bill !== undefined) {
      items.push({ description: "Water", amount: tenant.latest_reading.water_bill, type: "water" });
    }
    if (tenant.latest_reading?.garbage_fee !== undefined) {
      items.push({ description: "Garbage", amount: tenant.latest_reading.garbage_fee, type: "garbage" });
    }
    if (tenant.latest_reading?.security_fee !== undefined) {
      items.push({ description: "Security", amount: tenant.latest_reading.security_fee, type: "security" });
    }
    if (tenant.latest_reading?.service_fee !== undefined) {
      items.push({ description: "Service", amount: tenant.latest_reading.service_fee, type: "service" });
    }
    if (tenant.latest_reading?.other_charges !== undefined) {
      items.push({ description: "Other Charges", amount: tenant.latest_reading.other_charges, type: "other" });
    }

    // Embed missing metadata directly from the tenant object
    const enrichedReceipt = {
      ...tenant.latest_receipt,
      metadata: {
        ...(tenant.latest_receipt.metadata || {}),
        items: items, // <--- Injection of items
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
        const pBlob = generateReceiptPDF(receiptData);
        const name = tenant.tenant_name ? tenant.tenant_name.replace(/\\s+/g, "_") : "N_A";
        saveAs(pBlob, "Receipt_" + name + "_" + new Date().toISOString().split("T")[0] + ".pdf");
        toast.success("Receipt downloaded successfully");
    } catch(err) {
        console.error("Using fallback download Receipt PDF");
        downloadReceiptPDF(receiptData);
    }
  };

  `;

fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", content.replace(toReplace, replacement));
console.log("Replaced downloadReceiptPdf items generation.");

