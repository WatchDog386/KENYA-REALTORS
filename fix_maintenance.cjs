const fs = require('fs');
const files = [
  'src/services/maintenanceService.ts',
  'frontend/src/services/maintenanceService.ts'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/technician_categories\(\s*id,\s*name\s*\)/g, 'technician_categories:category_id(id, name)');
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
});
