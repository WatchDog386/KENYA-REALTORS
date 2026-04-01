import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  FaBars,
  FaUser,
  FaSearch,
  FaChevronDown,
  FaShoppingCart,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
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
  ACCOUNT_DROPDOWN,
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

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [filteredResults, setFilteredResults] = useState<typeof SEARCH_DATA>([]);

  const resolveRoute = (action?: string) => {
    const normalized = (action || "").trim();
    if (!normalized) return "/";
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  };

  const goToRoute = (action?: string) => {
    setMenuOpen(false);
    setShowTenantDropdown(false);
    setShowAccountDropdown(false);
    navigate(resolveRoute(action));
  };

  // Cart logic
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("realtor_cart");
    return saved ? JSON.parse(saved) : { count: 0, total: 0 };
  });

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

  const addToCart = (item: typeof SEARCH_DATA[0]) => {
    const newCart = {
      count: cart.count + 1,
      total: cart.total + (typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : item.price)
    };
    setCart(newCart);
    setSearchQuery("");
    setShowResults(false);
    // Optional: Flash a toast or something
  };

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

      /* Sleek & Polished 3D Effect */
      @keyframes polishedLift {
        0%, 100% {
          filter: drop-shadow(-6px 10px 18px rgba(0, 0, 0, 0.15));
          transform: translateY(0px);
        }
        50% {
          filter: drop-shadow(-8px 14px 24px rgba(0, 0, 0, 0.22));
          transform: translateY(-3px);
        }
      }

      .brand-animate {
        animation: polishedLift 4s ease-in-out infinite;
      }

      .logo-svg {
        filter: drop-shadow(-5px 8px 16px rgba(0, 0, 0, 0.12));
        transition: all 0.3s ease;
        will-change: filter, transform;
      }

      .logo-svg:hover {
        filter: drop-shadow(-7px 12px 22px rgba(0, 0, 0, 0.2));
        transform: translateY(-3px);
      }

      .brand-text-3d {
        filter: drop-shadow(-5px 8px 16px rgba(0, 0, 0, 0.12));
        animation: polishedLift 4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if(document.head.contains(link)) document.head.removeChild(link);
      if(document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("realtor_cart", JSON.stringify(cart));
  }, [cart]);

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
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-[#efeeee] ${isScrolled ? "shadow-md border-b border-[#d9d9d9]" : ""}`}
      style={{
        '--navbar-height-mobile': NAVBAR_HEIGHTS.mobile,
        '--navbar-height-desktop': NAVBAR_HEIGHTS.desktop
      } as React.CSSProperties}
    >
        
      {/* Top Utility Strip: Deep Blue Background - Brighter */}
      <div
        className="text-white text-xs hidden lg:block border-b border-slate-200"
        style={{
          background: `linear-gradient(180deg, ${COLORS.primary} 0%, #0f335e 100%)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.24)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-10">
          <div className="flex items-center gap-6 text-white font-medium">
            {UTILITY_BAR.location.enabled && (
              <>
                <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
                  <UTILITY_BAR.location.icon size={12} className={`text-[${COLORS.secondary}]`} />
                  <span className="font-semibold text-white group-hover:text-[#F96302] transition-colors">{UTILITY_BAR.location.text}</span>
                </button>
                <div className="h-3 w-[1px] bg-white/20"></div>
              </>
            )}
            {UTILITY_BAR.phone.enabled && (
              <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
                <UTILITY_BAR.phone.icon size={11} className={`text-[${COLORS.secondary}]`} />
                <span className="font-semibold text-white group-hover:text-[#F96302] transition-colors">{UTILITY_BAR.phone.text}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-6 font-bold tracking-wide">
            {UTILITY_BAR.buttons.map((btn, idx) => (
              <button 
                key={idx} 
                type="button"
                onClick={() => goToRoute(btn.action)} 
                className={`text-white hover:text-[#F96302] transition-colors uppercase ${btn.size}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div
        className={`relative z-20 transition-all duration-300 ${isScrolled ? "border-b border-slate-200" : "lg:border-b-0 border-b-0"} py-2 md:py-4 md:rounded-none rounded-b-[2rem] md:shadow-none`}
        style={{
          background: "#efeeee",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), 0 8px 16px rgba(0,0,0,0.08)",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            
            {/* MOBILE ONLY HEADER: CLEAN APP STYLE */}
            <div className="flex lg:hidden items-center justify-between w-full h-12">
               {/* 1. Left: Hamburger */}
               <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-xl text-[#154279] bg-[#efeeee] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] transition-all"
               >
                 <FaBars size={24} />
               </button>

               {/* 2. Center: Logo Icon Only (App Style) */}
               <div onClick={handleHomeClick} className="flex items-center justify-center gap-2">
                  {/* SVG Logo */}
                  <svg viewBox="0 0 200 200" className="h-10 w-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
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
                      <span className={`text-[${COLORS.primary}] font-bold text-lg tracking-tight leading-none`}>
                        Kenya
                      </span>
                      <span className="text-slate-900 font-bold text-lg tracking-tight leading-none">
                        realtors
                      </span>
                      <div className={`h-1.5 w-1.5 bg-[${COLORS.secondary}] rounded-none mb-1 shadow-sm`}></div>
                    </div>
                    <span className="text-slate-500 font-bold text-[8px] uppercase tracking-[0.2em]">
                      The Property Hub
                    </span>
                  </div>
               </div>

               {/* 3. Right: User Actions (Account Icon with Dropdown) */}
               <div className="relative">
                 <button 
                    onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                    className="p-2 rounded-xl text-[#154279] relative z-20 bg-[#efeeee] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] transition-all"
                 >
                   <FaUser size={22} />
                 </button>
                 
                 {/* Mobile Account Dropdown */}
                 {showTenantDropdown && (
                   <div className="absolute top-full right-0 mt-2 w-48 border border-[#d9d9d9] overflow-hidden z-30 rounded-2xl bg-[#efeeee] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]">
                      {ACCOUNT_DROPDOWN.items.map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            navigate(`/${item.action}`);
                            setShowTenantDropdown(false);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 first:rounded-t-2xl last:rounded-b-2xl"
                        >
                          <div className={`${item.bgColor} text-[${item.textColor}] p-2 rounded-full`}>
                            {item.id === 'signin' ? <FaSignInAlt size={12} /> : <FaUserPlus size={12} />}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{item.label}</span>
                        </button>
                      ))}
                   </div>
                 )}
                 
                 {/* Overlay to close dropdown when clicking outside */}
                 {showTenantDropdown && (
                   <div className="fixed inset-0 z-10" onClick={() => setShowTenantDropdown(false)}></div>
                 )}
               </div>
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
                  <svg viewBox="0 0 200 200" className="h-12 md:h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300 logo-svg" xmlns="http://www.w3.org/2000/svg">
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
                    <span className={`${BRAND.countryLabelSize} font-bold text-black leading-none ml-0.5 brand-lowercase tracking-[0.2em] uppercase text-xs md:text-sm`}>
                        {BRAND.countryLabel}
                    </span>
                    <div className="flex items-baseline -mt-1 relative">
                        <span className={`font-semibold text-2xl md:text-4xl font-extrabold tracking-tight text-[${BRAND.primaryColor}] brand-lowercase`}>
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
                      } rounded-xl bg-[#efeeee] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] hover:text-[#F96302]`}
                    >
                      <span className={`text-[${COLORS.secondary}]`}>
                        <IconComponent size={item.iconSize} />
                      </span>
                      <span className={`font-semibold text-[15px] text-[${COLORS.primary}] hover:text-[${COLORS.secondary}] transition-colors`}>
                        {item.name}
                      </span>
                      {isTenantSupport && (
                        <FaChevronDown size={12} className="text-slate-600 group-hover:text-[#F96302] transition-colors" />
                      )}
                    </button>

                    {/* Tenant Support Dropdown */}
                    {isTenantSupport && (
                      <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                        <div className="bg-[#efeeee] border border-[#d9d9d9] rounded-xl shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] overflow-hidden min-w-[220px]">
                          <button
                            onClick={() => {
                              handleNavClick("faq");
                              setShowTenantDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:text-[#F96302] transition-colors flex items-center gap-3 border-b border-slate-200 hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
                          >
                            <span>❓</span>
                            FAQ Section
                          </button>
                          <button
                            onClick={() => {
                              navigate("/contact");
                              setShowTenantDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:text-[#F96302] transition-colors flex items-center gap-3 hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]"
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

            {/* Desktop Account & Cart Area */}
            <div className="hidden lg:flex items-center gap-8 shrink-0">
              
              {/* Account Dropdown - Blue/Orange */}
              <div className="relative h-full py-2">
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown((prev) => !prev)}
                  className="flex flex-col items-start outline-none px-3 py-2 rounded-xl bg-[#efeeee] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-black font-bold uppercase tracking-wider">Account</span>
                    <FaChevronDown
                      size={8}
                      className={`text-[${COLORS.secondary}] transition-transform duration-300 ${showAccountDropdown ? "rotate-180" : ""}`}
                    />
                  </div>
                  <span className={`text-[14px] text-[${COLORS.primary}] font-bold hover:text-[${COLORS.secondary}] transition-colors`}>
                    Hello, Guest
                  </span>
                </button>

                {/* Dropdown Menu - Rounded & Smooth */}
                <div className={`absolute top-full right-0 pt-3 transition-all duration-300 transform w-64 z-50 ${showAccountDropdown ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}>
                  <div className="rounded-2xl border border-[#d9d9d9] overflow-hidden p-2 bg-[#efeeee] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">{ACCOUNT_DROPDOWN.title}</p>
                    </div>
                    
                    {ACCOUNT_DROPDOWN.items.map((item) => (
                      <button 
                        key={item.id}
                        type="button"
                        onClick={() => goToRoute(item.action)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group/item mt-1"
                      >
                        <div className={`${item.bgColor} text-[${item.textColor}] p-2.5 rounded-full group-hover/item:bg-[${item.textColor}] group-hover/item:text-white transition-colors shadow-sm`}>
                          {item.id === 'signin' ? <FaSignInAlt size={14} /> : <FaUserPlus size={14} />}
                        </div>
                        <div>
                            <span className={`block text-sm font-bold text-[${COLORS.primary}] group-hover/item:text-[${COLORS.secondary}] transition-colors`}>{item.label}</span>
                            <span className="block text-[10px] text-slate-600">{item.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {showAccountDropdown && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAccountDropdown(false)}
                  />
                )}
              </div>

              {/* Cart Button */}
              <button className={`flex items-center gap-3 group relative pl-6 border-l border-slate-300 pr-3 py-2 rounded-xl bg-[#efeeee] shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] transition-all`}>
                <div className="relative">
                  <FaShoppingCart size={24} className={`text-[${COLORS.secondary}] group-hover:text-[${COLORS.primary}] transition-colors duration-300`} />
                  {cart.count > 0 && (
                    <span className={`absolute -top-2 -right-2 bg-[${COLORS.secondary}] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-none border-2 border-white shadow-md scale-100 group-hover:scale-110 transition-transform`}>
                      {cart.count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-black font-bold uppercase tracking-wider">My Cart</span>
                  <span className={`text-[13px] text-[${COLORS.primary}] font-bold leading-tight group-hover:text-[${COLORS.secondary}] transition-colors`}>
                    {cart.count} Items
                  </span>
                </div>
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
                  <h2 className="font-bold text-xl">{MOBILE_HEADER.title}</h2>
                  <p className="text-xs text-white/85 font-medium">{MOBILE_HEADER.subtitle}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Menu Links */}
            <div className="py-4 bg-white">
              <div className="px-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu</div>
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
                        <span className="font-semibold text-sm">{item.name}</span>
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
                          className="w-full px-12 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3"
                        >
                          <span>❓</span>
                          FAQ Section
                        </button>
                        <button
                          onClick={() => {
                            navigate("/contact");
                            setMenuOpen(false);
                            
                          }}
                          className="w-full px-12 py-3 text-left text-sm font-medium text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3"
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
