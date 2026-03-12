const fs = require('fs');

const files = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Using simple replace without crazy regex
    content = content.replace(
      'className="flex items-center gap-2"',
      'className={\lex items-center gap-2 \\}'
    );
    content = content.replace(
      'className="flex items-center gap-2"',
      'className={\lex items-center gap-2 \\}'
    );
    content = content.replace(
      'className="flex items-center gap-2"',
      'className={\lex items-center gap-2 \\}'
    );
    content = content.replace(
      'className="flex items-center gap-2"',
      'className={\lex items-center gap-2 \\}'
    );

    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed', p);
  }
}
