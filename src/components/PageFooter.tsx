import React from "react";
import { 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Linkedin, 
  Twitter, 
  Facebook,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

// Color configuration matching Navbar
const COLORS = {
  primary: "#154279",
  secondary: "#F96302",
  light: "#F9F1DC",
  dark: "#5C5035",
};

// --- SHARED LOGO COMPONENT (Matches Navbar) ---
const Logo = () => (
  <svg viewBox="0 0 200 200" className="h-12 w-auto drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="footer-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F9F1DC" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>
      <linearGradient id="footer-grad-side" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#AA8C2C" />
      </linearGradient>
      <linearGradient id="footer-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#998A5E" />
        <stop offset="100%" stopColor="#5C5035" />
      </linearGradient>
      <filter id="footer-glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#footer-grad-front)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#footer-glow)"/>
    <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#footer-grad-dark)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#footer-glow)"/>
    <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#footer-grad-front)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#footer-glow)"/>
    <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#footer-grad-side)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#footer-glow)"/>
    <defs>
      <linearGradient id="footer-window-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#154279" />
        <stop offset="100%" stopColor="#0F2847" />
      </linearGradient>
    </defs>
    <g fill="url(#footer-window-grad)" opacity="0.9">
      <path d="M85 50 L100 56 V86 L85 80 Z" />
      <path d="M85 90 L100 96 V126 L85 120 Z" />
      <path d="M45 60 L55 54 V124 L45 130 Z" />
      <path d="M120 130 L140 122 V152 L120 160 Z" />
    </g>
    <circle cx="120" cy="60" r="8" fill="#F96302" opacity="0.7" filter="url(#footer-glow)"/>
  </svg>
);

const Footer = () => {
  const operations = [
    { label: "My Saved Homes", id: "#" },
    { label: "List a Property", id: "#" },
    { label: "Find an Agent", id: "#" },
    { label: "Mortgage Calculator", id: "#" },
  ];

  const legal = [
    { label: "Market Trends", id: "#" },
    { label: "Buying Guide", id: "#" },
    { label: "Commercial Leasing", id: "#" },
    { label: "Terms of Service", id: "#" },
  ];

  return (
    <footer id="contact" className="text-slate-900 border-t border-slate-200 bg-white">
      
      {/* MAIN CONTENT AREA */}
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* 1. BRAND & SOCIALS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 cursor-pointer select-none">
              <Logo />
              <div className="flex flex-col justify-center">
                <div className="flex items-baseline gap-1">
                  <span className={`text-[${COLORS.primary}] font-bold text-xl md:text-2xl tracking-tight leading-none`}>
                    Kenya
                  </span>
                  <span className="text-slate-900 font-bold text-xl md:text-2xl tracking-tight leading-none">
                    realtors
                  </span>
                  <div className={`h-2 w-2 bg-[${COLORS.secondary}] rounded-none mb-2 shadow-sm`}></div>
                </div>
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-0.5">
                  The Property Hub
                </span>
              </div>
            </div>

            <p className="text-[9px] font-semibold leading-relaxed border-l-4 pl-4" style={{ color: COLORS.primary, borderLeftColor: COLORS.secondary }}>
              Kenya's #1 Property Marketplace. <br/>
              <span style={{ color: COLORS.primary }} className="font-bold">Buy, Rent, and Sell with Confidence.</span>
            </p>
          </div>

          {/* 2. DISCOVER */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b-2 text-black" style={{ borderBottomColor: COLORS.primary }}>
              Discover
            </h3>
            <ul className="space-y-4">
              {operations.map((link, i) => (
                <li key={i}>
                  <a href={link.id} className="text-[11px] font-bold uppercase flex items-center gap-2 group transition-colors" style={{ color: COLORS.primary }}>
                    <div className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: COLORS.secondary }}></div>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. RESOURCES */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b-2 text-black" style={{ borderBottomColor: COLORS.primary }}>
              Resources
            </h3>
            <ul className="space-y-4">
              {legal.map((link, i) => (
                <li key={i}>
                  <a href={link.id} className="text-[11px] font-bold uppercase flex items-center gap-2 group transition-colors" style={{ color: COLORS.primary }}>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" style={{ color: COLORS.secondary }} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. CONTACT BADGES */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-widest mb-3 pb-2 border-b-2 text-black" style={{ borderBottomColor: COLORS.primary }}>
              Contact Us
            </h3>
            <div className="p-4 bg-slate-50 border-l-4 rounded-none flex items-center gap-3" style={{ borderLeftColor: COLORS.primary }}>
              <MapPin className="w-5 h-5" style={{ color: COLORS.secondary }} />
              <span className="text-[10px] font-bold uppercase leading-tight text-slate-700">
                Westlands, Nairobi<br/>Realtor Plaza, 4th Flr
              </span>
            </div>
            <a 
              href="tel:+254706927062" 
              className="p-4 bg-slate-50 border-l-4 rounded-none flex items-center gap-3 group transition-all duration-300"
              style={{ borderLeftColor: COLORS.secondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgb(248, 250, 252)";
                e.currentTarget.style.color = "inherit";
              }}
            >
              <Phone className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase text-slate-700 group-hover:text-white transition-colors">
                +254 706 927 062
              </span>
            </a>
            <a 
              href="mailto:support@realtor.co.ke" 
              className="p-4 rounded-none flex items-center gap-3 group transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              style={{ backgroundColor: COLORS.primary }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primary}
            >
              <Mail className="w-5 h-5 text-white" />
              <span className="text-[10px] font-bold uppercase text-white">
                support@realtor.co.ke
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP - Match to Navbar Top Strip */}
      <div 
        className="py-8 px-6"
        style={{
          backgroundImage: `linear-gradient(to right, ${COLORS.primary}, #003A75, ${COLORS.primary})`
        }}
      >
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-white/90 font-bold uppercase tracking-[0.2em]">
            © 2026 KENYA REALTORS <span style={{ color: COLORS.secondary }}>|</span> ALL RIGHTS RESERVED
          </p>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-white/80">
              <Smartphone className="w-4 h-4" style={{ color: COLORS.secondary }} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Mobile Friendly</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <ShieldCheck className="w-4 h-4" style={{ color: COLORS.secondary }} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Verified Listings</span>
            </div>
          </div>

          <div className="flex gap-6">
            {["Privacy Policy", "Cookie Policy"].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="text-[10px] text-white/70 font-bold uppercase transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;