-- Pro Plan Schema Updates

-- 1. Profiles Updates for Branding
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS proposal_header_title TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Pitch Analyses Table (Feature 4)
CREATE TABLE IF NOT EXISTS pitch_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  grade TEXT NOT NULL,
  category_scores JSONB NOT NULL DEFAULT '{}',
  strengths JSONB NOT NULL DEFAULT '[]',
  weaknesses JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  summary TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pitch_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own analyses"
  ON pitch_analyses FOR ALL
  USING (user_id = auth.uid());

-- 3. Proposal Events Updated (Feature 7)
-- We check if the table exists and add columns if they are missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposal_events') THEN
        CREATE TABLE proposal_events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL CHECK (event_type IN ('open','section_view','close','accept','decline','comment')),
            section_name TEXT,
            device_type TEXT,
            time_spent_seconds INTEGER,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    ELSE
        -- Ensure columns exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='proposal_events' AND column_name='section_name') THEN
            ALTER TABLE proposal_events ADD COLUMN section_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='proposal_events' AND column_name='device_type') THEN
            ALTER TABLE proposal_events ADD COLUMN device_type TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name='proposal_events' AND column_name='time_spent_seconds') THEN
            ALTER TABLE proposal_events ADD COLUMN time_spent_seconds INTEGER;
        END IF;
    END IF;
END $$;

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone inserts events' AND tablename = 'proposal_events') THEN
        CREATE POLICY "Anyone inserts events" ON proposal_events FOR INSERT WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners read own events' AND tablename = 'proposal_events') THEN
        CREATE POLICY "Owners read own events" ON proposal_events FOR SELECT USING (proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid()));
    END IF;
END $$;

-- 4. Followups Table (Feature 11)
CREATE TABLE IF NOT EXISTS followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  note TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own followups"
  ON followups FOR ALL
  USING (user_id = auth.uid());

-- 5. Templates Table (Feature 3)
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  content JSONB DEFAULT '{}',
  price_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert missing templates
INSERT INTO templates
  (name, description, category,
   is_free, is_published, content)
SELECT * FROM (VALUES
  ('Web Design & Development',
   'Websites, web apps, and development projects',
   'web-design', true, true, '{}'::jsonb),
  ('Brand Identity & Logo',
   'Branding, logo, and visual identity projects',
   'branding', true, true, '{}'::jsonb),
  ('Copywriting & Content',
   'Content strategy and copywriting projects',
   'copywriting', true, true, '{}'::jsonb),
  ('Photography',
   'Commercial shoots and photography sessions',
   'photography', true, true, '{}'::jsonb),
  ('Social Media Management',
   'Social media retainers and campaigns',
   'social-media', true, true, '{}'::jsonb),
  ('Video Production',
   'Video projects from concept to delivery',
   'video', true, true, '{}'::jsonb),
  ('Business Consulting',
   'Strategy consulting and advisory services',
   'consulting', true, true, '{}'::jsonb),
  ('SEO & Digital Marketing',
   'SEO audits and digital marketing retainers',
   'marketing', true, true, '{}'::jsonb)
) AS t(name, description, category,
       is_free, is_published, content)
WHERE NOT EXISTS (
  SELECT 1 FROM templates
  WHERE templates.name = t.name
);

UPDATE templates SET is_free = true, price_usd = 0;

-- 6. Ensure Proposal Columns for Portal and Signatures
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS public_slug UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signed_name TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- 7. Secure RPC for Creator Branding (Feature 12)
CREATE OR REPLACE FUNCTION get_creator_branding(creator_user_id UUID)
RETURNS TABLE (
  brand_logo_url TEXT,
  brand_name TEXT,
  company_name TEXT,
  display_name TEXT,
  portfolio_url TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.brand_logo_url, p.brand_name, p.company_name, p.display_name, p.portfolio_url
  FROM profiles p
  WHERE p.id = creator_user_id;
END;
$$;

-- 8. Secure RPC for Proposal by Slug (Feature 6)
CREATE OR REPLACE FUNCTION get_proposal_by_slug(slug_param UUID)
RETURNS SETOF proposals LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM proposals WHERE public_slug = slug_param;
END;
$$;
