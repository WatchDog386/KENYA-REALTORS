// src/pages/portal/TenantDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Home,
  FileText,
  Bell,
  Calendar,
  Wrench,
  User,
  CreditCard,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  MessageSquare,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Interfaces matching your database schema
interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: "pending" | "completed" | "overdue" | "failed";
  payment_method: string;
  description?: string;
  created_at: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  images?: string[];
  estimated_completion?: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  unit_number?: string;
  floor?: string;
  building_number?: string;
}

interface Lease {
  id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  security_deposit: number;
  status: "active" | "expired" | "terminated" | "pending";
  terms: string;
  created_at: string;
}

interface TenantInfo {
  id: string;
  user_id: string;
  property_id: string;
  lease_id: string;
  move_in_date: string;
  emergency_contact?: string;
  emergency_phone?: string;
  property?: Property;
  lease?: Lease;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "general" | "maintenance" | "event" | "urgent";
  published_at: string;
  expires_at?: string;
  created_by: string;
}

const TenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Inject Montserrat font
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.innerHTML = `
      body { font-family: 'Montserrat', sans-serif; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  const [leaseData, setLeaseData] = useState<Lease | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingDueDates, setUpcomingDueDates] = useState<any[]>([]);

  const [stats, setStats] = useState({
    currentBalance: 0,
    totalPaid: 0,
    leaseMonthsLeft: 0,
    activeRequests: 0,
    completedRequests: 0,
    unreadMessages: 0,
    upcomingEvents: 0,
  });

  // Calculate lease months remaining
  const calculateLeaseMonthsLeft = (endDate: string): number => {
    const today = new Date();
    const leaseEnd = new Date(endDate);
    const timeDiff = leaseEnd.getTime() - today.getTime();
    const monthsLeft = Math.max(
      0,
      Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30))
    );
    return monthsLeft;
  };

  // Calculate current balance (sum of overdue payments + upcoming due)
  const calculateCurrentBalance = (payments: Payment[]): number => {
    const overduePayments = payments.filter(
      (p) => p.status === "overdue" || p.status === "pending"
    );
    return overduePayments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
  };

  // Fetch user profile with full name and avatar
  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("Could not fetch user profile:", error?.message);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  // Fetch tenant info - links user to property/unit (critical for all other queries)
  const fetchTenantInfo = async (): Promise<boolean> => {
    try {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("tenants")
        .select(`
          id,
          user_id,
          property_id,
          unit_id,
          status,
          move_in_date
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (error || !data) {
        console.warn("Tenant record not found:", error?.message);
        return false;
      }

      setTenantInfo(data as any);

      // Fetch property details
      if (data.property_id) {
        const { data: propertyData } = await supabase
          .from("properties")
          .select("id, name, location, address, city, status")
          .eq("id", data.property_id)
          .single();

        if (propertyData) {
          setPropertyData({
            id: propertyData.id,
            name: propertyData.name,
            address: propertyData.location || propertyData.address,
            city: propertyData.city,
            state: "",
            zip_code: "",
          } as Property);
        }
      }

      // Fetch unit details if unit_id exists
      if (data.unit_id) {
        const { data: unitData } = await supabase
          .from("property_unit_types")
          .select("id, name")
          .eq("id", data.unit_id)
          .single();

        if (unitData) {
          setPropertyData((prev) => ({
            ...prev,
            unit_number: unitData.name,
          } as Property));
        }
      }

      return true;
    } catch (err) {
      console.error("Error fetching tenant info:", err);
      return false;
    }
  };

  const fetchDashboardData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile for full name and avatar
      await fetchUserProfile();

      // CRITICAL: Fetch tenant info first - all other queries depend on this
      const hasTenantInfo = await fetchTenantInfo();
      
      if (!hasTenantInfo) {
        setError("Tenant information not found. Please contact support.");
        return;
      }

      // Now fetch other data with proper scoping
      try {
        await fetchPayments();
      } catch (err) {
        console.warn("Could not fetch payments:", err);
      }

      try {
        await fetchMaintenanceRequests();
      } catch (err) {
        console.warn("Could not fetch maintenance requests:", err);
      }

      try {
        await fetchUpcomingDueDates();
      } catch (err) {
        console.warn("Could not fetch upcoming due dates:", err);
      }

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyAndLeaseSeparately = async () => {
    // Stub function - tenant_properties table doesn't exist
    console.warn(
      "Property and lease data not available - table does not exist"
    );
  };

  const fetchPayments = async () => {
    try {
      // Query rent_payments table
      const { data: payments, error: paymentsError } = await supabase
        .from("rent_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (paymentsError) throw paymentsError;

      if (payments) {
        setRecentPayments(payments);

        // Calculate stats
        const currentBalance = calculateCurrentBalance(payments);
        const totalPaid = payments
          .filter((p) => p.status === "completed")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        setStats((prev) => ({
          ...prev,
          currentBalance,
          totalPaid,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch payments:", err);
    }
  };

  const fetchMaintenanceRequests = async () => {
    try {
      // First get tenant info to scope to property
      if (!tenantInfo) return;
      
      const { data: requests, error: requestsError } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("property_id", tenantInfo.property_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (requestsError) throw requestsError;

      if (requests) {
        setMaintenanceRequests(requests);
        const activeRequests = requests.filter(
          (req) => req.status === "in_progress" || req.status === "assigned"
        ).length;
        const completedRequests = requests.filter(
          (req) => req.status === "completed"
        ).length;

        setStats((prev) => ({
          ...prev,
          activeRequests,
          completedRequests,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch maintenance requests:", err);
    }
  };

  const fetchAnnouncements = async () => {
    // Stub function - announcements table doesn't exist
    console.warn("Announcements not available - table does not exist");
  };

  const fetchUpcomingDueDates = async () => {
    try {
      if (!tenantInfo) return;
      
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      // Query rent_payments for pending/overdue
      const { data: upcoming, error: upcomingError } = await supabase
        .from("rent_payments")
        .select("*")
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (upcomingError) throw upcomingError;

      if (upcoming) {
        setUpcomingDueDates(upcoming);
        setStats((prev) => ({ ...prev, upcomingEvents: upcoming.length }));
      }
    } catch (err) {
      console.warn("Could not fetch upcoming due dates:", err);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    // Subscribe to payment updates
    const paymentChannel = supabase
      .channel("payments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rent_payments",
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    // Subscribe to maintenance request updates
    const maintenanceChannel = supabase
      .channel("maintenance-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "maintenance_requests",
        },
        () => {
          fetchMaintenanceRequests();
        }
      )
      .subscribe();

    // Subscribe to announcement updates
    const announcementChannel = supabase
      .channel("announcement-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(announcementChannel);
    };
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const cleanup = setupRealtimeSubscriptions();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);

    return () => {
      cleanup?.();
      clearInterval(interval);
    };
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "failed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Enhanced stats data with real calculations
  const statsData = [
    {
      title: "Current Balance",
      value: formatCurrency(stats.currentBalance),
      change: stats.currentBalance > 0 ? -1 : 0,
      changeLabel: stats.currentBalance > 0 ? "Overdue" : "Paid",
      icon: <DollarSign size={24} className="text-white" />,
      color:
        stats.currentBalance > 0
          ? "bg-gradient-to-br from-red-500 to-pink-600"
          : "bg-gradient-to-br from-green-500 to-emerald-600",
      gradient:
        stats.currentBalance > 0
          ? "from-red-500/20 to-pink-600/20"
          : "from-green-500/20 to-emerald-600/20",
      description:
        stats.currentBalance > 0 ? "Payment overdue" : "All payments current",
      action: () => navigate("/portal/tenant/payments"),
      trendIcon:
        stats.currentBalance > 0 ? (
          <TrendingDown size={16} className="text-red-500" />
        ) : (
          <CheckCircle size={16} className="text-green-500" />
        ),
    },
    {
      title: "Lease Duration",
      value: `${stats.leaseMonthsLeft} ${
        stats.leaseMonthsLeft === 1 ? "Month" : "Months"
      }`,
      change: 0,
      changeLabel: stats.leaseMonthsLeft > 6 ? "Secure" : "Renew Soon",
      icon: <Calendar size={24} className="text-white" />,
      color:
        stats.leaseMonthsLeft > 6
          ? "bg-gradient-to-br from-blue-500 to-cyan-600"
          : "bg-gradient-to-br from-amber-500 to-orange-600",
      gradient:
        stats.leaseMonthsLeft > 6
          ? "from-blue-500/20 to-cyan-600/20"
          : "from-amber-500/20 to-orange-600/20",
      description: leaseData?.end_date
        ? `Ends ${new Date(leaseData.end_date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}`
        : "Lease information",
      action: () => navigate("/portal/tenant/documents"),
      trendIcon: <Shield size={16} className="text-blue-500" />,
    },
    {
      title: "Active Requests",
      value: `${stats.activeRequests} Active`,
      change: stats.activeRequests,
      changeLabel: stats.activeRequests > 0 ? "In Progress" : "All Clear",
      icon: <Bell size={24} className="text-white" />,
      color:
        stats.activeRequests > 0
          ? "bg-gradient-to-br from-orange-500 to-amber-600"
          : "bg-gradient-to-br from-green-500 to-emerald-600",
      gradient:
        stats.activeRequests > 0
          ? "from-orange-500/20 to-amber-600/20"
          : "from-green-500/20 to-emerald-600/20",
      description: `${stats.completedRequests} completed this year`,
      action: () => navigate("/portal/tenant/maintenance"),
      trendIcon:
        stats.activeRequests > 0 ? (
          <Clock size={16} className="text-orange-500" />
        ) : (
          <CheckCircle size={16} className="text-green-500" />
        ),
    },
    {
      title: "Messages",
      value: stats.unreadMessages.toString(),
      change: 0,
      changeLabel: stats.unreadMessages > 0 ? "Unread" : "All Read",
      icon: <MessageSquare size={24} className="text-white" />,
      color:
        stats.unreadMessages > 0
          ? "bg-gradient-to-br from-purple-500 to-violet-600"
          : "bg-gradient-to-br from-gray-500 to-slate-600",
      gradient:
        stats.unreadMessages > 0
          ? "from-purple-500/20 to-violet-600/20"
          : "from-gray-500/20 to-slate-600/20",
      description: "From property management",
      action: () => navigate("/portal/tenant/messages"),
      trendIcon: <Bell size={16} className="text-purple-500" />,
    },
  ];

  const handleMakePayment = () => {
    navigate("/portal/tenant/payments/make");
  };

  const handleNewRequest = () => {
    navigate("/portal/tenant/maintenance/new");
  };

  const quickActions = [
    {
      title: "Pay Rent",
      icon: <CreditCard size={24} />,
      path: "/portal/tenant/payments",
      color: "bg-gradient-to-r from-green-500/20 to-emerald-600/20",
      textColor: "text-green-700",
      gradient: "from-green-500 to-emerald-600",
      description: "Secure online payment",
    },
    {
      title: "Request Repair",
      icon: <Wrench size={24} />,
      path: "/portal/tenant/maintenance/new",
      color: "bg-gradient-to-r from-orange-500/20 to-amber-600/20",
      textColor: "text-orange-700",
      gradient: "from-orange-500 to-amber-600",
      description: "Report maintenance issues",
    },
    {
      title: "View Documents",
      icon: <FileText size={24} />,
      path: "/portal/tenant/documents",
      color: "bg-gradient-to-r from-purple-500/20 to-violet-600/20",
      textColor: "text-purple-700",
      gradient: "from-purple-500 to-violet-600",
      description: "Lease & receipts",
    },
    {
      title: "Update Profile",
      icon: <User size={24} />,
      path: "/portal/tenant/profile",
      color: "bg-gradient-to-r from-blue-500/20 to-cyan-600/20",
      textColor: "text-blue-700",
      gradient: "from-blue-500 to-cyan-600",
      description: "Personal information",
    },
  ];

  const upcomingEvents = [
    {
      title: "Rent Due Date",
      date: "February 1, 2024",
      daysLeft: 15,
      color: "blue",
      icon: "📅",
    },
    {
      title: "Lease Renewal",
      date: leaseData?.end_date
        ? new Date(leaseData.end_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "August 31, 2024",
      monthsLeft: stats.leaseMonthsLeft,
      color: "yellow",
      icon: "📝",
    },
    {
      title: "Building Inspection",
      date: "March 15, 2024",
      daysLeft: 45,
      color: "purple",
      icon: "🔍",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#00356B]" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center gap-2 px-6 py-3 bg-[#D85C2C] text-white text-[10px] font-black uppercase tracking-[1.5px] rounded-md hover:bg-[#b84520] transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Loading
                </button>
                <button
                  onClick={() => navigate("/portal/tenant/support")}
                  className="px-6 py-3 bg-white border border-[#00356B] text-[#00356B] text-[10px] font-black uppercase tracking-[1.5px] rounded-md hover:bg-[#00356B] hover:text-white transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fullName = userProfile
    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Tenant";

  return (
    <div className="space-y-8">
      {/* Welcome Banner with announcements */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-light text-[#00356B] tracking-tight mb-2">
              Welcome back, <span className="font-bold">{fullName}</span>
            </h1>
            <p className="text-gray-600 font-medium">
              Here's your rental overview and recent activity. Everything you
              need in one place.
            </p>
          </div>
          {announcements.length > 0 && (
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00356B]/10 to-[#D85C2C]/10 rounded-md border border-[#00356B]/20">
                <Bell className="w-4 h-4 text-[#D85C2C]" />
                <span className="text-[12px] text-[#00356B] font-black uppercase tracking-tight">
                  {announcements.length} new announcement
                  {announcements.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mt-4 space-y-2">
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      {announcement.title}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Posted {formatDate(announcement.published_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            onClick={stat.action}
            className="cursor-pointer h-full"
          >
            <Card className="hover:shadow-lg transition-shadow hover:border-[#00356B]/30 h-full border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-full ${stat.color} shadow-sm group-hover:scale-105 transition-transform duration-300`}
                >
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate text-[#00356B]">
                  {stat.value}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {stat.trendIcon}
                  <span
                    className={`text-xs font-medium ${
                      stat.changeLabel.includes("Overdue")
                        ? "text-red-600"
                        : stat.changeLabel.includes("Renew")
                        ? "text-amber-600"
                        : stat.changeLabel.includes("In Progress")
                        ? "text-orange-600"
                        : stat.changeLabel.includes("Unread")
                        ? "text-purple-600"
                        : "text-green-600"
                    }`}
                  >
                    {stat.changeLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Recent Payments
              </h3>
              <p className="text-sm text-gray-600">
                Your payment history and status
              </p>
            </div>
            <button
              onClick={() => navigate("/portal/tenant/payments")}
              className="text-[#00356B] hover:text-[#002a54] font-semibold text-sm flex items-center gap-1 group"
            >
              View All
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payment history found</p>
              <button
                onClick={handleMakePayment}
                className="mt-4 text-[#00356B] hover:text-[#002a54] font-medium"
              >
                Make your first payment →
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {recentPayments.slice(0, 3).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:from-[#00356B]/5 hover:to-white transition-all duration-300 group border border-gray-100 hover:border-[#00356B]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          payment.status === "completed"
                            ? "bg-green-100"
                            : payment.status === "pending"
                            ? "bg-yellow-100"
                            : payment.status === "overdue"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <CreditCard
                          size={20}
                          className={
                            payment.status === "completed"
                              ? "text-green-600"
                              : payment.status === "pending"
                              ? "text-yellow-600"
                              : payment.status === "overdue"
                              ? "text-red-600"
                              : "text-gray-600"
                          }
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-[#00356B]">
                          {payment.description || "Monthly Rent"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.payment_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-lg">
                        {formatCurrency(payment.amount)}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${getPaymentStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Payments */}
              {upcomingDueDates.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Upcoming Payments
                  </h4>
                  <div className="space-y-2">
                    {upcomingDueDates.slice(0, 2).map((due) => (
                      <div
                        key={due.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-blue-800">
                            Next Payment
                          </p>
                          <p className="text-sm text-blue-600">
                            Due {formatDate(due.due_date)}
                          </p>
                        </div>
                        <span className="font-bold text-blue-800">
                          {formatCurrency(due.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleMakePayment}
                className="w-full mt-6 bg-[#00356B] text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:bg-[#002a54] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Make Payment
              </button>
            </>
          )}
        </div>

        {/* Maintenance Requests */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Maintenance Requests
              </h3>
              <p className="text-sm text-gray-600">
                Track your repair requests and status
              </p>
            </div>
            <button
              onClick={() => navigate("/portal/tenant/maintenance")}
              className="text-[#00356B] hover:text-[#002a54] font-semibold text-sm flex items-center gap-1 group"
            >
              View All
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>

          {maintenanceRequests.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No maintenance requests</p>
              <p className="text-sm text-gray-400 mt-1">
                Report any issues with your property
              </p>
              <button
                onClick={handleNewRequest}
                className="mt-4 text-[#00356B] hover:text-[#002a54] font-medium"
              >
                Submit a request →
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {maintenanceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl hover:shadow-md transition-all duration-300 group border border-gray-200 hover:border-[#00356B]/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            request.priority === "urgent"
                              ? "bg-red-100"
                              : request.priority === "high"
                              ? "bg-orange-100"
                              : request.priority === "medium"
                              ? "bg-yellow-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <Wrench
                            size={20}
                            className={
                              request.priority === "urgent"
                                ? "text-red-600"
                                : request.priority === "high"
                                ? "text-orange-600"
                                : request.priority === "medium"
                                ? "text-yellow-600"
                                : "text-blue-600"
                            }
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#00356B]">
                            {request.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status
                            .replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                            request.status.replace("_", " ").slice(1)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                            request.priority
                          )}`}
                        >
                          {request.priority} Priority
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">
                        Submitted {formatDate(request.created_at)}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            navigate(`/portal/tenant/maintenance/${request.id}`)
                          }
                          className="text-sm text-[#00356B] hover:text-[#002a54] font-semibold"
                        >
                          View Details
                        </button>
                        {request.status === "in_progress" &&
                          request.estimated_completion && (
                            <span className="text-sm text-gray-500">
                              Est: {formatDate(request.estimated_completion)}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleNewRequest}
                className="w-full mt-6 border-2 border-[#D85C2C] text-[#D85C2C] py-3.5 px-4 rounded-md font-black uppercase tracking-[1.5px] text-[11px] hover:bg-[#D85C2C]/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <AlertCircle size={20} />
                New Maintenance Request
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#00356B]/5 via-[#D85C2C]/5 to-[#00356B]/5 rounded-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-light text-[#00356B] mb-2 tracking-tight">
            Quick <span className="font-bold">Actions</span>
          </h3>
          <p className="text-gray-600 text-[13px] font-medium">
            Everything you need, right at your fingertips
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              className={`${action.color} ${action.textColor} p-6 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left group border border-transparent hover:border-white/50`}
            >
              <div className="flex flex-col items-start">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${action.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {action.icon}
                </div>
                <p className="font-bold text-lg mb-2">{action.title}</p>
                <p className="text-sm opacity-80">{action.description}</p>
                <div className="mt-4 text-xs font-medium text-gray-500 flex items-center gap-1">
                  Click to access
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Upcoming Events
              </h3>
              <p className="text-sm text-gray-600">
                Important dates and reminders
              </p>
            </div>
            <Calendar className="h-6 w-6 text-[#00356B]" />
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl ${
                  event.color === "blue"
                    ? "bg-blue-50"
                    : event.color === "yellow"
                    ? "bg-yellow-50"
                    : "bg-purple-50"
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{event.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-600">{event.date}</p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 text-sm rounded-full font-semibold ${
                      event.color === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : event.color === "yellow"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {event.daysLeft
                      ? `${event.daysLeft} days left`
                      : `${event.monthsLeft} months left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Status */}
        <div className="bg-gradient-to-br from-[#00356B] to-[#002a54] rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Property Status</h3>
              <p className="text-sm opacity-90">Your current rental</p>
            </div>
            <Home className="h-6 w-6" />
          </div>
          <div className="space-y-4">
            {propertyData ? (
              <>
                {propertyData.unit_number && (
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                    <div>
                      <p className="text-sm opacity-90">Unit Number</p>
                      <p className="font-bold text-lg">
                        {propertyData.unit_number}
                      </p>
                    </div>
                    {propertyData.floor && (
                      <div className="text-right">
                        <p className="text-sm opacity-90">Floor</p>
                        <p className="font-bold text-lg">
                          {propertyData.floor}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 bg-white/10 rounded-xl">
                  <p className="text-sm opacity-90 mb-1">Building</p>
                  <p className="font-bold text-lg">
                    {propertyData.name || "Sunset Villa Apartments"}
                  </p>
                  <p className="text-sm opacity-80 mt-2">
                    {propertyData.address || "1234 Sunset Blvd, Los Angeles"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <div>
                    <p className="text-sm opacity-90">Unit Number</p>
                    <p className="font-bold text-lg">Unit 204</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Floor</p>
                    <p className="font-bold text-lg">2nd</p>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <p className="text-sm opacity-90 mb-1">Building</p>
                  <p className="font-bold text-lg">Sunset Villa Apartments</p>
                  <p className="text-sm opacity-80 mt-2">
                    1234 Sunset Blvd, Los Angeles
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                All systems operational
              </span>
            </div>
            <button
              onClick={() => navigate("/portal/tenant/property")}
              className="w-full mt-4 bg-white text-[#00356B] py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              View Property Details
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Need help? Contact property management at{" "}
          <a
            href="mailto:support@aydenhomes.com"
            className="text-[#00356B] hover:text-[#002a54] font-medium"
          >
            support@aydenhomes.com
          </a>{" "}
          or call{" "}
          <a
            href="tel:+1234567890"
            className="text-[#00356B] hover:text-[#002a54] font-medium"
          >
            (123) 456-7890
          </a>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Available 24/7 for emergencies
        </p>
      </div>
    </div>
  );
};

export default TenantDashboard;
