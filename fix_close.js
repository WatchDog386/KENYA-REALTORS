const fs = require('fs');

const filePaths = [
  'src/components/portal/super-admin/PropertyManager.tsx',
  'frontend/src/components/portal/super-admin/PropertyManager.tsx'
];

for (const p of filePaths) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(
      '<Button variant="outline" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>',
      '<Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>'
  );

  fs.writeFileSync(p, content, 'utf8');
}
