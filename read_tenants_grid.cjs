const fs = require('fs');
let text = fs.readFileSync('src/components/portal/manager/ManagerTenants.tsx', 'utf8');
let idx = text.indexOf("bg-gradient-to-r from-emerald-500 to-teal-600");
console.log(text.substring(idx - 200, idx + 1500));
