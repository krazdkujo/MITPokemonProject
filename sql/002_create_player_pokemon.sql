-- Migration: 002_create_player_pokemon
-- Purpose: Create player_pokemon table for user-owned Pokemon
-- Date: 2026-01-03
-- Feature: 002-starter-selection

-- Create player_pokemon table
CREATE TABLE IF NOT EXISTS player_pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pokemon_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  is_active BOOLEAN NOT NULL DEFAULT false,
  slot_number INTEGER CHECK (slot_number >= 1 AND slot_number <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_player_pokemon_user_id ON player_pokemon(user_id);
CREATE INDEX IF NOT EXISTS idx_player_pokemon_active ON player_pokemon(user_id, is_active) WHERE is_active = true;

-- Enable Row-Level Security
ALTER TABLE player_pokemon ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own Pokemon
CREATE POLICY "Users can view own Pokemon"
  ON player_pokemon FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own Pokemon
CREATE POLICY "Users can insert own Pokemon"
  ON player_pokemon FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own Pokemon
CREATE POLICY "Users can update own Pokemon"
  ON player_pokemon FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own Pokemon
CREATE POLICY "Users can delete own Pokemon"
  ON player_pokemon FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to auto-update updated_at
CREATE TRIGGER update_player_pokemon_updated_at
  BEFORE UPDATE ON player_pokemon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
