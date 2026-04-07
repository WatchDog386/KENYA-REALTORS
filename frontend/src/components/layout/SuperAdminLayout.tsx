// src/components/layout/SuperAdminLayout.tsx
import React, { useState, ReactNode } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  LayoutDashboard,
  Building,
  Users,
  CheckCircle,
  BarChart3,
  Settings,
  FileText,
  Database,
  Shield,
  UserPlus,
  Mail,
  Key,
  Globe,
  DollarSign,
  FileBarChart,
  FileCheck,
  ClipboardList,
  Calendar,
  Wrench,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  MoreVertical,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { cn } from "@/lib/utils";

// Add missing type definitions
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  avatar_url?: string | null;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  description: string;
  children?: NavItem[];
  permission?: string;
}

interface DashboardStats {
  totalProperties: number;
  activeUsers: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalLeases?: number;
  pendingApplications?: number;
  systemHealth?: number;
  [key: string]: any;
}

interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'critical';
  action?: string;
  timestamp: string;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  icon?: string;
}

// Get navigation items function
const getNavigationItems = (permissions: string[], stats?: DashboardStats) => {
  return [
    {
      title: "Properties",
      path: "/portal/super-admin/properties",
      icon: "building",
      description: "Manage all properties",
      permission: "manage_properties",
    },
    {
      title: "Users",
      path: "/portal/super-admin/users",
      icon: "users",
      description: "Manage system users",
      permission: "manage_users",
    },
    {
      title: "Approvals",
      path: "/portal/super-admin/approvals",
      icon: "check-circle",
      description: "Review pending approvals",
      permission: "manage_approvals",
      badge: stats?.pendingApprovals?.toString(),
    },
    {
      title: "Analytics",
      path: "/portal/super-admin/analytics",
      icon: "bar-chart",
      description: "View analytics",
      permission: "view_analytics",
    },
    {
      title: "Applications",
      path: "/portal/super-admin/applications",
      icon: "clipboard-list",
      description: "Review tenant applications",
      permission: "manage_approvals",
      badge: stats?.pendingApplications?.toString(),
    },
    {
      title: "Billing and Invoicing",
      path: "/portal/super-admin/utilities",
      icon: "zap",
      description: "Manage billing and invoicing",
      permission: "manage_finances",
    },
    {
      title: "Leave Requests",
      path: "/portal/super-admin/leave-requests",
      icon: "calendar",
      description: "Review and approve staff leave requests",
      permission: "manage_users",
    },
  ];
};

// Define getIconComponent FIRST so it's available in getNavItems
const getIconComponent = (iconName?: string) => {
  switch (iconName) {
    case "building":
      return <Building size={20} />;
    case "users":
      return <Users size={20} />;
    case "check-circle":
      return <CheckCircle size={20} />;
    case "bar-chart":
      return <BarChart3 size={20} />;
    case "settings":
      return <Settings size={20} />;
    case "file-text":
      return <FileText size={20} />;
    case "database":
      return <Database size={20} />;
    case "shield":
      return <Shield size={20} />;
    case "user-plus":
      return <UserPlus size={20} />;
    case "mail":
      return <Mail size={20} />;
    case "key":
      return <Key size={20} />;
    case "globe":
      return <Globe size={20} />;
    case "dollar-sign":
      return <DollarSign size={20} />;
    case "file-bar-chart":
      return <FileBarChart size={20} />;
    case "file-check":
      return <FileCheck size={20} />;
    case "clipboard-list":
      return <ClipboardList size={20} />;
    case "calendar":
      return <Calendar size={20} />;
    case "zap":
      return <Zap size={20} />;
    case "wrench":
      return <Wrench size={20} />;
    case "message-square":
      return <MessageSquare size={20} />;
    case "help-circle":
      return <HelpCircle size={20} />;
    case "shield-check":
      return <ShieldCheck size={20} />;
    case "alert-triangle":
      return <AlertTriangle size={20} />;
    case "download":
      return <Download size={20} />;
    case "eye":
      return <Eye size={20} />;
    case "edit":
      return <Edit size={20} />;
    case "trash":
      return <Trash2 size={20} />;
    case "plus":
      return <Plus size={20} />;
    case "filter":
      return <Filter size={20} />;
    case "more-vertical":
      return <MoreVertical size={20} />;
    default:
      return <FileText size={20} />;
  }
};

