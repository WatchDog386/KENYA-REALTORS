const fs = require('fs');
const file = 'src/pages/portal/tenant/Payments.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<Tabs defaultValue="all" className="w-full"[\s\S]*?<Tabs defaultValue="all" className="w-full"/, '<Tabs defaultValue="all" className="w-full"');
fs.writeFileSync(file, content);
console.log("Fixed duplicate tabs!");
