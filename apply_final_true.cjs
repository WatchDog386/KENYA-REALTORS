const fs = require('fs');

const file = 'src/components/portal/manager/ManagerTenants.tsx';
if (!fs.existsSync(file)) process.exit(0);
let txt = fs.readFileSync(file, 'utf8');

const targetStr = \        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                {filteredTenants.map((tenant) => {
                    const isActive = tenant.lease_status === 'active';
                    const gradientClass = isActive 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600" 
                        : "bg-gradient-to-r from-amber-500 to-orange-600";
                    const avatarBg = isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
                    const buttonClass = isActive
                         ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                         : "bg-orange-500 hover:bg-orange-600 shadow-orange-200";

                    return (
                        <div key={tenant.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-visible flex flex-col h-full sticky-card relative">
                            {/* Card Header */}
                            <div className={\\\h-24 \\\ rounded-t-xl relative overflow-hidden\\\}>
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                        {tenant.lease_status === 'active' ? 'Active Lease' : tenant.lease_status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="px-6 relative flex-1 flex flex-col bg-white rounded-b-xl">
                                <div className="-mt-12 mb-4 flex justify-between items-end relative z-10">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
                                        <AvatarFallback className={\\\\\\ text-2xl font-bold\\\}>
                                            {getInitials(tenant.first_name, tenant.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="mb-1 text-right max-w-[50%]">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Unit</span>
                                        <span className="text-2xl font-bold text-slate-800 truncate block" title={tenant.unit_name}>{tenant.unit_name}</span>
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight truncate" title={\\\\\\ \\\\\\}>
                                        {tenant.first_name} {tenant.last_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                        <Mail size={14} className="shrink-0" />
                                        <span className="truncate" title={tenant.email}>{tenant.email}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><Phone size={14} /> Phone</span>
                                        <span className="font-medium text-slate-700">{tenant.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> Move In</span>
                                        <span className="font-medium text-slate-700">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500 flex items-center gap-2"><FileText size={14} /> Lease End</span>
                                        <span className="font-medium text-slate-700">{tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 'Month-to-Month'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pb-6 mt-auto">
                                    <Button 
                                        onClick={() => handleViewProfile(tenant)}
                                        className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all h-9"
                                    >
                                        <User size={16} className="mr-2" /> Profile
                                    </Button>
                                    <Button 
                                        onClick={() => handleMessage(tenant)}
                                        className={\\\lex-1 text-white shadow-sm h-9 \\\\\\}
                                    >
                                        <MessageSquare size={16} className="mr-2" /> Message
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (\;

let matchIndex = txt.indexOf(targetStr.substring(0, 100)); // First find where it starts
if(matchIndex === -1 && txt.indexOf(targetStr.split('\\r\\n').join('\\n').substring(0, 100)) !== -1) {
    console.log("Using LF");
}

let newGridBlock = \        ) : viewMode === 'grid' ? (
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
             <div className="flex justify-between items-end -mt-[52px] mb-4 pointer-events-none">
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
                     <div className="flex items-center gap-3 text-slate-400">
                         <Phone size={16} />
                         <span className="text-slate-500">Phone</span>
                     </div>
                     <span className="text-slate-600 font-medium">{tenant.phone || 'N/A'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-3 text-slate-400">
                         <Calendar size={16} />
                         <span className="text-slate-500">Move In</span>
                     </div>
                     <span className="text-slate-600 font-medium">{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString('en-GB') : '-'}</span>
                 </div>
                 
                 <div className="flex justify-between items-center py-3">
                     <div className="flex items-center gap-3 text-slate-400">
                         <FileText size={16} />
                         <span className="text-slate-500">Lease End</span>
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
) : (\;

// Safe replacement
let targetStrRN = targetStr.split('\\n').join('\\r\\n');
if (txt.includes(targetStr)) {
  txt = txt.replace(targetStr, newGridBlock);
  console.log("REPLACED USING LF");
} else if (txt.includes(targetStrRN)) {
  txt = txt.replace(targetStrRN, newGridBlock);
  console.log("REPLACED USING CRLF");
} else {
  // Let's do string splitting with regex!
  const regex = /\\) : viewMode === 'grid' \\? \\([\\s\\S]*?\\) : \\(/g;
  if(regex.test(txt)) {
     txt = txt.replace(regex, newGridBlock);
     console.log("REPLACED USING REGEX");
  } else {
     console.log("FAILED REPLACEMENT");
  }
}

fs.writeFileSync(file, txt);

if (fs.existsSync('frontend/' + file)) {
  fs.writeFileSync('frontend/' + file, txt);
}
