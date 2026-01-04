# Implementation Plan: Player Dashboard

**Branch**: `003-player-dashboard` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-player-dashboard/spec.md`

## Summary

Build a comprehensive player dashboard that displays the active party (up to 6 Pokemon with sprites, names, types, levels, and HP bars), box count, Pokedex progress, and badge information. The dashboard merges database records with Source data following the established Two-Tier Data Model pattern and provides navigation to a detailed stats page.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, React 18
**Storage**: Supabase PostgreSQL with RLS (player_pokemon table, users table)
**Testing**: Manual testing via browser, API testing via test endpoints
**Target Platform**: Web browser (Vercel serverless deployment)
**Project Type**: Web application (Next.js pages with API routes)
**Performance Goals**: Dashboard loads in under 2 seconds (SC-001)
**Constraints**: 10-second API timeout (Vercel limit), stateless requests, no persistent connections
**Scale/Scope**: Single user dashboard view, up to 6 active Pokemon + unlimited stored Pokemon

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| I. Two-Tier Data Model | PASS | Dashboard merges player_pokemon DB records with Source/pokemon/pokemon.json via lib/pokemonData.js |
| II. External JWT Authentication | PASS | Dashboard page protected by AuthGuard; API routes validate Bearer tokens |
| III. Row-Level Security | PASS | player_pokemon table has RLS enabled; all queries filtered by user_id |
| IV. Data Merging Pattern | PASS | Uses buildPlayerPokemonListResponse() from lib/pokemonData.js |
| V. Serverless Architecture | PASS | Next.js API routes on Vercel; Supabase client for DB access |
| VI. Pokemon 5e Compliance | PASS | HP display uses database current_hp/max_hp; sprite/type from Source |
| VII. Educational API Design | PASS | API returns consistent JSON envelope with success/data/error structure |
| VIII. Spec-Driven Development | PASS | Following specify -> plan -> tasks workflow |

**Gate Status**: PASSED - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/003-player-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
pages/
├── dashboard.js         # Enhanced dashboard page (existing, to be updated)
├── api/
│   └── player/
│       ├── pokemon.js   # Existing - returns player Pokemon roster
│       └── stats.js     # New - returns dashboard summary stats

components/
├── Dashboard/           # New feature component directory
│   ├── PartyCard.js     # Single Pokemon card with HP bar
│   ├── PartyRoster.js   # Active party display (6 slots)
│   ├── StatsSummary.js  # Box count, Pokedex progress, badges
│   └── HPBar.js         # Reusable HP bar component
├── layout/
│   └── AuthGuard.js     # Existing - protects authenticated routes

lib/
├── pokemonData.js       # Existing - Source data merging utilities
├── supabase.js          # Existing - Supabase client
└── apiFetch.js          # Existing - API fetch wrapper

sql/
└── 003_add_hp_fields.sql  # Migration to add current_hp and max_hp fields
```

**Structure Decision**: Following existing web application structure with pages/, components/, lib/, and api/ directories. New components organized under components/Dashboard/ for feature isolation.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
