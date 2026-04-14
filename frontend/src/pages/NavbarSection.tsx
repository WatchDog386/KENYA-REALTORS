import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, Globe } from "lucide-react";
import {
  FaBars,
  FaUser,
  FaSearch,
  FaChevronDown,
  FaSignOutAlt,
  FaSignInAlt,
  FaCity,
  FaKey,
  FaMapPin,
  FaBed,
  FaBath
} from "react-icons/fa";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  NAVIGATION_SECTIONS,
  COLORS,
  UTILITY_BAR,
  QUICK_ACTIONS,
  PROMO_BANNER,
  BRAND,
  SEARCH_BAR,
  NAVBAR_HEIGHTS,
  MOBILE_HEADER,
  FONTS,
  LOGOUT_BUTTON,
} from "@/config/navbarConfig";

// Unified Data for Search
const SEARCH_DATA = [
  // --- HERO LISTINGS ---
  { id: 101, title: "Modern Downtown Loft", area: "CBD", price: "85,000", type: "Loft", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=200" },
  { id: 102, title: "Suburban Family Home", area: "Karen", price: "150,000", type: "House", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=200" },
  { id: 103, title: "Cozy Studio Apartment", area: "Roysambu", price: "25,000", type: "Studio", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200" },
  { id: 104, title: "Luxury Condo w/ View", area: "Westlands", price: "210,000", type: "Condo", img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=200" }
];

// Extract unique locations with vacancy info
const LOCATION_AREAS = [
  { name: "CBD", vacancies: 7, rentals: 15 },
  { name: "Karen", vacancies: 4, rentals: 10 },
  { name: "Roysambu", vacancies: 6, rentals: 14 },
  { name: "Westlands", vacancies: 3, rentals: 9 }
];

const PUBLIC_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sw", label: "Swahili" },
  { code: "ar", label: "Arabic" },
  { code: "so", label: "Somali" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

const NAVBAR_UNIFIED_TEXT_CLASS = "text-lg font-bold";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [filteredResults, setFilteredResults] = useState<typeof SEARCH_DATA>([]);
  const [publicLanguage, setPublicLanguage] = useState(() => localStorage.getItem("public_language") || "en");

  const resolveRoute = (action?: string) => {
    const normalized = (action || "").trim();
    if (!normalized) return "/";
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  const goToRoute = (action?: string) => {
    setMenuOpen(false);
    setShowTenantDropdown(false);
    navigate(resolveRoute(action));
  };

  const handleLanguageChange = (languageCode: string) => {
    setPublicLanguage(languageCode);
    localStorage.setItem("public_language", languageCode);

    if (languageCode === "en") {
      return;
    }

    const sourceUrl = window.location.href;
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=${languageCode}&u=${encodeURIComponent(sourceUrl)}`;
    window.open(translateUrl, "_blank", "noopener,noreferrer");
  };

  // Search Logic
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (lowerQuery === "") {
      // Show all results if search is empty (or limit to top 5-10 if list is huge)
      setFilteredResults(SEARCH_DATA);
      return;
    }
    const results = SEARCH_DATA.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.area.toLowerCase().includes(lowerQuery) ||
      item.type.toLowerCase().includes(lowerQuery)
    );
    setFilteredResults(results);
  }, [searchQuery]);

  // Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = FONTS.url;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      .brand-lowercase { text-transform: lowercase; }
      
      /* Navbar height variables for consistent spacing */
      :root {
        --navbar-height-mobile: ${NAVBAR_HEIGHTS.mobile};
        --navbar-height-desktop: ${NAVBAR_HEIGHTS.desktop};
      }

      .logo-svg {
        transition: transform 0.3s ease;
      }

      .logo-svg:hover {
        transform: translateY(-3px);
      }
    `;
    document.head.appendChild(style);

    return () => {
      if(document.head.contains(link)) document.head.removeChild(link);
      if(document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation Logic
  const handleNavClick = (id) => {
    setMenuOpen(false);
    navigate(`/${id}`);
  };

  const handleHomeClick = () => {
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div 
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white ${isScrolled ? "shadow-sm" : ""}`}
      style={{
        '--navbar-height-mobile': NAVBAR_HEIGHTS.mobile,
        '--navbar-height-desktop': NAVBAR_HEIGHTS.desktop
      } as React.CSSProperties}
    >
        
      {/* Top Utility Strip: Deep Blue Background - Brighter */}
      <div
        className="text-white hidden lg:block border-b border-primary"
        style={{
          background: COLORS.primary,
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-6 text-white font-medium">
            {UTILITY_BAR.location.enabled && (
              <>
                <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
                  <UTILITY_BAR.location.icon size={12} className={`text-[${COLORS.secondary}]`} />
                  <span className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-white group-hover:text-[#F96302] transition-colors`}>{UTILITY_BAR.location.text}</span>
                </button>
                <div className="h-3 w-[1px] bg-white/20"></div>
              </>
            )}
            {UTILITY_BAR.phone.enabled && (
              <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
                <UTILITY_BAR.phone.icon size={11} className={`text-[${COLORS.secondary}]`} />
                <span className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-white group-hover:text-[#F96302] transition-colors`}>{UTILITY_BAR.phone.text}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-6 tracking-wide">
            <div className="flex items-center gap-2">
              <Globe size={11} className="text-[#F96302]" />
              <select
                value={publicLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`${NAVBAR_UNIFIED_TEXT_CLASS} bg-transparent text-white uppercase tracking-wider border border-white/30 rounded px-2 py-1 focus:outline-none focus:border-[#F96302]`}
                aria-label="Select site language"
              >
                {PUBLIC_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code} className="text-slate-900">
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            {UTILITY_BAR.buttons.map((btn, idx) => (
              <button 
                key={idx} 
                type="button"
                onClick={() => goToRoute(btn.action)} 
                className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-white hover:text-[#F96302] transition-colors uppercase`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div
        className={`relative z-20 transition-all duration-300 py-2 md:py-3 md:rounded-none rounded-b-[2rem] md:shadow-none`}
        style={{
          background: "#ffffff",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            
            {/* MOBILE ONLY HEADER: CLEAN APP STYLE */}
            <div className="flex lg:hidden items-center justify-between w-full h-12">
               {/* 1. Left: Hamburger */}
               <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-xl text-[#154279] bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
               >
                 <FaBars size={24} />
               </button>

               {/* 2. Center: Logo Icon Only (App Style) */}
               <div onClick={handleHomeClick} className="flex items-center justify-center gap-2">
                  {/* SVG Logo */}
                  <svg viewBox="0 0 200 200" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="mobile-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F9F1DC" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                      <linearGradient id="mobile-grad-side" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#AA8C2C" />
                      </linearGradient>
                      <linearGradient id="mobile-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#998A5E" />
                        <stop offset="100%" stopColor="#5C5035" />
                      </linearGradient>
                      <filter id="mobile-glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#mobile-grad-front)" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#mobile-grad-dark)" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#mobile-grad-front)" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#mobile-grad-side)" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round"/>
                    
                    <defs>
                      <linearGradient id="mobile-window-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#154279" />
                        <stop offset="100%" stopColor="#0F2847" />
                      </linearGradient>
                    </defs>
                    <g fill="url(#mobile-window-grad)" opacity="0.9">
                      <path d="M85 50 L100 56 V86 L85 80 Z" />
                      <path d="M85 90 L100 96 V126 L85 120 Z" />
                      <path d="M45 60 L55 54 V124 L45 130 Z" />
                      <path d="M120 130 L140 122 V152 L120 160 Z" />
                    </g>
                    <circle cx="120" cy="60" r="8" fill="#F96302" opacity="0.7" filter="url(#mobile-glow)"/>
                  </svg>
                  
                  {/* Text Logo */}
                  <div className="flex flex-col justify-center font-brand -mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[#154279] font-bold text-lg tracking-tight leading-none">
                        Kenya
                      </span>
                      <span className="text-slate-900 font-bold text-lg tracking-tight leading-none">
                        realtors
                      </span>
                      <div className={`h-1.5 w-1.5 bg-[${COLORS.secondary}] rounded-none mb-1 shadow-sm`}></div>
                    </div>
                    <span className="text-slate-500 font-bold text-lg uppercase tracking-[0.2em]">
                      The Property Hub
                    </span>
                  </div>
               </div>

               {/* 3. Right: Login */}
               <button
                  onClick={() => goToRoute("login")}
                className={`px-3 py-2 text-[#154279] ${NAVBAR_UNIFIED_TEXT_CLASS} uppercase tracking-wider hover:text-[#F96302] transition-colors`}
               >
                 Login
               </button>
            </div>

            {/* DESKTOP HEADER (Hidden on mobile) */}
            <div className="hidden lg:flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                {/* LOGO AREA */}
                <div 
                  onClick={handleHomeClick} 
                  className="shrink-0 cursor-pointer flex items-center gap-3 group"
                >
                  {/* SVG: Gold/Metallic Colors */}
                  <svg viewBox="0 0 200 200" className="h-10 md:h-12 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300 logo-svg" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="grad-front-nav" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F9F1DC" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                      <linearGradient id="grad-side-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#AA8C2C" />
                      </linearGradient>
                      <linearGradient id="grad-dark-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#998A5E" />
                        <stop offset="100%" stopColor="#5C5035" />
                      </linearGradient>
                      <filter id="glow-nav">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Enhanced Structure with Golden Accents */}
                    <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow-nav)"/>
                    <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow-nav)"/>
                    <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow-nav)"/>
                    <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav)" stroke="#D4AF37" strokeWidth="2.5" strokeLinejoin="round" filter="url(#glow-nav)"/>
                    
                    {/* Enhanced Windows with Gradient */}
                    <defs>
                      <linearGradient id="window-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#154279" />
                        <stop offset="100%" stopColor="#0F2847" />
                      </linearGradient>
                    </defs>
                    <g fill="url(#window-grad)" opacity="0.9">
                      <path d="M85 50 L100 56 V86 L85 80 Z" />
                      <path d="M85 90 L100 96 V126 L85 120 Z" />
                      <path d="M45 60 L55 54 V124 L45 130 Z" />
                      <path d="M120 130 L140 122 V152 L120 160 Z" />
                    </g>

                    {/* Accent Highlight */}
                    <circle cx="120" cy="60" r="8" fill="#F96302" opacity="0.7" filter="url(#glow-nav)"/>
                  </svg>

                  {/* BRAND TEXT: Blue Dominant */}
                  <div className="flex flex-col justify-center select-none ml-1">
                    <span className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-black leading-none ml-0.5 brand-lowercase tracking-[0.2em] uppercase`}>
                        {BRAND.countryLabel}
                    </span>
                    <div className="flex items-baseline -mt-1 relative">
                      <span className="font-semibold text-2xl md:text-4xl font-extrabold tracking-tight text-[#154279] brand-lowercase">
                        {BRAND.brandName}
                        </span>
                        {/* Dot is Bright Orange */}
                        <div className={`h-1.5 w-1.5 md:h-2 md:w-2 bg-[${BRAND.dotColor}] rounded-none ml-1 mb-1.5 shadow-sm`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE MENU SHEET (REPLACES OLD DROPDOWN) */}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                 <SheetContent side="left" className="w-[300px] p-0 border-r-4 border-[#F96302]">
                    <div className="flex flex-col h-full bg-slate-50">
                        {/* Header */}
                        <div className="bg-[#154279] p-6 text-white pb-8 relative overflow-hidden">
                           <div className="relative z-10">
                              <h2 className="text-xl font-black uppercase tracking-tighter mb-1">REALTORS<span className="text-[#F96302]">.</span></h2>
                              <p className="text-xs text-white/70 font-medium">Your Trusted Property Partner</p>
                           </div>
                           <div className="absolute -right-4 -bottom-8 opacity-10">
                              <FaCity size={120} />
                           </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-4">
                           {NAVIGATION_SECTIONS.map((item) => {
                             const IconComponent = item.icon;
                             return (
                               <button 
                                 key={item.id}
                                 onClick={() => handleNavClick(item.id)}
                                 className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white border-b border-transparent hover:border-l-4 hover:border-l-[#F96302] transition-all group"
                               >
                                 <div className="bg-white p-2 text-slate-400 group-hover:text-[#F96302] group-hover:shadow-md transition-all rounded-md">
                                    <IconComponent size={18} />
                                 </div>
                                 <span className="font-bold text-slate-600 group-hover:text-[#154279] uppercase text-xs tracking-wider">{item.name}</span>
                                 <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#F96302]" />
                               </button>
                             );
                           })}
                        </div>
                        
                        {/* Footer Actions */}
                        <div className="p-6 bg-white border-t border-slate-200">
                           <button 
                             type="button"
                             onClick={() => goToRoute('/login')}
                             className="w-full bg-[#154279] text-white py-3 font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2 rounded-none"
                           >
                             <FaSignInAlt /> Portal Login
                           </button>
                        </div>
                    </div>
                 </SheetContent>
              </Sheet>

            </div>

            {/* NAVIGATION LIST (Moved from Sub-Nav) */}
            <div className="hidden lg:flex flex-1 w-full justify-center items-center gap-10 relative z-30 ml-4 lg:ml-8">
              {NAVIGATION_SECTIONS.map((item) => {
                const IconComponent = item.icon;
                const isTenantSupport = item.id === "faq";
                
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => {
                        if (isTenantSupport) {
                          setShowTenantDropdown(!showTenantDropdown);
                        } else {
                          handleNavClick(item.id);
                        }
                      }}
                      className={`flex items-center gap-2 px-2 py-2.5 rounded-none transition-all duration-200 ${
                        isTenantSupport ? "group-hover:text-[#F96302]" : ""
                      } hover:text-[#F96302]`}
                    >
                      <span className={`text-[${COLORS.secondary}]`}>
                        <IconComponent size={item.iconSize} />
                      </span>
                      <span className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-[#154279] hover:text-[#F96302] transition-colors`}>
                        {item.name}
                      </span>
                      {isTenantSupport && (
                        <FaChevronDown size={12} className="text-slate-600 group-hover:text-[#F96302] transition-colors" />
                      )}
                    </button>

                    {/* Tenant Support Dropdown */}
                    {isTenantSupport && (
                      <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                        <div className="bg-[#efeeee] border border-[#d9d9d9] rounded-xl shadow-lg overflow-hidden min-w-[220px]">
                          <button
                            onClick={() => {
                              handleNavClick("faq");
                              setShowTenantDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 ${NAVBAR_UNIFIED_TEXT_CLASS} text-slate-700 hover:text-[#F96302] hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-200`}
                          >
                            <span>❓</span>
                            FAQ Section
                          </button>
                          <button
                            onClick={() => {
                              navigate("/contact");
                              setShowTenantDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 ${NAVBAR_UNIFIED_TEXT_CLASS} text-slate-700 hover:text-[#F96302] hover:bg-slate-50 transition-colors flex items-center gap-3`}
                          >
                            <span>📧</span>
                            Contact Us
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Account Area */}
            <div className="hidden lg:flex items-center gap-8 shrink-0">
              <button
                type="button"
                onClick={() => goToRoute("login")}
                className={`px-2 py-2 text-[#154279] ${NAVBAR_UNIFIED_TEXT_CLASS} uppercase tracking-wider hover:text-[#F96302] transition-colors`}
              >
                Login
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Sub-Nav (Desktop) Removed and moved into Main Nav Bar */}

      {/* Mobile Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 border-r-0 z-[60] bg-slate-50 flex flex-col h-full">
          
          {/* Mobile Header: Pure Blue background matching navbar */}
          <div className={`bg-[${COLORS.primary}] p-6 text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <FaUser className={`text-[${COLORS.secondary}] text-xl`} />
                <div>
                  <h2 className={`${NAVBAR_UNIFIED_TEXT_CLASS}`}>{MOBILE_HEADER.title}</h2>
                  <p className={`${NAVBAR_UNIFIED_TEXT_CLASS} text-white/85`}>{MOBILE_HEADER.subtitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Menu Links */}
            <div className="py-4 bg-white">
              <div className={`px-6 pb-2 ${NAVBAR_UNIFIED_TEXT_CLASS} text-slate-500 uppercase tracking-widest`}>Menu</div>
              {NAVIGATION_SECTIONS.map((item) => {
                const IconComponent = item.icon;
                const isTenantSupport = item.id === "faq";
                
                
                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => {
                        if (isTenantSupport) {
                          // setMobileDropdownOpen(!mobileDropdownOpen);
                        } else {
                          handleNavClick(item.id);
                          setMenuOpen(false);
                        }
                      }}
                      className={`w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-l-[3px] border-transparent hover:border-[${COLORS.secondary}] group`}
                    >
                      <div className={`flex items-center gap-4 text-slate-700 group-hover:text-[${COLORS.primary}]`}>
                        <span className={`text-slate-600 bg-slate-100 p-2 rounded-xl group-hover:bg-[${COLORS.secondary}] group-hover:text-white transition-colors`}>
                          <IconComponent size={item.iconSize} />
                        </span>
                        <span className={NAVBAR_UNIFIED_TEXT_CLASS}>{item.name}</span>
                      </div>
                      {isTenantSupport && (
                        <FaChevronDown size={12} className={`text-slate-500 transition-transform ${false ? "rotate-180" : ""}`} />
                      )}
                    </button>

                    {/* Mobile Tenant Support Dropdown */}
                    {isTenantSupport  && (
                      <div className="bg-slate-50 border-l-[3px] border-[#F96302]">
                        <button
                          onClick={() => {
                            navigate("/faq");
                            setMenuOpen(false);
                            
                          }}
                          className={`w-full px-12 py-3 text-left ${NAVBAR_UNIFIED_TEXT_CLASS} text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3`}
                        >
                          <span>❓</span>
                          FAQ Section
                        </button>
                        <button
                          onClick={() => {
                            navigate("/contact");
                            setMenuOpen(false);
                            
                          }}
                          className={`w-full px-12 py-3 text-left ${NAVBAR_UNIFIED_TEXT_CLASS} text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3`}
                        >
                          <span>📧</span>
                          Contact Us
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`m-4 p-5 bg-[${COLORS.primary}] rounded-xl text-white shadow-md relative overflow-hidden hidden`}>
               <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl"><FaCity /></div>
               {/* Bright Orange accent */}
               <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[${COLORS.secondary}]/25 to-transparent`}></div>
              <div className="relative z-10">
                <span className={`bg-[${COLORS.secondary}] text-[10px] font-bold px-2.5 py-1 rounded-lg text-white uppercase tracking-wider shadow-md`}>{PROMO_BANNER.badge}</span>
                <h3 className="font-bold text-xl mt-3 leading-tight">{PROMO_BANNER.title}</h3>
                <p className="text-xs text-white/90 mt-1 mb-4 font-medium w-2/3">{PROMO_BANNER.description}</p>
                <button onClick={() => handleNavClick(PROMO_BANNER.ctaAction)} className={`text-xs font-bold bg-white text-[${COLORS.primary}] px-4 py-2 rounded-lg hover:bg-[${COLORS.secondary}] hover:text-white transition-colors shadow-md`}>
                  {PROMO_BANNER.ctaLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 hidden">
            <button type="button" onClick={() => goToRoute('/login')} className={`flex items-center gap-3 ${LOGOUT_BUTTON.textColor} font-bold text-sm ${LOGOUT_BUTTON.hoverColor} w-full py-3 ${LOGOUT_BUTTON.hoverBgColor} rounded-xl transition-all px-4 justify-center`}>
              <FaSignOutAlt /> {LOGOUT_BUTTON.label}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Navbar;
