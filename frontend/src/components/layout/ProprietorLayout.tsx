import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Building2,
  FileText,
  MessageSquare,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  description: string;
  children?: NavItem[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'system' | 'message' | 'report';
  created_at: string;
}

const ProprietorLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleItem = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, role')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedNotifications = (data || []).map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        time: formatTimeAgo(notif.created_at),
        read: notif.is_read,
        type: (notif.type as Notification['type']) || 'system',
        created_at: notif.created_at
      }));

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Get notification type icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={14} className="text-blue-500" />;
      case 'report': return <FileText size={14} className="text-orange-500" />;
      case 'system': return <Bell size={14} className="text-gray-500" />;
      default: return <Bell size={14} className="text-gray-500" />;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('proprietor-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Navigation items
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/portal/proprietor',
      icon: <LayoutDashboard size={20} />,
      description: 'Overview of your portfolio'
    },
    {
      title: 'My Properties',
      href: '/portal/proprietor/properties',
      icon: <Building2 size={20} />,
      description: 'Manage your property listings'
    },
    {
      title: 'Reports',
      href: '/portal/proprietor/reports',
      icon: <FileText size={20} />,
      description: 'View property reports'
    },
    {
      title: 'Messages',
      href: '/portal/proprietor/messages',
      icon: <MessageSquare size={20} />,
      description: 'Communication center',
      badge: 2 // Example badge, could be dynamic
    },
    {
      title: 'Documents',
      href: '/portal/proprietor/documents',
      icon: <FileText size={20} />,
      description: 'Contracts & Compliance Files'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Flatten all items for current page detection
  const flattenItems = (items: NavItem[]): NavItem[] => {
    let result: NavItem[] = [];
    items.forEach(item => {
      result.push(item);
      if (item.children) result = result.concat(flattenItems(item.children));
    });
    return result;
  };

  const allItems = flattenItems(navItems);
  const currentPage = allItems.find(item => isActive(item.href)) || navItems[0];
  const isDashboardHome = location.pathname === '/portal/proprietor';
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const latestNotificationActivity = notifications[0]?.time || 'No recent activity';

  const renderNavItem = (item: NavItem, depth = 0) => {
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
            "group relative mb-1 flex items-center justify-between border-l-4 border-l-transparent rounded-none px-4 py-3 transition-all duration-150",
            isItemActive
              ? "border-l-white bg-[#154279] text-white"
              : "text-[#fff3e5] hover:border-l-[#154279] hover:bg-[#154279] hover:text-white",
            depth > 0 && "pl-10"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={`${
                isItemActive
                  ? "text-white"
                  : "text-[#ffe0bf] group-hover:text-white"
              } relative transition-colors`}
            >
              {item.icon}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-[#154279] text-[9px] font-bold text-white shadow-sm">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  "text-[15px] leading-tight",
                  isItemActive
                    ? "font-semibold"
                    : "font-normal"
                )}
              >
                {item.title}
              </span>
              <div className={cn("text-[10px] mt-0.5 hidden xl:block transition-opacity", isItemActive ? "text-white/70 font-medium" : "text-[#ffe0bf] opacity-0 group-hover:opacity-100 font-medium")}>
                {item.description}
              </div>
            </div>
          </div>
          {hasChildren ? (
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-180",
                isItemActive ? "text-white" : "text-[#ffe0bf] group-hover:text-white"
              )}
            />
          ) : isItemActive && (
            <ChevronRight size={14} className="text-white" />
          )}
        </Link>

        {hasChildren && isExpanded && (
          <div className="mb-2 ml-4 mt-1 space-y-1 border-l border-white/30 pl-2">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fullName = userProfile 
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Proprietor';

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Load custom fonts and styles
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap";
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

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

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
            className="w-9 h-9 rounded-lg bg-[#F96302] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white"
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
            <svg
              viewBox="0 0 200 200"
              className="h-12 w-auto drop-shadow-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="grad-front-nav-prop" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F9F1DC" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <linearGradient id="grad-side-nav-prop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#AA8C2C" />
                </linearGradient>
                <linearGradient id="grad-dark-nav-prop" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#998A5E" />
                  <stop offset="100%" stopColor="#5C5035" />
                </linearGradient>
              </defs>
              <path d="M110 90 V170 L160 150 V70 L110 90 Z" fill="url(#grad-front-nav-prop)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M160 70 L180 80 V160 L160 150 Z" fill="url(#grad-dark-nav-prop)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M30 150 V50 L80 20 V120 L30 150 Z" fill="url(#grad-front-nav-prop)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
              <path d="M80 20 L130 40 V140 L80 120 Z" fill="url(#grad-side-nav-prop)" stroke="#8A7D55" strokeWidth="2" strokeLinejoin="round" />
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
        <nav className="sidebar-scroll mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-2">
            <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fff1e2]">
              <span>Main Menu</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#ffd2ad] to-transparent" />
            </div>
            <div className="space-y-0.5">{navItems.map((item) => renderNavItem(item))}</div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[#d65a01] bg-[#F05F01] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e8ffe8]">
                System Online
              </span>
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
      <main
        className={cn(
          "min-h-screen flex flex-col bg-white transition-all duration-300",
          sidebarOpen ? "lg:ml-80" : "lg:ml-0"
        )}
      >
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-[#0f325e] bg-gradient-to-r from-[#154279] via-blue-700 to-[#154279] px-8 shadow-lg lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-semibold tracking-tight uppercase text-white">
                {isDashboardHome ? (
                  <>
                    Welcome Back, <span className="text-[#ffd2ad]">{fullName}</span>
                  </>
                ) : (
                  currentPage.title
                )}
              </h2>
              {(currentPage.description || isDashboardHome) && (
                <div className="text-[11px] font-medium uppercase tracking-wide text-blue-100">
                  {isDashboardHome ? "Proprietor Command Center" : currentPage.description}
                </div>
              )}
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
                    <div className="flex items-center justify-between border-b border-[#d8e3ef] bg-[#f3f7fb] px-4 py-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#154279]">Notifications</h3>
                        <p className="mt-0.5 text-xs text-[#6a7d92]">{unreadCount} unread</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-[#F96302] hover:text-[#e05800]"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                              setNotificationsOpen(false);
                            }}
                            className={`block cursor-pointer border-b border-[#e1e9f2] px-4 py-3 transition-colors hover:bg-[#f3f7fb] ${!n.read ? 'bg-blue-50/60' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-[#0d243f]">{n.title}</h4>
                                  {!n.read && (
                                    <span className="mt-1 h-2 w-2 rounded-full bg-[#F96302]" />
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[#243041]">{n.message}</p>
                                <p className="mt-1 text-[10px] font-medium text-[#40536b]">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-[#6a7d92]">
                          No notifications
                        </div>
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
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-white">{fullName}</div>
                  <div className="text-[10px] font-medium text-blue-100">Proprietor</div>
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
                    <div>
                      <Link
                        to="/portal/proprietor/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block border-b border-[#e1e9f2] px-4 py-3 text-sm font-medium text-[#1f2937] transition-all hover:bg-[#f3f7fb] hover:text-[#154279]"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/portal/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block border-b border-[#e1e9f2] px-4 py-3 text-sm font-medium text-[#1f2937] transition-all hover:bg-[#f3f7fb] hover:text-[#154279]"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full border-t border-[#e1e9f2] bg-[#F96302] px-4 py-3 text-left text-sm font-semibold text-white transition-all hover:bg-[#e05800]"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-hidden bg-white">
          <div className="h-full w-full overflow-y-auto custom-scroll">
            <Outlet />
          </div>
        </div>

        <footer className="hidden border-t border-[#e5e7eb] bg-white px-8 py-5 shadow-sm lg:block">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-[#64748b]">
              <span className="font-semibold tracking-tight text-[#154279]">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs font-semibold text-[#64748b]">
              <span className="text-[10px] text-[#64748b]">
                {`Last activity: ${latestNotificationActivity}`}
              </span>
              <Link to="/portal/proprietor/reports" className="flex items-center gap-1 transition-colors duration-200 hover:text-[#154279]">
                <FileText size={12} />
                Reports
              </Link>
              <Link to="/portal/settings" className="transition-colors duration-200 hover:text-[#154279]">
                Privacy Policy
              </Link>
              <Link to="/portal/settings" className="transition-colors duration-200 hover:text-[#154279]">
                Terms of Service
              </Link>
              <Link to="/portal/help" className="transition-colors duration-200 hover:text-[#154279]">
                Help Center
              </Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ProprietorLayout;
