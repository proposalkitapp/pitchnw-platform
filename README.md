# Welcome to Pitchnw

Pitchnw is an all-in-one platform designed for freelancers who mean business. It
empowers professionals to turn project briefs into winning proposals in just  seconds.
With AI-driven generation and comprehensive client tracking, Pitchnw ensures you know
exactly when to follow up and how to close more deals.
🚀 Features
Pitchnw provides everything you need to win more deals, from AI generation to client
tracking.
• AI Proposal Generator: Fill out a short form and receive a complete, professional
proposal featuring an executive summary, scope, pricing, and timeline.
• Template Marketplace: Browse, buy, and utilize stunning proposal templates. Creators earn % on every sale.
• Client Portal: Share proposals via private, branded links. Clients can accept, decline, or
comment directly—no login required.
• Smart Analytics: Track every view, scroll depth, and time spent. Know exactly when
your client opens your proposal.
• AI Win-Rate Coach: AI analyzes your proposals and provides actionable insights on why
you are winning or losing deals.
• CRM Pipeline: Track every proposal from draft to signed. Manage your entire freelance
pipeline in one centralized location.
🛠️ How It Works
From brief to signed deal in four simple steps:
. Fill in the details: Enter your client info, project type, and key requirements. It takes
less than  seconds.
. AI generates your proposal: Our AI crafts a complete professional proposal with scope,
timeline, pricing, and terms—in under  seconds.
. Customize & brand it: Edit any section, apply your brand kit, or swap in a premium
template from the marketplace.
. Send & track engagement: Share via a private link. Track views, time spent, and get notified the moment your client accepts.

🏁 Get Started
Ready to close deals faster? Join freelancers who are winning more projects with AIpowered proposals. Start for free — no credit card required.
Visit Pitchnw to get started today!

## Dodo Payments Subscription Integration

This app integrates Dodo Payments for a $12/month Pro subscription with server-side checkout and secure webhooks.

Endpoints
- Create Checkout Session: POST [/api/create-checkout-session](api/create-checkout-session.ts)
  - Request JSON:
    - sessionId: string (required) — your internal session tracking id
    - customer: { email?: string; name?: string; phone_number?: string } (optional)
    - billing_address: { street?, city?, state?, country?, zipcode? } (optional, country is ISO 3166-1 alpha-2)
  - Behavior:
    - Creates a Dodo Checkout Session for the Pro product (DODO_PRO_PLAN_PRODUCT_ID)
    - Attaches metadata.sessionId
    - Sets return_url to /?session={sessionId}
  - Response JSON:
    - { checkout_url: string, session_id: string }
  - Typical client usage:
    - Call the API, then window.location.href = checkout_url

- Webhook: POST [/api/webhook](api/webhook.ts)
  - Verifies signature using standardwebhooks with headers:
    - webhook-id
    - webhook-timestamp
    - webhook-signature
  - Parses event, handles payment.succeeded
  - Reads metadata.sessionId (fallbacks included) and upserts into proposal_sessions with paid=true, paid_at=now()
  - Always returns 200 on success; returns 400 on invalid signature

Environment Variables (.env.local or production env)
- DODO_PAYMENTS_API_KEY=your_api_key
- DODO_PAYMENTS_ENVIRONMENT=test_mode
- DODO_PRO_PLAN_PRODUCT_ID=prod_XXXXXXXXXXXX  (create in Dodo dashboard)
- DODO_PAYMENTS_WEBHOOK_SECRET=whsec_XXXXXXXX (generate for your webhook URL)
- SUPABASE_URL=https://xxx.supabase.co
- SUPABASE_SERVICE_ROLE_KEY=service_role_xxx  (server-side only)
- VERCEL_URL=your-vercel-domain (optional; Vercel sets this automatically)

Database
- Migration added: [supabase/migrations/20260413173000_create_proposal_sessions.sql](supabase/migrations/20260413173000_create_proposal_sessions.sql)
  - Creates public.proposal_sessions(session_id text unique, paid boolean, paid_at timestamptz, timestamps).
  - Run your usual Supabase migration flow to apply.

Vercel Config
- vercel.json updated to preserve /api/* functions and SPA routing otherwise.

Installation
- npm i dodopayments standardwebhooks
- @supabase/supabase-js already in dependencies

Notes and Best Practices
- Dodo SDK uses environment: 'test_mode' or 'live_mode'. test_mode is configured by default.
- API amounts from Dodo are in the currency’s smallest unit (minor units).
- return_url is the Dodo-supported field (equivalent to “success_url” concept). This integration sets return_url to /?session={sessionId}.
- Keep all secrets in environment variables. Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
- Webhook verification requires the exact raw request body. The handler reads the stream directly before parsing.
- Idempotency: Upsert by session_id in proposal_sessions to handle retries safely.

Testing (Sandbox)
1) Set DODO_PAYMENTS_ENVIRONMENT=test_mode and use your test API key.
2) Call POST /api/create-checkout-session with a test sessionId (e.g., a UUID), then redirect customer to checkout_url.
3) In Dodo dashboard, enable a webhook pointing to https://&lt;your-domain&gt;/api/webhook and set DODO_PAYMENTS_WEBHOOK_SECRET accordingly.
4) Use the dashboard webhook tester or send a signed test event; verify proposal_sessions reflects paid=true.
5) Confirm your app reads session from /?session=... after redirect to unlock Pro features.

Production Rollout
- Switch DODO_PAYMENTS_ENVIRONMENT=live_mode and API key to live.
- Keep the same /api/webhook URL and generate a live webhook secret; update the env var.
- Ensure strict error logging and monitoring on webhook handler.
- Verify checkout product id (DODO_PRO_PLAN_PRODUCT_ID) is the live product.

References
- Dodo Checkout Sessions (Node SDK): https://docs.dodopayments.com/developer-resources/checkout-session
- Subscription Integration Guide: https://docs.dodopayments.com/developer-resources/subscription-integration-guide
- Webhooks and signature verification: https://docs.dodopayments.com/developer-resources/webhooks
