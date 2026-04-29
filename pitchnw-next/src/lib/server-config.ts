import 'server-only'

export const serverConfig = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  supabaseServiceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  dodoApiKey: process.env.DODO_PAYMENTS_API_KEY,
  dodoProductId:
    process.env.DODO_STANDARD_PRODUCT_ID,
  dodoWebhookSecret:
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
}
