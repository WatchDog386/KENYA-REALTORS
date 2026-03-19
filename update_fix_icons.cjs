const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/<MessageSquare /g, '<MessageSquare');
txt = txt.replace(/<User /g, '<User');

fs.writeFileSync(file, txt);
