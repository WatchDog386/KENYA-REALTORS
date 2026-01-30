// src/components/layout/SuperAdminLayout.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
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
  CheckCircle,
  AlertCircle,
  UserPlus,
  Shield,
  Database,
  BarChart3,
  Home,
  Search,
  ChevronRight,
  Mail,
  Key,
  Globe,
  DollarSign,
  TrendingUp,
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import {
  SUPER_ADMIN_ROUTES,
  getNavigationItems,
} from "@/config/superAdminRoutes";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";

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

const SuperAdminLayout = () => {
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
  useEffect(() => {
    // Add Montserrat font
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
      .custom-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 0px; } /* Sharp scrollbar */
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

    const navigationItems = getNavigationItems(superAdminPermissions);

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

    // Add Reports item (if not already in routes) - FIXED PATH
    const hasReports = routeNavItems.some(item => item.title === "Reports");
    if (!hasReports) {
      routeNavItems.push({
        title: "Reports",
        href: "/portal/super-admin/reports", // Changed to lowercase
        icon: <FileBarChart size={20} />,
        description: "Generate & Export Reports",
        permission: "view_reports",
        badge: undefined,
      });
    }

    // Add additional system items for super admin
    const systemItems: NavItem[] = [
      {
        title: "System Settings",
        href: "/portal/super-admin/settings",
        icon: <Settings size={20} />,
        description: "Global Configuration",
        permission: "manage_system_settings",
        children: [
          {
            title: "General Settings",
            href: "/portal/super-admin/settings#general",
            icon: <Globe size={18} />,
            description: "Basic system configuration",
          },
          {
            title: "Security Settings",
            href: "/portal/super-admin/settings#security",
            icon: <Key size={18} />,
            description: "Authentication & security",
          },
          {
            title: "Payment Settings",
            href: "/portal/super-admin/settings#payment",
            icon: <DollarSign size={18} />,
            description: "Payment gateway configuration",
          },
          {
            title: "Email Settings",
            href: "/portal/super-admin/settings#email",
            icon: <Mail size={18} />,
            description: "Email server configuration",
          },
          {
            title: "Report Settings",
            href: "/portal/super-admin/settings#reports",
            icon: <FileBarChart size={18} />,
            description: "Report generation settings",
          },
        ],
      },
    ];

    // Add missing routes from App.tsx
    const additionalRoutes: NavItem[] = [
      {
        title: "Leases",
        href: "/portal/super-admin/leases",
        icon: <FileText size={20} />,
        description: "Manage lease agreements",
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
      {
        title: "Applications",
        href: "/portal/super-admin/applications",
        icon: <ClipboardList size={20} />,
        description: "Tenant applications",
        permission: "manage_approvals",
        badge: safeStats.pendingApplications?.toString(),
      },
      {
        title: "Refunds",
        href: "/portal/super-admin/refunds",
        icon: <DollarSign size={20} />,
        description: "Refund processing",
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
      // Implement search functionality
      console.log("Searching for:", searchQuery);
      // You can add search logic here
      // Example: navigate to search results page
      // navigate(`/portal/super-admin/search?q=${encodeURIComponent(searchQuery)}`);
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
        return <AlertTriangle size={14} className="text-yellow-600" />;
      case "error":
        return <AlertCircle size={14} className="text-red-600" />;
      case "critical":
        return <AlertCircle size={14} className="text-red-600" />;
      case "success":
        return <CheckCircle size={14} className="text-green-600" />;
      default:
        return <Bell size={14} className="text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "critical":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const hasPermission = (permission?: string): boolean => {
    // Super admin has all permissions
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
            "flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-all duration-200 group relative mb-1",
            isItemActive
              ? "bg-[#00356B] text-white shadow-lg shadow-blue-900/30"
              : "text-slate-900 hover:bg-orange-50 hover:text-orange-700",
            depth > 0 && "pl-8"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={`${
                isItemActive
                  ? "text-white"
                  : "text-slate-900 group-hover:text-orange-600"
              } relative transition-colors`}
            >
              {item.icon}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-orange-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.badge}
                </span>
              )}
              {typeof item.badge === "string" && parseInt(item.badge) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-orange-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <span
                className={cn(
                  "text-[13px] tracking-wide",
                  isItemActive
                    ? "font-black"
                    : "font-bold"
                )}
              >
                {item.title}
              </span>
              <div className={cn("text-[10px] mt-0.5 hidden xl:block transition-opacity", isItemActive ? "text-white/80 font-medium" : "text-slate-500 opacity-0 group-hover:opacity-100 font-semibold")}>
                {item.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeof item.badge === "string" && parseInt(item.badge) > 0 && (
              <span className="badge-navy hidden">
                {item.badge}
              </span>
            )}
            {hasChildren ? (
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180",
                  isItemActive ? "text-white" : "text-slate-900 group-hover:text-orange-600"
                )}
              />
            ) : (
              isItemActive && (
                <ChevronRight size={14} className="text-white/90" />
              )
            )}
          </div>
        </Link>

        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2 mb-2">
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-gradient-to-r from-navy via-blue-700 to-navy z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-2 bg-white/10 hover:bg-white/20 hover:text-cta transition-all rounded-lg border border-white/10"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white font-black tracking-tight risa-heading">
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
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cta text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-white/20">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-cta"
          >
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
          </button>
        </div>
      </div>

      {/* Sidebar - Sharp Edges */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-slate-50 text-slate-600 z-40 transition-all duration-300 ease-in-out shadow-xl flex flex-col border-r border-gray-200",
          sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
          "lg:translate-x-0 lg:w-72"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-gray-200 bg-slate-50">
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
              <g fill="#1a232e">
                <path d="M85 50 L100 56 V86 L85 80 Z" />
                <path d="M85 90 L100 96 V126 L85 120 Z" />
                <path d="M45 60 L55 54 V124 L45 130 Z" />
                <path d="M120 130 L140 122 V152 L120 160 Z" />
              </g>
            </svg>

            <div className="flex flex-col justify-center select-none ml-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-gray-500 leading-none ml-0.5 risa-uppercase">
                Kenya
              </span>
              <div className="flex items-baseline -mt-1 relative">
                <span className="text-[20px] font-black tracking-tighter text-gray-900 risa-heading">
                  REALTOR
                </span>
                <span className="text-[20px] font-black tracking-tighter text-navy risa-heading">
                  S
                </span>
                <div className="h-1.5 w-1.5 bg-cta rounded-none ml-1 mb-1.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* User Card - Removed as requested */}

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto sidebar-scroll pb-4 mt-6">
          <div className="mb-2">
            <div className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <span>Main Menu</span>
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Quick Stats - Removed as requested */}

          {/* Report Quick Links */}
          <div className="px-2 mt-6">
            <div className="px-4 mb-2 text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <span>Quick Reports</span>
            </div>
            <div className="space-y-1 mx-2">
              <Link
                to="/portal/super-admin/reports?type=rental&month=current"
                className="block p-3 bg-white rounded-lg hover:bg-orange-50 transition-all duration-200 group border-2 border-cta/20 hover:border-cta shadow-sm hover:shadow-md"
              >
                <div className="text-xs font-black text-slate-900 group-hover:text-cta transition-colors">Monthly Rental</div>
                <div className="text-[10px] text-slate-600 font-bold mt-0.5">Current month collection</div>
              </Link>
              <Link
                to="/portal/super-admin/reports?type=arrears"
                className="block p-3 bg-white rounded-lg hover:bg-orange-50 transition-all duration-200 group border-2 border-cta/20 hover:border-cta shadow-sm hover:shadow-md"
              >
                <div className="text-xs font-black text-slate-900 group-hover:text-cta transition-colors">Arrears Report</div>
                <div className="text-[10px] text-slate-600 font-bold mt-0.5">Outstanding payments</div>
              </Link>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-electric rounded-full animate-pulse ring-2 ring-electric/20"></div>
              <span className="text-[10px] text-electric font-black uppercase tracking-wider">
                System Online
              </span>
            </div>
            <span className="text-[10px] text-slate-900 font-bold">v2.4.0</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-xs text-white transition-colors py-3 bg-cta hover:bg-cta-hover rounded-lg font-black uppercase tracking-wider border-2 border-cta hover:border-cta-hover shadow-sm hover:shadow-lg"
          >
            <LogOut size={14} className="stroke-[3]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col bg-slate-50",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between h-20 px-8 bg-slate-50/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-black text-navy tracking-tight uppercase">
                {currentPage.title}
              </h2>
              <div className="text-[11px] text-gray-600 font-semibold uppercase tracking-wide">
                {currentPage.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <form onSubmit={handleSearch} className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cta transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-cta focus:shadow-sm w-72 outline-none placeholder:text-gray-400 transition-all duration-200 risa-body font-medium"
              />
            </form>

            {/* Notifications */}
            <div className="relative z-50">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 text-gray-500 hover:text-[#0056A6] hover:bg-white bg-white/50 border border-transparent hover:border-blue-100 hover:shadow-sm rounded-lg transition-all"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-cta text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
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
                  <div className="absolute right-0 top-full mt-4 w-96 bg-white rounded-xl shadow-[0_15px_50px_-10px_rgba(0,0,0,0.2)] border border-gray-150 z-50 overflow-hidden ring-1 ring-black/5">
                    <div className="p-5 border-b border-gray-150 bg-gradient-subtle">
                      <h3 className="font-black text-navy risa-heading">
                        System Alerts
                      </h3>
                      <div className="text-xs text-cta font-bold uppercase mt-1.5 risa-uppercase tracking-wider">
                        {safeSystemAlerts.filter((a) => a.type !== "success").length} alerts
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scroll">
                      {safeSystemAlerts.length > 0 ? (
                        safeSystemAlerts.map((alert, index) => (
                          <div
                            key={alert.id || index}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${getAlertColor(
                              alert.type
                            )} hover:shadow-sm`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white border border-gray-100 shadow-sm rounded-none shrink-0">
                                {getNotificationIcon(alert.type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-[#1a232e] risa-subheading">
                                  {alert.title}
                                </h4>
                                <div className="text-xs text-gray-600 my-1 risa-body">
                                  {alert.description}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-gray-500 risa-mono">
                                    {alert.timestamp}
                                  </span>
                                  {alert.action && (
                                    <Link
                                      to={alert.action}
                                      className="text-[10px] text-[#0056A6] font-bold hover:underline risa-uppercase"
                                      onClick={() => setNotificationsOpen(false)}
                                    >
                                      Take Action →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                          <p className="text-gray-500">No active alerts</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All systems are operating normally
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-150 bg-gradient-to-r from-gray-50 to-gray-100">
                      <Link
                        to="/portal/super-admin/analytics"
                        className="text-xs text-cta font-bold hover:underline flex items-center gap-2 risa-uppercase tracking-wider group"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <TrendingUp size={12} className="group-hover:text-orange-600 transition-colors" />
                        View All Analytics →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative z-50">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 pl-1 pr-3 py-1.5 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white font-bold border-2 border-cta">
                  {user?.first_name?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    "A"}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-[#1a232e] risa-heading">
                    {user?.first_name || "Super"} {user?.last_name || "Admin"}
                  </div>
                  <div className="text-[10px] text-cta font-bold uppercase risa-uppercase">
                    Super Admin
                  </div>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden ring-1 ring-black/5">
                    <div className="p-5 border-b border-gray-100 bg-gradient-hero text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center font-black text-lg border-2 border-cta">
                          {user?.first_name?.[0] || "A"}
                        </div>
                        <div>
                          <div className="font-bold text-sm risa-heading">
                            {user?.first_name || "Super"}{" "}
                            {user?.last_name || "Admin"}
                          </div>
                          <div className="text-[10px] text-blue-200 opacity-80 risa-mono">
                            {user?.email || "superadmin@kenyarealtors.com"}
                          </div>
                          <div className="text-[9px] text-cta font-bold mt-1 risa-uppercase">
                            Super Administrator
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/portal/super-admin/profile"
                        className="flex items-center gap-3 p-3 hover:bg-navy/5 rounded-none w-full text-gray-600 hover:text-navy transition-colors border-l-2 border-transparent hover:border-cta"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield size={16} />
                        <span className="text-sm font-semibold risa-subheading">
                          My Profile
                        </span>
                      </Link>
                      <Link
                        to="/portal/super-admin/users"
                        className="flex items-center gap-3 p-3 hover:bg-navy/5 rounded-none w-full text-gray-600 hover:text-navy transition-colors border-l-2 border-transparent hover:border-cta"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Users size={16} />
                        <span className="text-sm font-semibold risa-subheading">
                          Manage Users
                        </span>
                      </Link>
                      <Link
                        to="/portal/super-admin/reports"
                        className="flex items-center gap-3 p-3 hover:bg-navy/5 rounded-none w-full text-gray-600 hover:text-navy transition-colors border-l-2 border-transparent hover:border-cta"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FileBarChart size={16} />
                        <span className="text-sm font-semibold risa-subheading">
                          Generate Reports
                        </span>
                      </Link>
                      <Link
                        to="/portal/super-admin/settings"
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-none w-full text-gray-600 hover:text-[#0056A6] transition-colors border-l-2 border-transparent hover:border-[#F96302]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings size={16} />
                        <span className="text-sm font-semibold risa-subheading">
                          System Settings
                        </span>
                      </Link>
                      <Link
                        to="/portal"
                        className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-none w-full text-gray-600 hover:text-[#0056A6] transition-colors border-l-2 border-transparent hover:border-[#F96302]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Home size={16} />
                        <span className="text-sm font-semibold risa-subheading">
                          Main Portal
                        </span>
                      </Link>
                      <div className="h-px bg-gray-100 my-2 mx-3"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-none text-red-600 transition-colors border-l-2 border-transparent hover:border-red-500"
                      >
                        <LogOut size={16} />
                        <span className="text-sm font-bold risa-subheading">
                          Sign Out
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area - CLEAN BACKGROUND */}
        <div className="flex-1 overflow-visible bg-slate-50 relative z-10">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto overflow-y-auto custom-scroll max-h-[calc(100vh-120px)]">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-gray-200 bg-slate-50 hidden lg:block shadow-sm">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-600 font-medium">
              <span className="font-black text-navy tracking-tight">KENYA REALTORS</span> © {new Date().getFullYear()}. All rights reserved.
            </div>
            <div className="flex gap-6 text-xs text-gray-600 font-semibold">
              <span className="text-[10px] text-gray-500">
                {safeRecentActivities.length > 0
                  ? `Last activity: ${safeRecentActivities[0]?.time}`
                  : "No recent activity"}
              </span>
              <Link
                to="/portal/super-admin/reports"
                className="hover:text-[#D85C2C] transition-colors duration-200 flex items-center gap-1 hover:font-bold"
              >
                <FileBarChart size={12} />
                Reports
              </Link>
              <Link
                to="/portal/super-admin/settings"
                className="hover:text-[#D85C2C] transition-colors duration-200 hover:font-bold"
              >
                Privacy Policy
              </Link>
              <Link
                to="/portal/super-admin/settings"
                className="hover:text-[#D85C2C] transition-colors duration-200 hover:font-bold"
              >
                Terms of Service
              </Link>
              <Link
                to="/portal/help"
                className="hover:text-[#D85C2C] transition-colors duration-200 hover:font-bold"
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
          className="lg:hidden fixed inset-0 bg-[#00356B]/80 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;