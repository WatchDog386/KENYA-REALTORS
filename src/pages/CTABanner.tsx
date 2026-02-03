import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Heart,
  CheckCircle2,
  ShieldCheck,
  Home,
  Key,
  Building2,
  Sparkles
} from "lucide-react";

// ==========================================
// 1. STYLES (Compact Industrial Theme)
// ==========================================
const GlobalStyles = () => (
  <style>{`
    /* Custom scrollbar for consistency */
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #ccc; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #F96302; }
    
    /* Hover Effect: Blue to Orange transition */
    .realtor-strip-hover { background-color: #154279 !important; border-color: #154279 !important; }
    .realtor-strip-hover:hover { background-color: #F96302 !important; border-color: #F96302 !important; }

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

    /* Shimmer effect */
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .shimmer-effect {
      animation: shimmer 3s infinite;
    }
  `}</style>
);

// ==========================================
// 2. ANIMATED BACKGROUND COMPONENT
// ==========================================
const AnimatedBackground = () => {
  // Floating icons that move across the banner
  const floatingIcons = useMemo(() => [
    { Icon: Home, delay: 0, duration: 8, startY: 20, size: 16 },
    { Icon: Key, delay: 2, duration: 10, startY: 60, size: 14 },
    { Icon: Building2, delay: 4, duration: 7, startY: 40, size: 18 },
    { Icon: Sparkles, delay: 1, duration: 9, startY: 80, size: 12 },
    { Icon: Home, delay: 3, duration: 11, startY: 30, size: 14 },
    { Icon: Key, delay: 5, duration: 8, startY: 70, size: 16 },
  ], []);

  // Floating particles/dots
  const particles = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 6,
      startY: Math.random() * 100,
      opacity: Math.random() * 0.3 + 0.1,
    })), []);

  // Ripple circles
  const ripples = useMemo(() => [
    { delay: 0, duration: 3 },
    { delay: 0.5, duration: 3 },
    { delay: 1, duration: 3 },
    { delay: 1.5, duration: 3 },
  ], []);

  // Radial beams
  const radialBeams = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      angle: (i * 30),
      delay: i * 0.1,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ left: '192px' }}>
      
      {/* PHASE 1: RIPPLES - Circular waves emanating from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {ripples.map((ripple, index) => (
          <motion.div
            key={`ripple-${index}`}
            className="absolute rounded-full border-2 border-[#F96302]"
            style={{
              width: 20,
              height: 20,
            }}
            animate={{
              width: [20, 400, 400],
              height: [20, 400, 400],
              opacity: [0.8, 0, 0],
              borderWidth: [4, 1, 0],
            }}
            transition={{
              duration: ripple.duration,
              delay: ripple.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* PHASE 2: SPIRALS - Rotating spiral arms */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute"
          style={{ width: 300, height: 300 }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[0, 1, 2, 3].map((arm) => (
            <motion.div
              key={`spiral-arm-${arm}`}
              className="absolute top-1/2 left-1/2 origin-left"
              style={{
                width: 150,
                height: 4,
                background: `linear-gradient(90deg, #F96302, transparent)`,
                transform: `rotate(${arm * 90}deg)`,
                borderRadius: 2,
              }}
              animate={{
                opacity: [0.6, 0.2, 0.6],
                scaleX: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: arm * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
        
        {/* Inner rotating spiral */}
        <motion.div
          className="absolute"
          style={{ width: 200, height: 200 }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {[0, 1, 2].map((arm) => (
            <motion.div
              key={`inner-spiral-${arm}`}
              className="absolute top-1/2 left-1/2 origin-left"
              style={{
                width: 100,
                height: 3,
                background: `linear-gradient(90deg, #FCD200, transparent)`,
                transform: `rotate(${arm * 120}deg)`,
                borderRadius: 2,
              }}
              animate={{
                opacity: [0.5, 0.15, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: arm * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* PHASE 3: RADIALS - Beams radiating outward */}
      <div className="absolute inset-0 flex items-center justify-center">
        {radialBeams.map((beam, index) => (
          <motion.div
            key={`radial-${index}`}
            className="absolute origin-center"
            style={{
              width: 2,
              height: 60,
              background: 'linear-gradient(to top, #F96302, transparent)',
              transform: `rotate(${beam.angle}deg) translateY(-80px)`,
            }}
            animate={{
              height: [40, 100, 40],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              delay: beam.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Pulsing center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute w-16 h-16 bg-[#F96302] rounded-full filter blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute w-8 h-8 bg-[#FCD200] rounded-full filter blur-lg"
          animate={{
            scale: [1.2, 0.8, 1.2],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Color sweep overlay that ties it together */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, #F96302 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Shimmer line effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          animate={{
            x: ['-100%', '400%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, duration, startY, size }, index) => (
        <motion.div
          key={`icon-${index}`}
          className="absolute text-white/10"
          style={{ top: `${startY}%` }}
          initial={{ x: '-10%', opacity: 0 }}
          animate={{ 
            x: '110%', 
            opacity: [0, 0.15, 0.15, 0],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full bg-white"
          style={{
            width: particle.size,
            height: particle.size,
            top: `${particle.startY}%`,
            opacity: particle.opacity,
          }}
          initial={{ x: '-5%' }}
          animate={{ 
            x: '105%',
            y: [0, -20, 10, -10, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

export default function TenantCTABanner() {
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("realtor_unit_saved") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("realtor_unit_saved", isSaved ? "true" : "false");
  }, [isSaved]);

  return (
    <>
    <GlobalStyles />
    <section className="w-full bg-slate-50 py-4 px-4 text-[#484848]">
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto shadow-lg group"
      >
        
        {/* COMPACT STRIP CONTAINER */}
        <div className="bg-[#154279] transition-colors duration-300 flex flex-col md:flex-row h-auto md:h-40 relative overflow-hidden">
          
          {/* Animated Background Effects */}
          <AnimatedBackground />
          
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
               <span className="bg-[#154279] text-white transition-colors text-[9px] font-black uppercase px-1.5 py-0.5 tracking-widest group-hover:bg-white group-hover:text-[#F96302]">
                 New Listing
               </span>
               <span className="text-[9px] font-bold text-white/80 uppercase tracking-wide group-hover:text-white transition-colors">
                 Ref: #404-KE
               </span>
             </div>

             <h2 className="font-condensed font-black text-2xl md:text-3xl text-white uppercase leading-none mb-2 drop-shadow-sm">
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
               <button className="bg-white text-[#154279] hover:bg-[#F96302] hover:text-white transition-colors h-8 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm">
                  <Search className="w-3 h-3" /> View
               </button>
               
               <button 
                 onClick={() => setIsSaved(!isSaved)}
                 className={`h-8 border text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all
                 ${isSaved 
                    ? 'bg-[#F96302] border-[#F96302] text-white' 
                    : 'border-white/30 text-white hover:bg-[#154279]'}`}
               >
                  <Heart className={`w-3 h-3 ${isSaved ? 'fill-white' : ''}`} />
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