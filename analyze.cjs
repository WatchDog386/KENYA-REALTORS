const fs = require('fs');
let text = fs.readFileSync('src/components/portal/manager/ManagerTenants.tsx', 'utf8');
let idx1 = text.indexOf("viewMode === 'grid' ? (");
let idx2 = text.indexOf(") : (", idx1);
console.log("Found grid block from", idx1, "to", idx2);

let listStart = text.indexOf("<Table", idx2);
let listEnd = text.indexOf("</Table>", listStart);
console.log("Found list block from", listStart, "to", listEnd);

