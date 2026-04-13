-- Migration to drop Dodo Payments related columns from the profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS dodo_customer_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS dodo_subscription_id;
