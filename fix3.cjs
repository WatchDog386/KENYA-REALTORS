const fs = require('fs');

const files = [
  'src/pages/portal/components/ManagerAssignment.tsx',
  'frontend/src/pages/portal/components/ManagerAssignment.tsx'
];

for (const p of files) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    // Remove the bad content manually
    const targetDivStart = '<div className="flex flex-wrap gap-2">';
    const targetLabel = '<Label>Assignment Type</Label>';
    
    let labelIdx = content.indexOf(targetLabel);
    if(labelIdx !== -1) {
        let afterLabel = content.substring(labelIdx + targetLabel.length);
        let startDivIdx = content.indexOf(targetDivStart, labelIdx);
        let endDivIdx = content.indexOf('</div>', startDivIdx + 10);
        
        let before = content.substring(0, startDivIdx);
        let after = content.substring(endDivIdx + 6);
        
        let newBlock = `
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant={assignmentType === 'property_manager' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('property_manager')}
                        className={\`flex items-center gap-2 \${assignmentType !== 'property_manager' ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 border' : ''}\`}
                    >
                        <UserPlus className="h-4 w-4" /> Manager
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'technician' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('technician')}
                        className={\`flex items-center gap-2 \${assignmentType !== 'technician' ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 border' : ''}\`}
                    >
                        <Wrench className="h-4 w-4" /> Technician
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'proprietor' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('proprietor')}
                        className={\`flex items-center gap-2 \${assignmentType !== 'proprietor' ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 border' : ''}\`}
                    >
                        <Building className="h-4 w-4" /> Proprietor
                    </Button>
                    <Button
                        type="button"
                        variant={assignmentType === 'caretaker' ? 'default' : 'outline'}
                        onClick={() => setAssignmentType('caretaker')}
                        className={\`flex items-center gap-2 \${assignmentType !== 'caretaker' ? 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 border' : ''}\`}
                    >
                        <UserCheck className="h-4 w-4" /> Caretaker
                    </Button>
                </div>`;
                
        fs.writeFileSync(p, before + newBlock + after, 'utf8');
        console.log('Fixed', p);
    }
  }
}
