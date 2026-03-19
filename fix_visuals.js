const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', 'utf8');

code = code.replace(/case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" \/>;/, "case 'approved': return <CheckCircle className=\"w-4 h-4 text-green-500\" />;\n      case 'manager_approved': return <CheckCircle className=\"w-4 h-4 text-blue-500\" />;");

code = code.replace(/case 'approved': return 'bg-green-100 text-green-800 border-green-200';/, "case 'approved': return 'bg-green-100 text-green-800 border-green-200';\n      case 'manager_approved': return 'bg-blue-100 text-blue-800 border-blue-200';");

fs.writeFileSync('src/components/portal/super-admin/SuperAdminApplications.tsx', code);

// Same for manager
let code2 = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

code2 = code2.replace(/case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" \/>;/, "case 'approved': return <CheckCircle className=\"w-4 h-4 text-green-500\" />;\n      case 'manager_approved': return <CheckCircle className=\"w-4 h-4 text-blue-500\" />;");

code2 = code2.replace(/case 'approved': return 'bg-green-100 text-green-800 border-green-200';/, "case 'approved': return 'bg-green-100 text-green-800 border-green-200';\n      case 'manager_approved': return 'bg-blue-100 text-blue-800 border-blue-200';");

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', code2);
