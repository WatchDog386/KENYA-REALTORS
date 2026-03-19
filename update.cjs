const fs = require('fs');
const files = [
  'src/components/portal/manager/ManagerUnits.tsx',
  'frontend/src/components/portal/manager/ManagerUnits.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // 1. Array default to list
  c = c.replace(/const \[viewMode, setViewMode\] = useState<'grid' \| 'list'>\('grid'\);/g, "const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');");

  // 2. Remove "Add Unit" button
  c = c.replace(/<Button className="bg-blue-600 hover:bg-blue-700 text-white[^>]+>\s*<Plus size=\{16\} className="mr-2" \/>\s*Add Unit\s*<\/Button>/g, "");

  // 3. Grid Columns adjustment to make them smaller
  c = c.replace(
    /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">/g,
    '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 text-sm">'
  );

  // 4. Shrink Card Size inside mapped units
  c = c.replace(/<div className="p-5 flex flex-col flex-1 gap-4">/g, '<div className="p-3 flex flex-col flex-1 gap-2.5">');
  c = c.replace(/<div className="h-40 bg-slate-100 relative border-b border-slate-50">/g, '<div className="h-28 bg-slate-100 relative border-b border-slate-50">');
  c = c.replace(/<Building2 className=\{w-6 h-6 \$\{theme.icon\}\} strokeWidth=\{2\} \/>/g, '<Building2 className={w-5 h-5 } strokeWidth={2} />');
  c = c.replace(/<div className="bg-white p-3 rounded-full shadow-sm mb-2 relative z-10">/g, '<div className="bg-white p-2 rounded-full shadow-sm mb-1 relative z-10">');
  c = c.replace(/<h3 className="text-xl font-extrabold text-blue-900 group-hover:text-blue-700 transition-colors">/g, '<h3 className="text-base font-extrabold text-blue-900 group-hover:text-blue-700 transition-colors">');
  c = c.replace(/<span className="block text-xl font-bold text-blue-600">/g, '<span className="block text-base font-bold text-blue-600">');
  c = c.replace(/<p className="text-sm text-blue-500 font-semibold truncate max-w-\[150px\]" title=\{unitType\?\.name\}>/g, '<p className="text-xs text-blue-500 font-semibold truncate max-w-[120px]" title={unitType?.name}>');
  c = c.replace(/<div className="grid grid-cols-2 gap-3 text-sm mt-1">/g, '<div className="grid grid-cols-2 gap-2 text-xs mt-1">');
  c = c.replace(/<div className="flex items-center gap-2\.5 bg-slate-50 p-2 rounded-lg/g, '<div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg');
  c = c.replace(/<div className="p-2 rounded-md bg-indigo-600/g, '<div className="p-1.5 rounded-md bg-indigo-600');
  c = c.replace(/<div className="p-2 rounded-md bg-violet-600/g, '<div className="p-1.5 rounded-md bg-violet-600');
  c = c.replace(/<Layers size=\{16\} strokeWidth=\{2\.5\} \/>/g, '<Layers size={14} strokeWidth={2.5} />');
  c = c.replace(/<Maximize size=\{16\} strokeWidth=\{2\.5\} \/>/g, '<Maximize size={14} strokeWidth={2.5} />');
  c = c.replace(/<div className="mt-auto pt-3 grid grid-cols-2 gap-3">/g, '<div className="mt-auto pt-2 grid grid-cols-2 gap-2">');

  fs.writeFileSync(file, c);
  console.log('Fixed ' + file);
});
