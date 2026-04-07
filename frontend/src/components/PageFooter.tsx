import React from "react";
import {
  Diamond,
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
    <footer id="contact" className="relative text-slate-700">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#f5f9fd] via-[#edf4fb] to-[#e5eef7]">
        <div className="absolute inset-0 opacity-60 pointer-events-none bg-[radial-gradient(circle_at_14%_20%,rgba(255,255,255,0.85),transparent_36%),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.75),transparent_32%)]" />

        <div className="relative max-w-[1240px] mx-auto px-6 md:px-10 pt-7 md:pt-8 pb-7 md:pb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <a href="/" className="inline-flex items-center gap-3 group w-fit">
              <span className="h-6 w-6 rotate-45 rounded-sm bg-[#59a8ff] flex items-center justify-center">
                <Diamond size={13} className="-rotate-45 text-[#0f355f]" />
              </span>
              <span className="text-[1.45rem] leading-none font-bold tracking-tight text-[#154279]">Kenya Realtors</span>
            </a>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-slate-600">
              <a href="mailto:support@realtor.co.ke" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#F96302] transition-colors">
                <Mail size={16} className="text-[#154279]" />
                support@realtor.co.ke
              </a>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <MapPin size={16} className="text-[#154279]" />
                Nairobi HQ, Westlands.
              </span>
            </div>
          </div>

          <div className="mt-4 h-px bg-[#cbd5e1]" />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 max-w-[58ch]">
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
              <h3 className="text-base font-bold tracking-tight text-[#154279]">Quick Links</h3>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {usefulLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.id} className="text-sm text-slate-600 hover:text-[#F96302] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-[#F96302] text-white border-t border-transparent">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_8%,transparent_22%,transparent_55%,rgba(255,255,255,0.18)_72%,transparent_86%)]" />

        <div className="relative max-w-[1240px] mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs md:text-sm font-semibold text-white">
            © {year} KENYA REALTORS | ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span className="text-white/70">|</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;