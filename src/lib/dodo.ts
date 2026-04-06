import DodoPayments from 'dodopayments'

// This client is for SERVER-SIDE use only
// (Supabase Edge Functions)
// Never import this file in any /src/pages or
// /src/components file
export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: process.env.NODE_ENV === 'production'
    ? 'live_mode'
    : 'test_mode'
})
