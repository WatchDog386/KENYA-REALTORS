// src/components/dialogs/PaystackPaymentDialog.tsx
import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initializePaystackPayment, verifyPaystackTransaction, getPaystackPublicKey } from "@/services/paystackService";
import { toast } from "sonner";

export interface PaystackPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  amount: number;
  description: string;
  paymentType: "rent" | "water" | "electricity" | "garbage" | "other";
  referenceId?: string;
  onPaymentSuccess: (transactionRef: string, details: any) => void;
  onPaymentError?: (error: string) => void;
}

const PaystackPaymentDialog: React.FC<PaystackPaymentDialogProps> = ({
  open,
  onOpenChange,
  email,
  amount,
  description,
  paymentType,
  referenceId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "initializing" | "waiting" | "verifying" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [paystackPublicKey, setPaystackPublicKey] = useState<string | null>(null);
  const [keyLoadingError, setKeyLoadingError] = useState<string | null>(null);

  // Load Paystack public key
  useEffect(() => {
    const loadPaystackKey = async () => {
      try {
        const key = await getPaystackPublicKey();
        setPaystackPublicKey(key);
        setKeyLoadingError(null);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to load Paystack configuration";
        setKeyLoadingError(errorMsg);
        console.error("Failed to load Paystack public key:", errorMsg);
      }
    };

    if (open) {
      loadPaystackKey();
    }
  }, [open]);

  // Initialize Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {};
    script.onerror = () => {
      console.error("Failed to load Paystack SDK");
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script to avoid reload issues
      // document.body.removeChild(script);
    };
  }, []);

  // Wait for Paystack SDK to load
  const waitForPaystackSDK = (maxAttempts = 10): Promise<any> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkSDK = setInterval(() => {
        const PaystackPop = (window as any).PaystackPop;
        if (PaystackPop && PaystackPop.setup) {
          clearInterval(checkSDK);
          resolve(PaystackPop);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkSDK);
          reject(new Error("Paystack SDK failed to load. Please refresh and try again."));
        }
        attempts++;
      }, 200);
    });
  };

  const handlePayment = async () => {
    if (!paystackPublicKey) {
      const error = keyLoadingError || "Paystack public key is not configured";
      setErrorMessage(error);
      setTransactionStatus("error");
      onPaymentError?.(error);
      return;
    }

    setLoading(true);
    setTransactionStatus("initializing");
    setErrorMessage(null);

    // Always use a unique transaction reference for Paystack
    const ref = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setTransactionReference(ref);

    try {
      // Wait for Paystack SDK to load properly
      const PaystackPop = await waitForPaystackSDK();
      
      if (!PaystackPop || !PaystackPop.setup) {
         throw new Error("Paystack SDK not properly initialized");
      }

      const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: 'KES',
        ref: ref,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
            paymentType,
            description,
          referenceId,
             custom_fields: [
                {
                    display_name: "Payment Type",
                    variable_name: "payment_type",
                    value: paymentType
                }
            ]
        },
        callback: (transaction: any) => {
          // transaction.reference should match our ref
          verifyTransaction(transaction.reference);
        },
        onClose: () => {
          setLoading(false);
          setTransactionStatus("idle"); // User closed popup
          setErrorMessage("Payment canceled");
        }
      });

      handler.openIframe();
      
    } catch (error: any) {
      console.error("Payment init error:", error);
      const errorMsg = error.message || "Failed to open payment dialog. Please try again.";
      setErrorMessage(errorMsg);
      setTransactionStatus("error");
      setLoading(false);
      onPaymentError?.(errorMsg);
    }
  };

  // Restored handleVerifyPayment for the UI button
  const handleVerifyPayment = () => {
      if (transactionReference) {
          verifyTransaction(transactionReference);
      } else {
          setErrorMessage("No reference to verify");
      }
  };

  const verifyTransaction = async (reference: string) => {
    setTransactionStatus("verifying");
    try {
      const verifyResponse = await verifyPaystackTransaction(reference);
      if (!verifyResponse.status) {
        throw new Error(verifyResponse.message || "Payment verification failed");
      }

      if (verifyResponse.verification_unavailable) {
        console.info("Server verification unavailable; using callback fallback.");
        onPaymentSuccess(reference, {
          status: "success",
          reference,
          amount,
          verification_unavailable: true,
          fallback_reason: verifyResponse.fallback_reason,
        });
      } else {
        onPaymentSuccess(reference, verifyResponse.data);
      }

      setTransactionStatus("success");
      
      setTimeout(() => {
        onOpenChange(false);
        resetDialog();
      }, 2000);
    } catch (error: any) {
       console.error("Verification fatal error:", error);
       setErrorMessage(error.message);
       setTransactionStatus("error");
    }
  };


  const resetDialog = () => {
    setLoading(false);
    setTransactionStatus("idle");
    setErrorMessage(null);
    setTransactionReference(null);
  };

  const handleClose = (value: boolean) => {
    if (transactionStatus !== "waiting") {
      resetDialog();
      onOpenChange(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transactionStatus === "success" ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Payment Successful
              </>
            ) : transactionStatus === "error" ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Payment Failed
              </>
            ) : (
              <>
                <span className="text-lg font-semibold">Secure Payment</span>
              </>
            )}
          </DialogTitle>
          {transactionStatus !== "success" && transactionStatus !== "error" && (
            <DialogDescription>
              Pay {description} using Paystack
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          {transactionStatus !== "success" && transactionStatus !== "error" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    KES {amount.toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold capitalize">{paymentType}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {transactionStatus === "success" && (
            <div className="text-center space-y-2">
              <p className="text-green-600 font-semibold">
                Payment completed successfully!
              </p>
              <p className="text-sm text-gray-600">
                Reference: {transactionReference}
              </p>
            </div>
          )}

          {/* Loading State */}
          {(transactionStatus === "initializing" || transactionStatus === "verifying") && (
            <div className="text-center space-y-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600">
                {transactionStatus === "initializing"
                  ? "Initializing payment..."
                  : "Verifying payment..."}
              </p>
            </div>
          )}

          {/* Waiting State */}
          {transactionStatus === "waiting" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to complete payment at Paystack.
                After successful payment, return here to complete the transaction.
              </AlertDescription>
            </Alert>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {transactionStatus === "idle" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </>
            )}

            {transactionStatus === "waiting" && (
              <Button
                onClick={handleVerifyPayment}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Verify Payment
              </Button>
            )}

            {(transactionStatus === "error" || transactionStatus === "success") && (
              <Button
                onClick={() => handleClose(false)}
                className="w-full"
              >
                {transactionStatus === "error" ? "Try Again" : "Close"}
              </Button>
            )}
          </div>

          {/* Info Message */}
          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
            Your payment is secured by Paystack. No sensitive data will be stored on our servers.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaystackPaymentDialog;
