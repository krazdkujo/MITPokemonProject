# Implementation Plan: Wild Pokemon Encounter Page

**Branch**: `014-wild-encounter` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-wild-encounter/spec.md`

## Summary

Implement a Wild Pokemon encounter page (`pages/wild.js`) that allows players to browse encounter locations, select an area, search for wild Pokemon, and choose to battle or flee. The page integrates with the existing `/api/battle/start` endpoint and navigates to the `/combat` page for battles.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with React 18, Next.js 14
**Primary Dependencies**: React 18, Next.js 14, @supabase/supabase-js (existing)
**Storage**: Static JSON file for locations (Source/locations.json), Supabase PostgreSQL for player data
**Testing**: Manual browser testing (consistent with existing pages)
**Target Platform**: Web browsers (desktop and mobile responsive)
**Project Type**: Web application (Next.js pages + API routes)
**Performance Goals**: Page load <2s, encounter generation <3s (per success criteria)
**Constraints**: Serverless function timeout 10s max, stateless requests
**Scale/Scope**: 3-5 encounter locations for MVP, single page with multiple states

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Location data in Source/locations.json (new), Pokemon pools reference Source pokemon IDs, no duplication in database |
| II. External JWT Authentication | PASS | Uses existing GameLayout which handles auth via AuthGuard |
| III. Row-Level Security | N/A | No new database tables; uses existing player_pokemon with RLS |
| IV. Data Merging Pattern | PASS | Uses existing lib/pokemonData.js utilities for Pokemon data |
| V. Serverless Architecture | PASS | Page uses Next.js page, calls existing API endpoints |
| VI. Pokemon 5e Compliance | PASS | Wild Pokemon generation uses Source data for stats, moves, levels |
| VII. Educational API Design | PASS | Uses existing battle/start endpoint with documented response format |
| VIII. Spec-Driven Development | PASS | Following spec-driven workflow |

**Gate Status**: PASS - All constitution principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/014-wild-encounter/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
Source/
├── locations.json       # NEW: Encounter location definitions (read-only)
└── pokemon/pokemon.json # Existing: Pokemon species data

pages/
├── wild.js              # MODIFY: Replace placeholder with encounter UI
└── combat.js            # Existing: Navigation target for battles

components/
└── Wild/                # NEW: Wild encounter components
    ├── LocationSelector.js   # Location grid/list
    ├── LocationCard.js       # Individual location display
    ├── EncounterDisplay.js   # Wild Pokemon reveal
    └── EncounterActions.js   # Battle/Flee buttons

lib/
├── pokemonData.js       # Existing: Pokemon utilities
├── gameContext.js       # Existing: Party and player state
└── locationData.js      # NEW: Location data loading utilities
```

**Structure Decision**: Following existing Next.js project structure. New components go in `components/Wild/` following the pattern established by `components/Dashboard/` and `components/layout/`. Location data added to `Source/` following Two-Tier Data Model principle.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
