const fs = require('fs');

const files = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    // It got replaced to something with "lex". We'll just replace everything inside the <div className="flex flex-wrap gap-2"> that contains the buttons
    
    // Quick and dirty fix: Find the exact blocks
    content = content.replace(/className=\{\r?\n?lex items-center gap-2 \}/g, 'className={`flex items-center gap-2 ${assignmentType !== "REPLACE_ME" ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : ""}`}');

    // Just string replace REPLACE_ME manually for each button block by finding them
    // Actually simpler:
    content = content.replace(/variant=\{assignmentType === "property_manager"[^>]*className=\{[^}]*\}/g, 'variant={assignmentType === "property_manager" ? "default" : "outline"} onClick={() => setAssignmentType("property_manager")} className={`flex items-center gap-2 ${assignmentType !== "property_manager" ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : ""}`}');
    content = content.replace(/variant=\{assignmentType === "technician"[^>]*className=\{[^}]*\}/g, 'variant={assignmentType === "technician" ? "default" : "outline"} onClick={() => setAssignmentType("technician")} className={`flex items-center gap-2 ${assignmentType !== "technician" ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : ""}`}');
    content = content.replace(/variant=\{assignmentType === "proprietor"[^>]*className=\{[^}]*\}/g, 'variant={assignmentType === "proprietor" ? "default" : "outline"} onClick={() => setAssignmentType("proprietor")} className={`flex items-center gap-2 ${assignmentType !== "proprietor" ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : ""}`}');
    content = content.replace(/variant=\{assignmentType === "caretaker"[^>]*className=\{[^}]*\}/g, 'variant={assignmentType === "caretaker" ? "default" : "outline"} onClick={() => setAssignmentType("caretaker")} className={`flex items-center gap-2 ${assignmentType !== "caretaker" ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : ""}`}');

    fs.writeFileSync(p, content, 'utf8');
  }
}
