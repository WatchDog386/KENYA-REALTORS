const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

const regex = /viewMode === 'grid' \? \([\s\S]*?\) : \([\s\S]*?<Card/;

const match = txt.match(regex);
if (match) {
  console.log("MATCH FOUND!");
  const newGridBlock = \iewMode === 'grid' ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10 pt-4">
    {filteredTenants.map((tenant) => {
      const isActive = tenant.lease_status === 'active';
      return (
        <div key={tenant.id} className="bg-white rounded-[16px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-gray-200 overflow-visible relative flex flex-col pt-0 transition-all hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] h-full">
          {/* Header Banner */}
          <div className={\\\h-[90px] rounded-t-[16px] w-full relative \\\\\\}>
             <div className="absolute top-4 right-4 z-10">
               <span className={\\\	ext-[10px] font-bold px-3 py-1.5 rounded-full text-white \\\\\\}>
                 {isActive ? 'ACTIVE LEASE' : tenant.lease_status.replace('_', ' ').toUpperCase()}
               </span>
             </div>
          </div>
          
          <div className="px-6 flex-1 flex flex-col relative pb-6 pointer-events-none">
             {/* Offset elements layer */}
             <div className="flex justify-between items-end -mt-12 mb-4 pointer-events-none">
                <Avatar className="h-[96px] w-[96px] border-[5px] border-white shadow-sm bg-white text-[#159e75] pointer-events-auto">
                    <AvatarFallback className={\\\	ext-2xl font-semibold \\\\\\}>
                        {getInitials(tenant.first_name, tenant.last_name)}
                    </AvatarFallback>
                </Avatar>
                <div className="text-right pb-1 pointer-events-auto">
                   <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">UNIT</p>
                   <p className="text-[24px] font-semibold text-[#1a2b3c] leading-none">{tenant.unit_name}</p>
                </div>
             </div>
             
             {/* Info */}
             <div className="pointer-events-auto mb-6">
                 <h3 className="text-[18px] font-semibold text-[#1a2b3c] mb-1">
                     {tenant.first_name} {tenant.last_name}
                 </h3>
                 <div className="flex items-center gap-2 text-[14px] text-slate-500">
                     <Mail size={16} className="shrink-0" />
                     <span className="truncate">{tenant.email}</span>
                 </div>
             </div>

             {/* Details list */}
             <div className="space-y-0 text-[14px] mb-6 flex-1 pointer-events-auto border-t border-gray-100">
                 <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-3 text-slate-500">
                         <Phone size={16} />
                         <span>Phone</span>
                     </div>
                     <span className="text-slate-600 font-medium">{tenant.phone || 'N/A'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-3 text-slate-500">
                         <Calendar size={16} />
                         <span>Move In</span>
                     </div>
                     <span className="text-slate-600 font-medium">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('en-GB') : '-'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center py-3">
                     <div className="flex items-center gap-3 text-slate-500">
                         <FileText size={16} />
                         <span>Lease End</span>
                     </div>
                     <span className="text-slate-600 font-medium">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString('en-GB') : 'Month-to-Month'}</span>
                 </div>
             </div>
          </div>
          
          {/* Actions */}
          <div className="px-6 pb-6 pt-0 mt-auto grid grid-cols-2 gap-3 z-10 relative">
             <Button variant="outline" className="border-gray-200 text-[#1a2b3c] hover:bg-slate-50 font-bold text-[12px] tracking-wider uppercase h-[42px] w-full rounded-lg" onClick={() => handleViewProfile(tenant)}>
                <User size={16} className="mr-2" strokeWidth={2.5} /> PROFILE
             </Button>
             <Button className={\\\	ext-white font-bold text-[12px] tracking-wider uppercase h-[42px] w-full rounded-lg shadow-none \\\\\\} onClick={() => toast.info('Messaging feature coming soon')}>
                <MessageSquare size={16} className="mr-2" strokeWidth={2.5} /> MESSAGE
             </Button>
          </div>
        </div>
      );
    })}
  </div>
) : (
            <Card\;

  txt = txt.replace(regex, newGridBlock);
  fs.writeFileSync(file, txt);

  if (fs.existsSync('frontend/' + file)) {
    fs.writeFileSync('frontend/' + file, txt);
  }
  console.log('SUCCESS: REGEX APPLIED!');
} else {
  console.log('FAILED TO MATCH REGEX');
}
