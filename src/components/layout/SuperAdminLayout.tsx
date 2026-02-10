// src/components/layout/SuperAdminLayout.tsx
import React, { useState, ReactNode } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
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
  const [searchQuery, setSearchQuery] = useState("");
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
        description: "System Overview & Metrics",
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery);
    }
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
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.badge}
                </span>
              )}
              {typeof item.badge === "string" && parseInt(item.badge) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.badge}
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
            {hasChildren ? (
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180",
                  isItemActive ? "text-white" : "text-slate-500 group-hover:text-[#154279]"
                )}
              />
            ) : (
              isItemActive && (
                <ChevronRight size={14} className="text-[#F96302]" />
              )
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
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F96302] text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-lg bg-[#F96302] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white"
          >
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
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
              <span>Main Menu</span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Report Quick Links */}
          <div className="px-2 mt-8">
            <div className="px-4 mb-3 text-[10px] font-bold text-[#154279] uppercase tracking-widest flex items-center gap-2">
              <span>Quick Reports</span>
            </div>
            <div className="space-y-2 mx-2">
              <Link
                to="/portal/super-admin/reports?type=rental&month=current"
                className="block p-3 bg-slate-50 rounded-xl hover:bg-[#154279] hover:text-white transition-all duration-200 group border border-slate-200 hover:border-[#154279] shadow-sm hover:shadow-md"
              >
                <div className="text-xs font-bold text-[#154279] group-hover:text-white transition-colors">Monthly Rental</div>
                <div className="text-[10px] text-slate-600 group-hover:text-white/80 font-medium mt-0.5">Current month collection</div>
              </Link>
              <Link
                to="/portal/super-admin/reports?type=arrears"
                className="block p-3 bg-slate-50 rounded-xl hover:bg-[#F96302] hover:text-white transition-all duration-200 group border border-slate-200 hover:border-[#F96302] shadow-sm hover:shadow-md"
              >
                <div className="text-xs font-bold text-[#154279] group-hover:text-white transition-colors">Arrears Report</div>
                <div className="text-[10px] text-slate-600 group-hover:text-white/80 font-medium mt-0.5">Outstanding payments</div>
              </Link>
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
            <form onSubmit={handleSearch} className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F96302] transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#F96302] focus:shadow-sm w-72 outline-none placeholder:text-slate-400 transition-all duration-200 font-medium font-nunito"
              />
            </form>

            {/* Notifications */}
            <div className="relative z-50">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 text-slate-600 hover:text-[#154279] hover:bg-slate-100 bg-white border-2 border-slate-200 hover:border-[#F96302] hover:shadow-sm rounded-lg transition-all"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#F96302] text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.2)] border-2 border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-[#154279] text-white font-bold text-sm">
                      Notifications ({unreadNotifications})
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {safeSystemAlerts.length > 0 ? (
                        safeSystemAlerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            className={`px-4 py-3 border-b border-slate-100 last:border-0 ${getAlertColor(alert.type)} cursor-pointer hover:bg-opacity-80 transition-all`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(alert.type)}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-[#154279]">{alert.title}</h3>
                                <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
                                <span className="text-[10px] text-slate-500 font-medium mt-1 block">{alert.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-500 text-sm">
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
                className="flex items-center gap-3 pl-1 pr-3 py-1.5 hover:bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-[#F96302] hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-[#154279] flex items-center justify-center text-white font-bold border-2 border-[#F96302]">
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-[#154279]">
                    {user?.first_name || user?.email?.split("@")[0] || "Admin"}
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium">
                    {user?.role || "Super Admin"}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.2)] border-2 border-slate-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account</p>
                    </div>
                    <Link
                      to="/portal/super-admin/profile"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#154279] transition-all font-medium border-b border-slate-100"
                    >
                      View Profile
                    </Link>
                    <Link
                      to="/portal/super-admin/settings"
                      className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#154279] transition-all font-medium border-b border-slate-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-white bg-[#F96302] hover:bg-[#ff8c42] transition-all font-bold"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - WHITE BACKGROUND */}
        <div className="flex-1 overflow-visible bg-white relative z-10">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto overflow-y-auto custom-scroll max-h-[calc(100vh-120px)]">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 border-t-2 border-slate-200 bg-white hidden lg:block shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-700 font-medium font-nunito">
              <span className="font-bold text-[#154279] tracking-tight">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs text-slate-600 font-semibold font-nunito">
              <span className="text-[10px] text-slate-500">
                {safeRecentActivities.length > 0
                  ? `Last activity: ${safeRecentActivities[0]?.time}`
                  : "No recent activity"}
              </span>
              <Link
                to="/portal/super-admin/reports"
                className="hover:text-[#F96302] transition-colors duration-200 flex items-center gap-1 hover:font-bold"
              >
                <FileBarChart size={12} />
                Reports
              </Link>
              <Link
                to="/portal/super-admin/settings"
                className="hover:text-[#F96302] transition-colors duration-200 hover:font-bold"
              >
                Privacy Policy
              </Link>
              <Link
                to="/portal/super-admin/settings"
                className="hover:text-[#F96302] transition-colors duration-200 hover:font-bold"
              >
                Terms of Service
              </Link>
              <Link
                to="/portal/help"
                className="hover:text-[#F96302] transition-colors duration-200 hover:font-bold"
              >
                Help Center
              </Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;
