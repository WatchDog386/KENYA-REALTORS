const fs = require('fs');
let text = fs.readFileSync('src/components/portal/manager/ManagerUnits.tsx', 'utf8');
let idx = text.indexOf("viewMode === 'list' ? (");
console.log(text.substring(idx, idx + 1500));
