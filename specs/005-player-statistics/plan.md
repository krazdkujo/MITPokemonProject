# Implementation Plan: Player Statistics Page

**Branch**: `005-player-statistics` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-player-statistics/spec.md`

## Summary

Create a comprehensive statistics page accessible from the dashboard that displays player analytics including Pokemon collection breakdown by type, level distribution with visualizations, top Pokemon ranking, and placeholder sections for future battle/badge statistics. Uses Recharts for visualizations and follows existing architectural patterns.

## Technical Context

**Language/Version**: JavaScript (ES2020+) / Node.js 18+ / Next.js 14
**Primary Dependencies**: Recharts (new), @supabase/supabase-js, React 18
**Storage**: Supabase PostgreSQL (existing `player_pokemon` table - no new tables)
**Testing**: Manual browser testing + API endpoint verification
**Target Platform**: Web (Next.js on Vercel)
**Project Type**: Web application (pages + API routes)
**Performance Goals**: < 3 seconds page load (SC-001)
**Constraints**: Responsive 320px-1920px (SC-005), handle empty states gracefully (FR-006)
**Scale/Scope**: Single authenticated user viewing their own statistics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design | Post-Design | Notes |
|-----------|------------|-------------|-------|
| I. Two-Tier Data Model | PASS | PASS | Stats computed from player_pokemon + Source data |
| II. External JWT Auth | PASS | PASS | Uses authenticateRequest pattern |
| III. Row-Level Security | PASS | PASS | Queries filtered by user_id from JWT |
| IV. Data Merging Pattern | PASS | PASS | Uses lib/pokemonData.js utilities |
| V. Serverless Architecture | PASS | PASS | Standard Next.js API route |
| VI. Pokemon 5e Compliance | PASS | PASS | Types read from Source, not hardcoded |
| VII. Educational API Design | PASS | PASS | Consistent JSON envelope, clear responses |
| VIII. Spec-Driven Development | PASS | PASS | Following spec -> plan -> tasks workflow |

**Gate Status**: PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/005-player-statistics/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research output
├── data-model.md        # Entity definitions
├── quickstart.md        # Implementation guide
├── contracts/
│   └── api-player-stats.yaml  # OpenAPI specification
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # (Created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── api/
│   └── player/
│       └── stats.js           # NEW: Statistics API endpoint
└── stats.js                   # NEW: Statistics page

components/
├── Stats/                     # NEW: Stats components directory
│   ├── TypeDistributionChart.js
│   ├── LevelDistributionChart.js
│   ├── TopPokemonList.js
│   ├── StatsCard.js
│   └── EmptyState.js
└── Dashboard/
    └── StatsSummary.js        # EXISTING (links to stats page)

lib/
├── pokemonData.js             # EXISTING (used for type lookups)
├── apiResponse.js             # EXISTING (response helpers)
└── authHelper.js              # EXISTING (authentication)
```

**Structure Decision**: Web application structure matching existing codebase. New components in `components/Stats/` following the pattern of `components/Dashboard/` and `components/starter/`.

## Complexity Tracking

> No violations requiring justification. Feature follows established patterns.

## Phase Artifacts

### Phase 0: Research (Complete)
- [research.md](./research.md) - Technical decisions documented

### Phase 1: Design (Complete)
- [data-model.md](./data-model.md) - Entity definitions
- [contracts/api-player-stats.yaml](./contracts/api-player-stats.yaml) - API specification
- [quickstart.md](./quickstart.md) - Implementation guide

### Phase 2: Tasks (Pending)
- Run `/speckit.tasks` to generate implementation tasks

## Implementation Order

1. **API Endpoint** (`pages/api/player/stats.js`)
   - Authenticate request
   - Query player_pokemon
   - Merge with Source data
   - Calculate type/level statistics
   - Return structured response

2. **Stats Components** (`components/Stats/`)
   - EmptyState.js (reusable)
   - StatsCard.js (wrapper)
   - TypeDistributionChart.js
   - LevelDistributionChart.js
   - TopPokemonList.js

3. **Stats Page** (`pages/stats.js`)
   - AuthGuard wrapper
   - Fetch from /api/player/stats
   - Render components
   - Handle loading/error states

4. **Integration**
   - Verify dashboard link works
   - Test responsive layouts
   - Verify empty states

## Dependencies

### New Package
```bash
npm install recharts
```

### Existing (no changes needed)
- @supabase/supabase-js
- React 18
- Next.js 14

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Recharts SSR issues | Use dynamic import with `ssr: false` if needed |
| Large Pokemon collections slow | Limit topPokemon to 5, paginate if >100 Pokemon |
| Missing Source data | Existing `getPokemonById` returns null, handle gracefully |
| Future battle/badge tables | Return null sections, UI shows "Coming Soon" |

## Next Steps

Run `/speckit.tasks` to generate the ordered implementation task list.
