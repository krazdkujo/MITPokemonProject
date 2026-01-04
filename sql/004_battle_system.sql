-- Migration: 004_battle_system
-- Purpose: Add battle-related columns for experience, PP, moves, and currency
-- Date: 2026-01-03
-- Feature: 006-battle-api

-- Add experience and level-up tracking to player_pokemon
ALTER TABLE player_pokemon
ADD COLUMN IF NOT EXISTS experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
ADD COLUMN IF NOT EXISTS pending_levelup BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS move_pp JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS selected_moves TEXT[] NOT NULL DEFAULT '{}';

-- Add currency to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS currency INTEGER NOT NULL DEFAULT 0 CHECK (currency >= 0);

-- Create index for faster lookups on pending level-ups
CREATE INDEX IF NOT EXISTS idx_player_pokemon_pending_levelup
ON player_pokemon(user_id, pending_levelup)
WHERE pending_levelup = true;
