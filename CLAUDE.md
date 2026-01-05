# MITPokemonProject Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-03

## Active Technologies
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, @supabase/supabase-js, React 18 (002-starter-selection)
- Supabase PostgreSQL with RLS (player_pokemon table) (002-starter-selection)
- Supabase PostgreSQL with RLS (player_pokemon table, users table) (003-player-dashboard)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, node-fetch (for download script) (004-pokemon-images)
- Static files in `public/images/pokemon/` directory (served by Next.js) (004-pokemon-images)
- JavaScript (ES2020+) / Node.js 18+ / Next.js 14 + Recharts (new), @supabase/supabase-js, React 18 (005-player-statistics)
- Supabase PostgreSQL (existing `player_pokemon` table - no new tables) (005-player-statistics)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, @supabase/supabase-js, existing lib/pokemonData.js utilities (006-battle-api)
- Supabase PostgreSQL (player_pokemon table with RLS) (006-battle-api)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, @supabase/supabase-js, uuid (existing) (007-combat-engine)
- Supabase PostgreSQL with RLS (player_pokemon table with current_hp, pp tracking) (007-combat-engine)
- Supabase PostgreSQL with RLS (users table for currency, new player_inventory table) (009-shop-api)
- JavaScript (ES2020+) with React 18 + Next.js 14, @supabase/supabase-js, React 18 (011-game-layout)
- Supabase PostgreSQL (users table for currency, player_pokemon for party) (011-game-layout)
- JavaScript (ES2020+) with React 18, Next.js 14 + React 18, Next.js 14, @supabase/supabase-js (existing) (014-wild-encounter)
- Static JSON file for locations (Source/locations.json), Supabase PostgreSQL for player data (014-wild-encounter)
- JavaScript (ES2020+) with Node.js 18+ and Next.js 14 + React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/combatUtils.js, lib/statusEffects.js (015-combat-arena)
- Supabase PostgreSQL (existing player_pokemon table) (015-combat-arena)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, React 18, @supabase/supabase-js (016-zone-encounters)
- Supabase PostgreSQL (new active_battles table) + Source JSON files (016-zone-encounters)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, React 18, @supabase/supabase-js, existing lib/ utilities (017-5e-combat-research)
- Supabase PostgreSQL with RLS (existing tables: player_pokemon, users, player_inventory, active_battles) (017-5e-combat-research)
- JavaScript (ES2020+) with Node.js 18+ + Next.js 14, React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/combatUtils.js, lib/gridUtils.js, lib/ppTracker.js (018-combat-enhancements)
- Supabase PostgreSQL (active_battles table with JSONB battle_state, player_pokemon table with move_pp JSONB) (018-combat-enhancements)
- JavaScript (ES2020+) with Node.js 18+ / Next.js 14 + React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/battleState.js (019-fix-combat-bugs)
- Supabase PostgreSQL (existing tables: active_battles, player_pokemon) (019-fix-combat-bugs)

- JavaScript/TypeScript with Node.js 18+ + Next.js 14, @supabase/supabase-js, React 18 (001-env-auth-setup)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

JavaScript/TypeScript with Node.js 18+: Follow standard conventions

## Recent Changes
- 019-fix-combat-bugs: Added JavaScript (ES2020+) with Node.js 18+ / Next.js 14 + React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/battleState.js
- 018-combat-enhancements: Added JavaScript (ES2020+) with Node.js 18+ + Next.js 14, React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/combatUtils.js, lib/gridUtils.js, lib/ppTracker.js
- 017-5e-combat-research: Added JavaScript (ES2020+) with Node.js 18+ + Next.js 14, React 18, @supabase/supabase-js, existing lib/ utilities


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
