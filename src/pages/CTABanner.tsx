import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Heart,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

// ==========================================
// 1. STYLES (Compact Industrial Theme)
// ==========================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;700;900&display=swap');
    
    .font-condensed { font-family: 'Roboto Condensed', sans-serif; }
    .font-pro { font-family: 'Inter', sans-serif; }
    
    /* Hover Effect: Blue to Orange transition */
    .realtor-strip-hover:hover { background-color: #D85C2C !important; border-color: #D85C2C !important; }
    .realtor-strip-hover:hover .text-dynamic { color: white !important; }
    .realtor-strip-hover:hover .bg-dynamic { background-color: white !important; color: #F96302 !important; }

    /* Subtle Texture */
    .bg-texture-stripes {
      background-image: repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 4px,
        rgba(0, 0, 0, 0.05) 4px,
        rgba(0, 0, 0, 0.05) 8px
      );
    }
  `}</style>
);

export default function TenantCTABanner() {
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("realtor_unit_saved") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("realtor_unit_saved", isSaved);
  }, [isSaved]);

  return (
    <>
    <GlobalStyles />
    <section className="w-full bg-[#F4F4F4] py-4 px-4 font-pro">
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto shadow-lg group"
      >
        
        {/* COMPACT STRIP CONTAINER */}
        <div className="bg-[#0056b3] realtor-strip-hover transition-colors duration-300 flex flex-col md:flex-row h-auto md:h-40 relative overflow-hidden border-b-4 border-black/20">
          
          {/* Background Texture */}
          <div className="absolute inset-0 bg-texture-stripes opacity-20 pointer-events-none"></div>

          {/* 1. LOGO SECTION (Left) */}
          <div className="w-full md:w-48 bg-white relative z-10 flex-shrink-0 border-r border-gray-200">
             <div className="w-full h-full relative overflow-hidden group-hover:grayscale-0 transition-all duration-500">
                {/* Logo Image */}
                <img 
                  src="/realtor.jpg" 
                  alt="Realtor Logo" 
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Verified Overlay Badge */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                   <ShieldCheck className="w-2.5 h-2.5 text-[#FCD200]" /> Verified
                </div>
             </div>
          </div>

          {/* 2. CONTENT SECTION (Middle) - Compacted */}
          <div className="flex-1 p-4 md:p-5 flex flex-col justify-center relative z-10">
             
             <div className="flex items-center gap-2 mb-1">
               <span className="bg-dynamic bg-black text-white transition-colors text-[9px] font-black uppercase px-1.5 py-0.5 tracking-widest">
                 New Listing
               </span>
               <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide">
                 Ref: #404-KE
               </span>
             </div>

             <h2 className="font-condensed font-black text-2xl md:text-3xl text-white uppercase italic leading-none mb-2 drop-shadow-sm">
                Modern <span className="text-white/50">Living Spaces</span>
             </h2>
             
             <div className="flex flex-wrap gap-x-4 gap-y-1 text-white text-[10px] font-bold uppercase opacity-90">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#FCD200]" /> High-Speed Fiber
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#FCD200]" /> Backup Generator
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#FCD200]" /> CCTV Security
                </span>
             </div>
          </div>

          {/* 3. ACTION SECTION (Right) - Streamlined */}
          <div className="w-full md:w-64 bg-white/5 backdrop-blur-sm border-l border-white/10 p-4 flex flex-col justify-center relative z-20">
             
             <div className="flex items-end justify-between md:justify-start md:gap-3 mb-3 border-b border-white/20 pb-2">
                <span className="text-white/60 text-[9px] font-black uppercase mb-1">Rent</span>
                <div className="text-white font-condensed font-black text-3xl leading-none tracking-tighter">
                   15K <span className="text-[10px] text-[#FCD200]">KES</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-2">
               <button className="bg-white text-black hover:bg-[#111] hover:text-white transition-colors h-8 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                  <Search className="w-3 h-3" /> View
               </button>
               
               <button 
                 onClick={() => setIsSaved(!isSaved)}
                 className={`h-8 border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all
                 ${isSaved 
                    ? 'bg-[#FCD200] border-[#FCD200] text-black' 
                    : 'border-white/30 text-white hover:bg-white/10'}`}
               >
                  <Heart className={`w-3 h-3 ${isSaved ? 'fill-black' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
               </button>
             </div>

          </div>
        </div>

      </motion.div>
    </section>
    </>
  );
}