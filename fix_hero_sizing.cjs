const fs = require('fs');
let file = fs.readFileSync('src/components/Hero.tsx', 'utf8');

file = file.replace(/h-\[220px\] md:h-\[300px\]/g, 'min-h-[400px] md:min-h-[500px] lg:min-h-[600px]');
file = file.replace(/max-w-\[1320px\] mx-auto px-2 md:px-3 lg:px-4 py-2 md:py-3/g, 'max-w-[1536px] w-[98%] mx-auto px-0 md:px-4 lg:px-6 py-0 md:py-6');
file = file.replace(/grid grid-cols-1 lg:grid-cols-12 h-\[340px\] md:h-\[380px\]/g, 'grid grid-cols-1 lg:grid-cols-12 min-h-[500px] md:min-h-[560px] lg:min-h-[640px]');

file = file.replace(/p-3 md:p-4 lg:p-5 flex flex-col/g, 'p-6 md:p-8 lg:p-12 flex flex-col justify-center');
file = file.replace(/text-\[10px\] md:text-xs font-black uppercase tracking-\[0\.16em\] px-3 py-1/g, 'text-xs md:text-sm font-black uppercase tracking-[0.16em] px-4 py-1.5');
file = file.replace(/text-xl md:text-2xl font-black text-\[#0f335f\] leading-\[0\.95\] uppercase tracking-tight/g, 'text-3xl md:text-5xl lg:text-[56px] font-black text-[#0f335f] leading-[0.95] uppercase tracking-tight');
file = file.replace(/text-xs md:text-sm text-slate-600 leading-relaxed font-semibold max-w-\[34ch\]/g, 'text-sm md:text-base lg:text-lg text-slate-600 leading-relaxed font-semibold max-w-[42ch]');

file = file.replace(/text-\[11px\] font-bold px-2\.5 py-1/g, 'text-xs font-bold px-3 py-1.5');
file = file.replace(/px-2\.5 py-1\.5/g, 'px-4 py-3 border border-slate-200');
file = file.replace(/text-\[10px\] font-extrabold/g, 'text-xs font-extrabold');
file = file.replace(/text-xs md:text-sm font-black text-\[#0f335f\]/g, 'text-sm md:text-xl font-black text-[#0f335f]');

file = file.replace(/py-2 px-3 uppercase tracking-\[0\.12em\] text-\[10px\] md:text-\[11px\]/g, 'py-3.5 px-6 uppercase tracking-[0.12em] text-xs md:text-sm');

file = file.replace(/p-2 md:p-3/g, 'p-4 md:p-6');
file = file.replace(/text-\[9px\] font-black/g, 'text-[11px] font-black');
file = file.replace(/h-9 border/g, 'h-12 border');
file = file.replace(/text-xs md:text-sm font-semibold/g, 'text-sm md:text-base font-semibold');
file = file.replace(/h-9 bg-\[#0f335f\] text-white text-\[10px\] md:text-\[11px\]/g, 'h-12 bg-[#0f335f] text-white text-xs md:text-sm');

file = file.replace(/h-\[200px\] md:h-full/g, 'min-h-[300px] md:min-h-[560px] lg:min-h-full');
file = file.replace(/top-3 md:top-4 right-3 md:right-4/g, 'top-4 md:top-6 right-4 md:right-6');
file = file.replace(/px-3 py-2 border-l-4/g, 'px-4 py-3 border-l-4');
file = file.replace(/text-\[10px\] uppercase font-extrabold/g, 'text-xs uppercase font-extrabold');
file = file.replace(/text-base md:text-xl font-black text-\[#0f335f\] leading-none/g, 'text-xl md:text-3xl font-black text-[#0f335f] leading-none');

file = file.replace(/max-w-xl bg-black\\/45 backdrop-blur-\[2px\] border border-white\\/15 p-3 md:p-4/g, 'max-w-2xl bg-black/45 backdrop-blur-[2px] border border-white/15 p-4 md:p-6 lg:p-8');
file = file.replace(/text-\[10px\] md:text-xs font-black text-\[#ffd6bd\]/g, 'text-xs md:text-sm font-black text-[#ffd6bd]');
file = file.replace(/text-sm md:text-xl font-black uppercase/g, 'text-xl md:text-3xl font-black uppercase');
file = file.replace(/px-3 py-1\.5 hover:bg-\[#d75502\]/g, 'px-4 py-2.5 hover:bg-[#d75502]');
file = file.replace(/px-3 py-1\.5 hover:bg-slate-100/g, 'px-4 py-2.5 hover:bg-slate-100');

file = file.replace(/w-8 h-8 bg-white\\/90 hover:bg-white text-\[#0f335f\]/g, 'w-12 h-12 bg-white/90 hover:bg-white text-[#0f335f] cursor-pointer shadow-md');
file = file.replace(/size={15}/g, 'size={24}');
file = file.replace(/h-1 transition-all w-6/g, 'h-1.5 transition-all cursor-pointer w-8');
file = file.replace(/h-1 transition-all w-3/g, 'h-1.5 transition-all cursor-pointer w-4');

fs.writeFileSync('src/components/Hero.tsx', file, 'utf8');
console.log('Hero sizing restored');

