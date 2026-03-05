import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, amount, reference, description, metadata } = await req.json();

    // Validate required fields
    if (!email || !amount) {
      return new Response(
        JSON.stringify({ error: "Email and amount are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the Paystack secret key from environment
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          status: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate reference if not provided
    const ref =
      reference ||
      `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Call Paystack initialize endpoint
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Convert to kobo
          reference: ref,
          description:
            description || "Payment for rent or bills",
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack initialization failed:", {
        status: response.status,
        error: data,
        email,
      });

      return new Response(
        JSON.stringify({
          status: false,
          message: data.message || "Payment initialization failed",
          data: null,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Paystack initialization successful:", {
      reference: ref,
      amount,
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in initialize-paystack-payment:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        status: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
