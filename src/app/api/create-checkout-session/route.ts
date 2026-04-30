import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@/lib/supabase/server'
import { serverConfig } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { product_id, customer, sessionId } = await req.json()

    const apiKey = process.env.DODO_PAYMENTS_API_KEY
    const productId = product_id || process.env.DODO_PRO_PLAN_PRODUCT_ID

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing DODO_PAYMENTS_API_KEY' }, { status: 500 })
    }

    if (!productId) {
      return NextResponse.json({ error: 'Missing product_id' }, { status: 400 })
    }

    let environment = (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') || 'test_mode'

    // Admin override check
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (profile?.is_admin) {
      environment = 'test_mode'
    }

    const host = req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    const baseURL = `${proto}://${host}`
    const return_url = `${baseURL}/checkout/success`

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment,
    })

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: customer?.email ? { email: customer.email, name: customer.name } : { email: user.email },
      return_url,
      metadata: {
        user_id: user.id,
        plan: "pro",
      },
    })

    return NextResponse.json({
      checkout_url: session.checkout_url,
      session_id: session.session_id,
    })

  } catch (err: any) {
    console.error("Checkout session creation failed:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
