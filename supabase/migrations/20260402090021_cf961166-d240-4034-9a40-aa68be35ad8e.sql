ALTER TABLE public.proposals ADD COLUMN proposal_mode TEXT NOT NULL DEFAULT 'sales_pitch';

CREATE OR REPLACE FUNCTION public.validate_proposal_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.proposal_mode NOT IN ('sales_pitch', 'traditional') THEN
    RAISE EXCEPTION 'Invalid proposal_mode: %. Must be sales_pitch or traditional.', NEW.proposal_mode;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_proposal_mode
BEFORE INSERT OR UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.validate_proposal_mode();