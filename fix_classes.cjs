const fs = require('fs');

const files = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Use regex to properly replace each specific one
    content = content.replace(/variant=\{assignmentType === 'property_manager' \? 'default' : 'outline'\}[\s\n]*onClick=\{\(\) => setAssignmentType\('property_manager'\)\}[\s\n]*className="flex items-center gap-2"/g, 
        'variant={assignmentType === \"property_manager\" ? \"default\" : \"outline\"}\n                        onClick={() => setAssignmentType(\"property_manager\")}\n                        className={lex items-center gap-2 }');

    content = content.replace(/variant=\{assignmentType === 'technician' \? 'default' : 'outline'\}[\s\n]*onClick=\{\(\) => setAssignmentType\('technician'\)\}[\s\n]*className="flex items-center gap-2"/g, 
        'variant={assignmentType === \"technician\" ? \"default\" : \"outline\"}\n                        onClick={() => setAssignmentType(\"technician\")}\n                        className={lex items-center gap-2 }');

    content = content.replace(/variant=\{assignmentType === 'proprietor' \? 'default' : 'outline'\}[\s\n]*onClick=\{\(\) => setAssignmentType\('proprietor'\)\}[\s\n]*className="flex items-center gap-2"/g, 
        'variant={assignmentType === \"proprietor\" ? \"default\" : \"outline\"}\n                        onClick={() => setAssignmentType(\"proprietor\")}\n                        className={lex items-center gap-2 }');

    content = content.replace(/variant=\{assignmentType === 'caretaker' \? 'default' : 'outline'\}[\s\n]*onClick=\{\(\) => setAssignmentType\('caretaker'\)\}[\s\n]*className="flex items-center gap-2"/g, 
        'variant={assignmentType === \"caretaker\" ? \"default\" : \"outline\"}\n                        onClick={() => setAssignmentType(\"caretaker\")}\n                        className={lex items-center gap-2 }');

    fs.writeFileSync(p, content, 'utf8');
  }
}
