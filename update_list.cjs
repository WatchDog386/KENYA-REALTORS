const fs = require('fs');
const files = [
  'src/components/portal/manager/ManagerUnits.tsx',
  'frontend/src/components/portal/manager/ManagerUnits.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // Upgrade the list wrapper
  c = c.replace(
      '<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">',
      '<div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">'
  );

  // Upgrade table header
  c = c.replace(
      '<thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">',
      '<thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-widest text-[11px] font-extrabold">'
  );

  // Upgrade row hover
  c = c.replace(
      '<tr key={unit.id} className="hover:bg-slate-50 transition-colors group cursor-pointer"',
      '<tr key={unit.id} className="hover:bg-slate-50/80 hover:shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)] transition-all duration-200 group cursor-pointer"'
  );

  fs.writeFileSync(file, c);
});
