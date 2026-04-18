-- Add email column to profiles to allow fallback lookups in webhooks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Backfill emails from auth.users
UPDATE profiles
SET email = u.email
FROM auth.users u
WHERE profiles.user_id = u.id
AND profiles.email IS NULL;
