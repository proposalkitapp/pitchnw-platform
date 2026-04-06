/// <reference path="../edge-modules.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import DodoPayments from "npm:dodopayments@2.26.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function dodoEnvironment(): "live_mode" | "test_mode" {
  const mode = Deno.env.get("DODO_PAYMENTS_ENVIRONMENT");
  if (mode === "live_mode" || mode === "test_mode") return mode;
  return "test_mode";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dodo_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.dodo_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Dodo Payments is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: dodoEnvironment(),
    });

    await dodo.subscriptions.update(profile.dodo_subscription_id, {
      cancel_at_next_billing_date: true,
    });

    await supabase
      .from("profiles")
      .update({ subscription_status: "cancelled" })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription cancelled at end of billing period",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Cancel error:", error);
    return new Response(JSON.stringify({ error: "Cancellation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
