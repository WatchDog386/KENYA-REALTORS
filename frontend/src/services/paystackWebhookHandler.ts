// src/services/paystackWebhookHandler.ts
// This file handles Paystack webhook verification and payment record updates
// Can be used with Supabase Edge Functions or a Node.js backend

import { verifyPaystackTransaction } from "./paystackService";
import { supabase } from "@/integrations/supabase/client";

export interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code?: string;
      first_name?: string;
      last_name?: string;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      card_type: string;
    };
    metadata?: {
      paymentType?: string;
      referenceId?: string;
      timestamp?: string;
    };
  };
}

// Handle Paystack webhook payment.charge.success event
// Updates payment records in Supabase when payment is successful
export const handlePaystackWebhook = async (payload: PaystackWebhookPayload) => {
  try {
    const { event, data } = payload;

    // Only handle charge.success events
    if (event !== "charge.success") {
      console.log(`Ignoring event: ${event}`);
      return { success: true, message: "Event ignored" };
    }

    const { reference, amount, metadata } = data;
    const paymentType = metadata?.paymentType || "other";
    const referenceId = metadata?.referenceId;

    // Verify transaction with Paystack
    const verificationResponse = await verifyPaystackTransaction(reference);

    if (!verificationResponse.status) {
      throw new Error("Payment verification failed");
    }

    // Amount in kobo, convert to regular currency
    const paymentAmount = amount / 100;

    // Update payment record based on payment type
    if (paymentType === "rent" && referenceId) {
      // Update rent payment
      const { error: updateError } = await supabase
        .from("rent_payments")
        .update({
          amount_paid: paymentAmount,
          status: "completed",
          payment_method: "paystack",
          paid_date: new Date().toISOString(),
          transaction_reference: reference,
        })
        .eq("id", referenceId);

      if (updateError) {
        throw new Error(`Failed to update rent payment: ${updateError.message}`);
      }

      console.log(`Rent payment ${referenceId} updated successfully`);
    } else if (["water", "electricity", "garbage", "other"].includes(paymentType) && referenceId) {
      // Update utility bill
      const { error: updateError } = await supabase
        .from("bills_and_utilities")
        .update({
          paid_amount: paymentAmount,
          status: "completed",
          payment_reference: reference,
        })
        .eq("id", referenceId);

      if (updateError) {
        throw new Error(`Failed to update utility bill: ${updateError.message}`);
      }

      console.log(`Utility bill ${referenceId} updated successfully`);
    } else {
      console.warn(`Unable to determine payment type or reference: ${paymentType}, ${referenceId}`);
    }

    return {
      success: true,
      message: "Payment processed successfully",
      reference,
      amount: paymentAmount,
    };
  } catch (error: any) {
    console.error("Webhook handling error:", error);
    return {
      success: false,
      message: error.message || "Webhook processing failed",
    };
  }
};

/**
 * Verify a Paystack payment manually (useful for client-side verification)
 * This is already handled in paystackService.ts, but exposed here for convenience
 */
export const verifyPaymentManually = async (
  reference: string,
  paymentType: "rent" | "water" | "electricity" | "garbage" | "other",
  referenceId?: string
) => {
  try {
    const verificationResponse = await verifyPaystackTransaction(reference);

    if (!verificationResponse.status || !verificationResponse.data) {
      throw new Error("Payment verification failed");
    }

    const { amount, paid_at } = verificationResponse.data;
    const paymentAmount = amount / 100;

    // Update database record
    if (paymentType === "rent" && referenceId) {
      const { error: updateError } = await supabase
        .from("rent_payments")
        .update({
          amount_paid: paymentAmount,
          status: "completed",
          payment_method: "paystack",
          paid_date: paid_at || new Date().toISOString(),
          transaction_reference: reference,
        })
        .eq("id", referenceId);

      if (updateError) throw updateError;
    } else if (referenceId) {
      const { error: updateError } = await supabase
        .from("bills_and_utilities")
        .update({
          paid_amount: paymentAmount,
          status: "completed",
          payment_reference: reference,
        })
        .eq("id", referenceId);

      if (updateError) throw updateError;
    }

    return {
      success: true,
      amount: paymentAmount,
      reference,
      paidAt: paid_at,
    };
  } catch (error: any) {
    console.error("Payment verification error:", error);
    throw error;
  }
};

export default {
  handlePaystackWebhook,
  verifyPaymentManually,
};
