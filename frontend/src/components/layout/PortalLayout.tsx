// src/components/layout/TenantPortalLayout.tsx
import React, { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  description: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: "payment" | "maintenance" | "general" | "announcement";
  metadata?: any;
}

interface UnreadMessageCount {
  unread: number;
  last_message?: string;
  sender_name?: string;
}

const TenantPortalLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessageCount>({
    unread: 0,
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [propertyName, setPropertyName] = useState<string>("AYDEN HOMES");
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // Fetch user profile and property
  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      // User profile is already available from AuthContext
      setUserProfile(user);
      
      // Fetch tenant property name
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("property_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      
      if (tenantData?.property_id) {
        const { data: propertyData } = await supabase
          .from("properties")
          .select("name")
          .eq("id", tenantData.property_id)
          .single();
        
        if (propertyData?.name) {
          setPropertyName(propertyData.name.toUpperCase());
        }
      }
    } catch (err) {
      console.error("Error in fetchUserProfile:", err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "tenant")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching notifications:", error);
        // Fallback to mock data if table doesn't exist
        setNotifications([
          {
            id: "1",
            title: "Payment Reminder",
            message: "Your rent is due in 3 days",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            type: "payment",
          },
          {
            id: "2",
            title: "Maintenance Update",
            message: "Plumber scheduled for tomorrow",
            created_at: new Date(
              Date.now() - 24 * 60 * 60 * 1000
            ).toISOString(),
            read: true,
            type: "maintenance",
          },
        ]);
      } else if (data) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            created_at: n.created_at,
            read: n.read,
            type: n.category as Notification["type"],
          }))
        );
      }

      // Calculate unread count
      const unread = (data || []).filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error in fetchNotifications:", err);
    }
  };

  // Fetch unread message count
  const fetchUnreadMessages = async () => {
    if (!user?.id) return;

    try {
      // messages table doesn't exist - set to 0
      setUnreadMessages({ unread: 0 });
    } catch (err) {
      console.warn("Could not fetch unread messages:", err);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (!error) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.id)
        .eq("read", false);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    // Subscribe to notification updates
    const notificationChannel = supabase
      .channel("tenant-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to message updates
    const messageChannel = supabase
      .channel("tenant-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(messageChannel);
    };
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchNotifications(),
        fetchUnreadMessages(),
      ]);
      setLoading(false);
    };

    fetchData();

    // Set up real-time subscriptions
    const cleanup = setupRealtimeSubscriptions();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      cleanup?.();
      clearInterval(interval);
    };
  }, [user?.id]);

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/portal/tenant",
      icon: <LayoutDashboard size={20} />,
      description: "Overview & Updates",
    },
    {
      title: "My Property",
      href: "/portal/tenant/property",
      icon: <Home size={20} />,
      description: "Unit Details & Info",
    },
    {
      title: "Payments",
      href: "/portal/tenant/payments",
      icon: <DollarSign size={20} />,
      badge:
        notifications.filter((n) => n.type === "payment" && !n.read).length ||
        undefined,
      description: "Rent & Utilities",
    },
    {
      title: "Maintenance",
      href: "/portal/tenant/maintenance",
      icon: <Wrench size={20} />,
      badge:
        notifications.filter((n) => n.type === "maintenance" && !n.read)
          .length || undefined,
      description: "Request Repairs",
    },
    {
      title: "Documents",
      href: "/portal/tenant/documents",
      icon: <FileText size={20} />,
      description: "Leases & Records",
    },
    {
      title: "Messages",
      href: "/portal/tenant/messages",
      icon: <MessageSquare size={20} />,
      badge: unreadMessages.unread || undefined,
      description: "Inbox & Alerts",
    },
    {
      title: "Calendar",
      href: "/portal/tenant/calendar",
      icon: <Calendar size={20} />,
      description: "Events & Deadlines",
    },
    {
      title: "Safety",
      href: "/portal/tenant/safety",
      icon: <Shield size={20} />,
      description: "Emergency Contacts",
    },
    {
      title: "Help",
      href: "/portal/tenant/help",
      icon: <HelpCircle size={20} />,
      description: "Support & Guides",
    },
  ];

  // Special refund item (always shown)
  const refundItem = {
    title: "Deposit Refund Status",
    href: "/portal/tenant/refund-status",
    icon: <DollarSign size={20} className="text-yellow-500" />,
    description: "Track your refund progress",
    badge: "Track",
  };

  const secondaryItems = [
    {
      title: "My Profile",
      href: "/portal/tenant/profile",
      icon: <User size={20} />,
      description: "Personal Information",
    },
    {
      title: "Settings",
      href: "/portal/tenant/settings",
      icon: <Settings size={20} />,
      description: "Account Preferences",
    },
  ];

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const currentPage =
    [...navItems, refundItem, ...secondaryItems].find((item) =>
      isActive(item.href)
    ) || navItems[0];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSign size={14} className="text-green-500" />;
      case "maintenance":
        return <Wrench size={14} className="text-yellow-500" />;
      case "announcement":
        return <Bell size={14} className="text-blue-500" />;
      default:
        return <Bell size={14} className="text-gray-500" />;
    }
  };

  const userDisplayName = userProfile?.full_name || 
    (userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "") ||
    (user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "") ||
    user?.email?.split("@")[0] || "Tenant";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Font & Scrollbar Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
      `}</style>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#154279] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-md shadow-sm">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight">
                {propertyName.split(' ')[0]}<span className="text-blue-400">{propertyName.split(' ').slice(1).join(' ')}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#154279]">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md border border-blue-400"
          >
            {userDisplayName[0]?.toUpperCase() || "T"}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-gradient-to-b from-[#154279] to-[#0f325e] text-white z-40 transition-all duration-300 ease-in-out shadow-2xl flex flex-col",
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
          "lg:translate-x-0 lg:w-72"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-[#ffffff15]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg border border-blue-500/30">
              <Home className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight text-white">
                AYDEN<span className="text-blue-400">HOMES</span>
              </h1>
              <p className="text-[10px] text-blue-200 opacity-80 -mt-1">
                Tenant Portal
              </p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-6">
          <div className="bg-gradient-to-r from-[#ffffff0f] to-[#ffffff05] rounded-xl p-4 flex items-center gap-3 border border-[#ffffff0a] shadow-lg backdrop-blur-sm">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md border border-blue-400/30 overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt={userDisplayName} className="w-full h-full object-cover" />
                ) : (
                  userDisplayName[0]?.toUpperCase() || "T"
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-[#154279] rounded-full"></div>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold text-white truncate">
                {userDisplayName}
              </p>
              <p className="text-xs text-blue-200 opacity-90">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 text-[10px] font-bold rounded-full border border-blue-500/30">
                  Tenant
                </span>
                <span className="text-[10px] text-blue-300 opacity-70">
                  • Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4">
          <div className="mb-6">
            <p className="px-2 mb-3 text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70 flex items-center gap-2">
              <span>Main Navigation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-200/20 to-transparent"></div>
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30 font-semibold"
                          : "text-blue-100 hover:bg-[#ffffff10] hover:text-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`${
                            active
                              ? "text-white"
                              : "text-blue-300 group-hover:text-white"
                          } relative`}
                        >
                          {item.icon}
                          {item.badge !== undefined && typeof item.badge === "number" && item.badge > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium tracking-wide">
                            {item.title}
                          </span>
                          <p className="text-xs opacity-80 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof item.badge === "string" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <ChevronRight size={16} className="text-white/80" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Refund Status - Highlighted */}
          <div className="mb-6">
            <Link to={refundItem.href} className="block w-full">
              <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 hover:from-yellow-500/20 transition-all">
                <div className="flex items-center gap-3">
                  {refundItem.icon}
                  <div>
                    <span className="text-sm font-bold text-yellow-300">
                      {refundItem.title}
                    </span>
                    <p className="text-[10px] text-yellow-200 mt-0.5">
                      {refundItem.description}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-white rounded">
                  {refundItem.badge}
                </span>
              </div>
            </Link>
          </div>

          <div>
            <p className="px-2 mb-3 text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70 flex items-center gap-2">
              <span>Account</span>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-200/20 to-transparent"></div>
            </p>
            <ul className="space-y-1">
              {secondaryItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                        active
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-900/30 font-semibold"
                          : "text-blue-100 hover:bg-[#ffffff10] hover:text-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`${
                            active
                              ? "text-white"
                              : "text-blue-300 group-hover:text-white"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium tracking-wide">
                            {item.title}
                          </span>
                          <p className="text-xs opacity-80 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {active && (
                        <ChevronRight size={16} className="text-white/80" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#ffffff1a] bg-[#0a2644]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">
                System Online
              </span>
            </div>
            <span className="text-[10px] text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
              v2.4.0
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-200 hover:text-white transition-colors py-2.5 bg-white/5 hover:bg-white/10 rounded-lg"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                {currentPage.title}
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                {currentPage.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600"
                size={18}
              />
              <input
                type="text"
                placeholder="Search payments, messages, docs..."
                className="pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 focus:bg-white w-80 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-[#154279] hover:bg-gray-100 rounded-lg"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-xs font-bold text-white rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Notifications
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {unreadCount} unread
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scroll">
                      {loading ? (
                        <div className="p-8 text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                          <p className="mt-2 text-sm text-gray-500">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No notifications</p>
                          <p className="text-sm text-gray-400 mt-1">
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              // Navigate based on notification type
                              if (n.type === "payment") {
                                navigate("/portal/tenant/payments");
                              } else if (n.type === "maintenance") {
                                navigate("/portal/tenant/maintenance");
                              }
                            }}
                            className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 ${
                              !n.read ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                {getNotificationIcon(n.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium flex items-center gap-2">
                                  {n.title}
                                  {!n.read && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {n.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatRelativeTime(n.created_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
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
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {userProfile?.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userDisplayName} className="w-full h-full object-cover" />
                  ) : (
                    userDisplayName[0]?.toUpperCase() || "T"
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{userDisplayName}</p>
                  <p className="text-xs text-gray-500">Tenant</p>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#154279]/5 to-blue-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {userDisplayName[0]?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <p className="font-bold">{userDisplayName}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/portal/tenant/profile"
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={18} className="text-gray-500" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/portal/tenant/settings"
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={18} className="text-gray-500" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        to="/portal/tenant/messages"
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg w-full"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Mail size={18} className="text-gray-500" />
                        <span>Messages</span>
                        {unreadMessages.unread > 0 && (
                          <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadMessages.unread}
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
          <div className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-0">{children}</div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-gray-200 bg-white hidden lg:block">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 Ayden Homes. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Support
              </a>
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
