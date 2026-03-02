// src/pages/portal/TenantDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
  MapPin,
  Info,
  Plus,
  Activity,
  Zap,
  Filter,
  Download,
  LayoutGrid,
  ChevronRight,
  Search,
  ChevronDown,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  Droplets,
  Trash2
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [utilitySettings, setUtilitySettings] = useState<any>(null);
  const [utilityBills, setUtilityBills] = useState<any[]>([]);
  const [currentMonthUtility, setCurrentMonthUtility] = useState<any>(null);

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

      console.log("🔍 Fetching tenant info for user:", user.id);
      
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
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("❌ Error fetching tenant record:", error.message);
        // Don't return false yet, try fallback
      }
      
      let tenantData: any = data;

      // Fallback: Check tenant_leases if no direct tenant record
      if (!tenantData) {
        console.warn("⚠️ No active tenant record found. Checking active leases...");
        const { data: leaseData, error: leaseError } = await supabase
          .from("tenant_leases")
          .select("id, unit_id, start_date")
          .eq("tenant_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (leaseData) {
           console.log("✅ Found active lease! Fetching unit details...", leaseData);
           
           // Fetch property_id from unit
           const { data: unitData } = await supabase
             .from("units")
             .select("property_id")
             .eq("id", leaseData.unit_id)
             .maybeSingle();

           tenantData = {
               id: "lease-derived-" + leaseData.id,
               user_id: user.id,
               property_id: unitData?.property_id,
               unit_id: leaseData.unit_id,
               status: "active",
               move_in_date: leaseData.start_date
           };
        }
      }

      if (!tenantData) {
        console.warn("❌ No tenant record OR active lease found.");
        return false;
      }

      console.log("✅ Tenant info loaded:", tenantData);
      setTenantInfo(tenantData);

      // Fetch property details
      if (tenantData.property_id) {
        const { data: propertyData } = await supabase
          .from("properties")
          .select("id, name, location, status")
          .eq("id", tenantData.property_id)
          .single();

        if (propertyData) {
          console.log("✅ Property data loaded:", propertyData);
          setPropertyData({
            id: propertyData.id,
            name: propertyData.name,
            address: propertyData.location,
            city: "", // City is not a separate column in DB schema
            state: "",
            zip_code: "",
          } as Property);
        }
      }

      // Fetch unit details if unit_id exists
      if (tenantData.unit_id) {
        const { data: unitData } = await supabase
          .from("units")
          .select("id, unit_number")
          .eq("id", tenantData.unit_id)
          .single();

        // If not in units table (fallback to property_unit_types query for legacy reasons or different schema)
        if (unitData) {
             setPropertyData((prev) => ({
                ...prev,
                unit_number: unitData.unit_number,
              } as Property));
        } else {
             // Try fetching from property_unit_types as per original code logic if needed
            const { data: typeData } = await supabase
              .from("property_unit_types")
              .select("id, name")
              .eq("id", tenantData.unit_id) // This assumes tenantData.unit_id matches unit_types ID, which was odd in original code. 
                                            // The original code queried 'property_unit_types' with 'unit_id'. 
                                            // Ideally 'unit_id' references 'units' table. I'll stick to 'units' table query above which is more correct.
              .maybeSingle();
            
            if (typeData) {
               setPropertyData((prev) => ({
                ...prev,
                unit_number: typeData.name,
              } as Property));
            }
        }
      }

      return true;
    } catch (err) {
      console.error("❌ Error fetching tenant info:", err);
      return false;
    }
  };

  const fetchLeaseData = async () => {
    try {
      if (!user?.id) return;
      
      // Fetch active lease for current tenant
      const { data: lease, error: leaseError } = await supabase
        .from("tenant_leases")
        .select("*, units!inner(property_id)")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (leaseError) throw leaseError;

      if (lease) {
        setLeaseData({
          id: lease.id,
          start_date: lease.start_date,
          end_date: lease.end_date,
          monthly_rent: lease.monthly_rent || 0,
          security_deposit: lease.security_deposit || 0,
          status: lease.status,
          terms: lease.terms || "",
          created_at: lease.created_at,
        });

        // Calculate months remaining
        const leaseMonthsLeft = calculateLeaseMonthsLeft(lease.end_date);
        setStats((prev) => ({
          ...prev,
          leaseMonthsLeft,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch lease data:", err);
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
        // Just log warning, don't block render (user might be new)
        console.warn("Tenant information not fully linked.");
      }

      // Now fetch other data with proper scoping
      try {
        await fetchPayments();
      } catch (err) {
        console.warn("Could not fetch payments:", err);
      }

      try {
        await fetchLeaseData();
      } catch (err) {
        console.warn("Could not fetch lease data:", err);
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

      try {
        await fetchUtilitySettings();
      } catch (err) {
        console.warn("Could not fetch utility settings:", err);
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

  const fetchPayments = async () => {
    try {
      if (!user?.id) return;

      // Query rent_payments table - FILTERED BY CURRENT TENANT
      const { data: payments, error: paymentsError } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("payment_date", { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;

      if (payments && payments.length > 0) {
        setRecentPayments(payments);

        // Calculate stats
        const currentBalance = calculateCurrentBalance(payments);
        const totalPaid = payments
          .filter((p) => p.status === "completed")
          .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);

        setStats((prev) => ({
          ...prev,
          currentBalance,
          totalPaid,
        }));
      } else {
        // No payments found for this tenant
        setStats((prev) => ({
          ...prev,
          currentBalance: 0,
          totalPaid: 0,
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
    // console.warn("Announcements not available - table does not exist");
  };

  const fetchUpcomingDueDates = async () => {
    try {
      if (!user?.id) return;
      
      // Fetch upcoming/overdue payments ONLY FOR CURRENT TENANT
      const { data: upcoming, error: upcomingError } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (upcomingError) throw upcomingError;

      if (upcoming) {
        setUpcomingDueDates(upcoming);
        setStats((prev) => ({ ...prev, upcomingEvents: upcoming.length }));
      } else {
        setStats((prev) => ({ ...prev, upcomingEvents: 0 }));
      }
    } catch (err) {
      console.warn("Could not fetch upcoming due dates:", err);
    }
  };

  const fetchUtilitySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("utility_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUtilitySettings(data);
      }
    } catch (err) {
      console.warn("Could not fetch utility settings:", err);
    }
  };

  const fetchUtilityBills = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("utility_readings")
        .select("*")
        .eq("tenant_id", user.id)
        .order("reading_month", { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data && data.length > 0) {
        setUtilityBills(data);
        
        // Set current month as the latest reading
        const latestReading = data[0];
        setCurrentMonthUtility({
          id: latestReading.id,
          month: new Date(latestReading.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          electricity_bill: latestReading.electricity_bill || 0,
          water_bill: latestReading.water_bill || 0,
          garbage_fee: latestReading.garbage_fee || 0,
          security_fee: latestReading.security_fee || 0,
          service_fee: latestReading.service_fee || 0,
          other_charges: latestReading.other_charges || 0,
          total_bill: latestReading.total_bill || 0,
          status: latestReading.status,
          created_at: latestReading.created_at
        });
      }
    } catch (err) {
      console.warn("Could not fetch utility bills:", err);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
      case "overdue":
        return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case "failed":
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 font-nunito">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-[13px] font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show welcome message if no tenant info (user not yet assigned)
  if (!propertyData && !tenantInfo) {
    return (
      <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
         <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
          body { font-family: 'Nunito', sans-serif; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
        `}</style>
         
         <div className="max-w-[1400px] mx-auto px-6 py-10">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#154279] to-[#F96302]">
                Welcome, {userProfile?.first_name || "Tenant"}
              </h1>
              <p className="text-gray-500 mt-2">Your dashboard is being set up. You'll see your property and lease details here soon.</p>
              <div className="mt-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-[#154279] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#0f305a] transition-all duration-300 rounded-lg"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", refreshing ? "animate-spin" : "")} />
                  <span>{refreshing ? "Refreshing..." : "Refresh Now"}</span>
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-8 text-center">
                  <div className="bg-white p-4 rounded-full inline-flex mb-4 shadow-sm">
                    <Home className="h-8 w-8 text-[#154279]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Property Assignment Pending</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    We're coordinating with your property manager to link your account to your unit.
                  </p>
                  <p className="text-xs text-gray-500">This usually takes 1-2 business days.</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-8 text-center">
                  <div className="bg-white p-4 rounded-full inline-flex mb-4 shadow-sm">
                    <FileText className="h-8 w-8 text-[#F96302]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Make sure your profile is complete with all required information.
                  </p>
                  <Button className="w-full mt-2 bg-[#154279] hover:bg-[#0f305a]" size="sm">
                    Update Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
         </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">
                  Tenant Portal
                </span>
                <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">
                  Active
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                Welcome back, <span className="text-[#F96302]">{userProfile?.first_name || "Tenant"}</span>
              </h1>
              
              <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                Here's your residence overview. Track payments, maintenance requests, and lease details in one place.
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="group flex items-center gap-2 bg-white text-[#154279] px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} />
                  <span>Refresh Data</span>
                </button>
                
                <button 
                  onClick={() => navigate("/portal/tenant/maintenance")}
                  className="group flex items-center gap-2 bg-[#F96302] text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#d85501] transition-all duration-300 rounded-xl shadow-lg shadow-orange-900/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </button>
              </div>
            </div>

            {/* Stats Summary In Hero */}
            <div className="hidden md:grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-48">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Balance</span>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {formatCurrency(stats.currentBalance)}
                </div>
                <div className={cn("text-[10px] font-semibold mt-1", stats.currentBalance > 0 ? "text-red-300" : "text-emerald-300")}>
                  {stats.currentBalance > 0 ? "Payment Due" : "Fully Paid"}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-48">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Lease</span>
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {stats.leaseMonthsLeft} <span className="text-sm font-bold text-blue-200">{stats.leaseMonthsLeft === 1 ? 'Month' : 'Months'}</span>
                </div>
                <div className="text-[10px] text-blue-200 font-semibold mt-1">
                  Remaining Term
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-8 pb-20">
        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {/* Card 1: Balance */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
             <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
               <CardContent className="p-6 relative">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <DollarSign className="w-16 h-16 text-[#154279]" />
                 </div>
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-blue-50 rounded-xl">
                     <DollarSign className="w-6 h-6 text-[#154279]" />
                   </div>
                   {stats.currentBalance > 0 ? (
                     <Badge className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 uppercase text-[10px] tracking-wider">Action Needed</Badge>
                   ) : (
                     <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 uppercase text-[10px] tracking-wider">On Track</Badge>
                   )}
                 </div>
                 <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</h3>
                 <div className="text-2xl font-black text-slate-800 mb-2">
                    {formatCurrency(stats.currentBalance)}
                 </div>
                 <div className="flex items-center text-xs font-semibold text-slate-400">
                    <span className="text-[#F96302] hover:underline cursor-pointer flex items-center gap-1" onClick={() => navigate('/portal/tenant/payments')}>
                      Make Payment <ArrowRight className="w-3 h-3" />
                    </span>
                 </div>
               </CardContent>
             </Card>
           </motion.div>

           {/* Card 2: Maintenance */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
             <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
               <CardContent className="p-6 relative">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Wrench className="w-16 h-16 text-[#F96302]" />
                 </div>
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-orange-50 rounded-xl">
                     <Wrench className="w-6 h-6 text-[#F96302]" />
                   </div>
                   <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 uppercase text-[10px] tracking-wider">
                      {stats.activeRequests} Active
                   </Badge>
                 </div>
                 <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Maintenance</h3>
                 <div className="text-2xl font-black text-slate-800 mb-2">
                    {stats.activeRequests}
                 </div>
                 <div className="flex items-center text-xs font-semibold text-slate-400">
                   {stats.completedRequests} completed requests
                 </div>
               </CardContent>
             </Card>
           </motion.div>

           {/* Card 3: Messages */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
             <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group">
               <CardContent className="p-6 relative">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <MessageSquare className="w-16 h-16 text-indigo-500" />
                 </div>
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-indigo-50 rounded-xl">
                     <MessageSquare className="w-6 h-6 text-indigo-500" />
                   </div>
                   {stats.unreadMessages > 0 && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">New</Badge>}
                 </div>
                 <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Messages</h3>
                 <div className="text-2xl font-black text-slate-800 mb-2">
                    {stats.unreadMessages}
                 </div>
                 <div className="flex items-center text-xs font-semibold text-slate-400">
                   Check your inbox
                 </div>
               </CardContent>
             </Card>
           </motion.div>

           {/* Card 4: Property Info */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
             <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white rounded-2xl overflow-hidden h-full group cursor-pointer" onClick={() => navigate('/portal/tenant/property')}>
               <CardContent className="p-6 relative">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Home className="w-16 h-16 text-emerald-500" />
                 </div>
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-emerald-50 rounded-xl">
                     <Home className="w-6 h-6 text-emerald-500" />
                   </div>
                 </div>
                 <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">My Unit</h3>
                 <div className="text-xl font-black text-slate-800 mb-2 truncate" title={propertyData?.unit_number || "Unit Details"}>
                    {propertyData?.unit_number || "No Unit"}
                 </div>
                 <div className="flex items-center text-xs font-semibold text-slate-400 truncate" title={propertyData?.name}>
                   {propertyData?.name || "Property details unavailable"}
                 </div>
               </CardContent>
             </Card>
           </motion.div>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Payment History */}
             <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                         <CreditCard className="w-5 h-5 text-[#154279]" />
                      </div>
                      <div>
                         <CardTitle className="text-lg font-bold text-slate-800">Recent Payments</CardTitle>
                         <CardDescription className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Transaction History</CardDescription>
                      </div>
                   </div>
                   <Button variant="ghost" className="text-[#F96302] hover:text-[#d85501] hover:bg-orange-50" onClick={() => navigate("/portal/tenant/payments")}>
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                   {recentPayments.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                         <div className="p-4 bg-slate-50 rounded-full inline-block mb-3">
                            <CreditCard className="w-8 h-8 text-slate-300" />
                         </div>
                         <p className="font-medium">No recent payments found</p>
                      </div>
                   ) : (
                      <div className="divide-y divide-slate-50">
                        {recentPayments.map((payment) => (
                          <div key={payment.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                   "p-3 rounded-xl",
                                   payment.status === 'completed' ? "bg-emerald-50" : "bg-amber-50"
                                )}>
                                   {payment.status === 'completed' ? (
                                      <CheckCircle className={cn("w-5 h-5", "text-emerald-500")} />
                                   ) : (
                                      <Clock className={cn("w-5 h-5", "text-amber-500")} />
                                   )}
                                </div>
                                <div>
                                   <div className="font-bold text-slate-800 text-sm">Rent Payment</div>
                                   <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{formatDate(payment.created_at)}</div>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                <Badge className={cn("font-bold text-[10px] uppercase tracking-wider px-2 py-1", getPaymentStatusColor(payment.status))}>
                                   {payment.status}
                                </Badge>
                                <div className="font-black text-slate-800 text-lg">
                                   {formatCurrency(payment.amount)}
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                   )}
                </CardContent>
             </Card>

             {/* Maintenance Requests */}
             <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                         <Wrench className="w-5 h-5 text-[#F96302]" />
                      </div>
                      <div>
                         <CardTitle className="text-lg font-bold text-slate-800">Maintenance</CardTitle>
                         <CardDescription className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Service Requests</CardDescription>
                      </div>
                   </div>
                   <Button variant="ghost" className="text-[#154279] hover:text-[#0f325e] hover:bg-blue-50" onClick={() => navigate("/portal/tenant/maintenance")}>
                      View All
                      <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                   {maintenanceRequests.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                         <div className="p-4 bg-slate-50 rounded-full inline-block mb-3">
                            <CheckCircle className="w-8 h-8 text-slate-300" />
                         </div>
                         <p className="font-medium">No active maintenance requests</p>
                         <Button variant="link" className="text-[#F96302] font-bold mt-2" onClick={() => navigate("/portal/tenant/maintenance")}>Submit Request</Button>
                      </div>
                   ) : (
                      <div className="divide-y divide-slate-50">
                        {maintenanceRequests.map((req) => (
                          <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div className="flex items-start gap-4">
                                <div className={cn("mt-1 w-2 h-2 rounded-full", req.status === 'completed' ? "bg-emerald-500" : "bg-[#F96302]")} />
                                <div>
                                   <div className="font-bold text-slate-800 text-sm mb-1">{req.title}</div>
                                   <div className="flex items-center gap-2">
                                     <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wide border-0 px-2 py-0.5", getPriorityColor(req.priority))}>
                                        {req.priority}
                                     </Badge>
                                     <span className="text-xs text-slate-400 font-medium">{formatDate(req.created_at)}</span>
                                   </div>
                                </div>
                             </div>
                             <Badge className={cn("self-start sm:self-center font-bold text-[10px] uppercase tracking-wider px-2 py-1", getStatusColor(req.status))}>
                               {req.status?.replace('_', ' ')}
                             </Badge>
                          </div>
                        ))}
                      </div>
                   )}
                </CardContent>
             </Card>

          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="space-y-8">
             
             {/* QUICK ACTIONS */}
             <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#154279] to-[#F96302]"></div>
                <CardHeader className="p-6 pb-2">
                   <CardTitle className="text-base font-bold text-[#154279] uppercase tracking-wider">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                   <Button 
                     className="w-full justify-between bg-[#154279] hover:bg-[#0f325e] text-white h-auto py-3 px-4 rounded-xl shadow-md transition-all hover:translate-x-1"
                     onClick={() => navigate("/portal/tenant/payments")}
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-white/20 rounded-lg"><CreditCard className="w-4 h-4"/></div>
                         <span className="font-bold text-sm">Pay Rent</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                   </Button>

                   <Button 
                     className="w-full justify-between bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-auto py-3 px-4 rounded-xl shadow-sm transition-all hover:translate-x-1"
                     onClick={() => navigate("/portal/tenant/maintenance")}
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-orange-100 text-[#F96302] rounded-lg"><Wrench className="w-4 h-4"/></div>
                         <span className="font-bold text-sm">Report Issue</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                   </Button>

                   <Button 
                     className="w-full justify-between bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-auto py-3 px-4 rounded-xl shadow-sm transition-all hover:translate-x-1"
                     onClick={() => navigate("/portal/tenant/documents")}
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-blue-100 text-[#154279] rounded-lg"><FileText className="w-4 h-4"/></div>
                         <span className="font-bold text-sm">Download Lease</span>
                      </div>
                      <Download className="w-4 h-4 opacity-50" />
                   </Button>

                   <Button 
                     className="w-full justify-between bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-auto py-3 px-4 rounded-xl shadow-sm transition-all hover:translate-x-1"
                     onClick={() => navigate("/portal/tenant/bills")}
                   >
                      <div className="flex items-center gap-3">
                         <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><Zap className="w-4 h-4"/></div>
                         <span className="font-bold text-sm">View Bills</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                   </Button>
                </CardContent>
             </Card>

             {/* UTILITIES & SERVICES - DETAILED BREAKDOWN */}
             {currentMonthUtility ? (
               <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                           <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                           <CardTitle className="text-base font-bold text-emerald-900">Bill Calculation Breakdown</CardTitle>
                           <CardDescription className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">{currentMonthUtility.month}</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                     {/* Electricity */}
                     <div className="border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-semibold text-slate-700">Electricity</span>
                           </div>
                           <span className="text-lg font-bold text-yellow-700">{formatCurrency(currentMonthUtility.electricity_bill)}</span>
                        </div>
                     </div>

                     {/* Water */}
                     {currentMonthUtility.water_bill > 0 && (
                        <div className="border-b border-slate-100 pb-4">
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                 <Droplets className="w-4 h-4 text-blue-600" />
                                 <span className="text-sm font-semibold text-slate-700">Water</span>
                              </div>
                              <span className="text-lg font-bold text-blue-700">{formatCurrency(currentMonthUtility.water_bill)}</span>
                           </div>
                        </div>
                     )}

                     {/* Fixed Fees */}
                     {(currentMonthUtility.garbage_fee > 0 || currentMonthUtility.security_fee > 0 || currentMonthUtility.service_fee > 0) && (
                        <>
                           {currentMonthUtility.garbage_fee > 0 && (
                              <div className="flex justify-between items-center">
                                 <span className="text-sm text-slate-700">Garbage Fee</span>
                                 <span className="font-semibold text-slate-900">{formatCurrency(currentMonthUtility.garbage_fee)}</span>
                              </div>
                           )}
                           {currentMonthUtility.security_fee > 0 && (
                              <div className="flex justify-between items-center">
                                 <span className="text-sm text-slate-700">Security Fee</span>
                                 <span className="font-semibold text-slate-900">{formatCurrency(currentMonthUtility.security_fee)}</span>
                              </div>
                           )}
                           {currentMonthUtility.service_fee > 0 && (
                              <div className="flex justify-between items-center">
                                 <span className="text-sm text-slate-700">Service Fee</span>
                                 <span className="font-semibold text-slate-900">{formatCurrency(currentMonthUtility.service_fee)}</span>
                              </div>
                           )}
                        </>
                     )}

                     {/* Other Charges */}
                     {currentMonthUtility.other_charges > 0 && (
                        <div className="flex justify-between items-center">
                           <span className="text-sm text-slate-700">Other Charges</span>
                           <span className="font-semibold text-slate-900">{formatCurrency(currentMonthUtility.other_charges)}</span>
                        </div>
                     )}

                     {/* Total Bill - Highlighted */}
                     <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-4 rounded-lg border-2 border-emerald-300 mt-4">
                        <div className="flex justify-between items-center">
                           <h3 className="text-lg font-bold text-emerald-900">TOTAL BILL</h3>
                           <div className="text-right">
                              <p className="text-2xl font-extrabold text-emerald-700">{formatCurrency(currentMonthUtility.total_bill)}</p>
                              <p className="text-xs text-emerald-600 mt-1">Amount Due</p>
                           </div>
                        </div>
                     </div>

                     {/* Action Button */}
                     <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-4"
                        onClick={() => navigate("/portal/tenant/payments")}
                     >
                        View Full Bill Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                     </Button>
                  </CardContent>
               </Card>
             ) : (
               // Fallback: Show summary if detailed breakdown not available
               utilitySettings && (
                 <Card className="border-none shadow-lg bg-blue-50 rounded-2xl overflow-hidden border border-blue-100">
                    <CardHeader className="p-6 pb-2">
                       <div className="flex items-center gap-2 text-[#154279]">
                          <Zap className="w-5 h-5" />
                          <CardTitle className="text-base font-bold uppercase tracking-wider">Utilities & Services</CardTitle>
                       </div>
                    </CardHeader>
                    <CardContent className="p-6">
                       <div className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-blue-100">
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Monthly Total</div>
                          <div className="text-[#154279] font-black text-2xl">
                             {formatCurrency(
                               (Number(utilitySettings.water_fee) || 0) +
                               (Number(utilitySettings.electricity_fee) || 0) +
                               (Number(utilitySettings.garbage_fee) || 0) +
                               (Number(utilitySettings.security_fee) || 0) +
                               (Number(utilitySettings.service_fee) || 0)
                             )}
                          </div>
                       </div>
                       <p className="text-xs text-blue-600 font-medium leading-relaxed">
                          This is your summarized monthly fee for water, electricity, garbage, security, and general services.
                       </p>
                    </CardContent>
                 </Card>
               )
             )}

             {/* EMERGENCY CONTACT */}
             <Card className="border-none shadow-lg bg-red-50 rounded-2xl overflow-hidden border border-red-100">
                <CardHeader className="p-6 pb-2">
                   <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <CardTitle className="text-base font-bold uppercase tracking-wider">Emergency</CardTitle>
                   </div>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-red-100">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Emergency Maintenance</div>
                      <div className="text-red-600 font-black text-xl">
                         {tenantInfo?.emergency_phone || "+254 700 000 000"}
                      </div>
                   </div>
                   <p className="text-xs text-red-400 font-medium leading-relaxed">
                      Only use this number for urgent issues like flooding, fire, or total power loss. For non-emergencies, please submit a maintenance ticket.
                   </p>
                </CardContent>
             </Card>

             {/* Upcoming Events/Dates */}
             <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="p-6 pb-2 flex items-center justify-between">
                   <CardTitle className="text-base font-bold text-slate-700 uppercase tracking-wider">Upcoming</CardTitle>
                   <Calendar className="w-4 h-4 text-slate-400" />
                </CardHeader>
                <CardContent className="p-6 pt-2">
                   <div className="space-y-4 mt-2">
                      {upcomingDueDates.length > 0 ? (
                         upcomingDueDates.slice(0, 3).map((event, i) => (
                            <div key={i} className="flex gap-3 items-center">
                               <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-600">
                                  <span className="text-[10px] font-bold uppercase">{new Date(event.due_date).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-lg font-black leading-none">{new Date(event.due_date).getDate()}</span>
                               </div>
                               <div>
                                  <div className="text-sm font-bold text-slate-800">Rent Due</div>
                                  <div className="text-xs text-slate-400 font-medium">Auto-payment available</div>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="text-xs text-slate-400 text-center py-4">No upcoming events</div>
                      )}
                   </div>
                </CardContent>
             </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
