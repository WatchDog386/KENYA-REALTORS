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
  ChevronRight,
  ChevronDown,
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
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          toast.info(payload.new.title || 'New Notification');
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user?.id]);
  
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      * { font-family: 'Source Sans 3', sans-serif; }
      body { font-family: 'Source Sans 3', sans-serif; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Source Sans 3', sans-serif; }
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #154279; }
      .sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .sidebar-scroll::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.04); }
      .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(173, 181, 189, 0.38); border-radius: 4px; }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(173, 181, 189, 0.62); }
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
      if (!error && data) setUserProfile(data);
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
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    );
  };

  const navItems: NavItem[] = [
    { title: 'Dashboard', href: '/portal/tenant', icon: <LayoutDashboard size={20} />, description: 'Overview & Updates' },
    { title: 'Lease Agreement', href: '/portal/tenant/lease-agreement', icon: <FileText size={20} />, description: 'Read, Sign & Download' },
    { title: 'My Property', href: '/portal/tenant/property', icon: <Home size={20} />, description: 'Unit Details & Info' },
    { title: 'Payments', href: '/portal/tenant/payments', icon: <DollarSign size={20} />, badge: 1, description: 'Rent & Utilities' },
    { title: 'Maintenance', href: '/portal/tenant/maintenance', icon: <Wrench size={20} />, description: 'Request Repairs' },
    { title: 'Documents', href: '/portal/tenant/documents', icon: <FileText size={20} />, description: 'Leases & Records' },
    { title: 'Messages', href: '/portal/tenant/messages', icon: <MessageSquare size={20} />, badge: 2, description: 'Inbox & Alerts' },
    { title: 'Calendar', href: '/portal/tenant/calendar', icon: <Calendar size={20} />, description: 'Events & Deadlines' },
    { title: 'Notice to Vacate', href: '/portal/tenant/vacation-notice', icon: <LogOut size={20} />, description: 'End Lease Request' },
  ];

  const secondaryItems: NavItem[] = [
    { title: 'Deposit Refund', href: '/portal/tenant/refund-status', icon: <DollarSign size={20} />, description: 'Track your refund', badge: 'Track' },
    { title: 'Safety', href: '/portal/tenant/safety', icon: <Shield size={20} />, description: 'Emergency Contacts' },
    { title: 'Help', href: '/portal/tenant/help', icon: <HelpCircle size={20} />, description: 'Support & Guides' },
    { title: 'My Profile', href: '/portal/tenant/profile', icon: <User size={20} />, description: 'Personal Info' },
    { title: 'Settings', href: '/portal/tenant/settings', icon: <Settings size={20} />, description: 'Preferences' },
  ];

  const isActive = (href: string) => {
    if (href === '/portal/tenant' && location.pathname !== '/portal/tenant') return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const allItems = [...navItems, ...secondaryItems];
  const currentPage = allItems.find(item => isActive(item.href)) || navItems[0];
  const isDashboardHome = location.pathname === '/portal/tenant';

  const fullName = userProfile 
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : 'Tenant User';

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isExpanded = expandedItems.includes(item.title);

    return (
      <div key={item.title}>
        <Link
          to={item.href}
          onClick={(e) => {
            if (hasChildren) { e.preventDefault(); toggleItem(item.title); }
          }}
          className={cn(
            "group relative mb-1 flex items-center justify-between border-l-4 border-l-transparent rounded-none px-4 py-3 transition-all duration-150",
            isItemActive
              ? "border-l-white bg-[#154279] text-white"
              : "text-[#fff3e5] hover:border-l-[#154279] hover:bg-[#154279] hover:text-white",
            depth > 0 && "pl-10"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={`${isItemActive ? "text-white" : "text-[#ffe0bf] group-hover:text-white"} relative transition-colors`}>
              {item.icon}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-[#154279] text-[9px] font-bold text-white shadow-sm">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <span className={cn("text-[15px] leading-tight", isItemActive ? "font-semibold" : "font-normal")}>
                {item.title}
              </span>
              {typeof item.badge === 'string' && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-[#154279] text-white rounded font-bold">{item.badge}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180", isItemActive ? "text-white" : "text-[#ffe0bf] group-hover:text-white")} />
            ) : (
              isItemActive && <ChevronRight size={14} className="text-white" />
            )}
          </div>
        </Link>
        {hasChildren && isExpanded && (
          <div className="mb-2 ml-4 mt-1 space-y-1 border-l border-white/30 pl-2">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#1f2937] selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Mobile Header */}
      <div className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#0f325e] bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] px-4 py-3 shadow-lg lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md border border-white/20 bg-white/10 p-2 text-white transition-all hover:bg-white/20"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-semibold tracking-tight text-white">KENYA REALTORS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-full border-2 border-[#F96302] bg-[#1b4f8d] flex items-center justify-center text-white font-bold text-sm shadow-md"
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-80 flex-col border-r border-[#d65a01] bg-[#F96302] text-white shadow-xl transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center border-b border-[#d65a01] bg-white px-6">
          <div className="shrink-0 cursor-pointer flex items-center gap-2 md:gap-3 w-full">
            <svg viewBox="0 0 200 200" className="h-12 w-auto drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad-front-nav-tp" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F9F1DC" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <linearGradient id="grad-side-nav-tp" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#AA8C2C" />
                </linearGradient>
                <linearGradient id="grad-dark-nav-tp" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#998A5E" />
                  <stop offset="100%" stopColor="#5C5035" />
                </linearGradient>
              </defs>
              <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav-tp)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav-tp)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav-tp)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav-tp)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <g fill="#154279">
                <path d="M85 50 L100 56 V86 L85 80 Z" />
                <path d="M85 90 L100 96 V126 L85 120 Z" />
                <path d="M45 60 L55 54 V124 L45 130 Z" />
                <path d="M120 130 L140 122 V152 L120 160 Z" />
              </g>
            </svg>
            <div className="flex flex-col justify-center select-none ml-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#154279] leading-none ml-0.5">Kenya</span>
              <div className="flex items-baseline -mt-1 relative">
                <span className="text-[20px] font-black tracking-tighter text-[#154279]">REALTOR</span>
                <span className="text-[20px] font-black tracking-tighter text-[#F96302]">S</span>
                <div className="h-1.5 w-1.5 bg-[#F96302] rounded-full ml-1 mb-1.5 shadow-lg shadow-orange-500/50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scroll mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-2">
            <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff1e2]">
              <span>Tenant Portal</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#ffd2ad] to-transparent" />
            </div>
            <div className="space-y-0.5">{navItems.map((item) => renderNavItem(item))}</div>
          </div>
          <div className="mt-6 mb-2">
            <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff1e2]">
              <span>Account</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#ffd2ad] to-transparent" />
            </div>
            <div className="space-y-0.5">{secondaryItems.map((item) => renderNavItem(item))}</div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#d65a01] bg-[#F05F01] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e8ffe8]">System Online</span>
            </div>
            <span className="text-[10px] font-semibold text-[#fff1e2]">v2.4.0</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 border border-white bg-white py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#154279] transition-all hover:bg-[#154279] hover:text-white"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("min-h-screen flex flex-col bg-white transition-all duration-300", sidebarOpen ? "lg:ml-80" : "lg:ml-0")}>
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-[#0f325e] bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] px-8 shadow-lg lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-semibold tracking-tight uppercase text-white">
                {isDashboardHome ? (
                  <>Welcome Back, <span className="text-[#ffd2ad]">{fullName}</span></>
                ) : (
                  currentPage.title
                )}
              </h2>
              <div className="text-[11px] font-medium uppercase tracking-wide text-blue-100">
                {isDashboardHome ? "Tenant Portal" : currentPage.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <div className="relative z-50">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#F96302] text-[10px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-4 w-96 overflow-hidden border border-[#b7cce3] bg-white shadow-[0_15px_50px_-10px_rgba(0,0,0,0.25)]">
                    <div className="bg-[#154279] px-4 py-3 text-sm font-semibold text-white">Notifications ({unreadCount})</div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => { markAsRead(n.id); setNotificationsOpen(false); }}
                            className={`cursor-pointer border-b border-[#e1e9f2] px-4 py-3 last:border-0 transition-all hover:bg-[#f3f7fb] ${!n.is_read ? 'bg-blue-50/60' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1"><Bell size={14} className="text-blue-600" /></div>
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[#0d243f]">{n.title}</h3>
                                <p className="mt-1 text-xs text-[#243041]">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-[#6a7d92]">No notifications</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative z-50">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 rounded-lg py-1.5 pl-1 pr-1 transition-colors hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#F96302] bg-[#1b4f8d] font-bold text-white">
                  {initials}
                </div>
                <div className="hidden text-left xl:block">
                  <div className="text-xs font-semibold text-white">{fullName}</div>
                  <div className="text-[10px] font-medium text-blue-100">Tenant</div>
                </div>
                <ChevronDown size={14} className="text-blue-100" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden border border-[#b7cce3] bg-white shadow-[0_15px_50px_-10px_rgba(0,0,0,0.25)]">
                    <div className="border-b border-[#d8e3ef] bg-[#f3f7fb] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#154279]">Account</p>
                    </div>
                    <Link to="/portal/tenant/profile" onClick={() => setUserMenuOpen(false)} className="block border-b border-[#e1e9f2] px-4 py-3 text-sm font-medium text-[#1f2937] transition-all hover:bg-[#f3f7fb] hover:text-[#154279]">
                      My Profile
                    </Link>
                    <Link to="/portal/tenant/settings" onClick={() => setUserMenuOpen(false)} className="block border-b border-[#e1e9f2] px-4 py-3 text-sm font-medium text-[#1f2937] transition-all hover:bg-[#f3f7fb] hover:text-[#154279]">
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full border-t border-[#e1e9f2] bg-[#F96302] px-4 py-3 text-left text-sm font-semibold text-white transition-all hover:bg-[#e05800]"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative z-10 flex-1 overflow-hidden bg-white">
          <div className="h-full w-full overflow-y-auto custom-scroll">
            {children}
          </div>
        </div>

        <footer className="hidden border-t border-[#e5e7eb] bg-white px-8 py-5 shadow-sm lg:block">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-[#64748b]">
              <span className="font-semibold tracking-tight text-[#154279]">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs font-semibold text-[#64748b]">
              <Link to="/portal/tenant/payments" className="transition-colors duration-200 hover:text-[#154279]">Payments</Link>
              <Link to="/portal/tenant/settings" className="transition-colors duration-200 hover:text-[#154279]">Privacy Policy</Link>
              <Link to="/portal/tenant/settings" className="transition-colors duration-200 hover:text-[#154279]">Terms of Service</Link>
              <Link to="/portal/help" className="transition-colors duration-200 hover:text-[#154279]">Help Center</Link>
            </div>
          </div>
        </footer>
      </main>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default TenantPortalLayout;
