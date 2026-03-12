const fs = require('fs');

const files = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    content = content.replace(/className=\{\nlex items-center gap-2 \}/g, 'className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-200"');
    content = content.replace(/className=\{\r\nlex items-center gap-2 \}/g, 'className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 border-slate-200"');

    fs.writeFileSync(p, content, 'utf8');
  }
}
