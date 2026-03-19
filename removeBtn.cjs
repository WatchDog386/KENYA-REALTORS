const fs = require('fs');
const files = [
  'src/components/portal/manager/ManagerUnits.tsx',
  'frontend/src/components/portal/manager/ManagerUnits.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // Hardcode removal just using index of or split
  c = c.replace(/<Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200" onClick=\{\(\) => setIsAddUnitOpen\(true\)\}>\s*<Plus size=\{16\} className="mr-2" \/>\s*Add Unit\s*<\/Button>/g, "");

  fs.writeFileSync(file, c);
});
