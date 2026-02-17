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

const PAYSTACK_API_URL = "https://api.paystack.co";
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

/**
 * Initialize a Paystack transaction
 */
export const initializePaystackPayment = async (
  request: PaystackInitializeRequest
): Promise<PaystackResponse> => {
  try {
    if (!PAYSTACK_PUBLIC_KEY) {
      throw new Error("Paystack public key is not configured");
    }

    // Generate unique reference if not provided
    const reference =
      request.reference || `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: request.email,
        amount: Math.round(request.amount * 100), // Convert to kobo
        reference: reference,
        description: request.description || "Payment for rent or bills",
        metadata: {
          ...request.metadata,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data: PaystackResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error initializing Paystack payment:", error);
    throw error;
  }
};

/**
 * Verify a Paystack transaction
 */
export const verifyPaystackTransaction = async (
  reference: string
): Promise<PaystackVerificationResponse> => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is not configured");
    }

    const response = await fetch(
      `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data: PaystackVerificationResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying Paystack transaction:", error);
    throw error;
  }
};

/**
 * Get list of banks for bank transfers
 */
export const getPaystackBanks = async (): Promise<any> => {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/bank`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching banks:", error);
    throw error;
  }
};

/**
 * Create a payment plan
 */
export const createPaymentPlan = async (
  name: string,
  description: string,
  amount: number,
  interval: "monthly" | "quarterly" | "half-annually" | "annually"
): Promise<any> => {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        name,
        description,
        amount: Math.round(amount * 100), // Convert to kobo
        interval,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating payment plan:", error);
    throw error;
  }
};

/**
 * Charge an authorization (for recurring payments)
 */
export const chargeAuthorization = async (
  authorizationCode: string,
  email: string,
  amount: number,
  reference?: string
): Promise<PaystackResponse> => {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/charge_authorization`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        authorization_code: authorizationCode,
        email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference:
          reference ||
          `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error charging authorization:", error);
    throw error;
  }
};

export default {
  initializePaystackPayment,
  verifyPaystackTransaction,
  getPaystackBanks,
  createPaymentPlan,
  chargeAuthorization,
};
