const fs = require('fs');
let c = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

const lines = c.split('\n');
const fixedLines = lines.map(line => {
    if (line.includes('app.applicant_name || (app.profiles ?')) {
        return '                      {app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}';
    }
    return line;
});

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', fixedLines.join('\n'));
