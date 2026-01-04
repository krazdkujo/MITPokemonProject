# Implementation Plan: Game Navigation Layout

**Branch**: `011-game-layout` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-game-layout/spec.md`

## Summary

Implement a persistent game navigation layout wrapping all play screens with a top navigation bar (logo, currency, player info) and left sidebar (navigation links, mini party display with HP bars). The layout fetches player data once at the top level and shares it via React Context, allowing all child pages to access currency and party status without redundant API calls.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with React 18
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, React 18
**Storage**: Supabase PostgreSQL (users table for currency, player_pokemon for party)
**Testing**: Manual testing with Next.js dev server
**Target Platform**: Web (Desktop browsers)
**Project Type**: Web application (Next.js)
**Performance Goals**: Layout renders in <1s, currency/party updates visible within 1s
**Constraints**: Serverless functions (10s timeout), stateless requests
**Scale/Scope**: 6 navigation destinations, up to 6 Pokemon in party display

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Two-Tier Data Model | PASS | Party Pokemon display will merge DB records with Source data via buildPlayerPokemonListResponse |
| II. External JWT Authentication | PASS | Layout uses existing AuthGuard and authenticateRequest patterns |
| III. Row-Level Security | PASS | No new tables required; uses existing RLS-protected tables |
| IV. Data Merging Pattern | PASS | Uses existing lib/pokemonData.js utilities for party data |
| V. Serverless Architecture | PASS | Layout is React component; uses existing Next.js API routes |
| VI. Pokemon 5e Compliance | PASS | HP calculations use existing formulas from Source data |
| VII. Educational API Design | PASS | No new API endpoints required; uses existing /api/player/pokemon and /api/player/inventory |
| VIII. Spec-Driven Development | PASS | Following spec-driven workflow |

**Gate Status**: PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/011-game-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
components/
├── layout/
│   ├── AuthGuard.js         # Existing - authentication wrapper
│   ├── GameLayout.js        # NEW - main layout wrapper with top nav + sidebar
│   ├── TopNav.js            # NEW - logo, currency badge, player info
│   ├── SideNav.js           # NEW - navigation links with icons
│   ├── MiniPartyDisplay.js  # NEW - compact party view with HP bars
│   ├── CurrencyBadge.js     # NEW - currency display component
│   └── NavLink.js           # NEW - individual nav item with active state
├── Dashboard/
│   └── HPBar.js             # Existing - reuse for mini party display

lib/
├── gameContext.js           # NEW - React Context for layout-level player data
├── authContext.js           # Existing - authentication state
├── pokemonData.js           # Existing - data merging utilities
└── apiFetch.js              # Existing - authenticated fetch helper

pages/
├── combat.js                # NEW (placeholder) - wrapped with GameLayout
├── pokemart.js              # NEW (placeholder) - wrapped with GameLayout
├── pokecenter.js            # NEW (placeholder) - wrapped with GameLayout
├── wild.js                  # NEW (placeholder) - wrapped with GameLayout
├── inventory.js             # NEW (placeholder) - wrapped with GameLayout
└── dashboard.js             # Existing - needs GameLayout wrapper
```

**Structure Decision**: Follows existing Next.js pages structure with components organized by feature area. New layout components go in `components/layout/`. React Context pattern for sharing layout-level state.

## Complexity Tracking

> No violations to justify - all constitution checks passed.
