-- 006_active_battles.sql
-- Zone-based encounter battle persistence
-- Feature: 016-zone-encounters

-- Active Battles Table
-- Stores ongoing battle state for resume across sessions
CREATE TABLE IF NOT EXISTS active_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  zone_id TEXT NOT NULL,
  battle_state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'victory', 'defeat', 'fled', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure only one active battle per user
-- This partial unique index allows multiple completed battles but only one active
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_battles_user_active
ON active_battles(user_id)
WHERE status = 'active';

-- Query historical battles by user (for stats/history features)
CREATE INDEX IF NOT EXISTS idx_active_battles_user_created
ON active_battles(user_id, created_at DESC);

-- Filter by status for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_active_battles_status
ON active_battles(status)
WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE active_battles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own battles
CREATE POLICY "Users can view own battles"
ON active_battles FOR SELECT
USING (user_id = auth.uid());

-- Users can only insert battles for themselves
CREATE POLICY "Users can insert own battles"
ON active_battles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own battles
CREATE POLICY "Users can update own battles"
ON active_battles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_active_battles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS active_battles_updated_at ON active_battles;
CREATE TRIGGER active_battles_updated_at
BEFORE UPDATE ON active_battles
FOR EACH ROW EXECUTE FUNCTION update_active_battles_updated_at();

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON active_battles TO authenticated;
