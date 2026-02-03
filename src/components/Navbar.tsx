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
    <nav className="fixed w-full z-[60] bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 font-nunito">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Button - Left Side */}
          <button
            className="lg:hidden p-2 order-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo - Center on Mobile, Left on Desktop */}
          <Link to="/" className="flex items-center gap-2 group order-2 lg:order-1 mx-auto lg:mx-0">
            <div className="bg-[#154279] p-2 rounded-none group-hover:bg-[#F96302] transition-colors">
              <Home className="text-white" size={20} />
            </div>
            <span className="text-xl font-black text-[#154279] uppercase tracking-tighter">REALTORS<span className="text-[#F96302]">.</span></span>
          </Link>

          {/* Desktop Navigation - Only on Desktop */}
          <div className="hidden lg:flex items-center gap-8 order-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-[#154279] transition-all relative group/nav"
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
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#154279] bg-slate-50 px-4 py-2 hover:bg-[#154279] hover:text-white transition-all border border-slate-200"
              >
                <User size={16} />
                <span>Portal</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="bg-[#154279] text-white px-6 py-2.5 rounded-none text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#F96302] transition-all shadow-lg shadow-blue-900/10"
              >
                Client Access
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-700 hover:text-primary px-4 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-4 px-4">
                {user ? (
                  <Link
                    to={user.role === 'super_admin' ? '/portal/admin' : '/portal/tenant'}
                    className="block text-gray-700 hover:text-primary py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block text-gray-700 hover:text-primary py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block bg-primary text-white px-4 py-2 rounded-lg mt-2 text-center hover:bg-primary/90"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign Up
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