const SuperAdminLayout = ({ children }: { children?: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Dashboard"]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { stats, systemAlerts, recentActivities } = useSuperAdmin();

  // Default stats if undefined
  const safeStats: DashboardStats = stats || {
    totalProperties: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    totalLeases: 0,
    pendingApplications: 0,
    systemHealth: 100,
  };

  // Default system alerts if undefined
  const safeSystemAlerts: SystemAlert[] = (systemAlerts as unknown as SystemAlert[]) || [];
  const safeRecentActivities: RecentActivity[] = (recentActivities as unknown as RecentActivity[]) || [];

  // Inject Fonts and Styles
  React.useEffect(() => {
    // Use an AdminLTE-like font stack
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

  const toggleItem = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  // Generate nav items from routes with permissions
  const getNavItems = (): NavItem[] => {
    // Use default permissions for super admin
    const superAdminPermissions = [
      "manage_properties",
      "manage_users",
      "manage_approvals",
      "view_analytics",
      "manage_system_settings",
      "view_reports",
      "manage_finances",
      "manage_database",
    ];

    const navigationItems = getNavigationItems(superAdminPermissions, safeStats);

    const baseNavItems: NavItem[] = [
      {
        title: "Dashboard",
        href: "/portal/super-admin/dashboard",
        icon: <LayoutDashboard size={20} />,
        description: "",
        permission: "view_analytics",
      },
      {
        title: "My Profile",
        href: "/portal/super-admin/profile",
        icon: <Shield size={20} />,
        description: "View & Edit Your Profile",
        permission: "view_analytics",
      },
    ];

    // Add dynamic routes
    const routeNavItems = navigationItems.map((route) => ({
      title: route.title,
      href: route.path,
      icon: getIconComponent(route.icon),
      description: route.description,
      permission: route.permission,
      badge: route.path.includes("approvals")
        ? safeStats.pendingApprovals?.toString()
        : route.path.includes("applications")
        ? safeStats.pendingApplications?.toString()
        : undefined,
    }));

    // Add Reports item
    const hasReports = routeNavItems.some(item => item.title === "Reports");
    if (!hasReports) {
      routeNavItems.push({
        title: "Reports",
        href: "/portal/super-admin/reports",
        icon: <FileBarChart size={20} />,
        description: "Generate & Export Reports",
        permission: "view_reports",
        badge: undefined,
      });
    }

    // Add additional system items for super admin
    const systemItems: NavItem[] = [];

    // Add missing routes from App.tsx
    const additionalRoutes: NavItem[] = [
      {
        title: "Tenants",
        href: "/portal/super-admin/leases",
        icon: <Users size={20} />,
        description: "Manage tenants & leases",
        permission: "manage_properties",
        badge: safeStats.totalLeases?.toString(),
      },
      {
        title: "Payments",
        href: "/portal/super-admin/payments",
        icon: <DollarSign size={20} />,
        description: "Payment processing",
        permission: "manage_finances",
      },
    ];

    return [...baseNavItems, ...routeNavItems, ...additionalRoutes, ...systemItems];
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const flattenItems = (items: NavItem[]): NavItem[] => {
    let result: NavItem[] = [];
    items.forEach((item) => {
      result.push(item);
      if (item.children) result = result.concat(flattenItems(item.children));
    });
    return result;
  };

  const allItems = flattenItems(navItems);
  const currentPage =
    allItems.find((item) => isActive(item.href)) || navItems[0];
  const isDashboardHome = location.pathname === "/portal/super-admin/dashboard";
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    ((user as any)?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Admin";

  // Get unread notifications count from system alerts
  const unreadNotifications = safeSystemAlerts.filter(
    (alert) =>
      alert.type === "warning" ||
      alert.type === "error" ||
      alert.type === "critical"
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={14} className="text-amber-600" />;
      case "error":
        return <AlertCircle size={14} className="text-red-600" />;
      case "critical":
        return <AlertCircle size={14} className="text-red-600" />;
      case "success":
        return <CheckCircle size={14} className="text-emerald-600" />;
      default:
        return <Bell size={14} className="text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "critical":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-emerald-50 border-emerald-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    return user?.role === "super_admin";
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.href);
    const isExpanded = expandedItems.includes(item.title);

    // Check permission if specified
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

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

  return (
    <div className="min-h-screen bg-[#d7dce1] text-[#e8f2ff] selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <div className="fixed left-0 top-0 z-50 flex w-full items-center justify-between bg-[#343a40] px-4 py-3 shadow-lg lg:hidden">
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
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9aa4ae]">Super Admin</div>
              <div className="text-[20px] font-bold leading-none text-[#f8f9fa]">Command</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-scroll mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <div className="mb-2">
            <div className="mb-3 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#adb5bd]">
              <span>Main Menu</span>
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

      <main className={cn("min-h-screen flex flex-col bg-[#d7dce1] transition-all duration-300", sidebarOpen ? "lg:ml-80" : "lg:ml-0")}>
        <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-[#12314f] bg-[#0a1f38] px-8 shadow-sm lg:flex">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-semibold tracking-tight uppercase text-[#e8f2ff]">
                {isDashboardHome ? (
                  <>
                    Welcome Back, <span className="text-[#35d0ff]">{fullName}</span>
                  </>
                ) : (
                  currentPage.title
                )}
              </h2>
              {(currentPage.description || isDashboardHome) && (
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#8fb4d7]">
                  {isDashboardHome ? "Super Admin Command Center" : currentPage.description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative z-50">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-[#d6e9fb] transition-colors hover:text-[#35d0ff]"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#f28f1a] text-[10px] font-bold text-white shadow-sm">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-4 w-96 overflow-hidden border border-[#1f466b] bg-[#0f2b4a] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.35)]">
                    <div className="bg-[#194b79] px-4 py-3 text-sm font-semibold text-[#e8f2ff]">Notifications ({unreadNotifications})</div>
                    <div className="max-h-96 overflow-y-auto">
                      {safeSystemAlerts.length > 0 ? (
                        safeSystemAlerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            className={`cursor-pointer border-b border-[#1e476e] px-4 py-3 last:border-0 ${getAlertColor(alert.type)} transition-all hover:bg-opacity-80`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">{getNotificationIcon(alert.type)}</div>
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-[#0d243f]">{alert.title}</h3>
                                <p className="mt-1 text-xs text-[#243041]">{alert.description}</p>
                                <span className="mt-1 block text-[10px] font-medium text-[#40536b]">{alert.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-[#9dbedf]">No notifications</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative z-50">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 py-1.5 pl-1 pr-1 transition-colors hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#2ea3da] bg-[#1f7fb1] font-bold text-white">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={fullName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"
                  )}
                </div>
                <div className="hidden text-left xl:block">
                  <div className="text-xs font-semibold text-[#e8f2ff]">{fullName}</div>
                  <div className="text-[10px] font-medium text-[#9dc0df]">{user?.role || "Super Admin"}</div>
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
                    <Link to="/portal/super-admin/profile" className="block border-b border-[#1e476e] px-4 py-3 text-sm font-medium text-[#d4e4f5] transition-all hover:bg-[#194b79] hover:text-white">
                      View Profile
                    </Link>
                    <Link to="/portal/super-admin/settings" className="block border-b border-[#1e476e] px-4 py-3 text-sm font-medium text-[#d4e4f5] transition-all hover:bg-[#194b79] hover:text-white">
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

        <div className="relative z-10 flex-1 overflow-hidden bg-[#d7dce1]">
          <div className="h-full w-full overflow-y-auto custom-scroll">{children || <Outlet />}</div>
        </div>

        <footer className="hidden border-t border-[#12314f] bg-[#0a1f38] px-8 py-5 shadow-sm lg:block">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-[#9dc0df]">
              <span className="font-semibold tracking-tight text-[#e8f2ff]">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs font-semibold text-[#9dc0df]">
              <span className="text-[10px] text-[#8fb4d7]">
                {safeRecentActivities.length > 0 ? `Last activity: ${safeRecentActivities[0]?.time}` : "No recent activity"}
              </span>
              <Link to="/portal/super-admin/reports" className="flex items-center gap-1 transition-colors duration-200 hover:text-[#35d0ff]">
                <FileBarChart size={12} />
                Reports
              </Link>
              <Link to="/portal/super-admin/settings" className="transition-colors duration-200 hover:text-[#35d0ff]">
                Privacy Policy
              </Link>
              <Link to="/portal/super-admin/settings" className="transition-colors duration-200 hover:text-[#35d0ff]">
                Terms of Service
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

export default SuperAdminLayout;
