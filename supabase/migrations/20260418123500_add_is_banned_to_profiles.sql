-- Add is_banned to profiles to support the new AI generation edge function safety checks
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
