const fs = require("fs");
let code = fs.readFileSync("src/utils/receiptGenerator.ts", "utf8");

const startStr = "  let y = 108;";
const endStr = "  doc.setFillColor(241, 245, 249);";
const start = code.indexOf(startStr);
const end = code.indexOf(endStr, start);

if (start !== -1 && end !== -1) {
    const toReplace = code.substring(start, end);

    const replacement = `  let y = 108;
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "normal");
  
  const formatAmount = (amt: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amt || 0);

  if (data.items && data.items.length > 0) {
    data.items.forEach((item: any) => {
      doc.text(item.description, 16, y);
      doc.text(formatAmount(item.amount), 180, y, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.line(12, y + 4, 198, y + 4);
      y += 10;
    });
    // add small padding buffer
    y += 5;
  } else {
    doc.text("Payment Received", 16, y);
    doc.text(formatAmount(Number(data.amount)), 180, y, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.line(12, y + 4, 198, y + 4);
    y += 15;
  }

`;
    code = code.substring(0, start) + replacement + code.substring(end);
    fs.writeFileSync("src/utils/receiptGenerator.ts", code);
    console.log("Successfully replaced table logic!");
} else {
    console.log("Failed to find boundaries");
}

