import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaUser,
  FaSearch,
  FaChevronDown,
  FaCity,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaCog,
  FaTools,
  FaList,
  FaTags,
  FaCreditCard,
  FaStar,
  FaHeadset,
  FaShoppingCart,
  FaKey,
  FaHome,
  FaSignInAlt,
  FaUserPlus
} from "react-icons/fa";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Navigation Sections - Blue reduced, Orange increased
const SECTIONS = [
  { name: "Home", id: "", icon: <FaHome size={16} className="text-[#1a1a1a]" /> }, 
  { name: "DIY Rental guides", id: "how-it-works", icon: <FaTools size={16} className="text-[#F96302]" /> },
  { name: "Apartments features", id: "features", icon: <FaList size={16} className="text-[#1a1a1a]" /> },
  { name: "Affordable Prices", id: "pricing", icon: <FaTags size={18} className="text-[#F96302]" />, highlight: true },
  { name: "Blog", id: "payment-options", icon: <FaCreditCard size={18} className="text-[#1a1a1a]" /> },
  { name: "Reviews", id: "testimonials", icon: <FaStar size={16} className="text-[#F96302]" /> },
  { name: "Tenant Support", id: "faq", icon: <FaHeadset size={16} className="text-[#1a1a1a]" /> },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cart logic
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("realtor_cart");
    return saved ? JSON.parse(saved) : { count: 0, total: 0 };
  });

  // Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      .risa-font { font-family: 'Montserrat', sans-serif; -webkit-font-smoothing: antialiased; }
      .risa-heading { font-weight: 700; letter-spacing: -0.02em; }
      .risa-subheading { font-weight: 600; letter-spacing: -0.01em; }
      .brand-lowercase { text-transform: lowercase; }
      
      /* Navbar height variables for consistent spacing */
      :root {
        --navbar-height-mobile: 7rem;   /* 112px = 40px top bar + 72px main bar */
        --navbar-height-desktop: 10.5rem; /* 168px = 40px top bar + 72px main bar + 56px subnav */
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
      className={`fixed top-0 w-full z-50 bg-white transition-all duration-300 risa-font ${isScrolled ? "shadow-lg" : ""}`}
      style={{
        '--navbar-height-mobile': '7rem',
        '--navbar-height-desktop': '10.5rem'
      } as React.CSSProperties}
    >
        
      {/* Top Utility Strip: DOMINANT BLACK */}
      <div className="bg-[#000000] text-white text-xs hidden lg:block border-b border-[#222] h-10">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-6 risa-body text-gray-400">
            <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
              <FaMapMarkerAlt size={12} className="text-[#F96302]" />
              <span className="font-semibold text-white group-hover:text-[#F96302] transition-colors">Nairobi, KE</span>
            </button>
            <div className="h-3 w-[1px] bg-gray-800"></div>
            <button className="flex items-center gap-2 hover:text-[#F96302] transition-colors group">
              <FaPhoneAlt size={11} className="text-[#F96302]" />
              <span className="font-semibold text-white group-hover:text-[#F96302] transition-colors">+254 711 493 222</span>
            </button>
          </div>
          <div className="flex items-center gap-6 risa-heading font-bold tracking-wide">
            <button onClick={() => navigate('/login')} className="text-white hover:text-[#F96302] transition-colors uppercase text-[10px]">Post a Rental</button>
            <button onClick={() => navigate('/login')} className="text-white hover:text-[#F96302] transition-colors uppercase text-[10px]">Pay Rent</button>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="bg-white border-b border-gray-100 py-4 relative z-20">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                {/* Mobile Toggle */}
                <button 
                  onClick={() => setMenuOpen(true)} 
                  className="lg:hidden text-black hover:text-[#F96302] p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaBars size={24} />
                </button>

                {/* LOGO AREA */}
                <div 
                  onClick={handleHomeClick} 
                  className="shrink-0 cursor-pointer flex items-center gap-3 group"
                >
                  {/* SVG: Original Gold/Metallic Colors Restored */}
                  <svg viewBox="0 0 200 200" className="h-12 md:h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
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
                    </defs>

                    {/* Structure */}
                    <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round"/>
                    
                    {/* Windows */}
                    <g fill="#1a232e"> 
                      <path d="M85 50 L100 56 V86 L85 80 Z" />
                      <path d="M85 90 L100 96 V126 L85 120 Z" />
                      <path d="M45 60 L55 54 V124 L45 130 Z" />
                      <path d="M120 130 L140 122 V152 L120 160 Z" />
                    </g>
                  </svg>

                  {/* BRAND TEXT: Black & Orange Dominant, Blue Minimal */}
                  <div className="flex flex-col justify-center select-none ml-1">
                    <span className="text-[11px] md:text-[12px] font-bold text-gray-500 leading-none ml-0.5 brand-lowercase tracking-[0.2em] uppercase">
                        kenya
                    </span>
                    <div className="flex items-baseline -mt-1 relative">
                        <span className="text-[22px] md:text-[26px] font-extrabold tracking-tight text-black brand-lowercase risa-heading">
                        realtors
                        </span>
                        {/* Dot is Orange */}
                        <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-[#F96302] rounded-full ml-1 mb-1.5 shadow-sm animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Icons */}
              <div className="flex items-center gap-5 lg:hidden">
                <button onClick={() => navigate('/login')} className="text-black hover:text-[#F96302]">
                  <FaUser size={20} />
                </button>
                <button className="relative text-black hover:text-[#F96302]">
                  <FaShoppingCart size={20} />
                  {cart.count > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[#F96302] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                      {cart.count}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* SEARCH BAR: Orange Button */}
            <div className="flex-1 w-full relative group z-30 ml-4 lg:ml-8">
              <div className="w-full flex items-center bg-white border border-gray-200 rounded-full pl-1 pr-1 py-1 transition-all duration-300 shadow-sm group-hover:shadow-md focus-within:border-[#F96302] focus-within:shadow-[0_4px_15px_rgba(249,99,2,0.15)] focus-within:ring-1 focus-within:ring-[#F96302]/20">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#F96302] transition-colors pointer-events-none">
                    <FaSearch size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by City, Zip, or Building..." 
                    className="w-full h-10 pl-11 pr-4 border-none outline-none text-[15px] placeholder:text-gray-400/80 font-medium bg-transparent risa-body text-black"
                  />
                </div>
                <button className="bg-[#1a1a1a] hover:bg-[#F96302] text-white px-6 h-10 font-bold uppercase text-xs tracking-wider transition-all duration-300 rounded-full shadow-md hover:shadow-lg flex items-center gap-2 risa-heading transform hover:-translate-y-0.5">
                  <span className="hidden md:block">Search</span>
                  <FaSearch size={12} className="md:hidden" />
                </button>
              </div>
            </div>

            {/* Desktop Account & Cart Area */}
            <div className="hidden lg:flex items-center gap-8 shrink-0">
              
              {/* Account Dropdown - Black/Orange Dominant */}
              <div className="relative group h-full py-2">
                <button className="flex flex-col items-start outline-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Account</span>
                    <FaChevronDown size={8} className="text-[#F96302] group-hover:rotate-180 transition-transform duration-300" />
                  </div>
                  <span className="text-[14px] text-black font-bold group-hover:text-[#F96302] transition-colors risa-heading">
                    Hello, Guest
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-64 z-50">
                  <div className="bg-white rounded-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden p-2">
                    <div className="px-4 py-3 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Welcome to Kenya Realtors</p>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-all group/item"
                    >
                        {/* Blue Icon kept minimal/small */}
                        <div className="bg-blue-50 text-[#0056A6] p-2.5 rounded-full group-hover/item:bg-[#0056A6] group-hover/item:text-white transition-colors shadow-sm">
                            <FaSignInAlt size={14} />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-black group-hover/item:text-[#0056A6] transition-colors">Sign In</span>
                            <span className="block text-[10px] text-gray-500">Access your account</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => navigate('/register')}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-all group/item mt-1"
                    >
                        <div className="bg-orange-50 text-[#F96302] p-2.5 rounded-full group-hover/item:bg-[#F96302] group-hover/item:text-white transition-colors shadow-sm">
                            <FaUserPlus size={14} />
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-black group-hover/item:text-[#F96302] transition-colors">Create Account</span>
                            <span className="block text-[10px] text-gray-500">New here? Join us</span>
                        </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Button */}
              <button className="flex items-center gap-3 group relative pl-6 border-l border-gray-200">
                <div className="relative">
                  <FaShoppingCart size={24} className="text-gray-400 group-hover:text-[#F96302] transition-colors duration-300" />
                  {cart.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#F96302] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm risa-subheading scale-100 group-hover:scale-110 transition-transform">
                      {cart.count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">My Cart</span>
                  <span className="text-[13px] text-black font-bold leading-tight risa-heading group-hover:text-[#F96302] transition-colors">
                    {cart.count} Items
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Nav (Desktop) */}
      <div className="hidden lg:block bg-white border-b border-gray-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] h-14">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center h-full">
          <div className="flex items-center gap-10 text-[13px] font-bold text-gray-600 risa-subheading">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2.5 relative group h-full transition-all duration-200 ${
                  (location.pathname === `/${item.id}` || (item.id === "" && location.pathname === "/"))
                    ? 'text-black' 
                    : 'text-gray-500 hover:text-[#F96302]'
                }`}
              >
                <span className="group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100">{item.icon}</span>
                <span className={item.highlight ? 'text-[#F96302] font-bold uppercase tracking-wide risa-heading' : ''}>
                  {item.name}
                </span>
                {/* Active Indicator Line - Orange */}
                <span className={`absolute bottom-0 left-0 h-[3px] transition-all duration-300 ${
                  (location.pathname === `/${item.id}` || (item.id === "" && location.pathname === "/") || item.highlight)
                    ? 'bg-[#F96302] w-full' 
                    : 'bg-[#F96302] w-0 group-hover:w-full'
                }`}></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 border-r-0 z-[60] bg-gray-50 flex flex-col h-full risa-font">
          
          {/* Mobile Header: Black background, Orange accents */}
          <div className="bg-[#000000] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F96302] rounded-full blur-[60px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-full shadow-lg border border-white/10 backdrop-blur-sm">
                <FaUser className="text-[#F96302] text-xl" />
              </div>
              <div>
                <h2 className="font-bold text-xl risa-heading">Welcome</h2>
                <p className="text-xs text-gray-400 risa-body">Manage your property journey</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="bg-[#F96302] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-[#d15200] transition shadow-lg shadow-orange-900/20 risa-heading flex justify-center items-center gap-2">
                 Sign In
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/register'); }} className="bg-transparent border border-gray-600 text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide hover:border-[#F96302] hover:text-[#F96302] transition risa-heading flex justify-center items-center gap-2">
                 Register
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-200 bg-white">
              <button onClick={() => handleNavClick('how-it-works')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 transition border border-transparent hover:border-orange-100 group">
                <div className="bg-white p-2.5 rounded-full text-black group-hover:text-[#F96302] shadow-sm group-hover:scale-110 transition-transform"><FaSearch /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Find</span>
              </button>
              <button onClick={() => handleNavClick('features')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 transition border border-transparent hover:border-orange-100 group">
                <div className="bg-white p-2.5 rounded-full text-[#F96302] shadow-sm group-hover:scale-110 transition-transform"><FaKey /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Lease</span>
              </button>
              <button onClick={() => navigate('/login')} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 transition border border-transparent hover:border-orange-100 group">
                <div className="bg-white p-2.5 rounded-full text-black group-hover:text-[#F96302] shadow-sm group-hover:scale-110 transition-transform"><FaCity /></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">List</span>
              </button>
            </div>

            {/* Mobile Menu Links */}
            <div className="py-4 bg-white">
              <div className="px-6 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</div>
              {SECTIONS.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => handleNavClick(item.id)} 
                  className="w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-l-[3px] border-transparent hover:border-[#F96302] group"
                >
                  <div className="flex items-center gap-4 text-gray-600 group-hover:text-black">
                    <span className="text-gray-400 bg-gray-100 p-2 rounded-lg group-hover:bg-[#F96302] group-hover:text-white transition-colors">{item.icon}</span>
                    <span className="font-semibold text-sm risa-subheading">{item.name}</span>
                  </div>
                  <FaChevronDown className="-rotate-90 text-gray-300 text-xs group-hover:text-[#F96302]" />
                </button>
              ))}
            </div>

            <div className="m-4 p-5 bg-black rounded-3xl text-white shadow-xl relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl"><FaCity /></div>
               {/* Subtle Blue accent for background depth only */}
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#0056A6]/20 to-transparent"></div>
              <div className="relative z-10">
                <span className="bg-[#F96302] text-[10px] font-bold px-2.5 py-1 rounded-md text-white uppercase tracking-wider shadow-sm">PROMO</span>
                <h3 className="font-bold text-xl mt-3 risa-heading leading-tight">One Month Free</h3>
                <p className="text-xs text-gray-300 mt-1 mb-4 risa-body w-2/3">On select luxury apartments in Westlands.</p>
                <button onClick={() => handleNavClick('testimonials')} className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors risa-subheading shadow-sm">
                  Check Availability
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="flex items-center gap-3 text-gray-500 font-bold text-sm hover:text-[#F96302] w-full py-3 hover:bg-red-50 rounded-xl transition-all px-4 risa-subheading justify-center">
              <FaSignOutAlt /> Log Out / Switch Account
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Navbar;