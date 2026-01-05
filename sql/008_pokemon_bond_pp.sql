-- Feature: 017-5e-combat-research
-- Migration: Add bond_level and move_pp columns to player_pokemon table

-- Add bond level column (-3 to +3)
ALTER TABLE player_pokemon ADD COLUMN IF NOT EXISTS
  bond_level INTEGER DEFAULT 0 CHECK (bond_level >= -3 AND bond_level <= 3);

-- Add move PP tracking as JSONB (maps move_id to current PP)
ALTER TABLE player_pokemon ADD COLUMN IF NOT EXISTS
  move_pp JSONB DEFAULT '{}';

-- Create index for bond level queries (useful for Mega Evolution requirements)
CREATE INDEX IF NOT EXISTS idx_player_pokemon_bond
  ON player_pokemon(user_id, bond_level);

-- Comment explaining the structure
COMMENT ON COLUMN player_pokemon.bond_level IS 'Bond level from -3 to +3 per Pokemon 5e rules';
COMMENT ON COLUMN player_pokemon.move_pp IS 'Current PP for each move: { "move-id": current_pp }';
