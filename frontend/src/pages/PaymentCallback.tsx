// frontend/src/pages/PaymentCallback.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"checking" | "success" | "failed" | "pending">("checking");
  const [message, setMessage] = useState<string>("Verifying your payment...");
  const [txRef, setTxRef] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const tx_ref = searchParams.get("tx_ref");
        const status = searchParams.get("status");

        if (!tx_ref) {
          setStatus("failed");
          setMessage("No transaction reference found");
          return;
        }

        setTxRef(tx_ref);

        // The webhook from Flutterwave will handle the actual payment confirmation
        // This page just shows the user what happened
        if (status === "cancelled") {
          setStatus("failed");
          setMessage("Payment was cancelled by the user");
          return;
        }

        if (status === "failed") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          return;
        }

        // Status is unknown, widget should handle the verification
        // Check payment status in database after a short delay
        // (webhook might still be processing)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { data: payment } = await supabase
          .from("payments")
          .select("*, invoices(*, tenants(*))")
          .eq("tx_ref", tx_ref)
          .single();

        if (payment && payment.status === "successful") {
          setStatus("success");
          setMessage("Payment received successfully! Your receipt is being generated.");
          setDetails(payment);

          // Redirect after 3 seconds
          setTimeout(() => {
            navigate("/portal/tenant/payments", { state: { paymentSuccess: true } });
          }, 3000);
        } else {
          setStatus("pending");
          setMessage(
            "Payment status is being confirmed. Please wait, you'll be notified shortly."
          );
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("pending");
        setMessage(
          "Verifying your payment status... If you were charged, the payment will be confirmed shortly."
        );
      }
    };

    checkPaymentStatus();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Transaction Reference: {txRef || "—"}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === "checking" || status === "pending" ? (
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              ) : status === "success" ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-600" />
              )}
            </div>

            {/* Status Message */}
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {status === "success"
                  ? "Payment Successful"
                  : status === "failed"
                  ? "Payment Failed"
                  : "Verifying Payment"}
              </p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>

            {/* Payment Details (if successful) */}
            {status === "success" && details && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Invoice:</strong> {details.invoices?.invoice_number}
                  <br />
                  <strong>Amount Paid:</strong> KES{" "}
                  {details.amount.toLocaleString("en-KE", {
                    minimumFractionDigits: 2,
                  })}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert (if failed) */}
            {status === "failed" && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert (if pending) */}
            {status === "pending" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment verification is in progress. You'll receive an email confirmation
                  and can check your payment status in the Payments page.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {status === "failed" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/portal/tenant/payments")}
                    className="flex-1"
                  >
                    Back to Payments
                  </Button>
                  <Button
                    onClick={() => navigate("/portal/tenant/payments?retry=true")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Try Again
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/portal/tenant/payments")}
                  className="w-full"
                  disabled={status !== "success"}
                >
                  {status === "success" ? "Go to Payments" : "Redirecting..."}
                </Button>
              )}
            </div>

            {/* Support Info */}
            <div className="border-t pt-4 text-center text-xs text-gray-500">
              <p>If you have any issues, please contact support.</p>
              <p>Email: support@realtor.co.ke</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCallback;
