-- Add proposals_used column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS proposals_used INTEGER NOT NULL DEFAULT 0;
