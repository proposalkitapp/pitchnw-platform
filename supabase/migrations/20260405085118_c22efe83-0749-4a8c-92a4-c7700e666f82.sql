CREATE OR REPLACE FUNCTION public.get_creator_branding(creator_user_id uuid)
RETURNS TABLE (
  brand_logo_url text,
  brand_name text,
  company_name text,
  display_name text,
  portfolio_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.brand_logo_url, p.brand_name, p.company_name, p.display_name, p.portfolio_url
  FROM public.profiles p
  WHERE p.user_id = creator_user_id
  LIMIT 1;
$$;