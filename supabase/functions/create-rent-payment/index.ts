import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { tenantId, invoiceId, amount, tenantEmail } = await req.json();

    // Validate required fields
    if (!tenantId || !invoiceId || !amount || !tenantEmail) {
      return new Response(
        JSON.stringify({
          error: "tenantId, invoiceId, amount, and tenantEmail are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate tenant exists
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("id, email, first_name, last_name")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenantData) {
      console.error("Tenant not found:", tenantId);
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate invoice exists and is unpaid
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        "id, tenant_id, amount, due_date, status, property_id, unit_number"
      )
      .eq("id", invoiceId)
      .eq("tenant_id", tenantId)
      .single();

    if (invoiceError || !invoiceData) {
      console.error("Invoice not found:", invoiceId);
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check invoice status
    if (invoiceData.status !== "unpaid") {
      return new Response(
        JSON.stringify({ error: `Invoice is already ${invoiceData.status}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate amount matches
    if (invoiceData.amount !== amount) {
      return new Response(
        JSON.stringify({
          error: `Amount mismatch. Invoice amount: ${invoiceData.amount}, provided: ${amount}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get property details for metadata
    const { data: propertyData } = await supabase
      .from("properties")
      .select("name")
      .eq("id", invoiceData.property_id)
      .single();

    // Get Paystack credentials
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate transaction reference
    const timestamp = Date.now();
    const txRef = `RENT-${tenantId}-${invoiceId}-${timestamp}`;

    // Initialize Paystack transaction
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        body: JSON.stringify({
          email: tenantEmail,
          amount: Math.round(amount * 100), // Convert to kobo
          reference: txRef,
          description: `Rent payment for ${propertyData?.name || "property"} Unit ${invoiceData.unit_number}`,
          metadata: {
            tenantId,
            invoiceId,
            propertyId: invoiceData.property_id,
            paymentType: "rent",
          },
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error("Paystack initialization failed:", {
        status: paystackResponse.status,
        error: paystackData,
      });

      return new Response(
        JSON.stringify({
          error: paystackData.message || "Payment initialization failed",
          status: false,
        }),
        {
          status: paystackResponse.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Rent payment initialized:", {
      reference: txRef,
      tenantId,
      invoiceId,
      amount,
    });

    // Return success response with authorization URL
    return new Response(
      JSON.stringify({
        status: true,
        message: "Payment link created successfully",
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: txRef,
          amount,
          tenantId,
          invoiceId,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in create-rent-payment:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        status: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
