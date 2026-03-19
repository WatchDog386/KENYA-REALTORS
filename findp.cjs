const fs = require('fs');
let txt = fs.readFileSync('src/components/portal/manager/ManagerTenants.tsx.bak', 'utf8');

let listStart = txt.indexOf("<Table");
// Find where propertyName was used in list mode
let pn = txt.indexOf("propertyName", listStart);
console.log(txt.substring(pn - 100, pn + 100));
