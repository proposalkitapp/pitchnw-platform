-- Ensure onboarding_completed column exists in profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Optionally, if there are existing users you want to force through onboarding, you could reset it.
-- UPDATE profiles SET onboarding_completed = false;
