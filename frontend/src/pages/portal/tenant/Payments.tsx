// src/pages/portal/tenant/Payments.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  DollarSign,
  Plus,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Droplets,
  Shield,
  Home,
  TrendingUp,
  Calendar,
  Zap,
  Trash2,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Payment {
  id: string;
  amount: number;
  amount_paid?: number;
  payment_date?: string;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "partial" | "completed" | "open";
  payment_method?: string;
  created_at: string;
  bill_type?: string;
  remarks?: string;
}

interface UtilityBreakdown {
  id: string;
  month: string;
  electricity_bill: number;
  water_bill: number;
  garbage_fee: number;
  security_fee: number;
  service_fee: number;
  other_charges: number;
  total_bill: number;
  status: string;
  created_at: string;
}

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rentPayments, setRentPayments] = useState<Payment[]>([]);
  const [utilityBills, setUtilityBills] = useState<Payment[]>([]);
  const [utilityBreakdowns, setUtilityBreakdowns] = useState<UtilityBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const getCurrentMonthDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // 1. Get Tenant Unit Info
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, unit_id, property_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const unitId = tenantData?.unit_id;
      const propertyId = tenantData?.property_id;
      const tenantId = tenantData?.id;

      // 2. Fetch THIS MONTH's Rent Payments
      const { data: rentData, error: rentError } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: false });

      if (rentError) throw rentError;
      setRentPayments(rentData || []);

      // 3. Fetch Utility Readings (Breakdown) for THIS MONTH & Previous Months
      if (unitId) {
        const { data: readingsData, error: readingsError } = await supabase
          .from("utility_readings")
          .select("*")
          .eq("unit_id", unitId)
          .order("reading_month", { ascending: false });

        if (readingsError) throw readingsError;
        
        // Map utility readings to breakdown format
        const formattedBreakdowns = (readingsData || []).map((r: any) => ({
          id: r.id,
          month: new Date(r.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          electricity_bill: r.electricity_bill || 0,
          water_bill: r.water_bill || 0,
          garbage_fee: r.garbage_fee || 0,
          security_fee: r.security_fee || 0,
          service_fee: r.service_fee || 0,
          other_charges: r.other_charges || 0,
          total_bill: r.total_bill || 0,
          status: r.status,
          created_at: r.created_at
        }));
        setUtilityBreakdowns(formattedBreakdowns);

        // 4. Fetch Bills for history (if available)
        const { data: billData, error: billError } = await supabase
          .from("bills_and_utilities")
          .select("*")
          .eq("unit_id", unitId)
          .order("due_date", { ascending: false });

        if (!billError && billData) {
          const formattedBills = (billData || [])
            .filter((b: any) => {
              // Exclude 'all' type bills to avoid duplication with individual rent/utility items
              if (b.bill_type === 'all') return false;
              return true;
            })
            .map((b: any) => ({
            id: b.id,
            amount: b.amount,
            amount_paid: b.paid_amount || 0,
            due_date: b.due_date || b.bill_period_end || b.created_at,
            status: b.status,
            created_at: b.created_at,
            bill_type: b.bill_type || "utility",
            remarks: b.remarks
          }));
          setUtilityBills(formattedBills);
        }
      }

    } catch (err) {
      console.error("Error fetching payments:", err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "open":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "partial":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get current month's rent and utilities
  const currentMonthRent = rentPayments.length > 0 ? rentPayments[0] : null;
  const currentMonthUtility = utilityBreakdowns.length > 0 ? utilityBreakdowns[0] : null;

  // Calculate totals
  const totalRentDue = currentMonthRent ? Math.max(0, currentMonthRent.amount - (currentMonthRent.amount_paid || 0)) : 0;
  const totalUtilityDue = currentMonthUtility ? currentMonthUtility.total_bill : 0;
  const totalDue = totalRentDue + totalUtilityDue;

  const rentPaid = currentMonthRent?.amount_paid || 0;
  const utilityPaid = currentMonthUtility ? (currentMonthUtility.status === 'paid' ? currentMonthUtility.total_bill : 0) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-nunito">
      {/* Header - Minimalist */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/portal/tenant")}
                className="hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">My Payments</h1>
                <p className="text-slate-500 mt-1 text-sm">Rent and utility bills</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/portal/tenant/payments/make")}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-none px-6 py-6 text-base font-semibold rounded-lg"
            >
              <Plus size={20} className="mr-2" />
              Make Payment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-8">
        {/* Current Bill Summary - Minimalist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Total Due Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-6">
              <div>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total amount due</p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-5xl font-bold text-slate-900">{formatCurrency(totalDue)}</span>
                  <span className={cn("text-sm font-semibold", totalDue > 0 ? "text-red-600" : "text-green-600")}>
                    {totalDue > 0 ? '·  Payment due' : '·  All paid'}
                  </span>
                </div>
              </div>

              {/* Two-column breakdown */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200">
                {/* Rent */}
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-3">Rent (This Month)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Amount due:</span>
                      <span className={cn("font-semibold", totalRentDue > 0 ? "text-red-600" : "text-green-600")}>
                        {formatCurrency(totalRentDue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Total rent:</span>
                      <span className="text-slate-900 font-medium">{formatCurrency(currentMonthRent?.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Paid:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(rentPaid)}</span>
                    </div>
                  </div>
                </div>

                {/* Utilities */}
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-3">Utilities (This Month)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Amount due:</span>
                      <span className={cn("font-semibold", totalUtilityDue > 0 ? "text-red-600" : "text-green-600")}>
                        {formatCurrency(totalUtilityDue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Total utilities:</span>
                      <span className="text-slate-900 font-medium">{formatCurrency(totalUtilityDue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 text-sm">Paid:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(utilityPaid)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary CTA */}
              {totalDue > 0 && (
                <Button
                  onClick={() => navigate("/portal/tenant/payments/make")}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 text-lg font-semibold rounded-lg shadow-none mt-2"
                >
                  <CreditCard className="mr-2" size={20} />
                  Pay {formatCurrency(totalDue)} Now
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Utility Breakdown - Enhanced */}
        {currentMonthUtility && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Utility charges breakdown</h2>
                  <p className="text-slate-600 text-sm mt-1 flex items-center gap-2">
                    <Calendar size={16} />
                    {currentMonthUtility.month}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-sm">Total utilities</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.total_bill)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Electricity */}
                <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100 p-5 hover:border-yellow-200 hover:shadow-md transition-all">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 w-fit mb-3">
                    <Zap size={18} />
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-2">Electricity</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.electricity_bill)}</p>
                </div>

                {/* Water */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-5 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 w-fit mb-3">
                    <Droplets size={18} />
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-2">Water</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.water_bill)}</p>
                </div>

                {/* Garbage */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-5 hover:border-green-200 hover:shadow-md transition-all">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600 w-fit mb-3">
                    <Trash2 size={18} />
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-2">Garbage</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.garbage_fee)}</p>
                </div>

                {/* Security */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-5 hover:border-purple-200 hover:shadow-md transition-all">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600 w-fit mb-3">
                    <Shield size={18} />
                  </div>
                  <p className="text-slate-500 text-xs font-medium mb-2">Security</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.security_fee)}</p>
                </div>

                {/* Service Fee */}
                {currentMonthUtility.service_fee > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-5 hover:border-orange-200 hover:shadow-md transition-all">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 w-fit mb-3">
                      <CreditCard size={18} />
                    </div>
                    <p className="text-slate-500 text-xs font-medium mb-2">Service</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.service_fee)}</p>
                  </div>
                )}

                {/* Other Charges */}
                {currentMonthUtility.other_charges > 0 && (
                  <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-5 hover:border-red-200 hover:shadow-md transition-all">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 w-fit mb-3">
                      <Clock size={18} />
                    </div>
                    <p className="text-slate-500 text-xs font-medium mb-2">Other</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(currentMonthUtility.other_charges)}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment History - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={24} />
              Payment history
            </h2>
            <p className="text-slate-600 text-sm mt-2">View all your rent and utility payments</p>
          </div>

          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b border-slate-200 bg-slate-50 p-0 h-auto justify-start">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-white px-8 py-4 text-slate-600 font-medium transition-all"
              >
                <Calendar size={18} className="mr-2" />
                All Bills
              </TabsTrigger>
              <TabsTrigger 
                value="rent" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-white px-8 py-4 text-slate-600 font-medium transition-all"
              >
                <Home size={18} className="mr-2" />
                Rent Only
              </TabsTrigger>
              <TabsTrigger 
                value="utilities" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-white px-8 py-4 text-slate-600 font-medium transition-all"
              >
                <Droplets size={18} className="mr-2" />
                Utilities Only
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <TabsContent value="overview" className="mt-0">
                <AllPaymentsTable 
                  rentPayments={rentPayments}
                  utilityBills={utilityBills}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  navigate={navigate}
                />
              </TabsContent>
              
              <TabsContent value="rent" className="mt-0">
                <RentPaymentsTable 
                  data={rentPayments}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  navigate={navigate}
                />
              </TabsContent>

              <TabsContent value="utilities" className="mt-0">
                <UtilityHistoryTable 
                  data={utilityBreakdowns}
                  formatCurrency={formatCurrency}
                  getStatusColor={getStatusColor}
                />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

// Table Components
const AllPaymentsTable = ({ rentPayments, utilityBills, formatCurrency, formatDate, getStatusColor, navigate }: any) => {
  const allPayments = [
    ...rentPayments.map((r: any) => ({ ...r, type: 'rent', typeLabel: 'Rent Payment' })),
    ...utilityBills.map((u: any) => ({ ...u, type: 'utility', typeLabel: u.bill_type ? u.bill_type.charAt(0).toUpperCase() + u.bill_type.slice(1) + ' Bill' : 'Utility Bill' }))
  ].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

  if (allPayments.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {allPayments.map((item: any) => {
        const isPaid = item.status === 'paid' || item.status === 'completed';
        const remainingAmount = Math.max(0, item.amount - (item.amount_paid || 0));

        return (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={cn("p-3 rounded-lg flex-shrink-0", item.type === 'utility' ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-600")}>
                {item.type === 'utility' ? <Droplets size={20} /> : <Home size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-base">{item.typeLabel}</p>
                <p className="text-sm text-slate-500 mt-0.5">{formatDate(item.due_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-8 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-medium mb-1">Amount</p>
                <p className="font-bold text-slate-900 text-lg">{formatCurrency(item.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-1">Remaining</p>
                <p className={cn("font-bold text-lg", remainingAmount > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-3 py-1", getStatusColor(item.status))}>
                  {item.status}
                </Badge>
              </div>
              {!isPaid && remainingAmount > 0 && (
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/portal/tenant/payments/make?type=${item.type}&id=${item.id}`)}
                  className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap transition-all"
                >
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RentPaymentsTable = ({ data, formatCurrency, formatDate, getStatusColor, navigate }: any) => {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {data.map((item: any) => {
        const isPaid = item.status === 'paid' || item.status === 'completed';
        const remainingAmount = Math.max(0, item.amount - (item.amount_paid || 0));

        return (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-lg bg-slate-200 text-slate-600 flex-shrink-0">
                <Home size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-base">Monthly Rent</p>
                <p className="text-sm text-slate-500 mt-0.5">{formatDate(item.due_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-8 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-medium mb-1">Amount</p>
                <p className="font-bold text-slate-900 text-lg">{formatCurrency(item.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-1">Remaining</p>
                <p className={cn("font-bold text-lg", remainingAmount > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-3 py-1", getStatusColor(item.status))}>
                  {item.status}
                </Badge>
              </div>
              {!isPaid && remainingAmount > 0 && (
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/portal/tenant/payments/make?type=rent&id=${item.id}`)}
                  className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap transition-all"
                >
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const UtilityHistoryTable = ({ data, formatCurrency, getStatusColor }: any) => {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="font-bold text-slate-900 py-4">Month</TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <Zap size={16} className="text-yellow-600" />
                  Electricity
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <Droplets size={16} className="text-blue-600" />
                  Water
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <Trash2 size={16} className="text-green-600" />
                  Garbage
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">
                <div className="flex items-center justify-end gap-1">
                  <Shield size={16} className="text-purple-600" />
                  Security
                </div>
              </TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">Service</TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">Other</TableHead>
              <TableHead className="font-bold text-slate-900 text-right py-4">Total</TableHead>
              <TableHead className="font-bold text-slate-900 py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <TableCell className="font-semibold text-slate-900 py-4">{item.month}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.electricity_bill)}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.water_bill)}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.garbage_fee)}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.security_fee)}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.service_fee)}</TableCell>
                <TableCell className="text-right text-slate-600 py-4 font-medium">{formatCurrency(item.other_charges)}</TableCell>
                <TableCell className="font-bold text-slate-900 text-right py-4 text-lg">{formatCurrency(item.total_bill)}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-3 py-1", getStatusColor(item.status))}>
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
    <p className="text-slate-900 font-semibold">No outstanding payments</p>
    <p className="text-slate-600 text-sm mt-1">All bills are paid up to date</p>
  </div>
);

export default PaymentsPage;