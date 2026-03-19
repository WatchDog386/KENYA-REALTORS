const fs = require('fs');
let text = fs.readFileSync('src/components/portal/manager/ManagerTenants.tsx', 'utf8');
let idx = text.indexOf("Tenant Profile");
console.log(text.substring(idx - 200, idx + 2000));
