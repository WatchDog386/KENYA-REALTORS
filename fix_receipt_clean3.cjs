const fs = require("fs");
let code = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");

const start = code.indexOf("const pdfeBlob = generateReceiptPDF(receiptData);");
if (start !== -1) {
    const end = code.indexOf("toast.success(\"Receipt downloaded successfully\");", start);
    if (end !== -1) {
        const replacement = `const pdfeBlob = generateReceiptPDF(receiptData);\n        saveAs(pdfeBlob, \`Receipt_${tenant.tenant_name.replace(/\\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf\`);\n        `;
        code = code.substring(0, start) + replacement + code.substring(end);
        fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", code);
        console.log("Replaced problematic line entirely!");
    }
}

