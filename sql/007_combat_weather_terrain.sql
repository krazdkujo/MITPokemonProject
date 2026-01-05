-- Feature: 017-5e-combat-research
-- Migration: Add weather and terrain columns to active_battles table

-- Add weather state column (JSONB for flexibility)
ALTER TABLE active_battles ADD COLUMN IF NOT EXISTS
  weather JSONB DEFAULT NULL;

-- Add terrain state column (JSONB for flexibility)
ALTER TABLE active_battles ADD COLUMN IF NOT EXISTS
  terrain JSONB DEFAULT NULL;

-- Add battle format column (1v1 or 2v2)
ALTER TABLE active_battles ADD COLUMN IF NOT EXISTS
  format VARCHAR(10) DEFAULT '1v1';

-- Comment explaining the structure
COMMENT ON COLUMN active_battles.weather IS 'Weather state: { type: string, turns_remaining: number|null, source: "environment"|"move" }';
COMMENT ON COLUMN active_battles.terrain IS 'Terrain state: { type: string, turns_remaining: number, affected_cells: array }';
COMMENT ON COLUMN active_battles.format IS 'Battle format: 1v1 or 2v2';
