const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

code = code.replace(/user_roles/g, 'profiles'); // Actually wait, need to check how it was inserted
console.log(code.includes('user_roles'));
