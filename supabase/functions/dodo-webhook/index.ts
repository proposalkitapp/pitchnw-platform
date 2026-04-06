/// <reference path="../edge-modules.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get("DODO_PAYMENTS_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("DODO_PAYMENTS_WEBHOOK_SECRET not set");
      return new Response("Server misconfigured", { status: 500 });
    }

    const webhook = new Webhook(webhookSecret);

    const rawBody = await req.text();

    const webhookHeaders = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    let payload: Record<string, unknown>;
    try {
      payload = webhook.verify(rawBody, webhookHeaders) as Record<string, unknown>;
    } catch {
      console.error("Webhook signature verification failed");
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const eventType = payload.type as string;
    const data = payload.data as Record<string, unknown>;

    console.log("Dodo webhook received:", eventType);

    switch (eventType) {
      case "payment.succeeded": {
        const metadata = data.metadata as Record<string, string> | undefined;
        const userId = metadata?.user_id;
        const plan = metadata?.plan;
        const subId = data.subscription_id as string | undefined;

        if (userId && plan) {
          await supabase
            .from("profiles")
            .update({
              plan,
              subscription_status: "active",
              dodo_subscription_id: subId ?? null,
              subscription_period_end: null,
            })
            .eq("user_id", userId);
          console.log(`Plan activated: ${plan} for ${userId}`);
        }
        break;
      }

      case "subscription.active": {
        const metadata = data.metadata as Record<string, string> | undefined;
        const userId = metadata?.user_id;
        const subId = data.id as string | undefined;

        if (userId && subId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              dodo_subscription_id: subId,
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "subscription.renewed": {
        const subId = data.id as string | undefined;
        if (subId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_period_end: (data.next_billing_date as string) || null,
            })
            .eq("dodo_subscription_id", subId);
        }
        break;
      }

      case "subscription.cancelled": {
        const subId = data.id as string | undefined;
        if (subId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "cancelled",
              plan: null,
              subscription_period_end: (data.cancelled_at as string) || null,
            })
            .eq("dodo_subscription_id", subId);
        }
        break;
      }

      case "payment.failed": {
        const subId = data.subscription_id as string | undefined;
        if (subId) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("dodo_subscription_id", subId);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
