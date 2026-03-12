const fs = require('fs');

const filePaths = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of filePaths) {
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, 'utf8');
  
  // Replace the thick dark blue ring which might be seen as black to a lighter one
  content = content.replace(/focus:ring-\[#154279\]/g, 'focus:ring-blue-100 focus:border-blue-500 border-slate-200');
  
  // Actually, wait, let me use standard tailwind focus
  content = content.replace(/focus:border-blue-500 border-slate-200/g, 'focus:border-blue-500 focus:ring-blue-100');

  // Also replace 'border-slate-200 focus:ring-blue-100 focus:border-blue-500' if duplicated
  
  fs.writeFileSync(p, content, 'utf8');
}
