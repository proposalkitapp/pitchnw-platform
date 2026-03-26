
-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS signature_data text;

-- Add new columns to proposals for client portal
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS public_slug text UNIQUE,
ADD COLUMN IF NOT EXISTS client_signature_data text,
ADD COLUMN IF NOT EXISTS client_signed_name text,
ADD COLUMN IF NOT EXISTS signed_at timestamptz,
ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Create proposal_events table for tracking
CREATE TABLE IF NOT EXISTS public.proposal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

-- RLS: proposal owners can see their events
CREATE POLICY "Users can view their proposal events"
ON public.proposal_events FOR SELECT TO authenticated
USING (
  proposal_id IN (SELECT id FROM public.proposals WHERE user_id = auth.uid())
);

-- RLS: anyone can insert events (for client portal tracking)
CREATE POLICY "Anyone can insert proposal events"
ON public.proposal_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow public read on proposals by slug (for client portal)
CREATE POLICY "Public can view proposals by slug"
ON public.proposals FOR SELECT TO anon
USING (public_slug IS NOT NULL);

-- Generate slug trigger
CREATE OR REPLACE FUNCTION public.generate_proposal_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.public_slug IS NULL THEN
    NEW.public_slug := substring(NEW.id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_proposal_slug
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_proposal_slug();
