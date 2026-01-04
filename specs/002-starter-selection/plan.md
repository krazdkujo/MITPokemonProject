# Implementation Plan: Starter Pokemon Selection

**Branch**: `002-starter-selection` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-starter-selection/spec.md`

## Summary

New users who have no Pokemon must select a starter before accessing the app. The system filters Pokemon with SR <= 0.5 from Source data, displays them with type filter controls, and creates a player_pokemon record when selection is confirmed. This follows the Two-Tier Data Model pattern where Source JSON provides reference data and the database stores only user-specific state.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, React 18
**Storage**: Supabase PostgreSQL with RLS (player_pokemon table)
**Testing**: Manual testing via test auth flow
**Target Platform**: Web (Vercel serverless)
**Project Type**: Web application (Next.js pages + API routes)
**Performance Goals**: Type filtering < 200ms, selection flow < 60 seconds total
**Constraints**: 10 second API timeout (Vercel), stateless requests
**Scale/Scope**: Single page (starter selection), 1 new API endpoint, 1 database table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Pokemon data from Source/pokemon/pokemon.json, database stores only user_id, pokemon_id, level, is_active, slot_number |
| II. External JWT Authentication | PASS | Uses existing auth flow from 001-env-auth-setup; checks user_id from session |
| III. Row-Level Security | PASS | player_pokemon table will have RLS policies with user_id = auth.uid() |
| IV. Data Merging Pattern | PASS | Will implement lib/pokemonData.js functions to merge db records with Source |
| V. Serverless Architecture | PASS | API routes in pages/api/, React components, Supabase client |
| VI. Pokemon 5e Compliance | PASS | Uses SR field from Source data for starter eligibility |
| VII. Educational API Design | PASS | Uses existing apiResponse.js patterns for consistent JSON responses |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow |

**Gate Status**: PASSED - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-starter-selection/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API endpoint contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── api/
│   ├── auth/test-login.js        # Existing
│   ├── health.js                  # Existing
│   ├── pokemon/
│   │   └── starters.js            # NEW: Get starter-eligible Pokemon
│   └── player/
│       └── pokemon.js             # NEW: Player Pokemon CRUD
├── starter-select.js              # NEW: Starter selection page
├── dashboard.js                   # NEW: Post-selection landing page
├── _app.js                        # Existing
└── index.js                       # Existing (update redirect logic)

components/
├── auth/TestAuthForm.js           # Existing
├── starter/                       # NEW
│   ├── StarterGrid.js             # Pokemon grid display
│   ├── StarterCard.js             # Individual Pokemon card
│   ├── TypeFilterBar.js           # Type filter controls
│   └── ConfirmationModal.js       # Selection confirmation
└── layout/                        # NEW
    └── AuthGuard.js               # Route protection with starter check

lib/
├── supabase.js                    # Existing
├── apiResponse.js                 # Existing
├── authContext.js                 # Existing
└── pokemonData.js                 # NEW: Source data utilities

sql/
├── 000_reset_database.sql         # Existing
├── 001_create_users_table.sql     # Existing
└── 002_create_player_pokemon.sql  # NEW: Player Pokemon table + RLS
```

**Structure Decision**: Using existing Next.js pages structure with new API routes under `/api/pokemon/` and `/api/player/`. Components organized by feature (starter/) following existing pattern.

## Complexity Tracking

No constitution violations to justify.
