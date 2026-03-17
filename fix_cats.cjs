const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('git grep -l "technician_categories(name)"').toString().trim().split('\n');
files.forEach(f => {
  if(f) {
    const trimmedF = f.trim();
    const content = fs.readFileSync(trimmedF, 'utf8');
    fs.writeFileSync(trimmedF, content.replace(/technician_categories\(name\)/g, 'technician_categories:category_id(name)'));
    console.log('Fixed', trimmedF);
  }
});
