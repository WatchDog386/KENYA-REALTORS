const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

const gridBlockPattern = /viewMode === 'grid' \? \([\s\S]*?\) : \(/;

const newGridBlock = iewMode === 'grid' ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10 pt-4">
    {filteredTenants.map((tenant) => {
      const isActive = tenant.lease_status === 'active';
      return (
        <div key={tenant.id} className="bg-white rounded-[16px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-visible relative flex flex-col pt-0 transition-all hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1)] h-full">
          {/* Header Banner */}
          <div className={\h-28 rounded-t-[16px] w-full relative \\}>
             <div className="absolute top-4 right-4">
               <span className={\	ext-[11px] font-bold px-3 py-1.5 rounded-full text-white \\}>
                 {isActive ? 'ACTIVE LEASE' : tenant.lease_status.replace('_', ' ').toUpperCase()}
               </span>
             </div>
          </div>
          
          <div className="px-6 flex-1 flex flex-col relative pointer-events-none">
             {/* Offset elements layer */}
             <div className="flex justify-between items-end -mt-14 mb-4 pointer-events-none">
                <Avatar className="h-[104px] w-[104px] border-[5px] border-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] bg-white pointer-events-auto text-[#159e75]">
                    <AvatarFallback className={\	ext-2xl font-semibold \\}>
                        {getInitials(tenant.first_name, tenant.last_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="text-right pb-2 pointer-events-auto">
                   <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">UNIT</p>
                   <p className="text-[26px] font-semibold text-[#1a2b3c] leading-none">{tenant.unit_name}</p>
                </div>
             </div>
             
             {/* Info */}
             <div className="pointer-events-auto">
                 <h3 className="text-[19px] font-semibold text-[#1a2b3c] mb-1">
                     {tenant.first_name} {tenant.last_name}
                 </h3>
                 <div className="flex items-center gap-2.5 text-[14px] text-slate-500 mb-7">
                     <Mail size={16} className="shrink-0" />
                     <span className="truncate">{tenant.email}</span>
                 </div>
             </div>

             {/* Details list */}
             <div className="space-y-4 text-[14px] pointer-events-auto mb-7 flex-1">
                 <div className="flex justify-between items-center pb-3">
                     <div className="flex items-center gap-2.5 text-slate-500">
                         <Phone size={16} />
                         <span>Phone</span>
                     </div>
                     <span className="text-slate-600">{tenant.phone || 'N/A'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center border-t border-slate-100 pt-3 pb-3">
                     <div className="flex items-center gap-2.5 text-slate-500">
                         <Calendar size={16} />
                         <span>Move In</span>
                     </div>
                     <span className="text-slate-600">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('en-GB') : '-'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                     <div className="flex items-center gap-2.5 text-slate-500">
                         <FileText size={16} />
                         <span>Lease End</span>
                     </div>
                     <span className="text-slate-600">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString('en-GB') : 'Month-to-Month'}</span>
                 </div>
             </div>
          </div>
          
          {/* Actions */}
          <div className="px-6 pb-6 pt-0 mt-auto grid grid-cols-2 gap-3 z-10 relative">
             <Button variant="outline" className="border-slate-200 text-[#1a2b3c] hover:bg-slate-50 font-bold text-xs tracking-wider uppercase h-11 w-full rounded-lg shadow-sm" onClick={() => handleViewProfile(tenant)}>
                <User size={16} className="mr-2" strokeWidth={2} /> Profile
             </Button>
             <Button className={\	ext-white font-bold text-xs tracking-wider uppercase h-11 w-full rounded-lg shadow-sm \\} onClick={() => toast.info("Messaging feature coming soon")}>
                <MessageSquare size={16} className="mr-2" strokeWidth={2} /> Message
             </Button>
          </div>
        </div>
      );
    })}
  </div>
) : (;

txt = txt.replace(gridBlockPattern, newGridBlock);

fs.writeFileSync(file, txt);

// also frontend if it exists
if (fs.existsSync('frontend/' + file)) {
  fs.writeFileSync('frontend/' + file, txt);
}
console.log('Fixed tenant grid design');
