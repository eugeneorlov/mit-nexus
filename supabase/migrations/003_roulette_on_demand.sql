-- Queue for users waiting for a match
CREATE TABLE match_queue (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    entered_at  TIMESTAMPTZ DEFAULT NOW(),
    matched     BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id)  -- a user can only be in the queue once
);

-- Index for finding unmatched queue entries quickly
CREATE INDEX idx_match_queue_active ON match_queue(matched, entered_at ASC)
    WHERE matched = FALSE;

-- RLS policies
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- Users can see their own queue status
CREATE POLICY "Users can view own queue entry"
    ON match_queue FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert themselves into the queue
CREATE POLICY "Users can join queue"
    ON match_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves from the queue
CREATE POLICY "Users can leave queue"
    ON match_queue FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can do anything (for the Edge Function)
CREATE POLICY "Service role full access on match_queue"
    ON match_queue
    USING (auth.role() = 'service_role');

-- Add 'active' status option
ALTER TABLE matches
    DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches
    ADD CONSTRAINT matches_status_check
    CHECK (status IN ('pending', 'active', 'completed', 'skipped'));

-- week_number and year columns remain but become nullable / unused
-- Don't drop them — existing data references them
-- New matches will have NULL for week_number and year
ALTER TABLE matches ALTER COLUMN week_number DROP NOT NULL;
ALTER TABLE matches ALTER COLUMN year DROP NOT NULL;
