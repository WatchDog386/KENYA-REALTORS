const fs = require('fs');
let c = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

const regex = /{app\.applicant_name \|\| \(app\.profiles \? [^:]+ : "Unknown"\)}/g;

c = c.replace(regex, '{app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}');

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', c);
