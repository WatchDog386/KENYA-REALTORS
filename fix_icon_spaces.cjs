const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/<Usersize=/g, '<User size=');
txt = txt.replace(/<MessageSquaresize=/g, '<MessageSquare size=');

fs.writeFileSync(file, txt);

// also frontend if it exists
if (fs.existsSync('frontend/' + file)) {
  fs.writeFileSync('frontend/' + file, txt);
}
console.log('Fixed missing spaces in icons');
