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
    const { type, data } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Webhook received: ${type}`);

    switch (type) {
      case 'payment.succeeded': {
        const metadata = data.metadata as Record<string, string>;
        const userId = metadata?.user_id;
        const plan = metadata?.plan;

        console.log('Payment succeeded for user:', userId, 'plan:', plan);

        if (!userId) {
          console.error('No user_id in payment metadata');
          break;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: plan || 'pro',
            subscription_status: 'active',
            dodo_subscription_id: data.subscription_id as string || null
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Failed to update plan:', updateError);
        } else {
          console.log('Plan updated to pro for user:', userId);
        }
        break;
      }

      case 'subscription.active': {
        const subId = data.id as string;
        const metadata = data.metadata as Record<string, string>;
        const userId = metadata?.user_id;

        if (userId) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              dodo_subscription_id: subId
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Failed to update plan on subscription.active:', updateError);
          } else {
            console.log('Subscription activated for:', userId);
          }
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
