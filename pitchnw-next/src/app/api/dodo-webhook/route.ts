import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from
  '@/lib/supabase/admin'
import { serverConfig } from
  '@/lib/server-config'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const webhookId =
      req.headers.get('webhook-id') || ''
    const webhookSignature =
      req.headers.get('webhook-signature') || ''
    const webhookTimestamp =
      req.headers.get('webhook-timestamp') || ''

    if (!webhookSignature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify signature using standardwebhooks
    const { Webhook } = await import(
      'standardwebhooks'
    )
    const webhook = new Webhook(
      serverConfig.dodoWebhookSecret!
    )

    let payload: Record<string, unknown>
    try {
      payload = await webhook.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-signature': webhookSignature,
        'webhook-timestamp': webhookTimestamp,
      }) as Record<string, unknown>
    } catch {
      console.error('Webhook verification failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const eventType = payload.type as string
    const data =
      payload.data as Record<string, unknown>

    switch (eventType) {
      case 'payment.succeeded': {
        const metadata = data.metadata as
          Record<string, string>
        const userId = metadata?.user_id

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              dodo_subscription_id:
                data.subscription_id as string
                || null
            })
            .eq('id', userId)

          console.log('Plan activated for:', userId)
        }
        break
      }

      case 'subscription.active': {
        const metadata = data.metadata as
          Record<string, string>
        const userId = metadata?.user_id

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              dodo_subscription_id:
                data.id as string
            })
            .eq('id', userId)
        }
        break
      }

      case 'subscription.cancelled': {
        const subId = data.id as string
        if (subId) {
          await supabase
            .from('profiles')
            .update({
              plan: null,
              subscription_status: 'cancelled'
            })
            .eq('dodo_subscription_id', subId)
        }
        break
      }

      case 'payment.failed': {
        const subId =
          data.subscription_id as string
        if (subId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due'
            })
            .eq('dodo_subscription_id', subId)
        }
        break
      }

      default:
        console.log('Unhandled event:', eventType)
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
