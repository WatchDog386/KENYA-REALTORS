import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart,
  Download,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface PendingInvoice {
  id: string;
  amount: number;
  due_date: string;
  status: "unpaid" | "overdue" | "pending";
  property_id?: string;
  unit_id?: string;
  notes?: string;
}

interface OnboardingData {
  application: {
    id: string;
    unit_id: string;
    property_id: string;
    applicant_name?: string;
    status: string;
    created_at: string;
  } | null;
  pendingInvoice: PendingInvoice | null;
  property: {
    id: string;
    name: string;
    location?: string;
  } | null;
  unit: {
    id: string;
    unit_number?: string;
  } | null;
}

export const TenantOnboardingHub: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    application: null,
    pendingInvoice: null,
    property: null,
    unit: null,
  });

  useEffect(() => {
    if (user?.id) {
      fetchOnboardingData();
      setupInvoiceListener();
    }
  }, [user?.id]);

  // Set up real-time listener for invoice status changes
  const setupInvoiceListener = () => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("invoice_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "invoices",
        },
        (payload: any) => {
          console.log("📣 Invoice updated:", payload.new);
          // Check if the payment status changed to paid
          if (payload.new.status === "paid" && payload.old.status !== "paid") {
            console.log("💰 Invoice paid! Redirecting to dashboard...");
            setTimeout(() => {
              navigate("/portal/tenant");
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);

      // Fetch latest application
      const { data: applicationData } = await supabase
        .from("lease_applications")
        .select("id, unit_id, property_id, applicant_name, status, created_at")
        .eq("applicant_id", user?.id)
        .in("status", ["pending", "under_review", "approved", "invoice_sent"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!applicationData) {
        console.warn("No application found");
        setLoading(false);
        return;
      }

      // Fetch pending invoice
      const buildInvoiceQuery = () =>
        supabase
          .from("invoices")
          .select("id, amount, due_date, status, property_id, unit_id")
          .eq("property_id", applicationData.property_id)
          .in("status", ["unpaid", "overdue", "pending"])
          .order("created_at", { ascending: false })
          .limit(1);

      const createdAtIso = applicationData.created_at ? new Date(applicationData.created_at).toISOString() : null;
      const primaryInvoiceResponse = createdAtIso
        ? await buildInvoiceQuery().gte("created_at", createdAtIso).maybeSingle()
        : await buildInvoiceQuery().maybeSingle();

      let invoiceData = primaryInvoiceResponse.data;
      let invoiceError = primaryInvoiceResponse.error;

      if (invoiceError && createdAtIso) {
        console.warn("⚠️ Onboarding invoice lookup with created_at filter failed. Retrying without time filter.", invoiceError);
        const fallbackInvoiceResponse = await buildInvoiceQuery().maybeSingle();
        invoiceData = fallbackInvoiceResponse.data;
        invoiceError = fallbackInvoiceResponse.error;
      }

      if (invoiceError) {
        console.error("❌ Failed to fetch onboarding invoice:", invoiceError);
        setLoading(false);
        return;
      }

      // If no unpaid invoice found, payment already completed - redirect to dashboard
      if (!invoiceData) {
        console.log("✅ No pending invoices found - payment completed!");
        navigate("/portal/tenant");
        return;
      }
      // Fetch property details
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id, name, location")
        .eq("id", applicationData.property_id)
        .single();

      // Fetch unit details
      const { data: unitData } = await supabase
        .from("units")
        .select("id, unit_number")
        .eq("id", applicationData.unit_id)
        .single();

      setData({
        application: applicationData,
        pendingInvoice: invoiceData || null,
        property: propertyData || null,
        unit: unitData || null,
      });
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#154279]" />
          <p className="text-slate-600 text-sm font-medium">Setting up your account...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = data.pendingInvoice?.status === "overdue";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 md:px-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="bg-gradient-to-r from-[#154279] to-blue-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                <Heart className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome Home!</h1>
            <p className="text-blue-100 text-lg font-medium">
              Complete your onboarding to access your full tenant dashboard
            </p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 20 }} className="mb-12">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Step 1: Application */}
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">Application</div>
              <div className="text-xs text-slate-500 mt-1">Submitted</div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-emerald-200 to-amber-200"></div>
            </div>

            {/* Step 2: Payment */}
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", isOverdue ? "bg-red-100" : "bg-amber-100")}>
                  <CreditCard className={cn("w-6 h-6", isOverdue ? "text-red-600" : "text-amber-600")} />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700">Payment</div>
              <div className="text-xs text-slate-500 mt-1">Pending</div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Property & Unit Info Card */}
          {data.property && data.unit && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Card className="border-none shadow-lg bg-white">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Home className="w-5 h-5 text-[#154279]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Your Unit</CardTitle>
                      <CardDescription>Property & Accommodation Details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Property</p>
                        <p className="text-base font-bold text-slate-800">{data.property.name}</p>
                        <p className="text-sm text-slate-600 mt-1">{data.property.location}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Unit Number</p>
                      <p className="text-lg font-bold text-[#154279]">{data.unit.unit_number || "TBA"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Invoice Payment Card */}
          {data.pendingInvoice && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Card className={cn("border-none shadow-lg", isOverdue ? "bg-red-50 border-2 border-red-200" : "bg-white")}>
                <CardHeader className={cn("border-b pb-4", isOverdue ? "border-red-100" : "border-slate-100")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-lg", isOverdue ? "bg-red-100" : "bg-orange-50")}>
                        <CreditCard className={cn("w-5 h-5", isOverdue ? "text-red-600" : "text-[#F96302]")} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Payment Required</CardTitle>
                        <CardDescription>{isOverdue ? "Overdue Invoice" : "Complete your onboarding"}</CardDescription>
                      </div>
                    </div>
                    {isOverdue && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total Amount Due</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-[#154279]">
                          {formatCurrency(data.pendingInvoice.amount)}
                        </span>
                        <span className="text-sm text-slate-500">KES</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Due Date</p>
                        <p className="font-semibold text-slate-700">{formatDate(data.pendingInvoice.due_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                        <Badge className={cn("text-[10px] font-bold", isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                          {data.pendingInvoice.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 text-sm">Payment Overdue</p>
                          <p className="text-xs text-red-700 mt-1">
                            Please complete your payment immediately to access your dashboard and unit.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* What Happens Next */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="border-none shadow-lg bg-blue-50 border border-blue-100">
              <CardHeader className="pb-4 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#154279]" />
                  <CardTitle className="text-lg">What Happens Next</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#154279] text-white text-sm font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Complete Payment</p>
                      <p className="text-sm text-slate-600 mt-1">Pay the invoice securely using Paystack</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#F96302] text-white text-sm font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Receive Receipt</p>
                      <p className="text-sm text-slate-600 mt-1">An official receipt will be generated automatically</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white text-sm font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Sign Lease Agreement</p>
                      <p className="text-sm text-slate-600 mt-1">Review and finalize your A4-styled lease agreement</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                        4
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Full Access Unlocked</p>
                      <p className="text-sm text-slate-600 mt-1">Access your complete tenant dashboard and all features</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 20 }} transition={{ delay: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/portal/tenant/payments")}
              className="w-full h-auto py-4 px-6 bg-[#154279] hover:bg-[#0f305a] text-white font-bold text-base rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Pay Now
              <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open("/documents", "_blank")}
              className="w-full h-auto py-4 px-6 border-2 border-[#154279] text-[#154279] hover:bg-blue-50 font-bold text-base rounded-xl transition-all"
            >
              <Download className="w-5 h-5 mr-3" />
              View Lease Details
            </Button>
          </motion.div>

          {/* Support Info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center py-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Need help?</p>
            <Button variant="link" className="text-[#F96302] font-bold hover:text-[#d85501]">
              Contact Support
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TenantOnboardingHub;
