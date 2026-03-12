const fs = require('fs');

const filePaths = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of filePaths) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(/<Button\s+type="button"\s+variant=\{assignmentType === 'property_manager' \? 'default' : 'outline'\}\s+onClick=\{\(\) => setAssignmentType\('property_manager'\)\}\s+className="flex items-center gap-2"\s+>/, \<Button
                        type="button"
                        variant={assignmentType === 'property_manager' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('property_manager')}
                        className={\\\lex items-center gap-2 \\\\\\}
                    >\);
                    
  content = content.replace(/<Button\s+type="button"\s+variant=\{assignmentType === 'technician' \? 'default' : 'outline'\}\s+onClick=\{\(\) => setAssignmentType\('technician'\)\}\s+className="flex items-center gap-2"\s+>/, \<Button
                        type="button"
                        variant={assignmentType === 'technician' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('technician')}
                        className={\\\lex items-center gap-2 \\\\\\}
                    >\);
                    
  content = content.replace(/<Button\s+type="button"\s+variant=\{assignmentType === 'proprietor' \? 'default' : 'outline'\}\s+onClick=\{\(\) => setAssignmentType\('proprietor'\)\}\s+className="flex items-center gap-2"\s+>/, \<Button
                        type="button"
                        variant={assignmentType === 'proprietor' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('proprietor')}
                        className={\\\lex items-center gap-2 \\\\\\}
                    >\);

  content = content.replace(/<Button\s+type="button"\s+variant=\{assignmentType === 'caretaker' \? 'default' : 'outline'\}\s+onClick=\{\(\) => setAssignmentType\('caretaker'\)\}\s+className="flex items-center gap-2"\s+>/, \<Button
                        type="button"
                        variant={assignmentType === 'caretaker' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('caretaker')}
                        className={\\\lex items-center gap-2 \\\\\\}
                    >\);

  fs.writeFileSync(p, content, 'utf8');
}

