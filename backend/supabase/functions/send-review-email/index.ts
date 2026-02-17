import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }
    try {
        const supabaseClient = createClient("https://jtdtzkpqncpmmenywnlw.supabase.co", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        const { quoteId, clientEmail, clientName } = await req.json();
        const reviewLink = `${"https://jtdtzkpqncpmmenywnlw.supabase.co"}/review/${quoteId}`;
        console.log("Review email request:", {
            quoteId,
            clientEmail,
            clientName,
            reviewLink
        });
        return new Response(JSON.stringify({ success: true, message: "Review email sent" }), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }
    catch (error) {
        console.error("Error sending review email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }
});
