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

// --- SHARED LOGO COMPONENT (Matches Navbar) ---
const Logo = () => (
  <svg viewBox="0 0 200 200" className="h-12 w-auto drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="footer-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E6DFD0" />
      </linearGradient>
      <linearGradient id="footer-grad-side" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D4C596" />
        <stop offset="100%" stopColor="#8A7D55" />
      </linearGradient>
      <linearGradient id="footer-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8A7D55" />
        <stop offset="100%" stopColor="#5C5035" />
      </linearGradient>
    </defs>
    <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#footer-grad-front)" stroke="#F3E7C9" strokeWidth="1" />
    <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#footer-grad-dark)" stroke="#F3E7C9" strokeWidth="1" />
    <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#footer-grad-front)" stroke="#F3E7C9" strokeWidth="1" />
    <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#footer-grad-side)" stroke="#F3E7C9" strokeWidth="1" />
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
    <footer id="contact" className="risa-font text-[#333] border-t border-gray-200 who-section-bg">
      
      {/* MAIN CONTENT AREA */}
      <div className="pt-20 pb-12 px-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* 1. BRAND & SOCIALS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 cursor-pointer select-none">
              <Logo />
              <div className="flex flex-col">
                <span className="text-navy font-black text-2xl tracking-tight risa-heading leading-none">
                  Kenya<span className="text-[#222]">realtors</span>
                </span>
                <span className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 risa-uppercase">
                  The Property Hub
                </span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight leading-relaxed border-l-4 border-cta pl-4 risa-subheading">
              Kenya's #1 Property Marketplace. <br/>
              <span className="text-[#0056A6]">Buy, Rent, and Sell with Confidence.</span>
            </p>

            <div className="flex gap-2">
              {[Facebook, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-darkgray flex items-center justify-center text-white hover:bg-cta transition-all rounded-lg shadow-sm">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* 2. DISCOVER */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#111] mb-6 border-b-2 border-navy inline-block pb-1 risa-heading">
              Discover
            </h3>
            <ul className="space-y-4">
              {operations.map((link, i) => (
                <li key={i}>
                  <a href={link.id} className="text-[11px] font-black text-gray-400 hover:text-navy uppercase flex items-center gap-2 group transition-colors risa-uppercase">
                    <div className="w-1.5 h-1.5 bg-cta rounded-full group-hover:scale-150 transition-transform"></div>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. RESOURCES */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#111] mb-6 border-b-2 border-navy inline-block pb-1 risa-heading">
              Resources
            </h3>
            <ul className="space-y-4">
              {legal.map((link, i) => (
                <li key={i}>
                  <a href={link.id} className="text-[11px] font-black text-gray-400 hover:text-[#0056A6] uppercase flex items-center gap-2 group transition-colors risa-uppercase">
                    <ArrowRight className="w-3 h-3 text-cta group-hover:translate-x-1 transition-transform" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. CONTACT BADGES */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#111] mb-3 border-b-2 border-navy inline-block pb-1 risa-heading">
              Contact Us
            </h3>
            <div className="p-4 bg-gray-50 border-l-4 border-navy rounded-r-xl flex items-center gap-3">
              <MapPin className="text-cta w-5 h-5" />
              <span className="text-[10px] font-black uppercase leading-tight text-gray-700 risa-subheading">
                Westlands, Nairobi<br/>Realtor Plaza, 4th Flr</span>
            </div>
            <a href="tel:+254706927062" className="p-4 bg-gray-50 border-l-4 border-cta rounded-r-xl flex items-center gap-3 group hover:bg-navy transition-all">
              <Phone className="text-navy group-hover:text-white w-5 h-5" />
              <span className="text-[10px] font-black uppercase text-gray-700 group-hover:text-white transition-colors risa-subheading">+254 706 927 062</span>
            </a>
            <a href="mailto:support@realtor.co.ke" className="p-4 bg-[#1a1a1a] rounded-xl flex items-center gap-3 group hover:shadow-lg transition-all">
              <Mail className="text-cta w-5 h-5" />
              <span className="text-[10px] font-black uppercase text-white group-hover:text-cta transition-colors risa-subheading">support@realtor.co.ke</span>
            </a>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP - Dark Mode match to Navbar Top Strip */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#003A75] to-[#1a1a1a] py-8 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] risa-uppercase">
            © 2026 KENYA REALTORS <span className="text-cta">|</span> ALL RIGHTS RESERVED
          </p>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-gray-300">
              <Smartphone className="w-4 h-4 text-cta" />
              <span className="text-[9px] font-black uppercase tracking-widest risa-uppercase">Mobile Friendly</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <ShieldCheck className="w-4 h-4 text-cta" />
              <span className="text-[9px] font-black uppercase tracking-widest risa-uppercase">Verified Listings</span>
            </div>
          </div>

          <div className="flex gap-6">
            {["Privacy Policy", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="text-[10px] text-gray-400 hover:text-white font-black uppercase transition-colors risa-uppercase">
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