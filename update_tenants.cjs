const fs = require('fs');

const gridBlock = iewMode === 'grid' ? (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-10">
    {filteredTenants.map((tenant) => {
      const isActive = tenant.lease_status === 'active';
      return (
        <div key={tenant.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
             <div className="flex items-center gap-3">
                 <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                    <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                        {getInitials(tenant.first_name, tenant.last_name)}
                    </AvatarFallback>
                 </Avatar>
                 <div>
                    <h3 className="font-bold text-slate-900 leading-tight">
                        {tenant.first_name} {tenant.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Unit {tenant.unit_name}</p>
                 </div>
             </div>
             <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-semibold px-2 py-0.5" : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-semibold px-2 py-0.5"}>
                {isActive ? 'Active' : 'Past'}
             </Badge>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
               <Mail size={16} className="text-slate-400" />
               <span className="truncate">{tenant.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
               <Phone size={16} className="text-slate-400" />
               <span>{tenant.phone || 'No phone'}</span>
            </div>
            <div className="h-px bg-slate-100 my-1 w-full" />
            <div className="grid grid-cols-2 gap-4 mt-auto pt-2">
                <div>
                   <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Move In</p>
                   <p className="text-sm font-medium text-slate-800">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Move Out</p>
                   <p className="text-sm font-medium text-slate-800">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 'Active'}</p>
                </div>
            </div>
          </div>
          
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 mt-auto">
             <Button className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-semibold shadow-sm transition-colors" onClick={() => handleViewProfile(tenant)}>
                <User size={16} className="mr-2" /> View Details
             </Button>
          </div>
        </div>
      );
    })}
  </div>
) : (;

const listBlockContent = <div className="bg-white border text-sm border-slate-200 shadow-sm rounded-xl overflow-hidden">
<div className="overflow-x-auto">
  <Table>
    <TableHeader className="bg-slate-50 border-b border-slate-200">
      <TableRow className="hover:bg-transparent">
        <TableHead className="font-bold text-slate-600">Tenant</TableHead>
        <TableHead className="font-bold text-slate-600">Contact</TableHead>
        <TableHead className="font-bold text-slate-600">Unit Info</TableHead>
        <TableHead className="font-bold text-slate-600">Dates</TableHead>
        <TableHead className="font-bold text-slate-600">Status</TableHead>
        <TableHead className="text-right font-bold text-slate-600">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredTenants.map((tenant) => {
          const propertyName = properties.find(p => p.id === tenant.property_id)?.name || 'Unknown Property';
          return (
             <TableRow key={tenant.id} className="hover:bg-slate-50 border-b border-slate-100 group">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold text-xs">
                                        {getInitials(tenant.first_name, tenant.last_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-slate-900">{tenant.first_name} {tenant.last_name}</p>
                                    <p className="text-xs text-slate-500">Tenant ID: {tenant.id.slice(0,6)}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[150px]" title={tenant.email}>{tenant.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone size={14} className="text-slate-400 shrink-0" />
                                    <span>{tenant.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="bg-slate-50 text-slate-700 font-medium whitespace-nowrap">
                                     Unit {tenant.unit_name}
                                 </Badge>
                                 <span className="text-sm font-medium text-slate-500 truncate max-w-[120px]" title={propertyName}>{propertyName}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Calendar size={14} className="text-slate-400 shrink-0" />
                                    <span className="whitespace-nowrap">In: {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '-'}</span>
                                </div>
                                {tenant.lease_end_date && (
                                    <div className="text-xs text-slate-500 pl-6 whitespace-nowrap">
                                        Ends: {new Date(tenant.lease_end_date).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge className={tenant.lease_status === 'active' ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-medium whitespace-nowrap" : "bg-slate-100 text-slate-800 hover:bg-slate-200 border-none font-medium whitespace-nowrap"}>
                                {tenant.lease_status === 'active' ? 'Active' : tenant.lease_status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="sm" onClick={() => handleViewProfile(tenant)} className="bg-white hover:bg-blue-50 hover:text-blue-600 border-slate-200 shadow-sm text-xs font-semibold h-8 whitespace-nowrap">
                               View Details
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border-slate-200 shadow-xl rounded-xl">
          {selectedTenant && (
            <>
              {/* Header Banner */}
              <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                 <div className="absolute -bottom-10 left-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
                        <AvatarFallback className="bg-blue-50 text-blue-700 text-3xl font-bold">
                            {getInitials(selectedTenant.first_name, selectedTenant.last_name)}
                        </AvatarFallback>
                    </Avatar>
                 </div>
                 <div className="absolute top-4 right-4 flex gap-2">
                     <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm shadow-sm font-semibold px-3 py-1">
                        Unit {selectedTenant.unit_name}
                     </Badge>
                     {selectedTenant.lease_status === 'active' ? (
                       <Badge className="bg-emerald-500 text-white border-none shadow-sm font-semibold">Active</Badge>
                     ) : (
                       <Badge variant="secondary" className="shadow-sm font-semibold">{selectedTenant.lease_status.replace('_', ' ')}</Badge>
                     )}
                 </div>
              </div>

              {/* Profile Details */}
              <div className="pt-14 px-6 pb-6 space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedTenant.first_name} {selectedTenant.last_name}</h2>
                    <p className="text-slate-500 font-medium text-sm">Tenant ID: {selectedTenant.id}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 mt-0.5 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                                <Mail size={18} />
                            </div>
                            <div className="overflow-hidden">
                               <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Email Address</p>
                               <p className="text-sm font-semibold text-slate-800 truncate" title={selectedTenant.email}>{selectedTenant.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 mt-0.5 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Phone Number</p>
                               <p className="text-sm font-semibold text-slate-800">{selectedTenant.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 mt-0.5 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                                <Calendar size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Move In Date</p>
                               <p className="text-sm font-semibold text-slate-800">{selectedTenant.move_in_date ? new Date(selectedTenant.move_in_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 mt-0.5 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 shrink-0">
                                <FileText size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Lease End Date</p>
                               <p className="text-sm font-semibold text-slate-800">{selectedTenant.lease_end_date ? new Date(selectedTenant.lease_end_date).toLocaleDateString() : 'No End Date'}</p>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
                    <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold" onClick={() => setIsProfileOpen(false)}>
                        Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm" onClick={() => {
                        toast.info("Messaging feature coming soon");
                    }}>
                        <MessageSquare size={16} className="mr-2" /> Message Tenant
                    </Button>
                 </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>;

files = ['src/components/portal/manager/ManagerTenants.tsx', 'frontend/src/components/portal/manager/ManagerTenants.tsx'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let txt = fs.readFileSync(file, 'utf8');

    let idx1 = txt.indexOf("viewMode === 'grid' ? (");
    let idx2 = txt.indexOf(") : (", idx1);
    
    if (idx1 !== -1 && idx2 !== -1) {
        txt = txt.substring(0, idx1) + gridBlock + txt.substring(idx2 + 5);
    }
    
    let listStart = txt.indexOf("<Table");
    let listEnd = txt.indexOf("</Table>", listStart) + 8;
    
    if (listStart !== -1 && listEnd !== -1) {
        // find replacing bounds (the list block wrapper div)
        let wrapperStart = txt.lastIndexOf("<div", listStart);
        if (txt.substring(wrapperStart, listStart).includes("bg-white")) {
           let listWrapperEnd = txt.indexOf("</div>", listEnd);
           // Account for multiple nested divs actually, listWrapperEnd is just rough approximation
           // We can replace from wrapperStart to the end of wrapper. 
           // But safer to replace from txt.lastIndexOf('<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">', listStart) if possible
           
           let bgWhiteStart = txt.lastIndexOf('<div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">', listStart);
           if (bgWhiteStart === -1) bgWhiteStart = txt.lastIndexOf('<div className="', listStart);
           
           // I'll replace everything between listStart and listEnd actually, with a small adjustment.
           txt = txt.substring(0, listStart) + listBlockContent + txt.substring(listEnd);
        } else {
           txt = txt.substring(0, listStart) + listBlockContent + txt.substring(listEnd);
        }
    }

    // Now fix Dialog
    let idx3 = txt.indexOf("<Dialog open={isProfileOpen}");
    let idx4 = txt.indexOf("</Dialog>", idx3) + 9;
    if (idx3 !== -1 && idx4 !== -1) {
        txt = txt.substring(0, idx3) + profileDialogBlock + txt.substring(idx4);
    }

    fs.writeFileSync(file, txt);
    console.log("Updated", file);
});
