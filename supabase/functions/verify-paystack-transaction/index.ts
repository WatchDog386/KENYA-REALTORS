declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
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
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
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
          status: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Call Paystack verification endpoint
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack verification failed:", {
        status: response.status,
        error: data,
        reference,
      });

      return new Response(
        JSON.stringify({
          status: false,
          message: data.message || "Transaction verification failed",
          data: null,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Paystack verification successful:", {
      reference,
      amount: data.data?.amount,
      status: data.data?.status,
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in verify-paystack-transaction:", error);

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
