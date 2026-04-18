import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const event = await req.json();
    const { type, data } = event;
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Webhook received: ${type}`);

    // Standard extraction for metadata which should be on the 'data' object
    const metadata = (data?.metadata || {}) as Record<string, string>;
    const userId = metadata?.user_id || metadata?.userId;
    const plan = metadata?.plan || 'pro';
    const email = data?.customer?.email || data?.email;

    switch (type) {
      case 'payment.succeeded':
      case 'subscription.active':
      case 'subscription.created': {
        console.log(`Processing ${type} for user:`, userId, 'email:', email);

        if (!userId && !email) {
          console.error('No identifiable user (userId or email) in webhook data');
          break;
        }

        const updatePayload: any = {
          plan: plan,
          subscription_status: 'active',
          subscription_period_end: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
        };

        if (data?.id && type.startsWith('subscription')) {
          updatePayload.dodo_subscription_id = data.id;
        } else if (data?.subscription_id) {
          updatePayload.dodo_subscription_id = data.subscription_id;
        }

        let query = supabase.from('profiles').update(updatePayload);

        if (userId) {
          query = query.eq('user_id', userId);
        } else {
          query = query.eq('email', email);
        }

        const { error: updateError } = await query;

        if (updateError) {
          console.error(`Failed to update plan on ${type}:`, updateError);
        } else {
          console.log(`Successfully processed ${type} for user:`, userId || email);
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        if (userId || email) {
          const query = userId 
            ? supabase.from('profiles').update({ subscription_status: 'cancelled', plan: 'free' }).eq('user_id', userId)
            : supabase.from('profiles').update({ subscription_status: 'cancelled', plan: 'free' }).eq('email', email);
          
          await query;
          console.log(`Subscription ${type} for user:`, userId || email);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
