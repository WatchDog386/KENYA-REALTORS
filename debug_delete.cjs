const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

code = code.replace(/toast\.success\('Application deleted successfully'\);/g, "toast.success('Application deleted successfully');\n    setApplications(prev => prev.filter(a => a.id !== id));");

fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);
