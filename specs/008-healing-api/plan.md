# Implementation Plan: Healing API

**Branch**: `008-healing-api` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-healing-api/spec.md`

## Summary

Create a POST API endpoint at `/api/heal` that restores all active party Pokemon (is_active = true) to full health. The endpoint authenticates via JWT, queries the player's active roster, updates current_hp to max_hp and restores all move PP, then returns the healed Pokemon data merged with Source details. This is a free operation with no currency cost.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, existing lib/pokemonData.js utilities
**Storage**: Supabase PostgreSQL with RLS (player_pokemon table)
**Testing**: Manual API testing via curl/Postman, integration with N8N workflows
**Target Platform**: Vercel serverless functions
**Project Type**: Web application (Next.js API routes)
**Performance Goals**: Response under 2 seconds for full party (6 Pokemon)
**Constraints**: Serverless execution timeout (10 seconds max), stateless requests
**Scale/Scope**: Single authenticated user healing their own party per request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Two-Tier Data Model | PASS | Database stores only current_hp, max_hp, move_pp. Source data merged for response using lib/pokemonData.js |
| II. External JWT Authentication | PASS | Uses authenticateRequest() from lib/authHelper.js to extract user_id from JWT |
| III. Row-Level Security | PASS | Uses existing player_pokemon RLS policies; queries filtered by user_id |
| IV. Data Merging Pattern | PASS | Uses buildPlayerPokemonListResponse() for API response |
| V. Serverless Architecture | PASS | Next.js API route at pages/api/heal.js, stateless |
| VI. Pokemon 5e Compliance | PASS | PP restoration uses initializeMovePP() from Source data |
| VII. Educational API Design | PASS | Returns complete healed state with merged Source data for N8N workflows |
| VIII. Spec-Driven Development | PASS | Following full workflow: specify -> plan -> tasks -> implement |

**Gate Status**: PASS - All principles satisfied, no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/008-healing-api/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── heal-api.md      # API contract for /api/heal
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
  api/
    heal.js              # NEW: Healing API endpoint

lib/
  supabase.js            # Existing: Supabase client
  authHelper.js          # Existing: JWT authentication
  apiResponse.js         # Existing: Response helpers
  pokemonData.js         # Existing: Source data utilities (initializeMovePP, buildPlayerPokemonListResponse)

sql/
  (no new migrations)    # Using existing player_pokemon table schema
```

**Structure Decision**: Single new API route file following existing patterns. No new lib modules needed - all required utilities exist in pokemonData.js.

## Complexity Tracking

> No violations to justify - all gates pass.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
