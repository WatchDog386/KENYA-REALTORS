// src/utils/billingCalculations.ts
import { supabase } from "@/integrations/supabase/client";

export interface BillingStatement {
  totalDue: number;
  rentDue: number;
  utilitiesDue: number;
  rentPaid: number;
  utilitiesPaid: number;
  rentPayments: any[];
  utilityBills: any[];
  lastUpdated: Date;
}

/**
 * Fetch complete billing statement for a tenant including rent and utilities
 */
export const fetchTenantBillingStatement = async (
  userId: string
): Promise<BillingStatement | null> => {
  try {
    // Get tenant info
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("id, unit_id, property_id, user_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (tenantError || !tenantData) {
      console.error("Failed to fetch tenant data:", tenantError);
      return null;
    }

    // Fetch rent payments
    const { data: rentPayments, error: rentError } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("tenant_id", userId)
      .order("due_date", { ascending: false });

    if (rentError) {
      console.error("Failed to fetch rent payments:", rentError);
      return null;
    }

    // Fetch utility bills
    const { data: utilityBills, error: billError } = await supabase
      .from("bills_and_utilities")
      .select("*")
      .eq("unit_id", tenantData.unit_id)
      .order("due_date", { ascending: false });

    if (billError) {
      console.error("Failed to fetch utility bills:", billError);
      return null;
    }

    // Calculate totals
    const rentPaid = (rentPayments || []).reduce(
      (sum, p) => sum + (p.amount_paid || 0),
      0
    );
    const rentDue = (rentPayments || []).reduce((sum, p) => {
      if (p.status === "paid" || p.status === "completed") return sum;
      return sum + (p.amount - (p.amount_paid || 0));
    }, 0);

    const utilitiesPaid = (utilityBills || []).reduce(
      (sum, b) => sum + (b.paid_amount || 0),
      0
    );
    const utilitiesDue = (utilityBills || []).reduce((sum, b) => {
      if (b.status === "paid" || b.status === "completed") return sum;
      return sum + (b.amount - (b.paid_amount || 0));
    }, 0);

    const totalDue = rentDue + utilitiesDue;

    return {
      totalDue,
      rentDue,
      utilitiesDue,
      rentPaid,
      utilitiesPaid,
      rentPayments: rentPayments || [],
      utilityBills: utilityBills || [],
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error fetching billing statement:", error);
    return null;
  }
};

/**
 * Calculate payment distribution for splitting one payment across multiple bills
 */
export const calculatePaymentDistribution = (
  totalPayment: number,
  rentBills: any[],
  utilityBills: any[]
): {
  rentPayments: { id: string; amount: number }[];
  utilityPayments: { id: string; amount: number }[];
  remaining: number;
} => {
  const rentPayments: { id: string; amount: number }[] = [];
  const utilityPayments: { id: string; amount: number }[] = [];
  let remaining = totalPayment;

  // Apply payment to rent bills first
  for (const rent of rentBills) {
    if (remaining <= 0) break;

    const balance = rent.amount - (rent.amount_paid || 0);
    if (balance > 0) {
      const paymentAmount = Math.min(remaining, balance);
      rentPayments.push({
        id: rent.id,
        amount: paymentAmount,
      });
      remaining -= paymentAmount;
    }
  }

  // Apply remaining payment to utility bills
  for (const utility of utilityBills) {
    if (remaining <= 0) break;

    const balance = utility.amount - (utility.paid_amount || 0);
    if (balance > 0) {
      const paymentAmount = Math.min(remaining, balance);
      utilityPayments.push({
        id: utility.id,
        amount: paymentAmount,
      });
      remaining -= paymentAmount;
    }
  }

  return {
    rentPayments,
    utilityPayments,
    remaining,
  };
};

/**
 * Update payment records for both rent and utilities
 */
export const updatePaymentRecords = async (
  rentPayments: { id: string; amount: number }[],
  utilityPayments: { id: string; amount: number }[],
  transactionRef: string,
  remarks?: string
): Promise<boolean> => {
  try {
    const timestamp = new Date().toISOString();

    // Update rent payments
    for (const payment of rentPayments) {
      const { data: currentRecord } = await supabase
        .from("rent_payments")
        .select("amount_paid, amount")
        .eq("id", payment.id)
        .single();

      if (currentRecord) {
        const newPaidTotal = (currentRecord.amount_paid || 0) + payment.amount;
        const status =
          newPaidTotal >= currentRecord.amount ? "completed" : "partial";

        const { error } = await supabase
          .from("rent_payments")
          .update({
            amount_paid: newPaidTotal,
            status,
            payment_method: "paystack",
            paid_date: timestamp,
            transaction_reference: transactionRef,
            remarks:
              remarks ||
              `Partial payment via Paystack on ${new Date().toLocaleDateString()}`,
          })
          .eq("id", payment.id);

        if (error) throw error;
      }
    }

    // Update utility payments
    for (const payment of utilityPayments) {
      const { data: currentRecord } = await supabase
        .from("bills_and_utilities")
        .select("paid_amount, amount")
        .eq("id", payment.id)
        .single();

      if (currentRecord) {
        const newPaidTotal = (currentRecord.paid_amount || 0) + payment.amount;
        const status =
          newPaidTotal >= currentRecord.amount ? "completed" : "partial";

        const { error } = await supabase
          .from("bills_and_utilities")
          .update({
            paid_amount: newPaidTotal,
            status,
            payment_reference: transactionRef,
            remarks:
              remarks ||
              `Partial payment via Paystack on ${new Date().toLocaleDateString()}`,
          })
          .eq("id", payment.id);

        if (error) throw error;
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating payment records:", error);
    return false;
  }
};

/**
 * Format currency in KES
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Get status badge color based on payment status
 */
export const getStatusColor = (status: string): string => {
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
