const fs = require('fs');

const files = [
  'src/components/portal/super-admin/UserManagementNew.tsx',
  'frontend/src/components/portal/super-admin/UserManagementNew.tsx'
];

const andAnd = String.fromCharCode(38, 38);

const newHtml = `<div className="flex items-center justify-end gap-2">
                              {user.status === 'active' ? (
                                <Button
                                  onClick={() => handleStatusChange(user.id, 'inactive')}
                                  className="bg-[#f97316] hover:bg-[#ea580c] text-white h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all outline-none border-none shadow-none"
                                  title="Suspend Account"
                                >
                                  <Ban className="h-3.5 w-3.5" /> Suspend
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                  className="bg-[#10b981] hover:bg-[#059669] text-white h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all outline-none border-none shadow-none"
                                  title="Activate Account"
                                >
                                  <Play className="h-3.5 w-3.5" /> Activate
                                </Button>
                              )}
                              <Button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsAssignDialogOpen(true);
                                }}
                                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all outline-none border-none shadow-none"
                                title="Modify Role"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit Role
                              </Button>
                              {user.role ${andAnd} user.role !== 'super_admin' ${andAnd} (
                                <Button
                                  onClick={() => handleUnassignUser(user.id, user.role)}
                                  className="bg-[#eab308] hover:bg-[#ca8a04] text-white h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all outline-none border-none shadow-none"
                                  title="Unassign"
                                >
                                  <UserMinus className="h-3.5 w-3.5" /> Unassign
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-[#ef4444] hover:bg-[#dc2626] text-white h-8 px-3 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-all outline-none border-none shadow-none"
                                title="Purge Identity"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </Button>
                            </div>`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let text = fs.readFileSync(file, 'utf8');
    
    // First, let's look for the corrupted one
    const startStr = '<div className="flex items-center justify-end gap-2">';
    const endStr = '</TableCell>';
    
    const startIndex = text.indexOf(startStr);
    const endIndex = text.indexOf(endStr, startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
      const before = text.substring(0, startIndex);
      const after = text.substring(endIndex);
      fs.writeFileSync(file, before + newHtml + '\n                          ' + after, 'utf8');
      console.log("Updated in", file);
    }
  }
}
