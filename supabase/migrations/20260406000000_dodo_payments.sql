-- Remove legacy third-party payment columns (if present)
ALTER TABLE profiles
  DROP COLUMN IF EXISTS paystack_subscription_code,
  DROP COLUMN IF EXISTS paystack_email_token;

-- Dodo Payments + subscription state
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (
    subscription_status IS NULL
    OR subscription_status IN ('active', 'cancelled', 'paused', 'past_due', 'trialing')
  );

-- Allow clearing plan when subscription ends (webhook)
ALTER TABLE profiles ALTER COLUMN plan DROP NOT NULL;
