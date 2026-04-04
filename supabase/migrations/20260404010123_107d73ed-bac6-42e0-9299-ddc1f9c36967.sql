
-- 1. Fix privilege escalation: prevent users from setting is_admin on their own profile
CREATE OR REPLACE FUNCTION public.prevent_admin_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If is_admin is being changed and the current user is not already an admin, block it
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  -- Also prevent users from changing their own plan
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF NOT public.is_admin(auth.uid()) THEN
      NEW.plan := OLD.plan;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_admin_self_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_self_escalation();

-- 2. Fix public slug overexposure: create a secure function to fetch by exact slug
CREATE OR REPLACE FUNCTION public.get_proposal_by_slug(slug_param TEXT)
RETURNS SETOF public.proposals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.proposals
  WHERE public_slug = slug_param
  LIMIT 1;
$$;

-- Drop the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Public can view proposals by slug" ON public.proposals;

-- 3. Fix proposal_events open insert
DROP POLICY IF EXISTS "Anyone can insert proposal events" ON public.proposal_events;

-- Anon can only insert events for proposals that have a public_slug
CREATE POLICY "Anon insert events on public proposals"
ON public.proposal_events
FOR INSERT
TO anon
WITH CHECK (
  proposal_id IN (
    SELECT id FROM public.proposals WHERE public_slug IS NOT NULL
  )
);

-- Authenticated users can insert events for their own proposals
CREATE POLICY "Authenticated insert own proposal events"
ON public.proposal_events
FOR INSERT
TO authenticated
WITH CHECK (
  proposal_id IN (
    SELECT id FROM public.proposals WHERE user_id = auth.uid()
  )
  OR
  proposal_id IN (
    SELECT id FROM public.proposals WHERE public_slug IS NOT NULL
  )
);
