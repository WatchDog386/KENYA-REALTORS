// src/services/paystackService.ts

export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Amount in Kenyan Shillings (in kobo for Paystack - multiply by 100)
  reference?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      card_type: string;
    };
  };
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Initialize a Paystack transaction using backend Edge Function
 * This is SECURE because the secret key is never exposed to the client
 */
export const initializePaystackPayment = async (
  request: PaystackInitializeRequest
): Promise<PaystackResponse> => {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL is not configured");
    }

    if (!request.email || !request.amount) {
      throw new Error("Email and amount are required");
    }

    // Call the Supabase Edge Function for secure initialization
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/initialize-paystack-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: request.email,
          amount: request.amount,
          reference: request.reference,
          description: request.description,
          metadata: request.metadata,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Initialization failed: ${response.status}`);
    }

    return data as PaystackResponse;
  } catch (error) {
    console.error("Error initializing Paystack payment:", error);
    throw error;
  }
};

/**
 * Verify a Paystack transaction using backend Edge Function
 * This is SECURE because the secret key is never exposed to the client
 */
export const verifyPaystackTransaction = async (
  reference: string
): Promise<PaystackVerificationResponse> => {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL is not configured");
    }

    // Call the Supabase Edge Function for secure verification
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/verify-paystack-transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reference }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Verification failed: ${response.status}`);
    }

    return data as PaystackVerificationResponse;
  } catch (error) {
    console.error("Error verifying Paystack transaction:", error);
    throw error;
  }
};


/**
 * Create a rent payment (tenant invoice payment)
 * Validates invoice exists, is unpaid, and amount matches
 */
export const createRentPayment = async (
  tenantId: string,
  invoiceId: string,
  amount: number,
  tenantEmail: string
): Promise<PaystackResponse> => {
  try {
    if (!SUPABASE_URL) {
      throw new Error("Supabase URL is not configured");
    }

    if (!tenantId || !invoiceId || !amount || !tenantEmail) {
      throw new Error("tenantId, invoiceId, amount, and tenantEmail are required");
    }

    // Call the create-rent-payment Edge Function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-rent-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          invoiceId,
          amount,
          tenantEmail,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Payment creation failed: ${response.status}`);
    }

    return data as PaystackResponse;
  } catch (error) {
    console.error("Error creating rent payment:", error);
    throw error;
  }
};

/**
 * Get list of banks for bank transfers
 * Note: This requires backend implementation to keep secret key secure
 * Temporarily removing client-side implementation
 */
export const getPaystackBanks = async (): Promise<any> => {
  throw new Error(
    "getPaystackBanks must be called through a secure backend endpoint. " +
    "This function is deprecated on the client side for security reasons."
  );
};

/**
 * Create a payment plan
 * Note: This requires backend implementation to keep secret key secure
 * Temporarily removing client-side implementation
 */
export const createPaymentPlan = async (
  name: string,
  description: string,
  amount: number,
  interval: "monthly" | "quarterly" | "half-annually" | "annually"
): Promise<any> => {
  throw new Error(
    "createPaymentPlan must be called through a secure backend endpoint. " +
    "This function is deprecated on the client side for security reasons."
  );
};

/**
 * Charge an authorization (for recurring payments)
 * Note: This requires backend implementation to keep secret key secure
 * Temporarily removing client-side implementation
 */
export const chargeAuthorization = async (
  authorizationCode: string,
  email: string,
  amount: number,
  reference?: string
): Promise<PaystackResponse> => {
  throw new Error(
    "chargeAuthorization must be called through a secure backend endpoint. " +
    "This function is deprecated on the client side for security reasons."
  );
};

export default {
  initializePaystackPayment,
  createRentPayment,
  verifyPaystackTransaction,
  getPaystackBanks,
  createPaymentPlan,
  chargeAuthorization,
};
