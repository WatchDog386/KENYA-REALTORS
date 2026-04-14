import React from "react";
import {
  Home,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Music2,
} from "lucide-react";

const Footer = () => {
  const usefulLinks = [
    { label: "My Saved Homes", id: "#" },
    { label: "List a Property", id: "#" },
    { label: "Find an Agent", id: "#" },
    { label: "Mortgage Calculator", id: "#" },
    { label: "Market Trends", id: "#" },
    { label: "Buying Guide", id: "#" },
    { label: "Contact Support", id: "#contact" },
  ];

  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative font-nunito skeuo-navbar text-[#243041] bg-white">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');`}</style>
      <div className="relative overflow-hidden bg-gradient-to-r from-[#f5f9fd] via-[#edf4fb] to-[#e5eef7]">
        <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_14%_20%,rgba(255,255,255,0.85),transparent_36%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.75),transparent_32%)]" />

        <div className="relative max-w-[1240px] mx-auto px-6 md:px-10 pt-7 md:pt-8 pb-7 md:pb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <a href="/" className="flex items-center gap-2 group w-fit">
              <svg
                viewBox="0 0 200 200"
                className="h-7 w-auto drop-shadow-sm"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="grad-front-nav-sa" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F9F1DC" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                  <linearGradient id="grad-side-nav-sa" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#AA8C2C" />
                  </linearGradient>
                  <linearGradient id="grad-dark-nav-sa" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#998A5E" />
                    <stop offset="100%" stopColor="#5C5035" />
                  </linearGradient>
                </defs>
                <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav-sa)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
                <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav-sa)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
                <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav-sa)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
                <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav-sa)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
                <g fill="#154279">
                  <path d="M85 50 L100 56 V86 L85 80 Z" />
                  <path d="M85 90 L100 96 V126 L85 120 Z" />
                  <path d="M45 60 L55 54 V124 L45 130 Z" />
                  <path d="M120 130 L140 122 V152 L120 160 Z" />
                </g>
              </svg>
              <span className="text-lg md:text-xl font-black text-[#154279] uppercase tracking-tighter">REALTORS<span className="text-[#F96302]">.</span></span>
            </a>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[#154279]">
              <a href="mailto:support@realtor.co.ke" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#F96302] transition-colors">
                <Mail size={16} className="text-[#154279]" />
                support@realtor.co.ke
              </a>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <MapPin size={16} className="text-[#154279]" />
                Nairobi HQ, Westlands.
              </span>
            </div>
          </div>

          <div className="mt-4 h-px bg-[#cbd5e1]" />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <p className="text-sm text-[#243041] max-w-[58ch] font-nunito">
                Kenya Realtors helps people buy, rent, and sell with confidence through verified listings and trusted support.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="text-[#154279] hover:text-[#F96302] transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="#" aria-label="TikTok" className="text-[#154279] hover:text-[#F96302] transition-colors">
                  <Music2 size={18} />
                </a>
                <a href="#" aria-label="LinkedIn" className="text-[#154279] hover:text-[#F96302] transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#154279] mb-2 font-nunito">Quick Links</h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {usefulLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.id} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-[#F96302] transition-colors font-nunito">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-[#154279] text-white border-t border-transparent">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_8%,transparent_22%,transparent_55%,rgba(255,255,255,0.18)_72%,transparent_86%)]" />

        <div className="relative max-w-[1240px] mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs md:text-sm font-semibold text-white font-nunito">
            © {year} KENYA REALTORS | ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold font-nunito">
            <a href="#" className="hover:text-[#F96302] transition-colors">Terms of Service</a>
            <span className="text-white/70">|</span>
            <a href="#" className="hover:text-[#F96302] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;