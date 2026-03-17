const fs = require('fs');
let c = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');
let newLines = c.split('\n');
newLines = newLines.map(line => {
  if (line.includes('app.applicant_name || (app.profiles ?')) {
    return '                      {app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}';
  }
  return line;
});
fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', newLines.join('\n'));
