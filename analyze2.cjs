const fs = require('fs');
let text = fs.readFileSync('src/components/portal/manager/ManagerTenants.tsx', 'utf8');
let idx3 = text.indexOf("<Dialog open={isProfileOpen}");
let idx4 = text.indexOf("</Dialog>", idx3);
console.log("Found profile dialog from", idx3, "to", idx4);
