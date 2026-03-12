const fs = require("fs");
let code = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");

// Fix the backticks 
code = code.replace(/\\`Receipt_\\\${tenant\.tenant_name\.replace\(\/\\\\s\+\/g, "_"\)}_\\\${new Date\(\)\.toISOString\(\)\.split\("T"\)\[0\]}\.pdf\\`/g, 
"`Receipt_${tenant.tenant_name.replace(/\\s+/g, \"_\")}_${new Date().toISOString().split(\"T\")[0]}.pdf`");

// Add missing generateReceiptPDF import
if (code.indexOf("import { formatReceiptData, downloadReceiptPDF }") !== -1) {
    code = code.replace("import { formatReceiptData, downloadReceiptPDF }", "import { formatReceiptData, downloadReceiptPDF, generateReceiptPDF }");
}
// Add missing saveAs import
if (code.indexOf("import { saveAs }") === -1) {
    code = `import { saveAs } from "file-saver";\n` + code;
}

fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", code);

