// src/pages/portal/tenant/PaymentsTenantNew.tsx
// Tenant Payments Page - New Paystack Integration
// Displays invoices and handles rent payments with webhook verification

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  DollarSign,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PaystackPaymentDialog from "@/components/dialogs/PaystackPaymentDialog";
import { downloadReceiptPDF, formatReceiptData } from "@/utils/receiptGenerator";
import jsPDF from "jspdf";

interface Invoice {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_number: string;
  amount: number;
  description: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue" | "cancelled";
  paid_at?: string;
  created_at: string;
}

interface Receipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  payment_method: string;
  transaction_reference: string;
  generated_at: string;
  pdf_url?: string;
}

const TenantPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch tenant data
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState<string>("");

  // Real-time subscription
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!user?.id) {
        toast.error("User not authenticated");
        navigate("/login");
        return;
      }

      try {
        // Get tenant ID from tenants table
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (tenantError || !tenantData) {
          toast.error("Could not load tenant information");
          navigate("/");
          return;
        }

        setTenantId(tenantData.id);
        setTenantEmail(user.email || "");

        // Subscribe to real-time changes
        const subscription = supabase
          .channel("invoices-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "invoices",
              filter: `tenant_id=eq.${tenantData.id}`,
            },
            () => {
              fetchInvoices(tenantData.id);
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching tenant data:", error);
      }
    };

    fetchTenantData();
  }, [user, navigate]);

  // Fetch invoices
  const fetchInvoices = async (tid: string) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tid)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to load invoices");
    }
  };

  // Fetch receipts
  const fetchReceipts = async (tid: string) => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("tenant_id", tid)
        .order("generated_at", { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;

      setLoading(true);
      try {
        await Promise.all([
          fetchInvoices(tenantId),
          fetchReceipts(tenantId),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId]);

  // Refresh data
  const handleRefresh = async () => {
    if (!tenantId) return;

    setRefreshing(true);
    try {
      await Promise.all([
        fetchInvoices(tenantId),
        fetchReceipts(tenantId),
      ]);
      toast.success("Data refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  // Open payment dialog
  const handlePayNow = (invoice: Invoice) => {
    if (invoice.status !== "unpaid") {
      toast.error(`This invoice is already ${invoice.status}`);
      return;
    }

    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  // Handle successful payment (from webhook)
  const handlePaymentSuccess = async (transactionRef: string, details: any) => {
    console.log("✅ Payment successful:", transactionRef);
    toast.success("Payment completed! Your dashboard is being updated...");

    // Refresh data immediately and then again after 2 seconds to ensure webhook processed
    if (tenantId) {
      fetchInvoices(tenantId);
      fetchReceipts(tenantId);
    }

    // After another 3 seconds, redirect back to tenant dashboard to show full access
    setTimeout(() => {
      console.log("🚀 Redirecting to tenant dashboard...");
      navigate("/portal/tenant", { replace: true });
    }, 3000);

    setPaymentDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment error: ${error}`);
  };

  // Download receipt
  const handleDownloadReceipt = async (receipt: Receipt) => {
    try {
      if (receipt.pdf_url) {
        const response = await fetch(receipt.pdf_url);
        if (!response.ok) throw new Error("Receipt file not reachable");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${receipt.receipt_number || "receipt"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Receipt downloaded");
        return;
      }

      const receiptData = formatReceiptData(receipt, {
        name: "Property Management System",
        address: "Nairobi, Kenya",
        phone: "+254 (0) 123 456 789",
      });

      downloadReceiptPDF(receiptData);
      toast.success("Receipt downloaded");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("INVOICE", 14, 20);
      doc.setFontSize(10);
      doc.text(`Invoice ID: ${invoice.id}`, 14, 32);
      doc.text(`Unit: ${invoice.unit_number || "N/A"}`, 14, 38);
      doc.text(`Status: ${invoice.status}`, 14, 44);
      doc.text(`Issued: ${new Date(invoice.created_at).toLocaleDateString("en-KE")}`, 14, 50);
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString("en-KE")}`, 14, 56);
      doc.text(`Amount: KES ${Number(invoice.amount || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`, 14, 62);
      if (invoice.description) {
        const wrapped = doc.splitTextToSize(String(invoice.description), 180);
        doc.text("Description:", 14, 74);
        doc.text(wrapped, 14, 80);
      }
      doc.save(`invoice-${invoice.id.slice(0, 8)}.pdf`);
      toast.success("Invoice downloaded");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  // Calculate summary
  const summary = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0),
    unpaid: invoices
      .filter((inv) => inv.status === "unpaid")
      .reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices
      .filter((inv) => inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.amount, 0),
  };

  const statusColor = {
    paid: "bg-green-100 text-green-800",
    unpaid: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  const statusIcon = {
    paid: <CheckCircle className="h-4 w-4" />,
    unpaid: <Clock className="h-4 w-4" />,
    overdue: <AlertTriangle className="h-4 w-4" />,
    cancelled: <EyeOff className="h-4 w-4" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Manage your rent payments and track transaction history
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {summary.total.toLocaleString("en-KE", { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {summary.paid.toLocaleString("en-KE", { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">
              Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              KES {summary.unpaid.toLocaleString("en-KE", { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              KES {summary.overdue.toLocaleString("en-KE", { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      {summary.unpaid > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-700" />
          <AlertDescription className="text-yellow-800">
            You have unpaid invoices. Please pay them to avoid penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        KES {invoice.amount.toLocaleString("en-KE", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.due_date).toLocaleDateString("en-KE")}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor[invoice.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcon[invoice.status]}
                            {invoice.status.charAt(0).toUpperCase() +
                              invoice.status.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.paid_at
                          ? new Date(invoice.paid_at).toLocaleDateString("en-KE")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Invoice
                          </Button>
                          {invoice.status === "unpaid" && (
                            <Button
                              size="sm"
                              onClick={() => handlePayNow(invoice)}
                              disabled={processingPayment}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipts Table */}
      {receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-sm font-bold">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        KES {receipt.amount.toLocaleString("en-KE")}
                      </TableCell>
                      <TableCell>
                        {new Date(receipt.generated_at).toLocaleDateString(
                          "en-KE"
                        )}
                      </TableCell>
                      <TableCell>{receipt.payment_method}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {receipt.transaction_reference.substring(0, 16)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReceipt(receipt)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {selectedInvoice && (
        <PaystackPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          email={tenantEmail}
          amount={selectedInvoice.amount}
          description={selectedInvoice.description}
          paymentType="rent"
          referenceId={selectedInvoice.id}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default TenantPaymentsPage;
