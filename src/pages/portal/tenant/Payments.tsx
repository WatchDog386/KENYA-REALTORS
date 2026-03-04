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
  Bell,
  Home,
  Zap,
  Trash2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import TenantReceipts from "@/components/TenantReceipts";

interface Payment {
  id: string;
  amount: number; // For bills: Total amount
  amount_paid: number; // For bills & rent: Amount paid so far
  payment_date?: string;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "partial" | "completed" | "open";
  payment_method?: string;
  created_at: string;
  bill_type?: string; // For distinguish
  remarks?: string;
}

interface UtilityReading {
  id: string;
  unit_id: string;
  reading_month: string;
  previous_reading: number;
  current_reading: number;
  electricity_rate: number;
  water_previous_reading?: number;
  water_current_reading?: number;
  water_rate?: number;
  water_bill: number;
  garbage_fee: number;
  security_fee: number;
  service_fee?: number;
  custom_utilities?: Record<string, number>;
  other_charges: number;
  status: string;
  unit_number?: string;
  created_at?: string;
}

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rentPayments, setRentPayments] = useState<Payment[]>([]);
  const [utilityBills, setUtilityBills] = useState<Payment[]>([]);
  const [utilityReadings, setUtilityReadings] = useState<UtilityReading[]>([]);
  const [utilitySettings, setUtilitySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null);
  const [exactMonthlyRent, setExactMonthlyRent] = useState<number>(0);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<Set<string>>(new Set());
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  useEffect(() => {
    fetchData();

    // Setup real-time subscriptions for utility readings
    const readingsChannel = supabase
      .channel(`utility_readings_tenant_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_readings',
        },
        (payload) => {
          console.log('Real-time utility reading change detected:', payload);
          // Refetch data when readings change
          fetchData();
        }
      )
      .subscribe();

    // Setup real-time subscriptions for rent payments
    const paymentsChannel = supabase
      .channel(`rent_payments_tenant_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rent_payments',
        },
        (payload) => {
          console.log('Real-time rent payment change detected:', payload);
          // Refetch data when payments change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      readingsChannel.unsubscribe();
      paymentsChannel.unsubscribe();
    };
  }, [user?.id]);

  // Build a payment-style bill entry from raw utility readings when invoices are missing
  function buildBillsFromReadings(readings: UtilityReading[]): Payment[] {
    return readings.map(r => {
      // Calculate usage as the range/magnitude between readings
      const electricityUsage = Math.abs((r.current_reading || 0) - (r.previous_reading || 0));
      const electricityBill = electricityUsage * (r.electricity_rate || 0);

      const waterUsage = Math.abs((r.water_current_reading || 0) - (r.water_previous_reading || 0));
      const waterBill = typeof r.water_bill === 'number'
        ? Math.abs(r.water_bill)
        : waterUsage * (r.water_rate || 0);

      const fixedFees = Math.abs(r.garbage_fee || 0) + Math.abs(r.security_fee || 0) + Math.abs(r.service_fee || 0);
      const otherCharges = Math.abs(r.other_charges || 0);
      const total = electricityBill + waterBill + fixedFees + otherCharges;

      const status: Payment['status'] = ['pending', 'paid', 'overdue', 'partial', 'completed', 'open'].includes(r.status as Payment['status'])
        ? (r.status as Payment['status'])
        : 'pending';

      const readingDate = r.reading_month ? new Date(r.reading_month) : new Date();
      const monthLabel = readingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      return {
        id: r.id,
        amount: total,
        amount_paid: 0,
        due_date: r.reading_month || r.created_at || new Date().toISOString(),
        status,
        created_at: r.created_at || r.reading_month || new Date().toISOString(),
        bill_type: 'utility',
        remarks: `Utility bill for ${monthLabel}`,
      };
    });
  }

  // Build a rent bill from lease info when no rent payment records exist
  function buildRentBillFromLease(monthlyRent: number, dueDay?: number, startDate?: string): Payment[] {
    if (!monthlyRent) return [];

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const safeDay = Math.min(Math.max(dueDay || 1, 1), 28); // keep inside month
    const dueDate = new Date(year, month, safeDay);
    const dueISO = dueDate.toISOString();
    const monthLabel = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return [{
      id: `lease-${month + 1}-${year}`,
      amount: monthlyRent,
      amount_paid: 0,
      due_date: dueISO,
      status: 'pending',
      created_at: startDate || dueISO,
      bill_type: 'rent',
      remarks: `Rent for ${monthLabel}`,
    }];
  }

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      let derivedUtilityBills: Payment[] = [];
      let derivedRentBills: Payment[] = [];

      // 1. Get Tenant Unit Info
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('unit_id, property_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      const unitId = tenantData?.unit_id;
      const propertyId = tenantData?.property_id;

      // 1b. Fetch precise exact lease to get monthly rent
      let leaseMonthlyRent = 0;
      let leaseStartDate: string | undefined = undefined;

      const { data: activeLease } = await supabase
        .from("tenant_leases")
        .select(`
            rent_amount,
            start_date,
            units:unit_id (
              property_unit_types (
                 price_per_unit
              )
            )
        `)
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeLease) {
        // @ts-ignore
        leaseMonthlyRent = activeLease.rent_amount || activeLease.units?.property_unit_types?.price_per_unit || 0;
        leaseStartDate = activeLease.start_date;
      } else if (unitId) {
        const { data: unitDetails } = await supabase
          .from("units")
          .select("property_unit_types(price_per_unit)")
          .eq("id", unitId)
          .maybeSingle();
        // @ts-ignore
        if (unitDetails) leaseMonthlyRent = unitDetails.property_unit_types?.price_per_unit || 0;
      }

      setExactMonthlyRent(leaseMonthlyRent);

      if (leaseMonthlyRent > 0) {
        derivedRentBills = buildRentBillFromLease(
          leaseMonthlyRent,
          1, // default due day
          leaseStartDate
        );
      }

      // 2. Fetch Rent Payments
      const { data: rentData, error: rentError } = await supabase
        .from("rent_payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("due_date", { ascending: false });

      if (rentError) throw rentError;
      
      const allPaymentsRaw = (rentData || []).map((p: any) => {
         const isTriggerUtility = p.remarks?.toLowerCase().includes('utility') || p.bill_type === 'utility';
         return {
            ...p,
            amount_paid: p.amount_paid ?? 0,
            bill_type: isTriggerUtility ? 'utility' : (p.bill_type || 'rent')
         };
      });

      let pureRentList = allPaymentsRaw.filter((p: any) => p.bill_type === 'rent');
      const triggerUtilityBills = allPaymentsRaw.filter((p: any) => p.bill_type === 'utility');

      const hasRealRent = pureRentList.some((p: any) => (p.amount || 0) > 0);
      if (!hasRealRent && derivedRentBills.length > 0) {
        // Fallback to lease rent when rent_payments missing
        pureRentList = derivedRentBills;
      }
      setRentPayments(pureRentList);

      // 3. Fetch Utility Readings
      if (unitId) {
        const { data: readingsData } = await supabase
          .from("utility_readings")
          .select("*")
          .eq("unit_id", unitId)
          .order("reading_month", { ascending: false });

        if (readingsData) {
          const readingsWithUnit = readingsData.map((r: any) => ({
            ...r,
            unit_number: tenantData?.unit_id
          }));
          setUtilityReadings(readingsWithUnit);
          derivedUtilityBills = buildBillsFromReadings(readingsWithUnit);
        }
      }

      // 4. Fetch Bills (Using Unit ID)
      if (unitId) {
          const { data: billData, error: billError } = await supabase
            .from("bills_and_utilities")
            .select("*")
            .eq("unit_id", unitId)
            .order("bill_period_start", { ascending: false });

          if (billError) {
            console.warn("Tenant bills fetch failed, falling back to readings", billError);
          }
          // Map to common interface
          let formattedBills: Payment[] = (billData || []).map((b: any) => ({
             id: b.id,
             amount: b.amount,
             amount_paid: b.paid_amount ?? 0,
             due_date: b.due_date || b.bill_period_end || b.created_at,
             status: b.status,
             created_at: b.created_at,
             bill_type: b.bill_type || "utility", // Fallback for safety
             remarks: b.remarks
           }));

          let finalUtilityBills = [];
          const hasRealBills = formattedBills.some(b => (b.amount || 0) > 0);
          
          if (hasRealBills) {
             finalUtilityBills = formattedBills;
          } else if (triggerUtilityBills.length > 0) {
             finalUtilityBills = triggerUtilityBills;
          } else if (derivedUtilityBills.length > 0) {
             finalUtilityBills = derivedUtilityBills;
          }

          setUtilityBills(finalUtilityBills);
      }

      // 5. Fetch Utility Settings
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

  const getPaymentTypeLabel = (type: string | null) => {
    switch (type) {
      case 'rent': return 'Rent';
      case 'water': return 'Water Bill';
      case 'electricity': return 'Electricity';
      case 'garbage': return 'Garbage Collection';
      case 'all': return 'Pay All';
      default: return 'Payment';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'rent': return Home;
      case 'water': return Droplets;
      case 'electricity': return Zap;
      case 'garbage': return Trash2;
      case 'all': return DollarSign;
      default: return HelpCircle;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'rent': return 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300';
      case 'water': return 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:border-cyan-300';
      case 'electricity': return 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:border-yellow-300';
      case 'garbage': return 'bg-green-50 text-green-600 border-green-100 hover:border-green-300';
      case 'all': return 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300';
      default: return 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300';
    }
  };

  const handlePaymentTypeClick = (type: string) => {
    if (type === 'all') {
      // For lump sum, navigate directly to payment with all amount
      navigate(`/portal/tenant/payments/make?type=all&amount=${totalArrears}`);
    } else {
      setSelectedPaymentType(type);
      setPaymentAmount("");
    }
  };

  const handleQuickPay = (type: string, amount: number, id?: string) => {
    navigate(`/portal/tenant/payments/make?type=${type}&amount=${amount}${id ? `&id=${id}` : ''}`);
  };

  // Build utility line items from utility readings
  const buildUtilityLineItems = () => {
    const items: any[] = [];
    
    if (utilityReadings && utilityReadings.length > 0) {
      const reading = utilityReadings[0]; // Latest reading
      
      // Electricity
      if (reading.current_reading && reading.previous_reading) {
        const usage = Math.abs(reading.current_reading - reading.previous_reading);
        const bill = usage * (reading.electricity_rate || 0);
        if (bill > 0) {
          items.push({
            id: `electricity-${reading.id}`,
            type: 'electricity',
            label: 'Electricity',
            icon: Zap,
            amount: bill,
            description: `${usage} units @ ${formatCurrency(reading.electricity_rate)}/unit`,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
          });
        }
      }

      // Water
      if (reading.water_current_reading && reading.water_previous_reading) {
        const usage = Math.abs(reading.water_current_reading - reading.water_previous_reading);
        const bill = usage * (reading.water_rate || 0);
        if (bill > 0) {
          items.push({
            id: `water-${reading.id}`,
            type: 'water',
            label: 'Water',
            icon: Droplets,
            amount: bill,
            description: `${usage} units @ ${formatCurrency(reading.water_rate)}/unit`,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            borderColor: 'border-cyan-200'
          });
        }
      }

      // Fixed fees
      const fees = [
        { key: 'garbage_fee', label: 'Garbage Collection', icon: Trash2, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        { key: 'security_fee', label: 'Security', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { key: 'service_fee', label: 'Service Fee', icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
      ];

      fees.forEach(fee => {
        const rawAmount = reading[fee.key as keyof typeof reading];
        const amount = typeof rawAmount === 'number' ? rawAmount : (typeof rawAmount === 'string' ? parseFloat(rawAmount) : 0);
        if (amount > 0) {
          items.push({
            id: `${fee.key}-${reading.id}`,
            type: fee.key,
            label: fee.label,
            icon: fee.icon,
            amount: amount,
            description: 'Fixed monthly charge',
            color: fee.color,
            bgColor: fee.bgColor,
            borderColor: fee.borderColor
          });
        }
      });
    }
    
    return items;
  };

  const utilityLineItems = buildUtilityLineItems();
  const selectedItemsTotalAmount = Array.from(selectedPaymentItems).reduce((sum, itemId) => {
    if (itemId === 'rent') return sum + rentDue;
    const utilItem = utilityLineItems.find(u => u.id === itemId);
    return sum + (utilItem?.amount || 0);
  }, 0);

  const handleTogglePaymentItem = (itemId: string) => {
    const newSelected = new Set(selectedPaymentItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedPaymentItems(newSelected);
  };

  const proceedWithSelectedItems = () => {
    if (selectedPaymentItems.size === 0) {
      toast.error("Please select at least one item to pay");
      return;
    }
    // Navigate to payment with combined amount
    navigate(`/portal/tenant/payments/make?type=custom&amount=${selectedItemsTotalAmount}&items=${Array.from(selectedPaymentItems).join(',')}`);
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

  const totalArrears = rentDue + utilitiesDue;

  if (!selectedPaymentType && selectedPaymentType !== null) {
    // Just show normal view if user deselects
  }

  if (selectedPaymentType) {
    // Show payment form for selected type
    return (
      <div className="space-y-6 font-nunito min-h-screen bg-slate-50/50 pb-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPaymentType(null)}
            className="hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Pay {getPaymentTypeLabel(selectedPaymentType)}
            </h1>
            <p className="text-sm text-gray-500">Enter payment details</p>
          </div>
        </motion.div>

        <PaymentForm 
          paymentType={selectedPaymentType}
          rentPayments={rentPayments}
          utilityBills={utilityBills}
          utilityReadings={utilityReadings}
          navigate={navigate}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          globalUtilityFee={globalUtilityFee}
          utilitySettings={utilitySettings}
          getPaymentTypeLabel={getPaymentTypeLabel}
        />
      </div>
    );
  }

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
          onClick={() => setSelectedPaymentType('all')}
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

      {/* Payment Breakdown Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Breakdown</h2>
              <p className="text-slate-600">Complete itemization of your monthly obligations</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Total Amount Due</p>
              <p className="text-4xl font-bold text-[#F96302]">{formatCurrency(totalArrears)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rent Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-200 text-blue-700 rounded-lg">
                    <DollarSign size={18} />
                  </div>
                  <span className="font-semibold text-blue-900">Rent Payment</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Monthly Rent:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(exactMonthlyRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Paid:</span>
                  <span className="font-bold text-green-600">{formatCurrency(rentPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0))}</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-blue-900">Due:</span>
                  <span className="font-bold text-red-600">{formatCurrency(rentDue)}</span>
                </div>
              </div>
            </motion.div>

            {/* Utilities Card */}
            {(() => {
              const totalUtility = utilityBills.reduce((sum, p) => sum + (p.amount || 0), 0);
              const paidUtility = utilityBills.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
              return totalUtility > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-5 border border-cyan-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-200 text-cyan-700 rounded-lg">
                        <Droplets size={18} />
                      </div>
                      <span className="font-semibold text-cyan-900">Utilities & Bills</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-cyan-700">Amount:</span>
                      <span className="font-bold text-cyan-900">{formatCurrency(totalUtility)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-cyan-700">Paid:</span>
                      <span className="font-bold text-green-600">{formatCurrency(paidUtility)}</span>
                    </div>
                    <div className="border-t border-cyan-300 pt-2 flex justify-between">
                      <span className="text-sm font-semibold text-cyan-900">Due:</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalUtility - paidUtility)}</span>
                    </div>
                  </div>
                </motion.div>
              ) : null;
            })()}

            {/* Services & Fixed Fees Card */}
            {(() => {
              const latestReading = utilityReadings?.[0] || null;
              const securityFee = latestReading?.security_fee || utilitySettings?.security_fee || 0;
              const garbageFee = latestReading?.garbage_fee || utilitySettings?.garbage_fee || 0;
              const serviceFee = latestReading?.service_fee || utilitySettings?.service_fee || 0;
              const localFixedFee = securityFee + garbageFee + serviceFee;
              
              if (localFixedFee <= 0) return null;
              
              return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-200 text-purple-700 rounded-lg">
                      <Shield size={18} />
                    </div>
                    <span className="font-semibold text-purple-900">Fixed Operations</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const fees = [
                      { label: "Security", value: securityFee },
                      { label: "Garbage", value: garbageFee },
                      { label: "Service Fee", value: serviceFee },
                    ].filter(f => f.value > 0);

                    return (
                      <>
                        {fees.map(fee => (
                          <div key={fee.label} className="flex justify-between text-sm">
                            <span className="text-purple-700">{fee.label}:</span>
                            <span className="font-semibold text-purple-900">{formatCurrency(fee.value)}</span>
                          </div>
                        ))}
                        <div className="border-t border-purple-300 pt-2 mt-2 flex justify-between">
                          <span className="text-sm font-semibold text-purple-900">Total:</span>
                          <span className="font-bold text-red-600">{formatCurrency(localFixedFee)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* Current Statement detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
        <div className="bg-[#154279] p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Total Current Statement</h2>
            <p className="text-blue-100 mt-1">Itemized breakdown of your pending rent and utilities</p>
          </div>
          <div className="mt-4 sm:mt-0 text-center flex gap-4 items-center sm:text-right">
            <div className="text-right">
               <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold mb-1">Total Due Balance</p>
               <p className="text-3xl font-extrabold text-[#F96302]">
                 {formatCurrency(totalArrears)}
               </p>
            </div>
            {totalArrears > 0 && (
               <Button 
                 onClick={() => navigate(`/portal/tenant/payments/make?type=all&amount=${totalArrears}`)}
                 className="bg-[#F96302] hover:bg-[#d85501] text-white h-12 px-6 shadow-md shadow-orange-900/20 transition-all font-bold tracking-wide"
               >
                 <DollarSign className="mr-2" size={18} />
                 PAY LUMPSUM ({formatCurrency(totalArrears)})
               </Button>
            )}
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-slate-800">Charge Details</TableHead>
                <TableHead className="font-bold text-slate-800">Due Date</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Amount</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Paid</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Balance</TableHead>
                <TableHead className="font-bold text-slate-800 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {(() => {
                  const pendingRentPayments = rentPayments.filter(p => !['paid', 'completed'].includes(p.status));
                  const pendingUtilityBills = utilityBills.filter(p => !['paid', 'completed'].includes(p.status));
                  const allPending = [...pendingRentPayments, ...pendingUtilityBills].sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
                  
                  if (allPending.length === 0) {
                     return (
                       <TableRow>
                         <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-base">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            Good job! You have no outstanding balances.
                            <br />
                            <span className="text-sm">All caught up down to the last coin.</span>
                         </TableCell>
                       </TableRow>
                     )
                  }

                  return (
                     <>
                        {allPending.map(item => {
                           const isUtilityItem = (item.bill_type && item.bill_type !== 'rent') || (item.remarks && item.remarks.toLowerCase().includes('utility'));
                           const remainingAmount = Math.max(0, (Number(item.amount) || 0) - (item.amount_paid || 0));
                           const icon = isUtilityItem ? <Droplets size={18}/> : <DollarSign size={18}/>;
                           const iconBg = isUtilityItem ? "bg-cyan-50 text-cyan-600" : "bg-blue-50 text-blue-600";
                           const title = isUtilityItem ? "Monthly Utility Bill" : "Rent Payment";
                           
                           // Try matching the reading
                           let readingDetails = null;
                           if (isUtilityItem) {
                               const match = utilityReadings.find(r => {
                                  const rMonthStr = new Date(r.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                  const rawMonth = r.reading_month.substring(0,7);
                                  return item.remarks?.includes(rMonthStr) || item.due_date?.includes(rawMonth);
                               });
                               if (match) readingDetails = match;
                           }

                           return (
                             <React.Fragment key={item.id}>
                               <TableRow className={`border-slate-100 bg-white hover:bg-slate-50/50 ${readingDetails ? 'border-b-0' : 'border-b'}`}>
                                  <TableCell>
                                     <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
                                        <div>
                                          <p className="font-bold text-slate-900">{title}</p>
                                          <p className="text-xs text-slate-500 max-w-[200px] truncate" title={item.remarks}>{item.remarks || 'Standard charge'}</p>
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-slate-600 font-medium text-sm">
                                     <div className="flex flex-col">
                                        <span>{formatDate(item.due_date)}</span>
                                        <Badge variant="outline" className={cn("mt-1 w-fit text-[9px] uppercase tracking-wider", getStatusColor(item.status))}>
                                           {item.status}
                                        </Badge>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{formatCurrency(Number(item.amount) || 0)}</TableCell>
                                  <TableCell className="text-right text-green-600 font-medium">{formatCurrency(item.amount_paid || 0)}</TableCell>
                                  <TableCell className="text-right font-bold text-red-600">{formatCurrency(remainingAmount)}</TableCell>
                                  <TableCell className="text-right">
                                     <Button 
                                       size="sm" 
                                       className="bg-[#154279] hover:bg-[#103058] text-white h-8 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                                       onClick={() => {
                                          const type = isUtilityItem ? 'water' : 'rent';
                                          navigate(`/portal/tenant/payments/make?type=${type}&id=${item.id}&amount=${remainingAmount}`);
                                       }}
                                     >
                                       Pay Bill
                                     </Button>
                                  </TableCell>
                               </TableRow>
                               
                               {readingDetails && (
                                  <TableRow className="border-b border-slate-100">
                                     <TableCell colSpan={6} className="p-0 border-0">
                                        <div className="pl-14 pr-6 py-4 border-l-4 border-cyan-400 ml-5 my-0.5 mb-4 bg-slate-50 shadow-inner rounded-r-xl border-y border-r border-[#e2e8f0]">
                                           <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2"><Bell size={12}/> Itemized Breakdown</p>
                                              <p className="text-xs font-semibold text-slate-500">{new Date(readingDetails.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                           </div>
                                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                              <div>
                                                 <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Electricity</span>
                                                 <span className="font-bold text-slate-800">{formatCurrency(Math.abs(readingDetails.current_reading - readingDetails.previous_reading) * readingDetails.electricity_rate)}</span>
                                              </div>
                                              <div>
                                                 <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Water</span>
                                                 <span className="font-bold text-slate-800">{formatCurrency(Math.abs((readingDetails.water_current_reading || 0) - (readingDetails.water_previous_reading || 0)) * (readingDetails.water_rate || 0))}</span>
                                              </div>
                                              {(readingDetails.garbage_fee > 0 || readingDetails.security_fee > 0 || (readingDetails.service_fee && readingDetails.service_fee > 0)) && (
                                                 <div>
                                                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Fixed Fees</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(readingDetails.garbage_fee + readingDetails.security_fee + (readingDetails.service_fee || 0))}</span>
                                                 </div>
                                              )}
                                              {readingDetails.other_charges > 0 && (
                                                 <div>
                                                    <span className="text-slate-500 block text-[11px] uppercase tracking-wider mb-0.5">Other Charges</span>
                                                    <span className="font-bold text-slate-800">{formatCurrency(readingDetails.other_charges)}</span>
                                                 </div>
                                              )}
                                           </div>
                                        </div>
                                     </TableCell>
                                  </TableRow>
                               )}
                             </React.Fragment>
                           );
                        })}
                     </>
                  );
               })()}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Smart Payment Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8"
      >
        <div className="bg-gradient-to-r from-[#154279] to-[#1a5a96] p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={24} />
                Select Items to Pay
              </h2>
              <p className="text-blue-100 mt-1">Choose which bills to pay now - rent, utilities, or a custom combination</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPaymentSelector(!showPaymentSelector)}
              className="text-white hover:bg-white/20"
            >
              {showPaymentSelector ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </Button>
          </div>
        </div>

        {showPaymentSelector && (
          <div className="p-6 space-y-6">
            {/* Rent Section */}
            {rentDue > 0 && (
              <div className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="rent"
                    checked={selectedPaymentItems.has('rent')}
                    onCheckedChange={() => handleTogglePaymentItem('rent')}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Home size={18} />
                      </div>
                      <div>
                        <label htmlFor="rent" className="font-bold text-slate-900 cursor-pointer">Monthly Rent</label>
                        <p className="text-sm text-slate-600">Due {formatDate(rentPayments[0]?.due_date || new Date().toISOString())}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(rentDue)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Utilities Breakdown */}
            {utilityLineItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Droplets size={20} className="text-cyan-600" />
                  Utilities & Charges
                </h3>
                <div className="grid gap-3">
                  {utilityLineItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedPaymentItems.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "border-2 rounded-lg p-4 transition-all cursor-pointer",
                          isSelected
                            ? `${item.borderColor} ${item.bgColor} border-2`
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        )}
                        onClick={() => handleTogglePaymentItem(item.id)}
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                            className="w-5 h-5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 ${item.bgColor} ${item.color} rounded-lg`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.label}</p>
                                <p className="text-sm text-slate-600">{item.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(item.amount)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 h-12 font-bold"
                onClick={() => {
                  setSelectedPaymentItems(new Set(['rent']));
                }}
              >
                <Home size={18} className="mr-2" />
                Rent Only
              </Button>
              <Button
                variant="outline"
                className="border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50 h-12 font-bold"
                onClick={() => {
                  setSelectedPaymentItems(new Set(utilityLineItems.map(u => u.id)));
                }}
              >
                <Droplets size={18} className="mr-2" />
                Utilities Only
              </Button>
              <Button
                className="bg-[#F96302] hover:bg-[#d85501] text-white h-12 font-bold"
                onClick={() => {
                  setSelectedPaymentItems(new Set(['rent', ...utilityLineItems.map(u => u.id)]));
                }}
              >
                <DollarSign size={18} className="mr-2" />
                Pay All
              </Button>
            </div>

            {/* Selected Total and Pay Button */}
            {selectedPaymentItems.size > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-r from-[#154279] to-[#F96302] p-6 rounded-lg text-white flex items-center justify-between"
              >
                <div>
                  <p className="text-blue-100 text-sm font-semibold">Total to Pay</p>
                  <p className="text-3xl font-extrabold">{formatCurrency(selectedItemsTotalAmount)}</p>
                </div>
                <Button
                  onClick={proceedWithSelectedItems}
                  className="bg-white text-[#154279] hover:bg-blue-50 font-bold px-8 h-12 shadow-lg"
                >
                  <CreditCard size={18} className="mr-2" />
                  Proceed to Payment
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
           <TabsList>
             <TabsTrigger value="summary">Summary</TabsTrigger>
             <TabsTrigger value="all">All Transactions</TabsTrigger>
             <TabsTrigger value="receipts">Receipts</TabsTrigger>
           </TabsList>
        </div>

        <TabsContent value="summary" className="space-y-4">
          {/* Show the Current Statement Section */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
            <div className="bg-[#154279] p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Total Current Statement</h2>
                <p className="text-blue-100 mt-1">Itemized breakdown of your pending rent and utilities</p>
              </div>
              <div className="mt-4 sm:mt-0 text-center flex gap-4 items-center sm:text-right">
                <div className="text-right">
                   <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold mb-1">Total Due Balance</p>
                   <p className="text-3xl font-extrabold text-[#F96302]">
                     {formatCurrency(totalArrears)}
                   </p>
                </div>
                {totalArrears > 0 && (
                   <Button 
                     onClick={() => navigate(`/portal/tenant/payments/make?type=all&amount=${totalArrears}`)}
                     className="bg-[#F96302] hover:bg-[#d85501] text-white h-12 px-6 shadow-md shadow-orange-900/20 transition-all font-bold tracking-wide"
                   >
                     <DollarSign className="mr-2" size={18} />
                     PAY ALL ({formatCurrency(totalArrears)})
                   </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
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
                   onClick={() => handleQuickPay('utilities', globalUtilityFee)}
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
              handleQuickPay={handleQuickPay}
           />
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <TenantReceipts tenantId={user?.id || ''} />
        </TabsContent>
      </Tabs>
      
    </div>
  );
};

const PaymentsTable = ({ data, formatCurrency, formatDate, getStatusColor, navigate, handleQuickPay }: any) => {
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
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => {
             const isUtilityItem = (item.bill_type && item.bill_type !== 'rent') || (item.remarks && item.remarks.toLowerCase().includes('utility'));
             
             const typeLabel = isUtilityItem 
                ? (item.bill_type ? item.bill_type.charAt(0).toUpperCase() + item.bill_type.slice(1) + ' Bill' : 'Utility Bill')
                : 'Rent Payment';
             
             const isPaid = item.status === 'paid' || item.status === 'completed';
             const remainingAmount = Math.max(0, (Number(item.amount) || 0) - (item.amount_paid || 0));
             
             const handlePayClick = () => {
                const type = isUtilityItem ? 'water' : 'rent';
                handleQuickPay(type, remainingAmount, item.id);
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
                 <TableCell className="font-medium text-slate-900">{formatCurrency(Number(item.amount) || 0)}</TableCell>
                 <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount_paid || 0)}</TableCell>
                 <TableCell className={cn("font-bold", remainingAmount > 0 ? "text-red-600" : "text-slate-400")}>
                    {formatCurrency(remainingAmount)}
                 </TableCell>
                 <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", getStatusColor(item.status))}>
                        {item.status}
                    </Badge>
                 </TableCell>
                 <TableCell className="text-right">
                    {!isPaid && (
                        <Button 
                            size="sm" 
                            onClick={handlePayClick}
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

const PaymentForm: React.FC<{
  paymentType: string;
  rentPayments: Payment[];
  utilityBills: Payment[];
  utilityReadings: UtilityReading[];
  navigate: any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  globalUtilityFee: number;
  utilitySettings: any;
  getPaymentTypeLabel: (type: string) => string;
}> = ({
  paymentType,
  rentPayments,
  utilityBills,
  utilityReadings,
  navigate,
  formatCurrency,
  formatDate,
  globalUtilityFee,
  utilitySettings,
  getPaymentTypeLabel
}) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState<string>("");

  const getRelevantBills = () => {
    if (paymentType === 'rent') {
      return rentPayments.filter(p => !['paid', 'completed'].includes(p.status));
    } else if (paymentType === 'water' || paymentType === 'electricity' || paymentType === 'garbage') {
      return utilityBills.filter(p => 
        !['paid', 'completed'].includes(p.status) &&
        (
          (paymentType === 'water' && p.bill_type === 'water') ||
          (paymentType === 'electricity' && p.bill_type === 'electricity') ||
          (paymentType === 'garbage' && p.bill_type === 'garbage') ||
          (paymentType === 'water' && (!p.bill_type || p.bill_type === 'utility'))
        )
      );
    }
    return [];
  };

  const bills = getRelevantBills();
  const defaultBill = bills.length > 0 ? bills[0] : null;
  const defaultAmount = defaultBill ? (defaultBill.amount - (defaultBill.amount_paid || 0)) : 0;

  const handleSelectBill = (bill: any) => {
    setSelectedItem(bill);
    setCustomAmount(((bill.amount - (bill.amount_paid || 0)) || 0).toString());
  };

  const handleProceedToPayment = () => {
    const amount = customAmount ? parseFloat(customAmount) : defaultAmount;
    if (!amount || amount <= 0) {
      return;
    }
    navigate(`/portal/tenant/payments/make?type=${paymentType}&id=${selectedItem?.id || ''}&amount=${amount}`);
  };

  return (
    <div className="space-y-6">
      {bills.length > 0 ? (
        <>
          <Card className="shadow-lg border-t-4 border-t-[#F96302]">
            <CardHeader>
              <CardTitle>Select {getPaymentTypeLabel(paymentType)} to Pay</CardTitle>
              <CardDescription>Choose a bill or enter custom amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bills.map((bill) => {
                const balance = bill.amount - (bill.amount_paid || 0);
                const isSelected = selectedItem?.id === bill.id;
                return (
                  <div
                    key={bill.id}
                    onClick={() => handleSelectBill(bill)}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all",
                      isSelected
                        ? "border-[#F96302] bg-orange-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{paymentType === 'rent' ? `Rent` : `${bill.bill_type || 'Utility'} Bill`}</p>
                        <p className="text-sm text-slate-600">Due: {formatDate(bill.due_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(balance)}</p>
                        <p className="text-xs text-slate-500">Due</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Bill Breakdown Section - Show for Utility Bills */}
          {selectedItem && paymentType !== 'rent' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl shadow-lg border-2 border-emerald-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <h3 className="text-xl font-bold">Bill Calculation Breakdown</h3>
                <p className="text-emerald-100 text-sm mt-1">Itemized breakdown of your utility charges</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Electricity Section */}
                {(() => {
                  const reading = utilityReadings.find(r => {
                    const rMonthStr = new Date(r.reading_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const rawMonth = r.reading_month.substring(0, 7);
                    return selectedItem.remarks?.includes(rMonthStr) || selectedItem.due_date?.includes(rawMonth);
                  });

                  if (!reading) return null;

                  // Calculate usage as the range/magnitude between readings
                  const electricityUsage = Math.abs(reading.current_reading - reading.previous_reading);
                  const electricityBill = electricityUsage * reading.electricity_rate;
                  const waterUsage = Math.abs((reading.water_current_reading || 0) - (reading.water_previous_reading || 0));
                  const waterBill = waterUsage * (reading.water_rate || 0);
                  const fixedFees = Math.abs(reading.garbage_fee || 0) + Math.abs(reading.security_fee || 0) + Math.abs(reading.service_fee || 0);
                  const totalBill = electricityBill + waterBill + fixedFees + Math.abs(reading.other_charges || 0);

                  return (
                    <>
                      <div className="border-b border-emerald-200 pb-6">
                        <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                          <Zap size={18} className="text-yellow-600" />
                          Electricity
                        </h4>
                        <div className="bg-white p-4 rounded-lg space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Current Reading:</span>
                            <span className="font-semibold text-slate-900">{reading.current_reading}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Previous Reading:</span>
                            <span className="font-semibold text-slate-900">{reading.previous_reading}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                            <span className="text-slate-600">Usage (Units):</span>
                            <span className="font-bold text-slate-900">{electricityUsage}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Rate per Unit:</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(reading.electricity_rate)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold bg-yellow-50 p-3 rounded border border-yellow-200">
                            <span className="text-yellow-900">Electricity Bill:</span>
                            <span className="text-yellow-700">{formatCurrency(electricityBill)}</span>
                          </div>
                        </div>
                      </div>

                      {waterUsage > 0 && (
                        <div className="border-b border-emerald-200 pb-6">
                          <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                            <Droplets size={18} className="text-cyan-600" />
                            Water
                          </h4>
                          <div className="bg-white p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Current Reading:</span>
                              <span className="font-semibold text-slate-900">{reading.water_current_reading}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Previous Reading:</span>
                              <span className="font-semibold text-slate-900">{reading.water_previous_reading}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                              <span className="text-slate-600">Usage (Units):</span>
                              <span className="font-bold text-slate-900">{waterUsage}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Rate per Unit:</span>
                              <span className="font-semibold text-slate-900">{formatCurrency(reading.water_rate || 0)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold bg-cyan-50 p-3 rounded border border-cyan-200">
                              <span className="text-cyan-900">Water Bill:</span>
                              <span className="text-cyan-700">{formatCurrency(waterBill)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fixed Fees Section */}
                      {fixedFees > 0 && (
                        <div className="border-b border-emerald-200 pb-6">
                          <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-purple-600" />
                            Fixed Charges
                          </h4>
                          <div className="bg-white p-4 rounded-lg space-y-3">
                            {reading.garbage_fee > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Garbage Fee:</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(reading.garbage_fee)}</span>
                              </div>
                            )}
                            {reading.security_fee > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Security Fee:</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(reading.security_fee)}</span>
                              </div>
                            )}
                            {reading.service_fee && reading.service_fee > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Service Fee:</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(reading.service_fee)}</span>
                              </div>
                            )}
                            {reading.other_charges && reading.other_charges > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Other Charges:</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(reading.other_charges)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base font-bold bg-purple-50 p-3 rounded border border-purple-200">
                              <span className="text-purple-900">Total Fees:</span>
                              <span className="text-purple-700">{formatCurrency(fixedFees + (reading.other_charges || 0))}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total Bill */}
                      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-6 rounded-lg border-2 border-emerald-300">
                        <div className="flex justify-between items-center">
                          <h4 className="text-2xl font-bold text-emerald-900">TOTAL BILL</h4>
                          <div className="text-right">
                            <p className="text-3xl font-extrabold text-emerald-700">{formatCurrency(totalBill)}</p>
                            <p className="text-xs text-emerald-600 mt-1">Amount Due</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Payment Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">Default Amount (Balance Due)</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(customAmount ? parseFloat(customAmount) : (selectedItem ? (selectedItem.amount - (selectedItem.amount_paid || 0)) : defaultAmount))}</p>
              </div>

              <div className="space-y-2">
                <Label>Custom Amount (Optional - to pay less)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">KSh</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={defaultAmount.toString()}
                    className="pl-12 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-slate-500">Leave blank to pay the full balance</p>
              </div>

              <Button
                onClick={handleProceedToPayment}
                className="w-full bg-[#154279] hover:bg-[#0f325e] text-white py-3 px-4 rounded-xl font-bold uppercase tracking-wider transition-all shadow-lg"
              >
                <CreditCard className="mr-2" size={18} />
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default PaymentsPage;