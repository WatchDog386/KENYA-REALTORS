const fs = require('fs');

const gridBlock = iewMode === 'grid' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
    {filteredTenants.map((tenant) => {
      const isActive = tenant.lease_status === 'active';
      return (
        <div key={tenant.id} className="group bg-white rounded-none border border-slate-300 shadow-none hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-start bg-slate-50">
             <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12 border border-slate-300 shadow-sm rounded-none">
                    <AvatarFallback className="bg-slate-200 text-slate-700 font-bold rounded-none">
                        {getInitials(tenant.first_name, tenant.last_name)}
                    </AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="font-bold text-slate-900 leading-tight uppercase tracking-tight">
                        {tenant.first_name} {tenant.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unit {tenant.unit_name}</p>
                 </div>
             </div>
             <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase tracking-widest px-2 py-0.5 rounded-none text-[10px]" : "bg-amber-100 text-amber-800 border border-amber-300 font-bold uppercase tracking-widest px-2 py-0.5 rounded-none text-[10px]"}>
                {isActive ? 'Active' : 'Past'}
             </Badge>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                   <Mail size={16} className="text-slate-400 shrink-0" />
                   <span className="truncate font-medium">{tenant.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                   <Phone size={16} className="text-slate-400 shrink-0" />
                   <span className="font-medium">{tenant.phone || 'N/A'}</span>
                </div>
            </div>
            
            <div className="h-px bg-slate-200 my-1 w-full" />
            
            <div className="grid grid-cols-2 gap-4 mt-auto pt-2">
                <div>
                   <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Move In</p>
                   <p className="text-sm font-bold text-slate-800">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Move Out</p>
                   <p className="text-sm font-bold text-slate-800">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 'Active'}</p>
                </div>
            </div>
          </div>
          
          <div className="px-5 py-4 border-t border-slate-200 bg-white mt-auto">
             <Button className="w-full bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 font-bold rounded-none shadow-sm transition-all uppercase tracking-wider text-xs h-10" onClick={() => handleViewProfile(tenant)}>
                <User size={16} className="mr-2" strokeWidth={2.5} /> View Details
             </Button>
          </div>
        </div>
      );
    })}
  </div>
) : (;

const listBlockContent = <div className="bg-white border text-sm border-slate-300 shadow-sm rounded-none overflow-hidden">
<div className="overflow-x-auto">
  <Table>
    <TableHeader className="bg-slate-50 border-b border-slate-300">
      <TableRow className="hover:bg-transparent">
        <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Tenant</TableHead>
        <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Contact</TableHead>
        <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Unit Info</TableHead>
        <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Dates</TableHead>
        <TableHead className="font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Status</TableHead>
        <TableHead className="text-right font-extrabold text-slate-600 uppercase tracking-widest text-[11px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredTenants.map((tenant) => {
          const propertyName = properties.find(p => p.id === tenant.property_id)?.name || 'Unknown Property';
          return (
             <TableRow key={tenant.id} className="hover:bg-slate-50/80 border-b border-slate-200 group transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 rounded-none border border-slate-200">
                                    <AvatarFallback className="bg-slate-100 text-slate-700 font-bold text-xs rounded-none">
                                        {getInitials(tenant.first_name, tenant.last_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-slate-900 uppercase tracking-tight">{tenant.first_name} {tenant.last_name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID: {tenant.id.slice(0,6)}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Mail size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[150px] font-medium" title={tenant.email}>{tenant.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Phone size={14} className="text-slate-400 shrink-0" />
                                    <span className="font-medium">{tenant.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                 <Badge variant="outline" className="bg-white border-slate-300 text-slate-800 font-bold rounded-none px-2 uppercase tracking-wider whitespace-nowrap">
                                     Unit {tenant.unit_name}
                                 </Badge>
                                 <span className="text-sm font-semibold text-slate-500 truncate max-w-[140px]" title={propertyName}>{propertyName}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                    <span className="whitespace-nowrap font-medium">In: {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '-'}</span>
                                </div>
                                {tenant.lease_end_date && (
                                    <div className="text-xs text-slate-500 pl-6 whitespace-nowrap font-medium">
                                        Ends: {new Date(tenant.lease_end_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge className={tenant.lease_status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-none uppercase tracking-widest whitespace-nowrap text-[10px]" : "bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-none uppercase tracking-widest whitespace-nowrap text-[10px]"}>
                                {tenant.lease_status === 'active' ? 'Active' : tenant.lease_status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="sm" onClick={() => handleViewProfile(tenant)} className="bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border-slate-300 hover:border-blue-300 font-bold rounded-none shadow-sm uppercase tracking-wider text-[11px] h-8 transition-colors whitespace-nowrap">
                               <User size={14} className="mr-1.5" strokeWidth={2.5} /> View Details
                           </Button>
                        </TableCell>
              </TableRow>
          );
      })}
    </TableBody>
  </Table>
</div>
</div>;

const profileDialogBlock = <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-white border-slate-300 shadow-2xl rounded-none">
          {selectedTenant && (
            <>
              {/* Sharp Header Banner */}
              <div className="bg-slate-900 border-b border-slate-800 px-8 py-8 flex items-end justify-between relative">
                 <div className="flex gap-5 items-center z-10">
                    <Avatar className="h-20 w-20 border border-slate-700 shadow-md bg-slate-800 rounded-none">
                        <AvatarFallback className="bg-slate-800 text-white text-2xl font-extrabold rounded-none">
                            {getInitials(selectedTenant.first_name, selectedTenant.last_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pb-1">
                        <h2 className="text-2xl font-extrabold text-white mb-1 uppercase tracking-wider">{selectedTenant.first_name} {selectedTenant.last_name}</h2>
                        <div className="flex items-center gap-3">
                           <p className="text-slate-400 font-medium text-xs uppercase tracking-widest">ID: {selectedTenant.id.slice(0, 8)}</p>
                           <Badge className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md rounded-none uppercase tracking-widest text-[10px] font-bold px-2 py-0.5">
                              Unit {selectedTenant.unit_name}
                           </Badge>
                        </div>
                    </div>
                 </div>
                 <div className="z-10 pb-1">
                     {selectedTenant.lease_status === 'active' ? (
                       <div className="px-3 py-1.5 bg-emerald-500 text-white font-extrabold uppercase tracking-widest text-xs shadow-sm">
                          Active Lease
                       </div>
                     ) : (
                       <div className="px-3 py-1.5 bg-slate-700 text-slate-200 font-extrabold uppercase tracking-widest text-xs shadow-sm border border-slate-600">
                          {selectedTenant.lease_status.replace('_', ' ')}
                       </div>
                     )}
                 </div>
                 {/* Subtle background element */}
                 <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
              </div>

              {/* Profile Details (Sharp Grid) */}
              <div className="p-8 pb-4 space-y-8 bg-slate-50">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-none bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <Mail size={18} strokeWidth={2} />
                            </div>
                            <div className="overflow-hidden mt-0.5">
                               <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Email Address</p>
                               <p className="text-sm font-bold text-slate-800 truncate" title={selectedTenant.email}>{selectedTenant.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-none bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <Phone size={18} strokeWidth={2} />
                            </div>
                            <div className="mt-0.5">
                               <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Phone Number</p>
                               <p className="text-sm font-bold text-slate-800">{selectedTenant.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-none bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Calendar size={18} strokeWidth={2} />
                            </div>
                            <div className="mt-0.5">
                               <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Move In Date</p>
                               <p className="text-sm font-bold text-slate-800">{selectedTenant.move_in_date ? new Date(selectedTenant.move_in_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-none bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <FileText size={18} strokeWidth={2} />
                            </div>
                            <div className="mt-0.5">
                               <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Lease End Date</p>
                               <p className="text-sm font-bold text-slate-800">{selectedTenant.lease_end_date ? new Date(selectedTenant.lease_end_date).toLocaleDateString() : 'No End Date'}</p>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-3 justify-end pt-6 border-t border-slate-200">
                    <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold rounded-none shadow-sm uppercase tracking-widest text-[11px] h-10 px-6 line-height-none" onClick={() => setIsProfileOpen(false)}>
                        Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-none shadow-sm uppercase tracking-widest text-[11px] h-10 px-6 line-height-none" onClick={() => {
                        toast.info("Messaging feature coming soon");
                    }}>
                        <MessageSquare size={14} className="mr-2" strokeWidth={2.5} /> Message Tenant
                    </Button>
                 </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>;

const files = ['src/components/portal/manager/ManagerTenants.tsx', 'frontend/src/components/portal/manager/ManagerTenants.tsx'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    // 1. Grid
    let idx1 = txt.indexOf("viewMode === 'grid' ? (");
    let idx2 = txt.indexOf(") : (", idx1);
    if (idx1 !== -1 && idx2 !== -1) {
        txt = txt.substring(0, idx1) + gridBlock + txt.substring(idx2 + 5);
    }
    
    // 2. List
    let listStart = txt.indexOf("<Table");
    let listEnd = txt.indexOf("</Table>", listStart);
    if (listStart !== -1 && listEnd !== -1) {
        listEnd += 8; // length of </Table>
        // Find wrapper
        let wrapperStart = txt.lastIndexOf("<div", listStart);
        // Step back over multiple divs if necessary
        let firstDiv = txt.lastIndexOf('<div className="overflow-x-auto', listStart);
        let rootDiv = txt.lastIndexOf('<div className="bg-white', firstDiv);
        
        if (rootDiv !== -1 && rootDiv > idx2) { // safety check
           let endDiv1 = txt.indexOf("</div>", listEnd);
           let endDiv2 = txt.indexOf("</div>", endDiv1 + 4);
           if (endDiv2 !== -1) {
               txt = txt.substring(0, rootDiv) + listBlockContent + txt.substring(endDiv2 + 6);
           }
        }
    }

    // 3. Dialog
    let idx3 = txt.indexOf("<Dialog open={isProfileOpen}");
    let idx4 = txt.indexOf("</Dialog>", idx3);
    if (idx3 !== -1 && idx4 !== -1) {
        txt = txt.substring(0, idx3) + profileDialogBlock + txt.substring(idx4 + 9);
    }

    fs.writeFileSync(file, txt);
    console.log("Updated", file);
});
