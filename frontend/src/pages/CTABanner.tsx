import React from "react";
import { motion } from "framer-motion";
import { Home, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#f4f4f4] py-8 font-sans">
      
      {/* Container - Fixed height, relative for absolute layers */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden bg-[#f4f4f4] flex flex-col md:flex-row h-[500px] md:h-[420px] rounded-none"
      >
        
        {/* ========================================== */}
        {/* CSS STYLES FOR POLYGONS AND BACKGROUNDS    */}
        {/* ========================================== */}
        <style>{`
          /* DESKTOP POLYGONS */
          @media (min-width: 768px) {
            .clip-yellow-desktop {
                clip-path: polygon(0 0, 54% 0, 74% 70%, 100% 70%, 100% 100%, 0 100%);
            }
            .clip-light-blue-desktop {
                clip-path: polygon(0 0, 51% 0, 71% 70%, 100% 70%, 100% 100%, 0 100%);
            }
            .clip-main-blue-desktop {
                clip-path: polygon(0 0, 48% 0, 68% 70%, 100% 70%, 100% 100%, 0 100%);
            }
            .clip-floating-yellow {
               clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
            }
            .clip-discount-box {
               clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
            }
          }

          /* MOBILE POLYGONS */
          @media (max-width: 767px) {
            .clip-yellow-desktop { clip-path: polygon(0 0, 100% 0, 100% 64%, 0 72%); }
            .clip-light-blue-desktop { clip-path: polygon(0 0, 100% 0, 100% 61%, 0 69%); }
            .clip-main-blue-desktop { clip-path: polygon(0 0, 100% 0, 100% 58%, 0 66%); }
            .clip-floating-yellow { display: none; }
            .clip-discount-box {
               clip-path: polygon(0 0, 100% 0, 100% 100%, 15% 100%);
            }
          }
        `}</style>


        {/* THE BACKGROUND (Right Side Image) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[60%]">
            <img 
              src="/banner.png" 
              alt="Perfect 3D Home" 
              className="w-full h-full object-cover object-center drop-shadow-2xl z-10"
            />
          </div>
        </div>

        {/* ================== POLYGON LAYERS ================== */}
        
        {/* Layer 1: Accent Orange Stripe */}
        <div className="absolute inset-0 bg-[#F96302] z-10 clip-yellow-desktop shadow-lg" />
        
        {/* Layer 2: Light Blue Stripe */}
        <div className="absolute inset-0 bg-[#1A4F8C] z-[11] clip-light-blue-desktop shadow-lg" />

        {/* Layer 3: Main Dark Blue Background */}
        <div className="absolute inset-0 bg-[#154279] z-[12] clip-main-blue-desktop shadow-lg" />

        {/* ==================================================== */}

        {/* Decorative Floating Orange Rectangle on the blue shelf (Desktop Only) */}
        <div className="hidden md:block absolute right-[13%] bottom-[33%] w-[20%] h-[8%] bg-[#F96302] z-[13] clip-floating-yellow shadow-[0_10px_20px_rgba(0,0,0,0.2)]"></div>

        {/* Bottom Right Discount Box */}
        <div className="absolute bottom-0 right-0 w-full sm:w-[50%] md:w-[32%] h-[15%] md:h-[22%] bg-[#F96302] z-20 flex items-center justify-center pl-8 md:pl-12 clip-discount-box shadow-[0_-5px_20px_rgba(0,0,0,0.15)]">
           <span className="text-white font-black text-xl md:text-2xl tracking-tight">Discount up to 50%</span>
        </div>

        {/* ================== FOREGROUND TEXT ================== */}
        <div className="absolute top-0 left-0 w-full h-full z-30 flex flex-col justify-start md:justify-center pt-8 md:pt-0 px-6 md:px-14 pointer-events-none text-left">
          <div className="w-full md:w-[48%] pointer-events-auto">
            
            {/* Logo area */}
            <div className="flex items-center gap-2 text-[#F96302] mb-5 md:mb-6">
              <Home className="w-5 h-5 text-white stroke-[2.5px]" />
              <span className="font-extrabold text-[13px] tracking-widest uppercase">KENYA REALTORS</span>
            </div>
            
            {/* Headings */}
            <h2 className="text-3xl md:text-[2.75rem] font-medium text-white leading-[1.1] mb-1 drop-shadow-md">
              Find Perfect Home <br/>
              <span className="font-black text-[#F96302] text-[2.5rem] md:text-[4.2rem] tracking-tighter uppercase block mt-1 leading-[0.95]">
                FOR LIVING
              </span>
            </h2>
            
            {/* Paragraph Line Divider */}
            <div className="mt-5 md:mt-8 border-l-2 border-[#F96302] pl-5 py-1 relative">
              <div className="absolute -left-[5.5px] top-0 w-2.5 h-2.5 rounded-full bg-[#F96302]"></div>
              <div className="absolute -left-[5.5px] bottom-0 w-2.5 h-2.5 rounded-full bg-[#F96302]"></div>
              <p className="text-sm md:text-[15px] text-white/90 leading-relaxed font-medium max-w-[95%]">
                Discover premium apartments and elite residential spaces customized to map your lifestyle. Step into luxury today.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 md:mt-10 flex items-stretch h-12 md:h-14 w-fit shadow-xl group">
              <button 
                onClick={() => navigate('/applications?type=looking')}
                className="flex items-center gap-2 md:gap-3 border-2 border-[#F96302] bg-transparent text-white pl-4 pr-5 md:pl-6 md:pr-8 h-full font-bold text-xs md:text-[13px] uppercase tracking-wider hover:bg-[#F96302] hover:text-white transition-all"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" /> SHOP NOW
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#F96302] text-white px-4 md:px-8 h-full font-extrabold text-xs md:text-[13px] lowercase tracking-wide border-y-2 border-r-2 border-[#F96302] hover:bg-[#E85D02] transition-all"
              >
                realtors.co.ke
              </button>
            </div>
            
          </div>
        </div>

      </motion.div>
    </section>
  );
}