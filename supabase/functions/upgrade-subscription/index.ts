/// <reference path="../edge-modules.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const { plan } = await req.json();

    if (!plan || !["pro", "standard"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dodo_subscription_id, plan")
      .eq("user_id", user.id)
      .single();

    if (!profile?.dodo_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription to upgrade" }), {
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

    const newProductId = plan === "pro"
      ? Deno.env.get("DODO_PRO_PRODUCT_ID")!
      : Deno.env.get("DODO_STANDARD_PRODUCT_ID")!;

    if (!newProductId) {
      return new Response(JSON.stringify({ error: "Product ID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const mode = Deno.env.get("DODO_PAYMENTS_ENVIRONMENT") === "live_mode" ? "live_mode" : "test_mode";

    // Hit the Dodo Payments REST endpoint directly using fetch just in case the SDK is outdated
    const changePlanReq = await fetch(
      `https://${mode === "live_mode" ? "live" : "test"}.dodopayments.com/subscriptions/${profile.dodo_subscription_id}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: newProductId,
          quantity: 1,
          proration_billing_mode: "prorated_immediately",
          apply_change: "immediately"
        })
      }
    );

    if (!changePlanReq.ok) {
        const errorData = await changePlanReq.text();
        console.error("Dodo API Error:", errorData);
        // Fallback or retry structure?
        throw new Error("Failed to instruct Dodo Payments to change the plan.");
    }

    // Since webhook updates takes a moment, update the user profile optimistically so UI feels snappy
    await supabase.from("profiles").update({ plan }).eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription upgraded successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Upgrade error:", error);
    return new Response(
      JSON.stringify({
        error: "upgrade_failed",
        message: "Failed to upgrade subscription. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
