import React, { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Wrench,
  Calendar,
  Wallet,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  Search,
  ChevronRight,
  Loader2,
  Settings,
  MessageSquare,
  FileText
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
  type: 'system' | 'job' | 'payment';
  created_at: string;
}

const TechnicianLayout = ({ children }: { children?: ReactNode }) => {
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
      case 'job': return <Wrench size={14} className="text-blue-500" />;
      case 'payment': return <Wallet size={14} className="text-emerald-500" />;
      default: return <Bell size={14} className="text-gray-500" />;
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('technician-notifications')
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
      href: '/portal/technician',
      icon: <LayoutDashboard size={20} />,
      description: 'Overview of jobs'
    },
    {
      title: 'My Jobs',
      href: '/portal/technician/jobs',
      icon: <Wrench size={20} />,
      description: 'Active & past jobs'
    },
    {
      title: 'Schedule',
      href: '/portal/technician/schedule',
      icon: <Calendar size={20} />,
      description: 'Upcoming appointments'
    },
    {
      title: 'Earnings',
      href: '/portal/technician/earnings',
      icon: <Wallet size={20} />,
      description: 'Payment history'
    },
    {
      title: 'Profile',
      href: '/portal/technician/profile',
      icon: <User size={20} />,
      description: 'Manage profile & skills'
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
  
  const unreadCount = notifications.filter(n => !n.read).length;

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
            "flex items-center justify-between px-4 py-3 mx-2 rounded-xl transition-all duration-200 group relative mb-1 font-nunito",
            isItemActive
              ? "bg-[#154279] text-white shadow-lg"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#154279]",
            depth > 0 && "pl-8"
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
        </Link>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#154279]/20 pl-2 mb-2">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fullName = userProfile 
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Technician';

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
      "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap";
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

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

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
              TECHNICIAN
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg border border-white/10"
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
          "fixed top-0 left-0 h-full bg-white text-[#154279] z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col border-r-2 border-slate-200",
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
          "lg:translate-x-0 lg:w-72"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b-2 border-slate-200 bg-white">
          <div className="shrink-0 cursor-pointer flex items-center gap-2 md:gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#154279] to-[#F96302] flex items-center justify-center text-white font-bold text-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col justify-center select-none ml-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-[#154279] leading-none ml-0.5">
                Service
              </span>
              <div className="flex items-baseline -mt-1 relative">
                <span className="text-[16px] font-black tracking-tighter text-[#154279]">
                  TECHNICIAN
                </span>
                <span className="text-[16px] font-black tracking-tighter text-[#F96302]">
                  PORTAL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4 mt-4">
          <div className="mb-2">
            <div className="px-4 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Work</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
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
            <span className="text-[10px] text-slate-600 font-bold">v2.4.0</span>
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
      <main
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col bg-white",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white border-b-2 border-slate-200 sticky top-0 z-30 transition-all duration-300 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-black text-[#154279] tracking-tight uppercase">
                {currentPage.title}
              </h2>
              <div className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide">
                {currentPage.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F96302] transition-colors"
                size={16}
              />
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
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#F96302] text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <div>
                        <h3 className="font-bold text-[#154279]">Notifications</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#F96302] hover:text-[#d35400] font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scroll">
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
                            className={`block ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-[#154279]">
                                  {getNotificationIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm text-[#154279]">{n.title}</h4>
                                    {!n.read && (
                                      <span className="w-2 h-2 bg-[#F96302] rounded-full"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium text-sm">No notifications</p>
                        </div>
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
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Technician</p>
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
                       {/* Temporarily pointing to local routes */}
                      <Link
                        to="/portal/technician/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg w-full text-slate-700 hover:text-[#154279] transition-colors"
                      >
                        <User size={16} />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      <Link
                        to="/portal/technician/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg w-full text-slate-700 hover:text-[#154279] transition-colors"
                      >
                        <Settings size={16} />
                        <span className="text-sm font-medium">Account Settings</span>
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

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden custom-scroll bg-slate-50">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#154279]/80 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default TechnicianLayout;
