const fs = require('fs');
let code = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

// Also add manager_approved to ManagerApplications
code = code.replace(/<SelectItem value="all">All Applications<\/SelectItem>/g, '<SelectItem value="all">All Applications</SelectItem>\n              <SelectItem value="manager_approved">Manager Approved</SelectItem>');
code = code.replace(/approved: applications\.filter\(a => a\.status === 'approved'\)\.length,/g, "approved: applications.filter(a => a.status === 'approved').length,\n    manager_approved: applications.filter(a => a.status === 'manager_approved').length,");

code = code.replace(/{ label: 'Approved', value: stats\.approved, color: 'from-green-500 to-green-600' },/g, "{ label: 'Manager Approved', value: stats.manager_approved, color: 'from-blue-400 to-blue-500' },\n          { label: 'Approved', value: stats.approved, color: 'from-green-500 to-green-600' },");

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', code);
