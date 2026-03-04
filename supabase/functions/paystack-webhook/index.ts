import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
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
    // Get webhook signature from header
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.warn("Missing x-paystack-signature header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get request body
    const body = await req.text();

    // Get Paystack webhook secret
    const PAYSTACK_WEBHOOK_SECRET = Deno.env.get("PAYSTACK_WEBHOOK_SECRET");

    if (!PAYSTACK_WEBHOOK_SECRET) {
      console.error("PAYSTACK_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify webhook signature using HMAC SHA512
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(PAYSTACK_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign", "verify"]
    );

    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(body)
    );

    // Convert expected signature to hex
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedHex) {
      console.warn("Invalid webhook signature", {
        received: signature,
        expected: expectedHex,
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse webhook payload
    const payload = JSON.parse(body);

    console.log("Received Paystack webhook:", {
      event: payload.event,
      reference: payload.data?.reference,
    });

    // Only handle charge.success events
    if (payload.event !== "charge.success") {
      console.log(`Ignoring event: ${payload.event}`);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = payload.data;

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

    // Verify transaction with Paystack API
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

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${data.reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.status || verifyData.data.status !== "success") {
      console.error("Transaction verification failed:", {
        reference: data.reference,
        verifyData,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const txData = verifyData.data;
    const metadata = txData.metadata || {};
    const { tenantId, invoiceId } = metadata;

    if (!tenantId || !invoiceId) {
      console.warn("Missing tenantId or invoiceId in metadata:", metadata);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check for duplicate processing using transaction reference
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("reference", data.reference)
      .maybeSingle();

    if (existingPayment) {
      console.log("Payment already processed:", data.reference);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get invoice to validate amount
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, amount, tenant_id, property_id, unit_number")
      .eq("id", invoiceId)
      .eq("tenant_id", tenantId)
      .single();

    if (invoiceError || !invoiceData) {
      console.error("Invoice not found:", { invoiceId, tenantId });
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate amount (Paystack returns amount in kobo)
    const paidAmount = txData.amount / 100;

    if (invoiceData.amount !== paidAmount) {
      console.error("Amount mismatch:", {
        invoiceAmount: invoiceData.amount,
        paidAmount,
        reference: data.reference,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate currency is KES
    if (txData.currency !== "KES") {
      console.error("Invalid currency:", {
        currency: txData.currency,
        reference: data.reference,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update invoice status to paid
    const { error: updateInvoiceError } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateInvoiceError) {
      console.error("Failed to update invoice:", {
        invoiceId,
        error: updateInvoiceError,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Invoice updated to paid:", invoiceId);

    // Insert payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount: paidAmount,
        reference: data.reference,
        gateway: "paystack",
        status: "successful",
        paid_at: new Date(txData.paid_at).toISOString(),
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Failed to insert payment record:", {
        invoiceId,
        error: paymentError,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Payment record created:", paymentData.id);

    // Generate receipt number
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const receiptNumber = `RCPT-${year}-${random}`;

    // Get tenant and property details for receipt
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("first_name, last_name, email")
      .eq("id", tenantId)
      .single();

    const { data: propertyData } = await supabase
      .from("properties")
      .select("name")
      .eq("id", invoiceData.property_id)
      .single();

    // Create receipt record
    const { error: receiptError } = await supabase
      .from("receipts")
      .insert({
        payment_id: paymentData.id,
        receipt_number: receiptNumber,
        tenant_id: tenantId,
        invoice_id: invoiceId,
        amount: paidAmount,
        generated_at: new Date().toISOString(),
        tenant_name: tenantData
          ? `${tenantData.first_name} ${tenantData.last_name}`
          : "Unknown",
        property_name: propertyData?.name || "Unknown",
        unit_number: invoiceData.unit_number,
        payment_method: "paystack",
        transaction_reference: data.reference,
      });

    if (receiptError) {
      console.error("Failed to create receipt:", {
        invoiceId,
        error: receiptError,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Receipt generated successfully:", {
      receiptNumber,
      invoiceId,
    });

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in paystack-webhook:", error);

    return new Response(
      JSON.stringify({
        status: "ok",
        error: error.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
