import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const HeroBackground = () => {
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      
      {/* PHASE 1: RIPPLES - Circular waves emanating from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {ripples.map((ripple, index) => (
          <motion.div
            key={`ripple-${index}`}
            className="absolute rounded-full border-2 border-[#F96302]"
            style={{
              width: '20px',
              height: '20px',
            }}
            animate={{
              scale: [1, 15],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: ripple.duration,
              repeat: Infinity,
              delay: ripple.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* PHASE 2: RADIAL BEAMS - Rotating beams styling */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <motion.div 
          className="relative w-[800px] h-[800px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {radialBeams.map((beam, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-[2px] h-[400px] origin-top"
              style={{
                background: 'linear-gradient(to top, #F96302, transparent)',
                transform: `rotate(${beam.angle}deg)`,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* PHASE 3: PARTICLES - Floating glowing dots */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-[#F96302] rounded-full blur-[1px]"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${(particle.id * 7) % 100}%`,
          }}
          initial={{ bottom: -20, opacity: 0 }}
          animate={{
            bottom: ['0%', '100%'],
            opacity: [0, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}
      
      {/* Overlay Gradient to blend edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#154279]/50 via-transparent to-[#154279]/30" />
    </div>
  );
};
