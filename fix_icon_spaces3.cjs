const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(/<UserclassName=/g, '<User className=');
txt = txt.replace(/<MessageSquareclassName=/g, '<MessageSquare className=');

if (txt.includes('<UserclassName')) {
   txt = txt.split('<UserclassName').join('<User className');
}
if (txt.includes('<MessageSquareclassName')) {
   txt = txt.split('<MessageSquareclassName').join('<MessageSquare className');
}

fs.writeFileSync(file, txt);

if (fs.existsSync('frontend/' + file)) {
  fs.writeFileSync('frontend/' + file, txt);
}
console.log('Fixed missing spaces in icons again');
