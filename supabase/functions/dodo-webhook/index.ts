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
      case 'payment.succeeded': {
        const metadata = data.metadata as Record<string, string>;
        const userId = metadata?.user_id;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              subscription_status: 'active'
            })
            .eq('id', userId);
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
