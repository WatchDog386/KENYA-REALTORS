import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Home,
  DollarSign,
  ClipboardCheck,
  Search,
  ChevronRight,
  Mail,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  type: 'maintenance' | 'payment' | 'tenant' | 'system' | 'approval';
  related_entity_id?: string;
  created_at: string;
}

const ManagerLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingTasks, setPendingTasks] = useState({
    maintenance: 0,
    approvals: 0,
    applications: 0,
    payments: 0
  });
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
      // Fetch notifications targeted at the current user (recipient)
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
        related_entity_id: notif.related_entity_id,
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

  // Fetch pending tasks count
  const fetchPendingTasks = async () => {
    if (!user?.id) return;

    try {
      const tasks = {
        maintenance: 0,
        approvals: 0,
        applications: 0,
        payments: 0
      };

      // Get pending maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id', { count: 'exact' })
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'assigned']);

      if (!maintenanceError && maintenance) {
        tasks.maintenance = maintenance.length;
      }

      // Get pending approvals
      // approvals table doesn't exist - skip
      
      // Get pending applications (assuming this is in approvals table)
      // approvals table doesn't exist - skip
      
      // Get pending payments
      // Skip for now - requires complex querying

      setPendingTasks(tasks);
    } catch (err) {
      console.error('Error fetching pending tasks:', err);
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

      // Update local state
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

      // Update local state
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
      case 'maintenance': return <Wrench size={14} className="text-yellow-500" />;
      case 'payment': return <DollarSign size={14} className="text-red-500" />;
      case 'tenant': return <Users size={14} className="text-green-500" />;
      case 'approval': return <AlertTriangle size={14} className="text-blue-500" />;
      default: return <Bell size={14} className="text-gray-500" />;
    }
  };

  // Get notification link
  const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
      case 'maintenance':
        return `/portal/manager/maintenance${notification.related_entity_id ? `/${notification.related_entity_id}` : ''}`;
      case 'payment':
        return '/portal/manager/payments';
      case 'tenant':
        return '/portal/manager/tenants';
      case 'approval':
        return '/portal/manager/approval-requests';
      default:
        return '#';
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchPendingTasks();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('manager-notifications')
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

  // Navigation items with real badge counts
  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/portal/manager',
      icon: <LayoutDashboard size={20} />,
      description: 'Performance Overview'
    },
    {
      title: 'My Properties',
      href: '/portal/manager/properties',
      icon: <Building size={20} />,
      description: 'Managed Buildings & Units',
      children: [
        { title: 'Property Overview', href: '/portal/manager/properties', icon: <Home size={18} />, description: 'All Managed Properties' },
        { title: 'Units', href: '/portal/manager/properties/units', icon: <Building size={18} />, description: 'Unit-Level Details' },
      ]
    },
    {
      title: 'Tenants',
      href: '/portal/manager/tenants',
      icon: <Users size={20} />,
      badge: pendingTasks.applications,
      description: 'Resident Management',
      children: [
        { title: 'All Tenants', href: '/portal/manager/tenants', icon: <Users size={18} />, description: 'Tenant Directory' },
        { title: 'Applications', href: '/portal/manager/tenants/applications', icon: <ClipboardCheck size={18} />, description: 'New Lease Requests' },
        { title: 'Leases', href: '/portal/manager/leases', icon: <FileText size={18} />, description: 'Active Agreements' },
      ]
    },
    {
      title: 'Payments',
      href: '/portal/manager/payments',
      icon: <DollarSign size={20} />,
      badge: pendingTasks.payments,
      description: 'Financial Operations',
      children: [
        { title: 'Rent Collection', href: '/portal/manager/payments', icon: <DollarSign size={18} />, description: 'Track & Collect Rent' },
        { title: 'Deposits', href: '/portal/manager/payments/deposits', icon: <FileText size={18} />, description: 'Security Deposits' },
      ]
    },
    {
      title: 'Maintenance',
      href: '/portal/manager/maintenance',
      icon: <Wrench size={20} />,
      badge: pendingTasks.maintenance,
      description: 'Repair Requests & Tasks'
    },
    {
      title: 'Approval Requests',
      href: '/portal/manager/approval-requests',
      icon: <AlertTriangle size={20} />,
      badge: pendingTasks.approvals,
      description: 'Pending Manager Actions'
    },
    {
      title: 'Vacation Notices',
      href: '/portal/manager/vacation-notices',
      icon: <Calendar size={20} />,
      description: 'Tenant Absence Reports'
    },
    {
      title: 'Reports',
      href: '/portal/manager/reports',
      icon: <FileText size={20} />,
      description: 'Operational Summaries'
    },
    {
      title: 'Messages',
      href: '/portal/manager/messages',
      icon: <MessageSquare size={20} />,
      badge: notifications.filter(n => !n.read && n.type === 'system').length,
      description: 'Inbox & Alerts'
    },
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
            "flex items-center justify-between px-3 py-3 mx-2 rounded-lg transition-all duration-200 group relative mb-1",
            isItemActive
              ? "bg-[#00356B] text-white shadow-lg shadow-blue-900/30"
              : "text-slate-900 hover:bg-orange-50 hover:text-orange-700",
            depth > 0 && "pl-8"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={`${isItemActive ? 'text-white' : 'text-slate-900 group-hover:text-orange-600'} relative`}>
              {item.icon}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <span className={cn("text-sm tracking-wide", isItemActive ? "font-bold" : "font-medium")}>{item.title}</span>
              <p className={cn("text-[10px] mt-0.5 transition-opacity", isItemActive ? "text-white/80 font-medium" : "text-slate-500 opacity-70 group-hover:opacity-100")}>{item.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof item.badge === 'string' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                {item.badge}
              </span>
            )}
            {hasChildren ? (
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-180",
                isItemActive ? "text-white" : "text-slate-900 group-hover:text-orange-600"
              )} />
            ) : isItemActive && (
              <ChevronRight size={16} className="text-white/90" />
            )}
          </div>
        </Link>
        
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fullName = userProfile 
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Property Manager';

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
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      .risa-font { font-family: 'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; letter-spacing: -0.015em; }
      .risa-heading { font-family: 'Montserrat', sans-serif; font-weight: 800; letter-spacing: -0.03em; }
      .risa-subheading { font-family: 'Montserrat', sans-serif; font-weight: 600; letter-spacing: -0.01em; }
      .risa-body { font-family: 'Montserrat', sans-serif; font-weight: 400; letter-spacing: -0.01em; }
      .risa-uppercase { font-family: 'Montserrat', sans-serif; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
      .risa-mono { font-family: 'SF Mono', 'Roboto Mono', monospace; letter-spacing: -0.01em; }
      
      body { font-family: 'Montserrat', sans-serif; }
      
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 0px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      
      .sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .sidebar-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
      .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 0px; }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      {/* Font & Scrollbar Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Montserrat', sans-serif; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-gradient-to-r from-[#00356B] via-blue-700 to-[#00356B] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
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
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 bg-white/10 hover:bg-white/20 text-white transition-all rounded-lg border border-white/10"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-lg bg-[#00356B] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-orange-500"
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-slate-50 text-slate-600 z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col border-r border-gray-200",
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
        "lg:translate-x-0 lg:w-72"
      )}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00356B] rounded-lg shadow-lg">
              <Building className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight text-slate-900">
                AYDEN<span className="text-[#00356B]">HOMES</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider -mt-1">Manager Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4 mt-6">
          <div className="mb-6">
            <div className="px-2 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span>Management</span>
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
            </div>
            <div className="space-y-1">
              {navItems.map(item => renderNavItem(item))}
            </div>
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
        sidebarOpen ? "lg:ml-72" : "lg:ml-0"
      )}>
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-slate-50/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-black text-[#00356B] tracking-tight uppercase">
                {currentPage.title}
              </h2>
              <div className="text-[11px] text-gray-600 font-semibold uppercase tracking-wide">
                {currentPage.description}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D85C2C] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search tenants, units, payments..." 
                className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#D85C2C] focus:shadow-sm w-80 outline-none placeholder:text-gray-400 transition-all duration-200 font-medium"
              />
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 text-gray-500 hover:text-[#0056A6] hover:bg-white bg-white/50 border border-transparent hover:border-blue-100 hover:shadow-sm rounded-lg transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#D85C2C] text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scroll">
                      {loadingNotifications ? (
                        <div className="p-8 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map(n => (
                          <Link
                            key={n.id}
                            to={getNotificationLink(n)}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                              setNotificationsOpen(false);
                            }}
                            className={`block ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="p-4 border-b border-gray-50 hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  {getNotificationIcon(n.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-medium">{n.title}</h4>
                                    {!n.read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No notifications</p>
                          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
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
                className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{fullName}</p>
                  <p className="text-xs text-gray-500">Property Manager</p>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#154279]/5 to-blue-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold">{fullName}</p>
                          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link 
                        to="/portal/manager/profile" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                      >
                        <Users size={18} className="text-gray-500" />
                        <span>My Profile</span>
                      </Link>
                      <Link 
                        to="/portal/settings" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                      >
                        <Settings size={18} className="text-gray-500" />
                        <span>Account Settings</span>
                      </Link>
                      <Link 
                        to="/portal/manager/messages" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                      >
                        <Mail size={18} className="text-gray-500" />
                        <span>Messages</span>
                        {notifications.filter(n => !n.read && n.type === 'system').length > 0 && (
                          <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {notifications.filter(n => !n.read && n.type === 'system').length}
                          </span>
                        )}
                      </Link>
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg text-red-600"
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
          className="lg:hidden fixed inset-0 bg-[#00356B]/80 z-30 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
};

export default ManagerLayout;