const fs = require('fs');
let code = fs.readFileSync('src/components/portal/manager/ManagerApplications.tsx', 'utf8');

code = code.replace(
  \
otes?: string;\,
  \
otes?: string;\n  applicant_name?: string;\n  applicant_email?: string;\n  telephone_numbers?: string;\
);

code = code.replace(
  \properties:property_id (
             name,
             location
          ),
          units:unit_id (
             unit_number,
             price,
             status
          )
        \)
        .eq('property_id', propertyId)\,
  \properties:property_id (
             name,
             location
          ),
          units:unit_id (
             unit_number,
             price,
             status
          ),
          applicant_name,
          applicant_email,
          telephone_numbers
        \)
        .eq('property_id', propertyId)\
);

code = code.replace(
  \<p className="font-medium text-slate-900">\n                      {app.profiles?.first_name} {app.profiles?.last_name}\n                    </p>\,
  \<p className="font-medium text-slate-900">\n                      {app.applicant_name || \\ \\}\n                    </p>\
);

fs.writeFileSync('src/components/portal/manager/ManagerApplications.tsx', code);
