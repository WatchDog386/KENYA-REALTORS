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
  Mail,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  description: string;
  children?: NavItem[];
}

const TenantPortalLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Payment Reminder', message: 'Rent due soon', time: '2h ago', read: false, type: 'payment' },
    { id: 2, title: 'Maintenance Update', message: 'Request received', time: '1d ago', read: true, type: 'maintenance' },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Initial data fetch
  useEffect(() => {
    // Add Nunito font
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      * { font-family: 'Nunito', sans-serif; }
      body { font-family: 'Nunito', sans-serif; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #154279; }
      
      .sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .sidebar-scroll::-webkit-scrollbar-track { background: rgba(21, 66, 121, 0.05); }
      .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(21, 66, 121, 0.3); border-radius: 4px; }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(21, 66, 121, 0.5); }
    `;
    document.head.appendChild(style);

    fetchUserProfile();
    
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url, role")
        .eq("id", user.id)
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

  const toggleItem = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
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
  ];

  const secondaryItems: NavItem[] = [
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
    {
        title: 'My Profile',
        href: '/portal/tenant/profile',
        icon: <User size={20} />,
        description: 'Personal Info'
    },
    {
        title: 'Settings',
        href: '/portal/tenant/settings',
        icon: <Settings size={20} />,
        description: 'Preferences'
    }
  ];

  // Special refund item
  const refundItem: NavItem = {
    title: 'Deposit Refund',
    href: '/portal/tenant/refund-status',
    icon: <DollarSign size={20} className="text-yellow-500" />,
    description: 'Track your refund',
    badge: 'Track'
  };

  const isActive = (href: string) => {
    if (href === '/portal/tenant' && location.pathname !== '/portal/tenant') return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Find current page title
  const allItems = [...navItems, refundItem, ...secondaryItems];
  const currentPage = allItems.find(item => isActive(item.href)) || navItems[0];

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isExpanded = expandedItems.includes(item.title);

    return (
      <div key={item.title}>
        <Link
          to={item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleItem(item.title);
            }
          }}
          className={cn(
            "flex items-center justify-between px-4 py-3 mx-2 rounded-xl transition-all duration-200 group relative mb-1 font-nunito",
            isItemActive
              ? "bg-[#154279] text-white shadow-lg"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#154279]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={`${
                isItemActive
                  ? "text-[#F96302]"
                  : "text-slate-500 group-hover:text-[#F96302]"
              } relative transition-colors`}
            >
              {item.icon}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  "text-[14px] tracking-wide font-nunito",
                  isItemActive
                    ? "font-bold"
                    : "font-medium"
                )}
              >
                {item.title}
              </span>
              <div className={cn("text-[10px] mt-0.5 hidden xl:block transition-opacity font-nunito", isItemActive ? "text-white/70 font-medium" : "text-slate-500 opacity-0 group-hover:opacity-100 font-medium")}>
                {item.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof item.badge === 'string' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                {item.badge}
              </span>
            )}
            {hasChildren ? (
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180",
                  isItemActive ? "text-white" : "text-slate-500 group-hover:text-[#154279]"
                )}
              />
            ) : isItemActive && (
              <ChevronRight size={14} className="text-[#F96302]" />
            )}
          </div>
        </Link>
      </div>
    );
  };

  const fullName = userProfile 
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : 'Tenant User';

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-white text-[#154279] font-nunito selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-white p-2 bg-white/10 hover:bg-white/20 transition-all rounded-lg border border-white/10"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-tight text-sm">
               KENYA REALTORS
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setNotificationsOpen(!notificationsOpen)}
             className="relative p-2 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg border border-white/10"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">2</span>}
          </button>
          
          <button 
             onClick={() => setUserMenuOpen(!userMenuOpen)}
             className="w-9 h-9 rounded-lg bg-[#F96302] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white"
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-[#154279]/80 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white text-[#154279] z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col border-r-2 border-slate-200",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
        "lg:translate-x-0 lg:w-72"
      )}>
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b-2 border-slate-200 bg-white">
          <div className="shrink-0 cursor-pointer flex items-center gap-2 md:gap-3 w-full">
            <svg
              viewBox="0 0 200 200"
              className="h-12 w-auto drop-shadow-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="grad-front-nav-t" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F9F1DC" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <linearGradient id="grad-side-nav-t" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#AA8C2C" />
                </linearGradient>
                <linearGradient id="grad-dark-nav-t" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#998A5E" />
                  <stop offset="100%" stopColor="#5C5035" />
                </linearGradient>
              </defs>
              <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav-t)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav-t)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav-t)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav-t)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <g fill="#154279">
                <path d="M85 50 L100 56 V86 L85 80 Z" />
                <path d="M85 90 L100 96 V126 L85 120 Z" />
                <path d="M45 60 L55 54 V124 L45 130 Z" />
                <path d="M120 130 L140 122 V152 L120 160 Z" />
              </g>
            </svg>

            <div className="flex flex-col justify-center select-none ml-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#154279] leading-none ml-0.5">
                Kenya
              </span>
              <div className="flex items-baseline -mt-1 relative">
                <span className="text-[20px] font-black tracking-tighter text-[#154279]">
                  REALTOR
                </span>
                <span className="text-[20px] font-black tracking-tighter text-[#F96302]">
                  S
                </span>
                <div className="h-1.5 w-1.5 bg-[#F96302] rounded-full ml-1 mb-1.5 shadow-lg shadow-orange-500/50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4 mt-4">
          <div className="mb-2">
            <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Tenant Portal</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
            </div>
            <div className="space-y-0.5">
              {navItems.map(item => renderNavItem(item))}
            </div>
          </div>
          
          <div className="mt-8 mb-2">
            <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Account</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
            </div>
            <div className="space-y-0.5">
              {renderNavItem(refundItem)}
              {secondaryItems.map(item => renderNavItem(item))}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t-2 border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-emerald-500/20"></div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                System Online
              </span>
            </div>
            <span className="text-[10px] text-slate-600 font-bold">2026 MPG</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-xs text-white transition-all py-3 bg-gradient-to-r from-[#154279] to-[#0f325e] hover:from-[#F96302] hover:to-[#ff8c42] rounded-xl font-bold uppercase tracking-wider shadow-md hover:shadow-lg"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen flex flex-col bg-slate-50", 
        sidebarOpen ? "lg:ml-72" : "lg:ml-0"
      )}>
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white border-b-2 border-slate-200 sticky top-0 z-30 transition-all duration-300 shadow-sm">
           <div className="flex items-start flex-col">
              <h2 className="text-lg font-black text-[#154279] tracking-tight uppercase">
                {currentPage.title}
              </h2>
              <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">
                {currentPage.description}
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F96302] transition-colors" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   className="pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#F96302] focus:shadow-sm w-72 outline-none placeholder:text-slate-400 transition-all duration-200 font-medium font-nunito"
                 />
              </div>

              {/* Notifications */}
              <div className="relative">
                 <button 
                   onClick={() => setNotificationsOpen(!notificationsOpen)}
                   className="relative p-2.5 text-slate-600 hover:text-[#154279] hover:bg-slate-100 bg-white border-2 border-slate-200 hover:border-[#F96302] hover:shadow-sm rounded-lg transition-all"
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-[#F96302] text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
                       {unreadCount > 9 ? '9+' : unreadCount}
                    </span>}
                 </button>

                 {notificationsOpen && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                     <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                           <h3 className="font-bold text-[#154279] text-sm">Notifications</h3>
                           <span className="text-[10px] font-bold text-[#F96302] cursor-pointer">Mark all as read</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scroll">
                           {notifications.length > 0 ? (
                             notifications.map(n => (
                               <div key={n.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                                  <div className="flex items-start gap-3">
                                     <div className={cn("p-1.5 rounded-lg", n.type === 'payment' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500')}>
                                       {n.type === 'payment' ? <DollarSign size={14} /> : <Wrench size={14} />}
                                     </div>
                                     <div>
                                        <p className="text-xs font-bold text-[#154279]">{n.title}</p>
                                        <p className="text-[10px] text-slate-500">{n.message}</p>
                                     </div>
                                  </div>
                               </div>
                             ))
                           ) : (
                             <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                           )}
                        </div>
                     </div>
                   </>
                 )}
              </div>

              {/* User Menu */}
              <div className="relative">
                 <button 
                   onClick={() => setUserMenuOpen(!userMenuOpen)}
                   className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                 >
                    <div className="w-9 h-9 rounded-lg bg-[#F96302] flex items-center justify-center text-white font-bold text-sm shadow-md">
                       {initials}
                    </div>
                    <div className="text-left hidden md:block">
                       <p className="text-sm font-bold text-[#154279]">{fullName}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tenant</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                 </button>

                 {userMenuOpen && (
                   <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#154279]/5 to-blue-500/5 rounded-t-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#154279] flex items-center justify-center text-white font-bold">
                              {initials}
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-[#154279] truncate">{fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                           <Link
                            to="/portal/tenant/profile"
                            className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg w-full text-slate-700 hover:text-[#154279] transition-colors"
                          >
                            <User size={16} />
                            <span className="text-sm font-medium">My Profile</span>
                          </Link>
                          <Link
                            to="/portal/tenant/settings"
                            className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg w-full text-slate-700 hover:text-[#154279] transition-colors"
                          >
                            <Settings size={16} />
                            <span className="text-sm font-medium">Settings</span>
                          </Link>
                          <div className="h-px bg-slate-100 my-2"></div>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-red-50 rounded-lg text-red-600 transition-colors group"
                          >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            <span className="text-sm font-bold">Sign Out</span>
                          </button>
                        </div>
                      </div>
                   </>
                 )}
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-x-hidden custom-scroll bg-slate-50">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantPortalLayout;