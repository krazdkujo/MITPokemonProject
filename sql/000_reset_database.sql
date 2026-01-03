-- Migration: 000_reset_database
-- Purpose: Clear all data and tables to start fresh
-- Date: 2026-01-03
-- WARNING: This script DELETES ALL DATA. Only use in development!

-- ============================================================================
-- DROP TABLES (CASCADE automatically drops policies, triggers, and indexes)
-- ============================================================================

-- Future tables that reference users (add here as they're created)
DROP TABLE IF EXISTS battle_log CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS player_pokemon CASCADE;

-- Core tables
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- DROP FUNCTIONS (standalone functions not tied to tables)
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This query should return no rows if reset was successful
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'player_pokemon', 'inventory', 'battle_log');
