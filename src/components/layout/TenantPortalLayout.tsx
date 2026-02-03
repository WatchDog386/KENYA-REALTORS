// src/components/layout/TenantPortalLayout.tsx
import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  DollarSign, 
  Wrench, 
  FileText, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  MessageSquare,
  Calendar,
  Shield,
  HelpCircle,
  User,
  Search,
  ChevronRight,
  ChevronDown,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  description: string;
}

const TenantPortalLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user?.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/portal/tenant',
      icon: <LayoutDashboard size={20} />,
      description: 'Overview & Updates'
    },
    {
      title: 'My Property',
      href: '/portal/tenant/property',
      icon: <Home size={20} />,
      description: 'Unit Details & Info'
    },
    {
      title: 'Payments',
      href: '/portal/tenant/payments',
      icon: <DollarSign size={20} />,
      badge: 1,
      description: 'Rent & Utilities'
    },
    {
      title: 'Maintenance',
      href: '/portal/tenant/maintenance',
      icon: <Wrench size={20} />,
      description: 'Request Repairs'
    },
    {
      title: 'Documents',
      href: '/portal/tenant/documents',
      icon: <FileText size={20} />,
      description: 'Leases & Records'
    },
    {
      title: 'Messages',
      href: '/portal/tenant/messages',
      icon: <MessageSquare size={20} />,
      badge: 2,
      description: 'Inbox & Alerts'
    },
    {
      title: 'Calendar',
      href: '/portal/tenant/calendar',
      icon: <Calendar size={20} />,
      description: 'Events & Deadlines'
    },
    {
      title: 'Safety',
      href: '/portal/tenant/safety',
      icon: <Shield size={20} />,
      description: 'Emergency Contacts'
    },
    {
      title: 'Help',
      href: '/portal/tenant/help',
      icon: <HelpCircle size={20} />,
      description: 'Support & Guides'
    },
  ];

  // Special refund item (always shown)
  const refundItem = {
    title: 'Deposit Refund Status',
    href: '/portal/tenant/refund-status',
    icon: <DollarSign size={20} className="text-yellow-500" />,
    description: 'Track your refund progress',
    badge: 'Track'
  };

  const secondaryItems = [
    {
      title: 'My Profile',
      href: '/portal/tenant/profile',
      icon: <User size={20} />,
      description: 'Personal Information'
    },
    {
      title: 'Settings',
      href: '/portal/tenant/settings',
      icon: <Settings size={20} />,
      description: 'Account Preferences'
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const currentPage = [...navItems, refundItem, ...secondaryItems].find(item => isActive(item.href)) || navItems[0];

  // Mock notifications (you can replace with real data later)
  const notifications = [
    { id: 1, title: 'Payment Reminder', message: 'Your rent is due in 3 days', time: '2 hours ago', read: false, type: 'payment' },
    { id: 2, title: 'Maintenance Update', message: 'Plumber scheduled for tomorrow', time: '1 day ago', read: true, type: 'maintenance' },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign size={14} className="text-green-500" />;
      case 'maintenance': return <Wrench size={14} className="text-yellow-500" />;
      default: return <Bell size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      {/* Font & Scrollbar Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Montserrat', sans-serif; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-gradient-to-r from-[#00356B] via-blue-700 to-[#00356B] z-50 px-4 py-3 flex items-center justify-between shadow-lg h-[68px]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-white p-2 bg-white/10 hover:bg-white/20 hover:text-orange-500 transition-all rounded-lg border border-white/10"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-tight font-heading">
              AYDEN<span className="text-orange-500">HOMES</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg border border-white/10">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">
                {unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-xl bg-[#00356B] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-orange-500 overflow-hidden"
          >
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'T'
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-slate-50 text-slate-600 z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col border-r border-gray-200",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-72",
        "lg:translate-x-0 lg:w-72" // Always visible on desktop
      )}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00356B] rounded-lg shadow-lg">
              <Home className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight text-slate-900">
                AYDEN<span className="text-[#00356B]">HOMES</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider -mt-1">Tenant Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4 mt-6">
          <div className="mb-6">
            <div className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>Main Navigation</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center justify-between px-3 py-3 mx-2 rounded-lg transition-all duration-200 group relative mb-1 ${
                        active
                          ? 'bg-[#00356B] text-white shadow-lg shadow-blue-900/30'
                          : 'text-slate-900 hover:bg-orange-50 hover:text-orange-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${active ? 'text-white' : 'text-slate-900 group-hover:text-orange-600'} relative`}>
                          {item.icon}
                          {typeof item.badge === 'number' && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={cn("text-sm tracking-wide", active ? "font-bold" : "font-medium")}>{item.title}</span>
                          <p className={cn("text-[10px] mt-0.5 transition-opacity", active ? "text-white/80 font-medium" : "text-slate-500 opacity-70 group-hover:opacity-100")}>{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof item.badge === 'string' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                            {item.badge}
                          </span>
                        )}
                        {active && <ChevronRight size={16} className="text-white/90" />}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Refund Status - Highlighted */}
          <div className="mb-6 mx-2">
            <Link
              to={refundItem.href}
              className="block w-full"
            >
              <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-orange-50 border border-orange-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className="text-orange-600 group-hover:text-orange-700 transition-colors">
                  {refundItem.icon}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900">{refundItem.title}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{refundItem.description}</p>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-600 text-white rounded font-bold">
                  {refundItem.badge}
                </span>
              </div>
            </Link>
          </div>

          <div>
            <div className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>Account</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <ul className="space-y-1">
              {secondaryItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center justify-between px-3 py-3 mx-2 rounded-lg transition-all duration-200 group relative mb-1 ${
                        active
                          ? 'bg-slate-800 text-white shadow-lg'
                          : 'text-slate-900 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${active ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <span className={cn("text-sm tracking-wide", active ? "font-bold" : "font-medium")}>{item.title}</span>
                          <p className={cn("text-[10px] mt-0.5 transition-opacity", active ? "text-white/80 font-medium" : "text-slate-500 opacity-70 group-hover:opacity-100")}>{item.description}</p>
                        </div>
                      </div>
                      {active && <ChevronRight size={16} className="text-white/80" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#86bc25] rounded-full animate-pulse ring-2 ring-[#86bc25]/20"></div>
              <span className="text-[10px] text-[#86bc25] font-black uppercase tracking-wider">
                System Online
              </span>
            </div>
            <span className="text-[10px] text-slate-900 font-bold">v2.4.0</span>
          </div>
          <button 
            onClick={handleSignOut} 
            className="w-full flex items-center justify-center gap-2 text-xs text-white transition-colors py-3 bg-[#D85C2C] hover:bg-[#b84520] rounded-lg font-black uppercase tracking-wider border-2 border-[#D85C2C] hover:border-[#b84520] shadow-sm hover:shadow-lg"
          >
            <LogOut size={14} className="stroke-[3]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen flex flex-col bg-slate-50",
        "lg:ml-72", // Always offset by sidebar width on desktop
        "pt-[68px] lg:pt-0" // Add padding top on mobile for fixed header
      )}>
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-slate-50/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-extrabold text-[#00356B] tracking-tight uppercase">
                {currentPage.title}
              </h2>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">{currentPage.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00356B] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search payments, messages, docs..." 
                className="pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#D85C2C] focus:shadow-sm w-80 outline-none placeholder:text-gray-400 transition-all duration-200 font-medium"
              />
            </div>
            
            <div className="h-8 w-px bg-gray-200"></div>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-[#00356B] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-[#D85C2C] text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scroll">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getNotificationIcon(n.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{n.title}</h4>
                              <p className="text-sm text-gray-600">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#00356B] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-[#D85C2C] overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'T'
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">{userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Tenant'}</p>
                  <p className="text-xs text-gray-500 font-medium">Tenant Portal</p>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#00356B] flex items-center justify-center text-white font-bold text-lg border-2 border-[#D85C2C] overflow-hidden">
                          {userProfile?.avatar_url ? (
                            <img
                              src={userProfile.avatar_url}
                              alt={userProfile.first_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user?.first_name?.[0] || 'T'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name || 'Tenant'}</p>
                          <p className="text-xs text-gray-500 font-medium truncate max-w-[140px]">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link to="/portal/tenant/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-gray-700 hover:text-[#00356B] transition-colors">
                        <User size={18} />
                        <span className="font-medium">My Profile</span>
                      </Link>
                      <Link to="/portal/tenant/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-gray-700 hover:text-[#00356B] transition-colors">
                        <Settings size={18} />
                        <span className="font-medium">Settings</span>
                      </Link>
                      <Link to="/portal/tenant/messages" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full text-gray-700 hover:text-[#00356B] transition-colors">
                        <Mail size={18} />
                        <span className="font-medium">Messages</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-[#D85C2C] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
                        )}
                      </Link>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden custom-scroll">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-200 bg-white hidden lg:block">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">© 2025 Ayden Homes. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-30" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
};

export default TenantPortalLayout;