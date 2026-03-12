const fs = require("fs");
let code = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");

const tStart = code.indexOf("const pdfeBlob = generateReceiptPDF(receiptData);");
const tEnd = code.indexOf("toast.success(", tStart);
if (tStart !== -1 && tEnd !== -1) {
    const toReplace = code.substring(tStart, tEnd);
    const replacement = "const pBlob = generateReceiptPDF(receiptData);\n        const name = (tenant.tenant_name || \"N_A\").replace(/\\s+/g, \"_\");\n        saveAs(pBlob, \"Receipt_\" + name + \"_\" + new Date().toISOString().split(\"T\")[0] + \".pdf\");\n        ";
    code = code.substring(0, tStart) + replacement + code.substring(tEnd);
    fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", code);
    console.log("Success with exact string splitting!");
}

