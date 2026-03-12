const fs = require('fs');
const files = ['src/components/portal/super-admin/UserManagementNew.tsx', 'frontend/src/components/portal/super-admin/UserManagementNew.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let text = fs.readFileSync(file, 'utf8');

    // Replace the inactive button
    text = text.replace(/<Button\s+size="icon"\s+onClick=\{\(\) => handleStatusChange\(user\.id, 'inactive'\)\}\s+className="h-9 w-9[^>]+>\s+<Ban className="h-4 w-4" \/>\s+<\/Button>/, 
        `<Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.id, 'inactive')} className="h-8 w-8 rounded-none text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Suspend Account"><Ban className="h-4 w-4" /></Button>`);

    // Replace the active button
    text = text.replace(/<Button\s+size="icon"\s+onClick=\{\(\) => handleStatusChange\(user\.id, 'active'\)\}\s+className="h-9 w-9[^>]+>\s+<Play className="h-4 w-4" \/>\s+<\/Button>/, 
        `<Button variant="ghost" size="icon" onClick={() => handleStatusChange(user.id, 'active')} className="h-8 w-8 rounded-none text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Activate Account"><Play className="h-4 w-4" /></Button>`);

    // Replace modify role button
    text = text.replace(/<Button\s+size="icon"\s+onClick=\{\(\) => \{\s+setSelectedUser\(user\);\s+setIsAssignDialogOpen\(true\);\s+\}\}\s+className="h-9 w-9[^>]+>\s+<Edit2 className="h-4 w-4" \/>\s+<\/Button>/,
        `<Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsAssignDialogOpen(true); }} className="h-8 w-8 rounded-none text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Modify Role"><Edit2 className="h-4 w-4" /></Button>`);

    // Replace unassign button
    text = text.replace(/<Button\s+size="icon"\s+onClick=\{\(\) => handleUnassignUser\(user\.id, user\.role\)\}\s+className="h-9 w-9[^>]+>\s+<UserMinus className="h-4 w-4" \/>\s+<\/Button>/,
        `<Button variant="ghost" size="icon" onClick={() => handleUnassignUser(user.id, user.role)} className="h-8 w-8 rounded-none text-slate-400 hover:text-orange-600 hover:bg-orange-50" title="Unassign"><UserMinus className="h-4 w-4" /></Button>`);

    // Replace delete button
    text = text.replace(/<Button\s+size="icon"\s+onClick=\{\(\) => handleDeleteUser\(user\.id\)\}\s+className="h-9 w-9[^>]+>\s+<Trash2 className="h-4 w-4" \/>\s+<\/Button>/,
        `<Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50" title="Purge Identity"><Trash2 className="h-4 w-4" /></Button>`);

    fs.writeFileSync(file, text, 'utf8');
    console.log("Updated", file);
  }
}
