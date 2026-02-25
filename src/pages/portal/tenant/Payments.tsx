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
  Shield
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
  amount: number; // For bills: Total amount
  amount_paid?: number; // For bills & rent: Amount paid so far
  payment_date?: string;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "partial" | "completed" | "open";
  payment_method?: string;
  created_at: string;
  bill_type?: string; // For distinguish
  remarks?: string;
}

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rentPayments, setRentPayments] = useState<Payment[]>([]);
  const [utilityBills, setUtilityBills] = useState<Payment[]>([]);
  const [utilitySettings, setUtilitySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // 1. Get Tenant Unit Info
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('unit_id, property_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const unitId = tenantData?.unit_id;
      const propertyId = tenantData?.property_id;

      // 2. Fetch Rent Payments
      const { data: rentData, error: rentError } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("due_date", { ascending: false });

      if (rentError) throw rentError;
      setRentPayments(rentData || []);

      // 3. Fetch Bills (Using Unit ID)
      if (unitId) {
          const { data: billData, error: billError } = await supabase
            .from("bills_and_utilities")
            .select("*")
            .eq("unit_id", unitId)
            .order("bill_period_start", { ascending: false });

          if (billError) throw billError;
          // Map to common interface
          const formattedBills = (billData || []).map((b: any) => ({
             id: b.id,
             amount: b.amount,
             amount_paid: b.paid_amount,
             due_date: b.due_date || b.bill_period_end || b.created_at,
             status: b.status,
             created_at: b.created_at,
             bill_type: b.bill_type || "utility", // Fallback for safety
             remarks: b.remarks
          }));
          setUtilityBills(formattedBills);
      }

      // 4. Fetch Utility Settings
      const { data: settingsData } = await supabase
        .from("utility_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (settingsData) {
        setUtilitySettings(settingsData);
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

  const getPaymentMethodBadge = (paymentMethod?: string) => {
    if (paymentMethod === 'paystack') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Paystack</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate Totals
  const rentDue = rentPayments.reduce((sum, p) => {
      if (p.status === 'paid') return sum;
      return sum + (p.amount - (p.amount_paid || 0));
  }, 0);

  const utilitiesDue = utilityBills.reduce((sum, p) => {
     if (p.status === 'paid') return sum;
     return sum + (p.amount - (p.amount_paid || 0));
  }, 0);

  const globalUtilityFee = utilitySettings ? (
    (Number(utilitySettings.water_fee) || 0) +
    (Number(utilitySettings.electricity_fee) || 0) +
    (Number(utilitySettings.garbage_fee) || 0) +
    (Number(utilitySettings.security_fee) || 0) +
    (Number(utilitySettings.service_fee) || 0)
  ) : 0;

  const totalArrears = rentDue + utilitiesDue + globalUtilityFee;

  return (
    <div className="space-y-6 font-nunito min-h-screen bg-slate-50/50 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portal/tenant")}
            className="hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#154279] to-[#F96302]">
              My Payments
            </h1>
            <p className="text-sm text-gray-500">Manage rent and all utility bills</p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/portal/tenant/payments/make")}
          className="bg-[#F96302] hover:bg-[#d85501] text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} className="mr-2" />
          Make Payment
        </Button>
      </motion.div>

      {/* Paystack Payment Info Banner */}
      <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Secure Payments:</strong> All rent and utility payments are processed securely through Paystack. Your payment information is never stored on our servers.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cn("border-l-4 shadow-sm transition-all hover:shadow-md", totalArrears > 0 ? "border-l-red-500 bg-red-50/50" : "border-l-green-500 bg-green-50/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              Total Outstanding
              <AlertTriangle className={cn("w-4 h-4", totalArrears > 0 ? "text-red-500" : "text-green-500")} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalArrears > 0 ? "text-red-700" : "text-green-700")}>
              {formatCurrency(totalArrears)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Rent + All Utilities Arrears</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              Rent Arrears
              <DollarSign className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(rentDue)}
            </div>
             <p className="text-xs text-gray-500 mt-1">{rentPayments.filter(p => p.status !== 'paid').length} payments pending</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500 shadow-sm transition-all hover:shadow-md bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
              Utility Bills
              <Droplets className="w-4 h-4 text-cyan-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(utilitiesDue + globalUtilityFee)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {utilityBills.filter(p => p.status !== 'paid').length} bills pending
              {globalUtilityFee > 0 && " + Monthly Utilities"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
           <TabsList>
             <TabsTrigger value="all">All Transactions</TabsTrigger>
             <TabsTrigger value="rent">Rent</TabsTrigger>
             <TabsTrigger value="utilities">Utilities & Other Bills</TabsTrigger>
           </TabsList>
        </div>


        <TabsContent value="all" className="space-y-4">
           {globalUtilityFee > 0 && (
             <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                   <Droplets size={18} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-blue-900">Monthly Utilities & Services</h3>
                   <p className="text-sm text-blue-700">Standard monthly fee for water, electricity, garbage, security, and services</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-xl font-bold text-blue-900">{formatCurrency(globalUtilityFee)} <span className="text-sm font-normal text-blue-700">/ month</span></div>
                 <Button 
                   size="sm" 
                   className="mt-2 bg-blue-600 hover:bg-blue-700"
                   onClick={() => navigate(`/portal/tenant/payments/make?type=utilities&amount=${globalUtilityFee}`)}
                 >
                   Pay Now
                 </Button>
               </div>
             </div>
           )}
           <PaymentsTable 
              data={[...rentPayments, ...utilityBills].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              navigate={navigate}
           />
        </TabsContent>
        
        <TabsContent value="rent" className="space-y-4">
           <PaymentsTable 
              data={rentPayments}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              navigate={navigate}
           />
        </TabsContent>

        <TabsContent value="utilities" className="space-y-4">
           {globalUtilityFee > 0 && (
             <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                   <Droplets size={18} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-blue-900">Monthly Utilities & Services</h3>
                   <p className="text-sm text-blue-700">Standard monthly fee for water, electricity, garbage, security, and services</p>
                 </div>
               </div>
               <div className="text-right">
                 <div className="text-xl font-bold text-blue-900">{formatCurrency(globalUtilityFee)} <span className="text-sm font-normal text-blue-700">/ month</span></div>
                 <Button 
                   size="sm" 
                   className="mt-2 bg-blue-600 hover:bg-blue-700"
                   onClick={() => navigate(`/portal/tenant/payments/make?type=utilities&amount=${globalUtilityFee}`)}
                 >
                   Pay Now
                 </Button>
               </div>
             </div>
           )}
           <PaymentsTable 
              data={utilityBills}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              navigate={navigate}
           />
        </TabsContent>
      </Tabs>
      
    </div>
  );
};

const PaymentsTable = ({ data, formatCurrency, formatDate, getStatusColor, navigate }: any) => {
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Payment For</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount Due</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => {
             // Determine if it is utility based on property presence or passed type
             // rentPayments usually don't have bill_type but we can infer or rely on the item structure
             const isUtilityItem = item.bill_type && item.bill_type !== 'rent';
             
             const typeLabel = isUtilityItem 
                ? (item.bill_type ? item.bill_type.charAt(0).toUpperCase() + item.bill_type.slice(1) + ' Bill' : 'Utility Bill')
                : 'Rent Payment';
             
             const isPaid = item.status === 'paid' || item.status === 'completed';
             const remainingAmount = Math.max(0, item.amount - (item.amount_paid || 0));
             
             const handlePay = () => {
                const type = isUtilityItem ? 'water' : 'rent';
                navigate(`/portal/tenant/payments/make?type=${type}&id=${item.id}&amount=${remainingAmount}`);
             };

             return (
               <TableRow key={item.id} className="hover:bg-slate-50/50">
                 <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        {isUtilityItem ? (
                            <div className="p-1.5 rounded-full bg-cyan-100 text-cyan-600"><Droplets size={14}/></div>
                        ) : (
                            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600"><DollarSign size={14}/></div>
                        )}
                        <span className="text-slate-700">{typeLabel}</span>
                    </div>
                 </TableCell>
                 <TableCell className="text-slate-500">{formatDate(item.due_date)}</TableCell>
                 <TableCell className="font-medium text-slate-900">{formatCurrency(item.amount)}</TableCell>
                 <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount_paid || 0)}</TableCell>
                 <TableCell className={cn("font-bold", remainingAmount > 0 ? "text-red-600" : "text-slate-400")}>
                    {formatCurrency(remainingAmount)}
                 </TableCell>
                 <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", getStatusColor(item.status))}>
                        {item.status}
                    </Badge>
                 </TableCell>
                 <TableCell className="text-gray-500 italic text-sm max-w-[150px] truncate" title={item.remarks}>
                    {item.remarks || '-'}
                 </TableCell>
                 <TableCell className="text-right">
                    {!isPaid && (
                        <Button 
                            size="sm" 
                            onClick={handlePay} 
                            className={cn(
                                "h-8 px-3 text-xs font-bold uppercase tracking-wider shadow-sm", 
                                isUtilityItem 
                                    ? "bg-cyan-600 hover:bg-cyan-700" 
                                    : "bg-blue-600 hover:bg-blue-700"
                            )}
                        >
                            Pay
                        </Button>
                    )}
                 </TableCell>
               </TableRow>
             );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const EmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500">No records found</p>
    </div>
);

export default PaymentsPage;