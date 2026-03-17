const fs = require('fs');

let content = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

content = content.replace(
  '{app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}',
  '{app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}'
);

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', content);
