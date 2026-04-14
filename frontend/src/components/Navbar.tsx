import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
  ];

  return (
    <nav className="fixed w-full z-[60] font-nunito skeuo-navbar">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button - Left Side */}
          <button
            className="lg:hidden p-1.5 order-1 text-[#154279] skeuo-icon-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {/* Logo - Center on Mobile, Left on Desktop */}
          <Link to="/" className="flex items-center gap-2 group order-2 lg:order-1 mx-auto lg:mx-0">
            <div className="p-1.5 md:p-2 skeuo-logo-chip bg-white rounded-md">
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
            </div>
            <span className="text-lg md:text-xl font-black text-[#154279] uppercase tracking-tighter">REALTORS<span className="text-[#F96302]">.</span></span>
          </Link>

          {/* Mobile User Action - Right Side (Balances the Header) */}
          <div className="lg:hidden order-3 p-1 text-[#154279]">
            <Link to={user ? (user.role === 'super_admin' ? '/portal/admin' : '/portal/tenant') : '/auth'}>
              <span className="inline-flex p-1.5 skeuo-icon-button">
                <User size={22} strokeWidth={2.5} />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Only on Desktop */}
          <div className="hidden lg:flex items-center gap-8 order-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-all relative group/nav skeuo-nav-link"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#F96302] transition-all group-hover/nav:w-full"></span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Only on Desktop */}
          <div className="hidden lg:flex items-center gap-6 order-3">
            {user ? (
              <Link
                to={user.role === 'super_admin' ? '/portal/admin' : '/portal/tenant'}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#154279] px-4 py-2 transition-all skeuo-portal-btn"
              >
                <User size={16} />
                <span>Portal</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all skeuo-cta-btn"
              >
                Client Access
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full rounded-b-[2.5rem] overflow-hidden transition-all animate-in slide-in-from-top-2 duration-200 skeuo-mobile-panel">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-700 px-4 py-2 font-medium text-lg skeuo-mobile-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 pt-4 px-4">
                {user ? (
                  <Link
                    to={user.role === 'super_admin' ? '/portal/admin' : '/portal/tenant'}
                    className="block text-gray-700 py-2 px-4 font-medium text-lg skeuo-mobile-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block text-gray-700 py-2 px-4 font-medium text-lg skeuo-mobile-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth"
                      className="block text-white px-4 py-3 mt-3 text-center transition-colors font-bold uppercase tracking-wider text-sm skeuo-cta-btn"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Client Access
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;