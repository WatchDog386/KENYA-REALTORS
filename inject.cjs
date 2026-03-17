const fs = require('fs');
let code = fs.readFileSync('src/components/portal/super-admin/PropertyManager.tsx', 'utf8');

const dialogPart = `
        {/* UNASSIGN CONFIRM DIALOG */}
        <Dialog open={!!unassignConfig} onOpenChange={(open) => !open && setUnassignConfig(null)}>
          <DialogContent className="sm:max-w-[400px] bg-white rounded-xl border border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Confirm Unassign
              </DialogTitle>
              <DialogDescription className="text-slate-600 pt-2">
                Are you sure you want to unassign this staff member from the property? This action will immediately revoke their access.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:justify-start">
              <Button variant="outline" className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" onClick={() => setUnassignConfig(null)}>
                  Cancel
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={executeUnassignStaff}>
                  Yes, Unassign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSIGN MANAGER DIALOG */}`;

code = code.replace('{/* ASSIGN MANAGER DIALOG */}', dialogPart);
fs.writeFileSync('src/components/portal/super-admin/PropertyManager.tsx', code);
console.log('Dialog added via base64');
