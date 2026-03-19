-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    company     TEXT,
    role        TEXT,
    city        TEXT,
    country     TEXT,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    timezone    TEXT,
    avatar_url  TEXT,           -- Supabase Storage URL
    linkedin_url TEXT,
    bio         TEXT,           -- 280 char intro
    onboarded   BOOLEAN DEFAULT FALSE,
    roulette_opt_in BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- "I can help with" / "I want to learn" tags
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category    TEXT NOT NULL CHECK (category IN ('help', 'learn')),
    label       TEXT NOT NULL,
    UNIQUE(user_id, category, label)
);

-- Coffee Roulette matches
CREATE TABLE matches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','skipped')),
    shared_tags JSONB,          -- Array of overlapping help↔learn tags
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages (Realtime-enabled)
CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    read_at     TIMESTAMPTZ
);

-- Travel announcements
CREATE TABLE trips (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    city        TEXT NOT NULL,
    country     TEXT NOT NULL,
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    date_from   DATE NOT NULL,
    date_to     DATE NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Invite tracking
CREATE TABLE invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    used_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_tags_category_label ON tags(category, label);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_receiver_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_matches_users ON matches(user_a_id, user_b_id, year, week_number);
CREATE INDEX idx_trips_active ON trips(date_to);
CREATE INDEX idx_profiles_onboarded ON profiles(onboarded) WHERE onboarded = TRUE;

-- Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;



-- Profiles: anyone authenticated can read, only own profile writable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Tags: readable by all authenticated, writable by owner
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags are viewable by authenticated users" ON tags
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own tags" ON tags
    FOR ALL USING (auth.uid() = user_id);

-- Messages: only sender or receiver can see
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can mark as read" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Matches: participants can see their own matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own matches" ON matches
    FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "Users can update own match status" ON matches
    FOR UPDATE USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Trips: readable by all authenticated, writable by owner
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trips are viewable by authenticated users" ON trips
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own trips" ON trips
    FOR ALL USING (auth.uid() = user_id);

-- Invites: anyone can read (to verify), creators can manage
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invites are verifiable" ON invites
    FOR SELECT USING (true);
CREATE POLICY "Users can create invites" ON invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);
	
	
-- Create avatars bucket (in Supabase dashboard or via API)
-- Public read, authenticated write, 2MB max, images only
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
	
	
	





