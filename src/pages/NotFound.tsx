// © 2025 Jeff. All rights reserved.

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  // --- Animation Variants ---

  // The House Floating
  const floatVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 1, -1, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // The Shadow Breathing
  const shadowVariants = {
    animate: {
      scale: [1, 0.85, 1],
      opacity: [0.3, 0.15, 0.3],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Eyes Blinking
  const eyeVariants = {
    animate: {
      scaleY: [1, 1, 0.1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        times: [0, 0.9, 0.95, 1], // Blink rarely
        ease: "easeInOut"
      }
    }
  };

  // Question Mark Orbit
  const questionMarkVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 10, -10, 0],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden font-sans selection:bg-[#d97706] selection:text-white">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-900"></div>
      
      {/* --- THE ANIMATED CARTOON SCENE --- */}
      <div className="relative z-10 mb-12">
        
        {/* The Floating Question Mark */}
        <motion.div 
          className="absolute -top-4 -right-12 text-6xl font-serif text-[#d97706]"
          variants={questionMarkVariants}
          animate="animate"
        >
          ?
        </motion.div>

        {/* The Sad House SVG */}
        <motion.div variants={floatVariants} animate="animate" className="relative z-20">
          <svg width="240" height="240" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-100 drop-shadow-2xl">
            
            {/* House Structure (White Fill) */}
            <path d="M3 10L12 2L21 10V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10Z" fill="#e2e8f0" stroke="none" />
            <path d="M3 10L12 2L21 10V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V10Z" stroke="#94a3b8" />
            
            {/* Columns Details (To make it look classy) */}
            <path d="M6 12V19" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M18 12V19" stroke="#cbd5e1" strokeWidth="1" />

            {/* Left Eye (Sad & Blinking) */}
            <motion.ellipse 
              cx="8.5" cy="13" rx="1.5" ry="2" 
              fill="#1e293b" stroke="none"
              variants={eyeVariants}
              animate="animate"
            />
             {/* Eyebrow Left (Worried) */}
            <path d="M7 10C7.5 9.5 9.5 9.5 10 10" stroke="#1e293b" strokeWidth="1" />
            
            {/* Right Eye (Sad & Blinking) */}
            <motion.ellipse 
              cx="15.5" cy="13" rx="1.5" ry="2" 
              fill="#1e293b" stroke="none"
              variants={eyeVariants}
              animate="animate"
            />
            {/* Eyebrow Right (Worried) */}
            <path d="M14 10C14.5 9.5 16.5 9.5 17 10" stroke="#1e293b" strokeWidth="1" />

            {/* Sad Mouth */}
            <path d="M10 17C11 16 13 16 14 17" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            
          </svg>
        </motion.div>

        {/* The Shadow Underneath */}
        <motion.div 
          variants={shadowVariants}
          animate="animate"
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-[100%] blur-xl z-0"
        />
      </div>

      {/* --- CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center z-10 max-w-lg px-6"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Lost Your Way <span className="text-[#d97706]">Home?</span>
        </h1>
        
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          It seems the page you are looking for has gone on vacation or doesn't exist anymore.
        </p>

        <Button 
          onClick={() => navigate("/")}
          className="group relative h-14 px-8 bg-white text-slate-900 hover:bg-[#d97706] hover:text-white rounded-full font-bold text-base transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)]"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            Take Me Home
          </span>
        </Button>
      </motion.div>

      {/* Footer Copyright */}
      <div className="absolute bottom-6 text-[10px] text-slate-600 uppercase tracking-widest">
        © 2025 Jeff. All rights reserved.
      </div>

    </div>
  );
};

export default NotFound;