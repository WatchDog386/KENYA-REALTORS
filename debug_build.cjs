const fs = require("fs");
let code = fs.readFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", "utf8");
console.log(code.match(/Receipt.*pdf/g));
const lines = code.split("\n");
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("Receipt_") && lines[i].includes(".pdf")) {
         console.log("Found line", i, lines[i]);
         lines[i] = "        saveAs(pBlob, \"Receipt_\" + name + \"_\" + new Date().toISOString().split(\"T\")[0] + \".pdf\");";
    }
}
fs.writeFileSync("src/pages/portal/SuperAdminUtilitiesManager.tsx", lines.join("\n"));

