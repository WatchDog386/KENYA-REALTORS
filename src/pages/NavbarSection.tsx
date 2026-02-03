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
  { id: 104, title: "Luxury Condo w/ View", area: "Westlands", price: "210,000", type: "Condo", img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=200" },

  // --- FEATURES LISTINGS (Page 1) ---
  { id: "AHT-304", title: "Luxury 3-Bedroom Panorama Suite", area: "Ayden Home Towers, Wing A", price: 85000, type: "3 Bedroom", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200" },
  { id: "AHT-202", title: "Modern 2-Bedroom Executive", area: "Ayden Home Towers, Wing B", price: 55000, type: "2 Bedroom", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=200" },
  { id: "AHT-105", title: "Spacious 1-Bedroom Apartment", area: "Ayden Home Towers, Wing B", price: 35000, type: "1 Bedroom", img: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?q=80&w=200" },
  { id: "AHT-001", title: "Standard Single Room / Bedsitter", area: "Ayden Home Towers, Wing C", price: 18000, type: "Bedsitter", img: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=200" },
  { id: "AHT-205", title: "Premium 2-Bedroom with Balcony", area: "Ayden Home Towers, Wing A", price: 60000, type: "2 Bedroom", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=200" },
  { id: "AHT-108", title: "Economy 1-Bedroom", area: "Ayden Home Towers, Wing C", price: 28000, type: "1 Bedroom", img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=200" },

  // --- FEATURES LISTINGS (Page 2) ---
  { id: "AHT-406", title: "Penthouse 4-Bedroom Executive Suite", area: "Ayden Home Towers, Wing A", price: 125000, type: "4 Bedroom", img: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=200" },
  { id: "AHT-309", title: "Executive 3-Bedroom Family Unit", area: "Ayden Home Towers, Wing A", price: 92000, type: "3 Bedroom", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=200" },
  { id: "AHT-212", title: "Modern 2-Bedroom Corner Unit", area: "Ayden Home Towers, Wing B", price: 62000, type: "2 Bedroom", img: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=200" },
  { id: "AHT-115", title: "Premium 1-Bedroom Studio", area: "Ayden Home Towers, Wing B", price: 42000, type: "1 Bedroom", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200" },
  { id: "AHT-003", title: "Deluxe Bedsitter with Balcony", area: "Ayden Home Towers, Wing C", price: 22000, type: "Bedsitter", img: "https://images.unsplash.com/photo-1558036117-15e82a2c9a9a?q=80&w=200" },
  { id: "AHT-110", title: "Budget-Friendly Studio Apartment", area: "Ayden Home Towers, Wing C", price: 25000, type: "Studio", img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=200" }
];

// Extract unique locations with vacancy info
const LOCATION_AREAS = [
  { name: "Ayden Home Towers, Wing A", vacancies: 5, rentals: 12 },
  { name: "Ayden Home Towers, Wing B", vacancies: 3, rentals: 8 },
  { name: "Ayden Home Towers, Wing C", vacancies: 2, rentals: 6 },
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
  const [filteredResults, setFilteredResults] = useState<typeof SEARCH_DATA>([]);

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
      className={`fixed top-0 w-full z-50 bg-white transition-all duration-300 ${isScrolled ? "shadow-md border-b border-slate-200" : ""}`}
      style={{
        '--navbar-height-mobile': NAVBAR_HEIGHTS.mobile,
        '--navbar-height-desktop': NAVBAR_HEIGHTS.desktop
      } as React.CSSProperties}
    >
        
      {/* Top Utility Strip: Deep Blue Background - Brighter */}
      <div className={`bg-[${COLORS.primary}] text-white text-xs hidden lg:block border-b border-slate-200`}>
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
              <button key={idx} onClick={() => navigate(btn.action === 'login' ? '/login' : '/')} className={`text-white hover:text-[#F96302] transition-colors uppercase ${btn.size}`}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className={`bg-white py-4 relative z-20 ${isScrolled ? "border-b border-slate-200" : "lg:border-b-0 border-b-0"}`}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            
            <div className="flex items-center justify-between w-full lg:w-auto">
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

              {/* Navigation Dropdown - Mobile/Tablet on Right */}
              <div className="lg:hidden relative group h-full py-2">
                <button className="flex items-center outline-none">
                  <FaBars size={20} className={`text-[${COLORS.primary}]`} />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-0 group-hover:translate-y-0 w-80 z-50 max-h-[500px] overflow-y-auto">
                  {/* Blue Header Section */}
                  <div className={`bg-[${COLORS.primary}] p-4 text-white`}>
                    <div className="flex items-center gap-3 mb-4">
                      <FaUser className={`text-[${COLORS.secondary}] text-lg`} />
                      <div>
                        <h3 className="font-bold text-sm">{MOBILE_HEADER.title}</h3>
                        <p className="text-xs text-white/85">{MOBILE_HEADER.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-none shadow-md border border-slate-200 overflow-hidden">
                    {/* Account Section */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Account</p>
                    </div>
                    
                    {ACCOUNT_DROPDOWN.items.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => navigate(`/${item.action}`)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-none transition-all group/item border-b border-slate-100 last:border-0"
                      >
                        <div className={`${item.bgColor} text-[${item.textColor}] p-2.5 rounded-none group-hover/item:bg-[${item.textColor}] group-hover/item:text-white transition-colors shadow-sm`}>
                          {item.id === 'signin' ? <FaSignInAlt size={14} /> : <FaUserPlus size={14} />}
                        </div>
                        <div>
                            <span className={`block text-sm font-bold text-[${COLORS.primary}] group-hover/item:text-[${COLORS.secondary}] transition-colors`}>{item.label}</span>
                            <span className="block text-[10px] text-slate-600">{item.description}</span>
                        </div>
                      </button>
                    ))}

                    {/* Navigation Section */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 mt-2">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Menu</p>
                    </div>
                    
                    {NAVIGATION_SECTIONS.map((item) => {
                      const IconComponent = item.icon;
                      const isTenantSupport = item.id === "faq";
                      const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
                      
                      return (
                        <div key={item.id}>
                          <button 
                            onClick={() => {
                              if (isTenantSupport) {
                                setMobileMenuOpen(!mobileMenuOpen);
                              } else {
                                handleNavClick(item.id);
                              }
                            }}
                            className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 rounded-none transition-all border-b border-slate-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-slate-600 bg-slate-100 p-2 rounded-none`}>
                                <IconComponent size={item.iconSize} />
                              </span>
                              <span className={`text-sm font-semibold text-slate-700`}>{item.name}</span>
                            </div>
                            {isTenantSupport && (
                              <FaChevronDown size={12} className={`text-slate-500 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
                            )}
                          </button>

                          {/* Tenant Support Sub-dropdown */}
                          {isTenantSupport && mobileMenuOpen && (
                            <div className="bg-slate-50 border-l-[3px] border-[#F96302]">
                              <button
                                onClick={() => {
                                  handleNavClick("faq");
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full px-8 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3"
                              >
                                <span>❓</span>
                                FAQ Section
                              </button>
                              <button
                                onClick={() => {
                                  navigate("/contact");
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full px-8 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-white hover:text-[#F96302] transition-colors flex items-center gap-3"
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

                  {/* Promo Banner */}
                  <div className={`m-3 p-4 bg-[${COLORS.primary}] rounded-none text-white shadow-md relative overflow-hidden`}>
                    <div className="absolute -right-4 -bottom-4 text-white/5 text-6xl"><FaCity /></div>
                    <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[${COLORS.secondary}]/25 to-transparent`}></div>
                    <div className="relative z-10">
                      <span className={`bg-[${COLORS.secondary}] text-[10px] font-bold px-2.5 py-1 rounded-none text-white uppercase tracking-wider shadow-md`}>{PROMO_BANNER.badge}</span>
                      <h3 className="font-bold text-lg mt-2 leading-tight">{PROMO_BANNER.title}</h3>
                      <p className="text-xs text-white/90 mt-1 mb-3 font-medium">{PROMO_BANNER.description}</p>
                      <button onClick={() => handleNavClick(PROMO_BANNER.ctaAction)} className={`text-xs font-bold bg-white text-[${COLORS.primary}] px-3 py-1.5 rounded-none hover:bg-[${COLORS.secondary}] hover:text-white transition-colors shadow-md`}>
                        {PROMO_BANNER.ctaLabel}
                      </button>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button onClick={() => { navigate('/login'); }} className={`flex items-center gap-3 ${LOGOUT_BUTTON.textColor} font-bold text-sm ${LOGOUT_BUTTON.hoverColor} w-full py-3 ${LOGOUT_BUTTON.hoverBgColor} rounded-none transition-all px-4 justify-center`}>
                      <FaSignOutAlt /> {LOGOUT_BUTTON.label}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CHECK VISIBILITY: Sleek Rounded Design - Hidden on tablet/mobile */}
            <div className="hidden lg:flex flex-1 w-full relative group z-30 ml-4 lg:ml-8">
                <div className={`w-full flex items-center bg-slate-50 border border-slate-200 rounded-full pl-1 pr-1 py-1 transition-all duration-300 shadow-sm group-hover:shadow-md focus-within:border-[${COLORS.secondary}] focus-within:shadow-[0_4px_15px_rgba(249,99,2,0.2)] focus-within:ring-1 focus-within:ring-[${COLORS.secondary}]/30`}>
                <div className="relative flex-1">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[${COLORS.secondary}] transition-colors pointer-events-none`}>
                    <FaSearch size={16} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search by location..."
                    onFocus={() => setShowLocations(true)}
                    onBlur={() => setTimeout(() => setShowLocations(false), 200)}
                    className="w-full h-10 pl-11 pr-4 border-none outline-none text-[15px] placeholder:text-slate-500 font-medium bg-transparent text-slate-900"
                  />
                </div>
                <button className={`bg-[${COLORS.secondary}] hover:bg-[${COLORS.primary}] text-white px-6 h-10 font-bold text-[16px] transition-all duration-300 rounded-full shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5`}>
                  <span className="hidden md:block">SEARCH</span>
                  <FaSearch size={12} className="md:hidden" />
                </button>

                {/* LOCATION DROPDOWN */}
                {showLocations && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 mt-2 max-h-[350px] overflow-y-auto rounded-lg z-50">
                    <div className="px-4 py-2 bg-slate-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider sticky top-0 border-b border-gray-100">
                      Available Areas
                    </div>
                    {LOCATION_AREAS.map((location, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowLocations(false);
                          navigate("/features");
                        }}
                        className="w-full px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0 text-left group/loc"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-[#154279] group-hover/loc:text-[#F96302] transition-colors">{location.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {location.vacancies} Vacant
                              </span>
                              <span>•</span>
                              <span>{location.rentals} Total</span>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-[#F96302] opacity-0 group-hover/loc:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Account & Cart Area */}
            <div className="hidden lg:flex items-center gap-8 shrink-0">
              
              {/* Account Dropdown - Blue/Orange */}
              <div className="relative group h-full py-2">
                <button className="flex flex-col items-start outline-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-black font-bold uppercase tracking-wider">Account</span>
                    <FaChevronDown size={8} className={`text-[${COLORS.secondary}] group-hover:rotate-180 transition-transform duration-300`} />
                  </div>
                  <span className={`text-[14px] text-[${COLORS.primary}] font-bold group-hover:text-[${COLORS.secondary}] transition-colors`}>
                    Hello, Guest
                  </span>
                </button>

                {/* Dropdown Menu */}
                  <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-64 z-50">
                  <div className="bg-white rounded-none shadow-md border border-slate-200 overflow-hidden p-2">
                    <div className="px-4 py-3 border-b border-slate-200 mb-1">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">{ACCOUNT_DROPDOWN.title}</p>
                    </div>
                    
                    {ACCOUNT_DROPDOWN.items.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => navigate(`/${item.action}`)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-none transition-all group/item mt-1"
                      >
                        <div className={`${item.bgColor} text-[${item.textColor}] p-2.5 rounded-none group-hover/item:bg-[${item.textColor}] group-hover/item:text-white transition-colors shadow-sm`}>
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
              </div>

              {/* Cart Button */}
              <button className={`flex items-center gap-3 group relative pl-6 border-l border-slate-200`}>
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

      {/* Sub-Nav (Desktop) */}
      <div className={`hidden lg:block ${isScrolled ? 'bg-white border-b border-slate-200' : 'bg-black/20 backdrop-blur-sm border-b border-white/10'} h-14 transition-all duration-300`}>
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-center h-full">
          <div className="flex items-center gap-10">
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
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-none transition-all duration-200 ${
                      isTenantSupport ? "group-hover:text-[#F96302]" : ""
                    }`}
                  >
                    <span className={`text-[${COLORS.secondary}]`}>
                      <IconComponent size={item.iconSize} />
                    </span>
                    <span className={`font-semibold text-sm text-[${COLORS.primary}]`}>
                      {item.name}
                    </span>
                    {isTenantSupport && (
                      <FaChevronDown size={12} className="text-slate-600 group-hover:text-[#F96302] transition-colors" />
                    )}
                  </button>

                  {/* Tenant Support Dropdown */}
                  {isTenantSupport && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[220px]">
                        <button
                          onClick={() => {
                            handleNavClick("faq");
                            setShowTenantDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#F96302] transition-colors flex items-center gap-3 border-b border-slate-100"
                        >
                          <span>❓</span>
                          FAQ Section
                        </button>
                        <button
                          onClick={() => {
                            navigate("/contact");
                            setShowTenantDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#F96302] transition-colors flex items-center gap-3"
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
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 border-r-0 z-[60] bg-slate-50 flex flex-col h-full">
          
          {/* Mobile Header: Pure Blue background matching navbar */}
          <div className={`bg-[${COLORS.primary}] p-6 text-white relative overflow-hidden`}>
            <div className="relative z-10 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <FaUser className={`text-[${COLORS.secondary}] text-xl`} />
                <div>
                  <h2 className="font-bold text-xl">{MOBILE_HEADER.title}</h2>
                  <p className="text-xs text-white/85 font-medium">{MOBILE_HEADER.subtitle}</p>
                </div>
              </div>

              {/* Search Bar - Mobile Version */}
              <div className={`w-full flex items-center bg-white/15 border border-white/20 rounded-full pl-1 pr-1 py-1 transition-all duration-300 focus-within:border-white focus-within:ring-1 focus-within:ring-white/50`}>
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                    <FaSearch size={14} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder="Find properties..."
                    className="w-full h-9 pl-10 pr-3 border-none outline-none text-[13px] placeholder:text-white/50 font-medium bg-transparent text-white"
                  />
                </div>
                <button className={`bg-[${COLORS.secondary}] hover:bg-[${COLORS.primary}] text-white px-4 h-9 font-bold text-xs tracking-wider transition-all rounded-full shadow-md flex items-center`}>
                  <FaSearch size={12} />
                </button>
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
                const [mobileDropdownOpen, setMobileDropdownOpen] = React.useState(false);
                
                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => {
                        if (isTenantSupport) {
                          setMobileDropdownOpen(!mobileDropdownOpen);
                        } else {
                          handleNavClick(item.id);
                          setMenuOpen(false);
                        }
                      }}
                      className={`w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-l-[3px] border-transparent hover:border-[${COLORS.secondary}] group`}
                    >
                      <div className={`flex items-center gap-4 text-slate-700 group-hover:text-[${COLORS.primary}]`}>
                        <span className={`text-slate-600 bg-slate-100 p-2 rounded-none group-hover:bg-[${COLORS.secondary}] group-hover:text-white transition-colors`}>
                          <IconComponent size={item.iconSize} />
                        </span>
                        <span className="font-semibold text-sm">{item.name}</span>
                      </div>
                      {isTenantSupport && (
                        <FaChevronDown size={12} className={`text-slate-500 transition-transform ${mobileDropdownOpen ? "rotate-180" : ""}`} />
                      )}
                    </button>

                    {/* Mobile Tenant Support Dropdown */}
                    {isTenantSupport && mobileDropdownOpen && (
                      <div className="bg-slate-50 border-l-[3px] border-[#F96302]">
                        <button
                          onClick={() => {
                            navigate("/faq");
                            setMenuOpen(false);
                            setMobileDropdownOpen(false);
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
                            setMobileDropdownOpen(false);
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

            <div className={`m-4 p-5 bg-[${COLORS.primary}] rounded-none text-white shadow-md relative overflow-hidden`}>
               <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl"><FaCity /></div>
               {/* Bright Orange accent */}
               <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[${COLORS.secondary}]/25 to-transparent`}></div>
              <div className="relative z-10">
                <span className={`bg-[${COLORS.secondary}] text-[10px] font-bold px-2.5 py-1 rounded-none text-white uppercase tracking-wider shadow-md`}>{PROMO_BANNER.badge}</span>
                <h3 className="font-bold text-xl mt-3 leading-tight">{PROMO_BANNER.title}</h3>
                <p className="text-xs text-white/90 mt-1 mb-4 font-medium w-2/3">{PROMO_BANNER.description}</p>
                <button onClick={() => handleNavClick(PROMO_BANNER.ctaAction)} className={`text-xs font-bold bg-white text-[${COLORS.primary}] px-4 py-2 rounded-none hover:bg-[${COLORS.secondary}] hover:text-white transition-colors shadow-md`}>
                  {PROMO_BANNER.ctaLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className={`flex items-center gap-3 ${LOGOUT_BUTTON.textColor} font-bold text-sm ${LOGOUT_BUTTON.hoverColor} w-full py-3 ${LOGOUT_BUTTON.hoverBgColor} rounded-none transition-all px-4 justify-center`}>
              <FaSignOutAlt /> {LOGOUT_BUTTON.label}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Navbar;