import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from
  '@/lib/supabase/admin'
import { serverConfig } from
  '@/lib/server-config'

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    const missingKeys = []
    if (!serverConfig.dodoApiKey)
      missingKeys.push('DODO_PAYMENTS_API_KEY')
    if (!serverConfig.dodoProductId)
      missingKeys.push('DODO_STANDARD_PRODUCT_ID')

    if (missingKeys.length > 0) {
      console.error('Missing secrets:', missingKeys)
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: 'Payment system not configured.'
        },
        { status: 500 }
      )
    }

    const authHeader =
      req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dodo_customer_id, display_name')
      .eq('id', user.id)
      .single()

    const checkoutBody: Record<string, unknown> = {
      product_cart: [{
        product_id: serverConfig.dodoProductId,
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?plan=pro&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      metadata: {
        user_id: user.id,
        plan: 'pro'
      }
    }

    if (profile?.dodo_customer_id) {
      checkoutBody.customer = {
        customer_id: profile.dodo_customer_id
      }
    } else {
      checkoutBody.customer = {
        email: user.email,
        name: (profile as any)?.display_name || user.email,
        create_new_customer: true
      }
    }

    const dodoResponse = await fetch(
      'https://api.dodopayments.com/checkout/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization':
            `Bearer ${serverConfig.dodoApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutBody)
      }
    )

    const dodoData = await dodoResponse.json()

    if (!dodoResponse.ok) {
      console.error('Dodo error:', dodoData)
      return NextResponse.json(
        {
          error: 'payment_error',
          message: dodoData.message ||
            'Could not create checkout.'
        },
        { status: 500 }
      )
    }

    if (dodoData.customer?.customer_id &&
        !profile?.dodo_customer_id) {
      await supabase
        .from('profiles')
        .update({
          dodo_customer_id:
            dodoData.customer.customer_id
        })
        .eq('id', user.id)
    }

    const checkoutUrl =
      dodoData.payment_link ||
      dodoData.url ||
      dodoData.checkout_url

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: 'no_checkout_url',
          message: 'No checkout URL returned.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkout_url: checkoutUrl,
      session_id: dodoData.checkout_session_id
    })

  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Something went wrong.'
      },
      { status: 500 }
    )
  }
}
