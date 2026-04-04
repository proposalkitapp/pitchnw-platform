import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, userEmail, userId } = await req.json();

    if (!plan || !userEmail || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: plan, userEmail, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Paystack is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_PRO_PLAN_CODE = Deno.env.get("PAYSTACK_PRO_PLAN_CODE");
    const PAYSTACK_STANDARD_PLAN_CODE = Deno.env.get("PAYSTACK_STANDARD_PLAN_CODE");

    const planCode = plan === "pro" ? PAYSTACK_PRO_PLAN_CODE : PAYSTACK_STANDARD_PLAN_CODE;
    const amount = plan === "pro" ? 1800000 : 4500000; // in kobo

    if (!planCode) {
      return new Response(
        JSON.stringify({ error: `Paystack plan code for "${plan}" is not configured` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callbackUrl = Deno.env.get("CALLBACK_URL") || "https://pitchnw.lovable.app/payment/callback";

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount,
        plan: planCode,
        callback_url: callbackUrl,
        metadata: {
          user_id: userId,
          plan,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack init error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to initialize payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ authorization_url: data.data.authorization_url, reference: data.data.reference }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-paystack-subscription error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
