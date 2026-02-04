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
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: "pending" | "completed" | "overdue" | "failed";
  payment_method: string;
  created_at: string;
}

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [user?.id]);

  const fetchPayments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rent_payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
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
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "failed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    // You can expand this logic if you have different icons for different methods
    return <CreditCard className="text-[#154279]" size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <img
          src="/lovable-uploads/27116824-00d0-4ce0-8d5f-30a840902c33.png"
          alt="Loading..."
          className="w-16 h-16 animate-spin opacity-20"
        />
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueAmount = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 font-nunito min-h-screen bg-slate-50/50">
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
              Payments
            </h1>
            <p className="text-sm text-gray-500">Manage your rent and viewing history</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#154279]">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <CheckCircle size={12} className="mr-1" /> Lifetime contribution
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#F96302]">
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-xs text-yellow-600 mt-1 flex items-center">
                <Clock size={12} className="mr-1" /> Due soon
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(overdueAmount)}
              </div>
              {overdueAmount > 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center font-medium">
                  <AlertTriangle size={12} className="mr-1" /> Action Required
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100">
            <div>
              <CardTitle className="text-xl text-[#154279]">Payment History</CardTitle>
              <CardDescription>A complete log of your rent payments</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter size={16} className="mr-2" /> Filter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <p>No payments found</p>
                </div>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-2.5 rounded-full text-[#154279] group-hover:bg-[#154279] group-hover:text-white transition-colors">
                        {getPaymentMethodIcon(payment.payment_method)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {payment.description || "Monthly Rent"}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                          {formatDate(payment.created_at)}
                          <span className="mx-1.5">•</span>
                          {payment.payment_method || "Online"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 mb-1">
                        {formatCurrency(payment.amount)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize font-normal", getStatusColor(payment.status))}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentsPage;
