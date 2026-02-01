import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
      className={`fixed top-0 w-full z-50 bg-white transition-all duration-300 border-b border-slate-200 ${isScrolled ? "shadow-md" : ""}`}
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
      <div className="bg-white border-b border-slate-200 py-4 relative z-20">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-8">
            
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                {/* Mobile Toggle */}
                <button 
                  onClick={() => setMenuOpen(true)} 
                  className={`lg:hidden text-[${COLORS.primary}] hover:text-[${COLORS.secondary}] p-2 rounded-none hover:bg-slate-50 transition-colors`}
                >
                  <FaBars size={24} />
                </button>

                {/* LOGO AREA */}
                <div 
                  onClick={handleHomeClick} 
                  className="shrink-0 cursor-pointer flex items-center gap-3 group"
                >
                  {/* SVG: Gold/Metallic Colors */}
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

                  {/* BRAND TEXT: Blue Dominant */}
                  <div className="flex flex-col justify-center select-none ml-1">
                    <span className={`${BRAND.countryLabelSize} font-bold text-slate-400 leading-none ml-0.5 brand-lowercase tracking-[0.2em] uppercase`}>
                        {BRAND.countryLabel}
                    </span>
                    <div className="flex items-baseline -mt-1 relative">
                        <span className={`${BRAND.brandNameSize} font-extrabold tracking-tight text-[${BRAND.primaryColor}] brand-lowercase`}>
                        {BRAND.brandName}
                        </span>
                        {/* Dot is Bright Orange */}
                        <div className={`h-1.5 w-1.5 md:h-2 md:w-2 bg-[${BRAND.dotColor}] rounded-none ml-1 mb-1.5 shadow-sm animate-pulse`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Icons */}
              <div className="flex items-center gap-5 lg:hidden">
                <button onClick={() => navigate('/login')} className={`text-[${COLORS.primary}] hover:text-[${COLORS.secondary}] transition-colors`}>
                  <FaUser size={20} />
                </button>
                <button className={`relative text-[${COLORS.primary}] hover:text-[${COLORS.secondary}] transition-colors`}>
                  <FaShoppingCart size={20} />
                  {cart.count > 0 && (
                    <span className={`absolute -top-1 -right-2 bg-[${COLORS.secondary}] text-white text-[10px] font-bold w-4 h-4 rounded-none flex items-center justify-center border border-white`}>
                      {cart.count}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* SEARCH BAR: Bright Orange Button */}
            <div className="flex-1 w-full relative group z-30 ml-4 lg:ml-8">
              <div className={`w-full flex items-center bg-slate-50 border border-slate-200 rounded-none pl-1 pr-1 py-1 transition-all duration-300 shadow-sm group-hover:shadow-md focus-within:border-[${COLORS.secondary}] focus-within:shadow-[0_4px_15px_rgba(249,99,2,0.2)] focus-within:ring-1 focus-within:ring-[${COLORS.secondary}]/30`}>
                <div className="relative flex-1">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[${COLORS.secondary}] transition-colors pointer-events-none`}>
                    <FaSearch size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder={SEARCH_BAR.placeholder}
                    className="w-full h-10 pl-11 pr-4 border-none outline-none text-[15px] placeholder:text-slate-500 font-medium bg-transparent text-slate-900"
                  />
                </div>
                <button className={`bg-[${COLORS.primary}] hover:bg-[${COLORS.secondary}] text-white px-6 h-10 font-bold uppercase text-xs tracking-wider transition-all duration-300 rounded-none shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5`}>
                  <span className="hidden md:block">{SEARCH_BAR.buttonText}</span>
                  <FaSearch size={12} className="md:hidden" />
                </button>
              </div>
            </div>

            {/* Desktop Account & Cart Area */}
            <div className="hidden lg:flex items-center gap-8 shrink-0">
              
              {/* Account Dropdown - Blue/Orange */}
              <div className="relative group h-full py-2">
                <button className="flex flex-col items-start outline-none">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Account</span>
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
                  <FaShoppingCart size={24} className={`text-slate-600 group-hover:text-[${COLORS.secondary}] transition-colors duration-300`} />
                  {cart.count > 0 && (
                    <span className={`absolute -top-2 -right-2 bg-[${COLORS.secondary}] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-none border-2 border-white shadow-md scale-100 group-hover:scale-110 transition-transform`}>
                      {cart.count}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">My Cart</span>
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
      <div className="hidden lg:block bg-white border-b border-slate-200 h-14">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center h-full">
          <div className="flex items-center gap-10 text-[13px] font-bold text-slate-700">
            {NAVIGATION_SECTIONS.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2.5 relative group h-full transition-all duration-200 ${
                    (location.pathname === `/${item.id}` || (item.id === "" && location.pathname === "/"))
                      ? `text-[${COLORS.primary}]` 
                      : `text-slate-700 hover:text-[${COLORS.secondary}]`
                  }`}
                >
                  <span className="group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100">
                    <IconComponent size={item.iconSize} className={`text-[${item.iconColor}]`} />
                  </span>
                  <span className={item.highlight ? `text-[${COLORS.secondary}] font-bold uppercase tracking-wide` : ''}>
                    {item.name}
                  </span>
                  {/* Active Indicator Line - Bright Orange */}
                  <span className={`absolute bottom-0 left-0 h-[3px] transition-all duration-300 ${
                    (location.pathname === `/${item.id}` || (item.id === "" && location.pathname === "/") || item.highlight)
                      ? `bg-[${COLORS.secondary}] w-full` 
                      : `bg-[${COLORS.secondary}] w-0 group-hover:w-full`
                  }`}></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-[340px] p-0 border-r-0 z-[60] bg-slate-50 flex flex-col h-full">
          
          {/* Mobile Header: Deep Blue background, Bright Orange accents */}
          <div className={`bg-[${COLORS.primary}] p-6 text-white relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-[${COLORS.secondary}] rounded-none blur-[30px] opacity-40 -translate-y-1/2 translate-x-1/2`}></div>
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <div className="bg-white/15 p-3 rounded-none shadow-md border border-white/20">
                <FaUser className={`text-[${COLORS.secondary}] text-xl`} />
              </div>
              <div>
                <h2 className="font-bold text-xl">{MOBILE_HEADER.title}</h2>
                <p className="text-xs text-white/85 font-medium">{MOBILE_HEADER.subtitle}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOBILE_HEADER.buttons.map((btn, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setMenuOpen(false); navigate(`/${btn.action}`); }} 
                  className={`${btn.bgColor} ${btn.textColor} ${btn.borderColor ? btn.borderColor + ' border-2' : ''} py-3 px-4 rounded-none font-bold text-xs uppercase tracking-wide hover:bg-[${COLORS.secondary}] hover:text-white transition shadow-md flex justify-center items-center gap-2`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-200 bg-white">
              {QUICK_ACTIONS.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <button 
                    key={idx}
                    onClick={() => handleNavClick(action.id)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-none bg-slate-50 hover:bg-orange-50 transition border border-slate-200 hover:border-orange-200 group`}
                  >
                    <div className={`bg-white p-2.5 rounded-none text-[${action.iconColor}] shadow-sm group-hover:scale-110 transition-transform`}>
                      <ActionIcon />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Menu Links */}
            <div className="py-4 bg-white">
              <div className="px-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Menu</div>
              {NAVIGATION_SECTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => handleNavClick(item.id)} 
                    className={`w-full px-6 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 active:bg-slate-100 transition-colors border-l-[3px] border-transparent hover:border-[${COLORS.secondary}] group`}
                  >
                    <div className={`flex items-center gap-4 text-slate-700 group-hover:text-[${COLORS.primary}]`}>
                      <span className={`text-slate-600 bg-slate-100 p-2 rounded-none group-hover:bg-[${COLORS.secondary}] group-hover:text-white transition-colors`}>
                        <IconComponent size={item.iconSize} />
                      </span>
                      <span className="font-semibold text-sm">{item.name}</span>
                    </div>
                    <FaChevronDown className="-rotate-90 text-slate-400 text-xs group-hover:text-[#F96302]" />
                  </button>
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