import React from "react";
import { motion } from "framer-motion";
import { Home, ShoppingCart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#efeeee] py-8 md:py-10 font-nunito flex justify-center border-none">
      <div className="w-[96%] max-w-[1600px] relative z-10">
        {/* Restoring the original height container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full relative overflow-hidden bg-[#e0eaF5] flex flex-col md:flex-row h-[500px] md:h-[420px] rounded-none shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff]"
        >
          
          {/* ========================================== */}
          {/* CSS STYLES FOR POLYGON LAYOUT SHAPE        */}
          {/* ========================================== */}
          <style>{`
            /* DESKTOP POLYGONS */
            @media (min-width: 768px) {
              .clip-orange-desktop {
                  clip-path: polygon(0 0, 51% 0, 71% 70%, 100% 70%, 100% 100%, 0 100%);
              }
              .clip-main-blue-desktop {
                  clip-path: polygon(0 0, 48% 0, 68% 70%, 100% 70%, 100% 100%, 0 100%);
              }
              .clip-discount-box {
                 clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
              }
            }

            /* MOBILE POLYGONS */
            @media (max-width: 767px) {
              .clip-orange-desktop { clip-path: polygon(0 0, 100% 0, 100% 64%, 0 72%); }
              .clip-main-blue-desktop { clip-path: polygon(0 0, 100% 0, 100% 61%, 0 69%); }
              .clip-discount-box {
                 clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%);
              }
            }
          `}</style>


          {/* THE BACKGROUND (Right Side Image) */}
          <div className="absolute inset-0 z-0 border-none pointer-events-none">
            {/* The right container for the image */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] md:w-[60%] flex items-start justify-end z-10">
              <img
                src="/banner.png"
                alt="Perfect Home"
                /* object-contain ensures it shrinks completely to fit without cropping */
                className="w-full h-full object-cover object-left-top drop-shadow-2xl z-10"
              />
            </div>
          </div>


          {/* ================== POLYGON LAYERS ================== */}
          {/* Layer 1: Accent Orange Stripe */}
          <div className="absolute inset-0 bg-[#F96302] z-10 clip-orange-desktop outline-none pointer-events-none" />

          {/* Layer 2: Main Dark Blue Background */}
          <div className="absolute inset-0 bg-[#154279] z-[11] clip-main-blue-desktop outline-none pointer-events-none" />
          {/* ==================================================== */}

          {/* Bottom Right Box - Special Offers */}
          <div className="absolute bottom-0 right-0 w-full sm:w-[50%] md:w-[32%] h-[15%] md:h-[22%] bg-[#F96302] z-20 flex items-center justify-center pl-8 md:pl-12 clip-discount-box border-none shadow-[0_-5px_20px_rgba(0,0,0,0.15)] pointer-events-none">
             <span className="text-white font-black text-xl md:text-2xl tracking-tight uppercase">Special Offers</span>
          </div>

          {/* ================== FOREGROUND TEXT ================== */}
          {/* Keeping our sleek professional typography and copy */}
          <div className="absolute top-0 left-0 w-full h-full z-30 flex flex-col justify-start md:justify-center pt-8 md:pt-0 px-6 md:px-14 pointer-events-none text-left border-none">
            <div className="w-full md:w-[48%] pointer-events-auto">

              <div className="flex items-center gap-2 text-[#F96302] mb-5 md:mb-6">
                <Home className="w-5 h-5 text-white stroke-[2.5px]" />
                <span className="font-black text-[13px] tracking-widest uppercase">KENYA REALTORS</span>
              </div>

              <h2 className="text-3xl md:text-[2.75rem] font-bold text-white leading-[1.1] mb-1 drop-shadow-md tracking-tight">
                Ready to elevate <br className="hidden lg:block"/>
                <span className="font-black text-[#F96302] text-[2.5rem] md:text-[3.8rem] tracking-tighter uppercase block mt-1 leading-[0.95]">
                  YOUR LIVING
                </span>
              </h2>

              <div className="mt-5 md:mt-8 border-l-2 border-[#F96302] pl-5 py-1 relative">
                <div className="absolute -left-[5.5px] top-0 w-2.5 h-2.5 rounded-full bg-[#F96302]"></div>
                <div className="absolute -left-[5.5px] bottom-0 w-2.5 h-2.5 rounded-full bg-[#F96302]"></div>
                <p className="text-sm md:text-[14px] text-white/90 leading-relaxed font-semibold max-w-[95%]">
                  Join hundreds of residents experiencing the pinnacle of property management. 
                  Secure your unit today and enjoy premium amenities and transparent billing right out of the box.
                </p>
              </div>

              {/* Skeuomorphic Action Buttons */}
              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-fit group">
                <button
                  onClick={() => navigate('/applications')}
                  className="px-6 py-3 md:px-8 md:py-4 bg-[#F96302] hover:bg-[#e55a00] text-white font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-none shadow-[4px_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_2px_2px_4px_#ab4401,inset_-2px_-2px_4px_#ff8203]"
                >
                  <ShoppingCart className="w-4 h-4" /> Start Application
                </button>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 md:px-8 md:py-4 bg-transparent border-2 border-[#F96302] hover:bg-[#F96302] text-white font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[4px_4px_8px_rgba(0,0,0,0.2)]"
                >
                  Contact Leasing <ArrowRight size={16} />
                </button>
              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}


