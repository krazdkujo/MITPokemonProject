-- Migration: 003_add_hp_fields
-- Purpose: Add HP tracking fields to player_pokemon table
-- Date: 2026-01-03
-- Feature: 003-player-dashboard

-- Add HP fields with defaults
ALTER TABLE player_pokemon
ADD COLUMN IF NOT EXISTS current_hp INTEGER NOT NULL DEFAULT 1 CHECK (current_hp >= 0),
ADD COLUMN IF NOT EXISTS max_hp INTEGER NOT NULL DEFAULT 1 CHECK (max_hp >= 1);

-- Add constraint to ensure current_hp <= max_hp
-- Note: Using DO block to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hp_bounds'
  ) THEN
    ALTER TABLE player_pokemon ADD CONSTRAINT hp_bounds CHECK (current_hp <= max_hp);
  END IF;
END $$;

-- Update existing records to have proper HP values
-- For existing Pokemon, set HP to a reasonable default based on level
-- Formula: base HP of 10 + (level * 2) as simple placeholder
UPDATE player_pokemon
SET
  max_hp = 10 + (level * 2),
  current_hp = 10 + (level * 2)
WHERE max_hp = 1 OR current_hp = 1;
