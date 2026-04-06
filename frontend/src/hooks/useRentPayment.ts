// src/hooks/useRentPayment.ts
// Custom hook for managing rent payments using Paystack integration

import { useState, useCallback } from "react";
import { createRentPayment, initializePaystackPayment } from "@/services/paystackService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RentPaymentState {
  loading: boolean;
  error: string | null;
  authorizationUrl: string | null;
  reference: string | null;
}

export const useRentPayment = () => {
  const [state, setState] = useState<RentPaymentState>({
    loading: false,
    error: null,
    authorizationUrl: null,
    reference: null,
  });

  /**
   * Initialize rent payment using invoice
   */
  const initializeRentPayment = useCallback(
    async (
      tenantId: string,
      invoiceId: string,
      amount: number,
      tenantEmail: string
    ) => {
      setState({ loading: true, error: null, authorizationUrl: null, reference: null });

      try {
        // Call create-rent-payment endpoint
        const response = await createRentPayment(
          tenantId,
          invoiceId,
          amount,
          tenantEmail
        );

        if (!response.status || !response.data) {
          throw new Error(response.message || "Failed to initialize payment");
        }

        setState({
          loading: false,
          error: null,
          authorizationUrl: response.data.authorization_url,
          reference: response.data.reference,
        });

        return response.data;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to initialize payment";
        setState({
          loading: false,
          error: errorMessage,
          authorizationUrl: null,
          reference: null,
        });

        toast.error(errorMessage);
        throw error;
      }
    },
    []
  );

  /**
   * Check payment status by polling (for manual verification)
   */
  const checkPaymentStatus = useCallback(
    async (invoiceId: string) => {
      try {
        // Check if invoice is marked as paid in database
        const { data, error } = await supabase
          .from("invoices")
          .select("status, paid_at")
          .eq("id", invoiceId)
          .single();

        if (error) {
          throw new Error("Failed to check payment status");
        }

        return {
          isPaid: data?.status === "paid",
          paidAt: data?.paid_at,
        };
      } catch (error) {
        console.error("Error checking payment status:", error);
        return {
          isPaid: false,
          paidAt: null,
        };
      }
    },
    []
  );

  /**
   * Get receipt after payment
   */
  const getReceipt = useCallback(
    async (invoiceId: string, tenantId: string) => {
      try {
        const { data, error } = await supabase
          .from("receipts")
          .select("*")
          .eq("invoice_id", invoiceId)
          .eq("tenant_id", tenantId)
          .single();

        if (error) {
          throw new Error("Receipt not found");
        }

        return data;
      } catch (error) {
        console.error("Error fetching receipt:", error);
        return null;
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      authorizationUrl: null,
      reference: null,
    });
  }, []);

  return {
    ...state,
    initializeRentPayment,
    checkPaymentStatus,
    getReceipt,
    reset,
  };
};
