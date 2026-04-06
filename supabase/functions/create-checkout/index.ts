/// <reference path="../edge-modules.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import DodoPayments from "npm:dodopayments@2.26.0";



function dodoEnvironment(): "live_mode" | "test_mode" {
  const mode = Deno.env.get("DODO_PAYMENTS_ENVIRONMENT");
  if (mode === "live_mode" || mode === "test_mode") return mode;
  return "test_mode";
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const isAllowed = origin && (origin.startsWith("http://localhost:") || origin === "https://pitchnw.app");
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://pitchnw.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

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
      return new Response(JSON.stringify({ error: "Invalid plan", message: "A valid plan (pro or standard) is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    const proProductId = Deno.env.get("DODO_PRO_PRODUCT_ID");
    const standardProductId = Deno.env.get("DODO_STANDARD_PRODUCT_ID");
    const appUrl = (Deno.env.get("APP_URL") || "").replace(/\/$/, "");

    if (!apiKey || !proProductId || !standardProductId || !appUrl) {
      console.error("Missing configuration:", { apiKey: !!apiKey, proProductId, standardProductId, appUrl });
      return new Response(JSON.stringify({ 
        error: "configuration_error", 
        message: "Payment system not configured correctly. Please check environment variables (API Key, Product IDs, or APP_URL)." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dodo_customer_id, display_name, plan")
      .eq("user_id", user.id)
      .single();

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: dodoEnvironment(),
    });

    const productId = plan === "pro" ? proProductId : standardProductId;

    const displayName = profile?.display_name?.trim() || user.email || "Customer";

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: profile?.dodo_customer_id
        ? { customer_id: profile.dodo_customer_id }
        : {
          email: user.email!,
          name: displayName,
          create_new_customer: true,
        },
      return_url: `${appUrl}/payment/success?plan=${encodeURIComponent(plan)}`,
      cancel_url: `${appUrl}/settings`,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    const checkoutUrl = session.checkout_url;
    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "no_checkout_url", message: "No checkout URL returned from payment provider." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        session_id: session.session_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Full checkout error:", error);
    return new Response(
      JSON.stringify({
        error: "checkout_failed",
        original_error: error.message,
        message: error.message || "Failed to create checkout. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
