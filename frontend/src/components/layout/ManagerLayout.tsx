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
  UserCheck,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getManagerAssignedPropertyIds } from '@/services/managerPropertyAssignmentService';

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
      const propertyIds = await getManagerAssignedPropertyIds(user.id);

      const tasks = {
        maintenance: 0,
        approvals: 0,
        applications: 0,
        payments: 0
      };

      if (propertyIds.length === 0) {
        setPendingTasks(tasks);
        return;
      }

      // Get pending maintenance requests for manager properties
      const { count: maintenanceCount, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .in('status', ['pending', 'assigned', 'in_progress']);

      if (!maintenanceError) {
        tasks.maintenance = maintenanceCount || 0;
      }

      // Get pending lease applications for manager properties only.
      const { count: applicationCount, error: applicationError } = await supabase
        .from('lease_applications')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .in('status', ['pending', 'under_review']);

      if (!applicationError) {
        tasks.applications = applicationCount || 0;
      }

      // Pending payments represented by unpaid invoices in manager properties.
      const { count: paymentCount, error: paymentError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .in('status', ['unpaid', 'overdue']);

      if (!paymentError) {
        tasks.payments = paymentCount || 0;
      }

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
      title: 'Technicians',
      href: '/portal/manager/maintenance',
      icon: <Briefcase size={20} />,
      description: 'Track Technician Work Orders'
    },
    {
      title: 'Caretakers',
      href: '/portal/manager/caretakers',
      icon: <UserCheck size={20} />,
      description: 'Caretaker Duties & Follow-up'
    },
    {
      title: 'Approval Requests',
      href: '/portal/manager/approval-requests',
      icon: <AlertTriangle size={20} />,
      badge: pendingTasks.approvals,
      description: 'Pending Manager Actions'
    },
    {
      title: 'Leave Requests',
      href: '/portal/manager/leave-requests',
      icon: <Calendar size={20} />,
      description: 'Staff Leave Submission & Review'
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
            "group relative mb-1 flex items-center justify-between border-l-4 border-l-transparent rounded-none px-4 py-3 transition-all duration-150",
            isItemActive
              ? "border-l-[#17a2b8] bg-[#007bff] text-white"
              : "text-[#cfd4da] hover:border-l-[#adb5bd] hover:bg-[#343a40] hover:text-[#e9ecef]",
            depth > 0 && "pl-10"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={`${
                isItemActive
                  ? "text-white"
                  : "text-[#adb5bd] group-hover:text-[#e9ecef]"
              } relative transition-colors`}
            >
              {item.icon}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-[#343a40] bg-[#fd7e14] text-[9px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
              {typeof item.badge === "string" && parseInt(item.badge) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-[#343a40] bg-[#fd7e14] text-[9px] font-bold text-white shadow-sm">
                  {item.badge}
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
              <div className={cn("text-[10px] mt-0.5 hidden xl:block transition-opacity", isItemActive ? "text-white/70 font-medium" : "text-[#adb5bd] opacity-0 group-hover:opacity-100 font-medium")}>
                {item.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180",
                  isItemActive ? "text-white" : "text-[#adb5bd] group-hover:text-[#e9ecef]"
                )}
              />
            ) : (
              isItemActive && (
                <ChevronRight size={14} className="text-white" />
              )
            )}
          </div>
        </Link>

        {hasChildren && isExpanded && (
          <div className="mb-2 ml-4 mt-1 space-y-1 border-l border-[#adb5bd]/40 pl-2">
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

  // Load custom fonts and styles (matching Super Admin aesthetic)
  useEffect(() => {
    // Use AdminLTE-like font stack (Source Sans 3)
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
    <div className="min-h-screen bg-[#d7dce1] text-[#e8f2ff] selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#343a40] z-50 px-4 py-3 flex items-center justify-between shadow-lg border-b border-[#4b545c]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md border border-[#4b545c] bg-[#3f474f] p-2 text-white transition-all hover:bg-[#4b545c]"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-semibold tracking-tight text-[#f8f9fa]">KENYA REALTORS</span>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-80 flex-col border-r border-[#4b545c] bg-[#343a40] text-[#c2c7d0] shadow-xl transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-20 items-center border-b border-[#4b545c] bg-[#343a40] px-6">
          <div className="flex w-full items-center">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9aa4ae]">Property Manager</div>
              <div className="text-[20px] font-bold leading-none text-[#f8f9fa]">Portal</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-scroll mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-2">
            <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#adb5bd]">
              <span>Management</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#6c757d] to-transparent" />
            </div>
            <div className="space-y-0.5">{navItems.map((item) => renderNavItem(item))}</div>
          </div>
        </nav>

        <div className="border-t border-[#4b545c] bg-[#30363d] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ddab8]">System Online</span>
            </div>
            <span className="text-[10px] font-semibold text-[#9aa4ae]">v2.4.0</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 border border-[#dc3545] bg-[#dc3545] py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#c82333]"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("min-h-screen flex flex-col bg-[#d7dce1] transition-all duration-300", sidebarOpen ? "lg:ml-80" : "lg:ml-0")}>
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-[#12314f] bg-[#0a1f38] px-8 shadow-sm lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-semibold tracking-tight uppercase text-[#e8f2ff]">
                {currentPage.title}
              </h2>
              {currentPage.description && (
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#8fb4d7]">
                  {currentPage.description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <div className="relative z-50">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-[#d6e9fb] transition-colors hover:text-[#35d0ff]"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#f28f1a] text-[10px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-4 w-96 overflow-hidden border border-[#1f466b] bg-[#0f2b4a] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.35)]">
                    <div className="bg-[#194b79] px-4 py-3 text-sm font-semibold text-[#e8f2ff] flex justify-between items-center">
                      <span>Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-[#35d0ff] hover:text-white font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scroll">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center p-8">
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
                          >
                            <div className={`cursor-pointer border-b border-[#1e476e] px-4 py-3 last:border-0 transition-all hover:bg-opacity-80 ${!n.read ? 'bg-blue-50/10' : 'bg-transparent'}`}>
                              <div className="flex items-start gap-3">
                                <div className="mt-1 text-[#8fb4d7]">{getNotificationIcon(n.type)}</div>
                                <div className="flex-1">
                                  <h3 className="text-sm font-semibold text-[#e8f2ff]">{n.title}</h3>
                                  <p className="mt-1 text-xs text-[#a8c5dd]">{n.message}</p>
                                  <span className="mt-1 block text-[10px] font-medium text-[#8fb4d7]">{n.time}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-[#9dbedf]">No notifications</div>
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
                className="flex items-center gap-3 py-1.5 pl-1 pr-1 transition-colors hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#2ea3da] bg-[#1f7fb1] font-bold text-white">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden text-left xl:block">
                  <div className="text-xs font-semibold text-[#e8f2ff]">{fullName}</div>
                  <div className="text-[10px] font-medium text-[#9dc0df]">Manager</div>
                </div>
                <ChevronDown size={14} className="text-[#8fb4d7]" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden border border-[#1f466b] bg-[#0f2b4a] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.35)]">
                    <div className="border-b border-[#1e476e] bg-[#123b63] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b9d7f2]">Account</p>
                    </div>
                    <Link to="/portal/manager/profile" className="block border-b border-[#1e476e] px-4 py-3 text-sm font-medium text-[#d4e4f5] transition-all hover:bg-[#194b79] hover:text-white">
                      View Profile
                    </Link>
                    <Link to="/portal/settings" className="block border-b border-[#1e476e] px-4 py-3 text-sm font-medium text-[#d4e4f5] transition-all hover:bg-[#194b79] hover:text-white">
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full border-t border-[#1e476e] bg-[#f28f1a] px-4 py-3 text-left text-sm font-semibold text-white transition-all hover:bg-[#d6780c]"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-hidden bg-[#d7dce1]">
          <div className="h-full w-full overflow-y-auto custom-scroll p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="hidden border-t border-[#12314f] bg-[#0a1f38] px-8 py-5 shadow-sm lg:block">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-[#9dc0df]">
              <span className="font-semibold tracking-tight text-[#e8f2ff]">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs font-semibold text-[#9dc0df]">
              <Link to="/portal/manager/profile" className="transition-colors duration-200 hover:text-[#35d0ff]">
                Profile
              </Link>
              <Link to="/portal/settings" className="transition-colors duration-200 hover:text-[#35d0ff]">
                Settings
              </Link>
              <Link to="/portal/help" className="transition-colors duration-200 hover:text-[#35d0ff]">
                Help Center
              </Link>
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

export default ManagerLayout;