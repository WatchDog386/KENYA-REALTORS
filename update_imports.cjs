const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

if (!txt.includes('function getInitials(') && !txt.includes('const getInitials =')) {
txt = txt.replace('export default function ManagerTenants() {', \
const getInitials = (first: string | null | undefined, last: string | null | undefined) => {
  return \\\\\\\\.toUpperCase() || 'T';
};
export default function ManagerTenants() {\);
}

if (!txt.includes('import { MessageSquare')) {
    txt = txt.replace(/import {([^}]+)} from 'lucide-react';/, "import {, MessageSquare, User, Calendar, FileText, Phone, Mail} from 'lucide-react';");
}

fs.writeFileSync(file, txt);

// also frontend if it exists
if (fs.existsSync('frontend/' + file)) {
  fs.writeFileSync('frontend/' + file, txt);
}
console.log('Fixed imports and getInitials function in manager tenants');
