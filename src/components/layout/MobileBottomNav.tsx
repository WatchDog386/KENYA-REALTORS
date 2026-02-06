import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, Heart, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Get active state for navigation items
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Define portal link based on user role
  const portalLink = user 
    ? (user.role === 'super_admin' ? '/portal/admin' : '/portal/tenant')
    : '/auth';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-2 pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        {/* Home */}
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/') ? 'text-[#154279]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={22} className={isActive('/') ? 'fill-current' : ''} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </Link>
        
        {/* Search / Marketplace */}
        <Link 
          to="/marketplace" 
          className={`flex flex-col items-center justify-center space-y-1 ${isActive('/marketplace') ? 'text-[#154279]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Search size={22} strokeWidth={isActive('/marketplace') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Search</span>
        </Link>

        {/* Center - Highlighted Portal Button (Optional Style) 
            Or we can keep it standard. Let's make Portal a bit distinct or just standard.
            Let's stick to standard for consistency but maybe the middle one could be "Key" or something if we wanted.
            Let's stick to User/Portal.
        */}

        {/* Favorites / Saved (assuming feature exists or placeholder) */}
        {/* If no favorites route exists, maybe swap for "Contact" or "Menu" */}
        {/* Let's double check relevant public routes. "Contact" / "Menu" */}
        <Link 
            to="/profile" // Using profile for now or maybe favorites if it implies saved items
            className={`flex flex-col items-center justify-center space-y-1 ${isActive('/profile') ? 'text-[#154279]' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Heart size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-tight">Saved</span>
        </Link>

        {/* Portal / Profile */}
        <Link 
          to={portalLink}
          className={`flex flex-col items-center justify-center space-y-1 ${location.pathname.startsWith('/portal') || location.pathname === '/auth' ? 'text-[#154279]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <User size={22} className={location.pathname.startsWith('/portal') ? 'fill-current' : ''} strokeWidth={location.pathname.startsWith('/portal') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">{user ? 'Portal' : 'Login'}</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileBottomNav;
