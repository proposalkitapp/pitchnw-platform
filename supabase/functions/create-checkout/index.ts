import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'
import DodoPayments from 'https://esm.sh/dodopayments'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('DODO_PAYMENTS_API_KEY')
    const productId = Deno.env.get('DODO_STANDARD_PRODUCT_ID')
    const appUrl = Deno.env.get('APP_URL')

    if (!apiKey || !productId || !appUrl) {
      console.error('Missing env vars:', {
        hasApiKey: !!apiKey,
        hasProductId: !!productId,
        hasAppUrl: !!appUrl
      })
      return new Response(
        JSON.stringify({
          error: 'configuration_error',
          message: 'Payment system not configured.'
        }),
        { status: 500, headers: corsHeaders }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dodo_customer_id, full_name')
      .eq('id', user.id)
      .single()

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: 'live_mode'
    })

    const session = await dodo.checkoutSessions.create({
      product_cart: [{
        product_id: productId,
        quantity: 1
      }],
      customer: profile?.dodo_customer_id
        ? { customer_id: profile.dodo_customer_id }
        : {
            email: user.email!,
            name: profile?.full_name || user.email!,
            create_new_customer: true
          },
      success_url: appUrl + '/payment/success?plan=standard&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: appUrl + '/checkout',
      metadata: {
        user_id: user.id,
        plan: 'standard'
      }
    })

    if (session.customer?.customer_id && !profile?.dodo_customer_id) {
      await supabase
        .from('profiles')
        .update({
          dodo_customer_id: session.customer.customer_id
        })
        .eq('id', user.id)
    }

    return new Response(
      JSON.stringify({
        checkout_url: session.payment_link,
        session_id: session.checkout_session_id
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({
        error: 'checkout_failed',
        message: error.message || 'Failed to create checkout.'
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
