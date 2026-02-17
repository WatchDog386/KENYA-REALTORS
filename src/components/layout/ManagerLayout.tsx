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
  Loader2,
  Briefcase
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
  type: 'maintenance' | 'payment' | 'tenant' | 'system' | 'approval' | 'vacancy_update';
  related_entity_type?: string;
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
  const [managedProperties, setManagedProperties] = useState<string[]>([]);
  const [firstPropertyName, setFirstPropertyName] = useState<string>("MANAGER PORTAL");
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
          .select('first_name, last_name, email, phone, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    // Fetch assigned properties
    const fetchAssignedProperties = async () => {
      if (!user?.id) return;

      try {
        // Get property IDs from assignment table
        const { data: assignments, error: assignmentError } = await supabase
          .from("property_manager_assignments")
          .select("property_id")
          .eq("property_manager_id", user.id);

        if (assignmentError) throw assignmentError;

        if (assignments && assignments.length > 0) {
          const propertyIds = assignments.map(a => a.property_id);

          // Fetch property details
          const { data: properties, error: propsError } = await supabase
            .from("properties")
            .select("id, name")
            .in("id", propertyIds);

          if (!propsError && properties && properties.length > 0) {
            const names = properties.map(p => p.name);
            setManagedProperties(names);
            setFirstPropertyName(names[0].toUpperCase());
          }
        }
      } catch (err) {
        console.error('Error fetching assigned properties:', err);
      }
    };

    fetchUserProfile();
    fetchAssignedProperties();
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
      case 'vacancy_update':
        return '/portal/manager/vacation-notices';
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
        { title: 'Vacancy Notices', href: '/portal/manager/vacation-notices', icon: <LogOut size={18} />, description: 'Move-Out Requests' },
      ]
    },
    {
      title: 'Payments',
      href: '/portal/manager/payments',
      icon: <DollarSign size={20} />,
      badge: pendingTasks.payments,
      description: 'Financial Operations'
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
      title: 'Caretaker Duties',
      href: '/portal/manager/caretaker-duties',
      icon: <Briefcase size={20} />,
      description: 'Assign tasks to caretakers'
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
    : user?.email?.split('@')[0] || 'Property Manager';

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Load custom fonts and styles
  useEffect(() => {
    // Add Nunito font
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

      {/* Sidebar - Sleek White Background */}
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
            <svg
              viewBox="0 0 200 200"
              className="h-12 w-auto drop-shadow-sm"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="grad-front-nav"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#F9F1DC" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
                <linearGradient
                  id="grad-side-nav"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#AA8C2C" />
                </linearGradient>
                <linearGradient
                  id="grad-dark-nav"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#998A5E" />
                  <stop offset="100%" stopColor="#5C5035" />
                </linearGradient>
              </defs>
              <path
                d="M110 90 V170 L160 150 V70 L110 90 Z"
                fill="url(#grad-front-nav)"
                stroke="#8A7D55"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M160 70 L180 80 V160 L160 150 Z"
                fill="url(#grad-dark-nav)"
                stroke="#8A7D55"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M30 150 V50 L80 20 V120 L30 150 Z"
                fill="url(#grad-front-nav)"
                stroke="#8A7D55"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M80 20 L130 40 V140 L80 120 Z"
                fill="url(#grad-side-nav)"
                stroke="#8A7D55"
                strokeWidth="2"
                strokeLinejoin="round"
              />
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
              <span>Management</span>
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
                          <Link
                            key={n.id}
                            to={getNotificationLink(n)}
                            onClick={() => {
                              if (!n.read) markAsRead(n.id);
                              setNotificationsOpen(false);
                            }}
                            className={`block ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
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
                          </Link>
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
                <div className="w-9 h-9 rounded-lg bg-[#F96302] flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold text-[#154279]">{fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manager</p>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#154279]/5 to-blue-500/5 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#154279] flex items-center justify-center text-white font-bold overflow-hidden">
                          {userProfile?.avatar_url ? (
                            <img 
                              src={userProfile.avatar_url} 
                              alt={fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-[#154279] truncate">{fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                       <Link
                        to="/portal/manager/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg w-full text-slate-700 hover:text-[#154279] transition-colors"
                      >
                        <Users size={16} />
                        <span className="text-sm font-medium">My Profile</span>
                      </Link>
                      <Link
                        to="/portal/settings"
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
          <div className="p-4 md:p-6 lg:p-8">
            {children}
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

export default ManagerLayout;