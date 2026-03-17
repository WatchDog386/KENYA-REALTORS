const fs = require('fs');
let c = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

c = c.replace("{app.applicant_name || (app.profiles ? \\ \\ : \"Unknown\")}", "{app.applicant_name || (app.profiles ? \\ \\ : \"Unknown\")}");
c = c.replace("{app.applicant_name || (app.profiles ? \\\\\ \\ : \"Unknown\")}", "{app.applicant_name || (app.profiles ? \\ \\ : \"Unknown\")}");

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', c);
