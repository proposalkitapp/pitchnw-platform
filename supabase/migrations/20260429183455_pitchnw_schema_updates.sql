CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS proposal_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id)
    ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'open', 'section_view', 'close',
      'accept', 'decline', 'comment'
    )
  ),
  section_name TEXT,
  device_type TEXT,
  time_spent_seconds INTEGER,
  client_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone inserts events"
  ON proposal_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners read own events"
  ON proposal_events FOR SELECT
  USING (proposal_id IN (
    SELECT id FROM proposals
    WHERE user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS pitch_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id)
    ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Deck',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'shared')),
  slides JSONB NOT NULL DEFAULT '[]',
  transcript TEXT,
  demo_link TEXT,
  thumbnail_url TEXT,
  is_collaborative BOOLEAN DEFAULT false,
  public_slug UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pitch_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own decks"
  ON pitch_decks FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Public read by slug"
  ON pitch_decks FOR SELECT
  USING (public_slug IS NOT NULL
         AND status = 'published');

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'creator'
CHECK (role IN ('creator', 'investor', 'admin'));

CREATE TABLE IF NOT EXISTS investor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id)
    ON DELETE CASCADE UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL CHECK (
    organization_type IN (
      'Angel Investor',
      'Venture Capital',
      'Private Equity',
      'Corporate Investor',
      'Government Fund',
      'Accelerator',
      'Incubator',
      'Grant Organization',
      'Competition / Award',
      'Other'
    )
  ),
  description TEXT,
  website TEXT,
  focus_areas TEXT[],
  min_investment TEXT,
  max_investment TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_accepting_pitches BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read investor profiles"
  ON investor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Investors manage own profile"
  ON investor_profiles FOR ALL
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS pitch_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitter_id UUID REFERENCES profiles(id)
    ON DELETE CASCADE NOT NULL,
  investor_id UUID
    REFERENCES investor_profiles(id)
    ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES proposals(id),
  pitch_deck_id UUID REFERENCES pitch_decks(id),
  cover_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'viewed', 'interested',
      'declined', 'in_discussion'
    )),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pitch_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submitters see own submissions"
  ON pitch_submissions FOR SELECT
  USING (submitter_id = auth.uid());

CREATE POLICY "Investors see their submissions"
  ON pitch_submissions FOR SELECT
  USING (investor_id IN (
    SELECT id FROM investor_profiles
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can submit"
  ON pitch_submissions FOR INSERT
  WITH CHECK (submitter_id = auth.uid());
