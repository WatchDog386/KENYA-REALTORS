const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/portal/super-admin/PropertyManager.tsx', 'utf8');
code = code.replace(/<Button variant="outline" onClick=\{\(\) => setShowAssignManagerDialog\(false\)\}>Close<\/Button>/g, '<Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>');
// handle the multiline versions
code = code.replace(/<Button[\s\n]*variant="outline"[\s\n]*onClick=\{\(\) =>[\s\n]*setShowAssignManagerDialog\(false\)\}>Close<\/Button>/g, '<Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setShowAssignManagerDialog(false)}>Close</Button>');
fs.writeFileSync('frontend/src/components/portal/super-admin/PropertyManager.tsx', code);
