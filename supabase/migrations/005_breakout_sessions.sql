-- ─── Breakout Sessions ───────────────────────────────────────────────────────

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('chat', 'video')),
  max_participants INT NOT NULL DEFAULT 8 CHECK (max_participants BETWEEN 3 AND 10),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  meeting_link TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Session participants table
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- Session messages table
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES session_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_sessions_status ON sessions(status, created_at DESC);
CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);
CREATE INDEX idx_session_messages_session ON session_messages(session_id, created_at ASC);
CREATE INDEX idx_session_messages_reply ON session_messages(reply_to_id);

-- ─── Realtime ────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE session_messages;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

-- Session participants policies
CREATE POLICY "session_participants_select" ON session_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "session_participants_insert" ON session_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_participants_delete" ON session_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Session messages policies
CREATE POLICY "session_messages_select" ON session_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_messages.session_id
        AND session_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "session_messages_insert" ON session_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = session_messages.session_id
        AND session_participants.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_messages.session_id
        AND sessions.status = 'open'
    )
  );
