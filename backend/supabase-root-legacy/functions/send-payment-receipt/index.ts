import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const {
      to_email,
      tenant_name = 'Tenant',
      receipt_number,
      amount = 0,
      items = [],
      payment_date = new Date().toLocaleString(),
      payment_method = 'Paystack',
      transaction_reference = '',
      receipt_id,
      resend = false,
    } = await req.json()

    // Log receipt email request
    console.log("Receipt email request:", {
      to_email,
      receipt_number,
      amount,
      resend,
    })

    // In production, send actual email via SendGrid, Resend, or similar service
    // For now, just log and return success
    // The email sending can be integrated later

    // If email service is configured, uncomment and implement:
    // const emailResult = await sendEmailViaService(...)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Receipt ${receipt_number} processed for ${to_email}`,
        data: {
          receipt_number,
          email: to_email,
          amount,
        }
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200
      }
    )
  } catch (error) {
    console.error("Error processing receipt email:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    )
  }
})

