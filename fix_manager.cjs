const fs = require('fs');
let code = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

code = code.replace(
  '(profile.email?.toLowerCase().includes(searchString)) ||',
  '(profile.email?.toLowerCase().includes(searchString)) ||\n      (app.applicant_name?.toLowerCase().includes(searchString)) ||'
);

code = code.replace(
                    '{app.profiles?.first_name} {app.profiles?.last_name}',
                    '{app.applicant_name || (app.profiles ? \\ \\ : "Unknown")}'
);
code = code.replace(
                    '<a href={\mailto:\\} className="flex items-center gap-2 hover:text-[#154279] transition-colors">',
                    '<a href={\mailto:\\} className="flex items-center gap-2 hover:text-[#154279] transition-colors">'
);
code = code.replace(
                      '{app.profiles?.email}',
                      '{app.applicant_email || app.profiles?.email || "N/A"}'
);
code = code.replace(
                      '<a href={\	el:\\} className="flex items-center gap-2 hover:text-[#154279] transition-colors">',
                      '<a href={\	el:\\} className="flex items-center gap-2 hover:text-[#154279] transition-colors">'
);
code = code.replace(
                      '{app.profiles?.phone}',
                      '{app.telephone_numbers || app.profiles?.phone || "N/A"}'
);

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', code);
