const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

// Update filter dropdown
code = code.replace(/<SelectItem value="approved">Approved<\/SelectItem>/g, '<SelectItem value="manager_approved">Manager Approved</SelectItem>\n              <SelectItem value="approved">Approved</SelectItem>');

// Update stats
code = code.replace(/approved: applications\.filter\(a => a\.status === 'approved'\)\.length,/g, "approved: applications.filter(a => a.status === 'approved').length,\n    manager_approved: applications.filter(a => a.status === 'manager_approved').length,");

// Add Stats card for manager_approved right before approved
code = code.replace(/{ label: 'Approved', value: stats\.approved, color: 'from-green-500 to-green-600' },/g, "{ label: 'Manager Approved', value: stats.manager_approved, color: 'from-blue-400 to-blue-500' },\n          { label: 'Approved', value: stats.approved, color: 'from-green-500 to-green-600' },");

fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);
