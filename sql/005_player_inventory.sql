-- Migration: 005_player_inventory
-- Purpose: Create player inventory table for purchased items
-- Date: 2026-01-04
-- Feature: 009-shop-api

-- Create player_inventory table
CREATE TABLE IF NOT EXISTS player_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Index for user inventory lookups
CREATE INDEX IF NOT EXISTS idx_player_inventory_user_id
ON player_inventory(user_id);

-- Enable Row-Level Security
ALTER TABLE player_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own inventory"
  ON player_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory"
  ON player_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory"
  ON player_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory"
  ON player_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger (reuses existing function from users table)
CREATE TRIGGER update_player_inventory_updated_at
  BEFORE UPDATE ON player_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
