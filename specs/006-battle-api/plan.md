# Implementation Plan: Battle API Endpoint

**Branch**: `006-battle-api` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-battle-api/spec.md`

## Summary

Build the main battle API endpoint for N8N workflow integration. The endpoint accepts a player's Pokemon ID and move choice, processes battle turns using Pokemon 5e combat rules from Source JSON files, updates Pokemon state in the database, and returns a detailed JSON battle log for workflow parsing.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, existing lib/pokemonData.js utilities
**Storage**: Supabase PostgreSQL (player_pokemon table with RLS)
**Testing**: Manual API testing via curl/Postman, N8N workflow integration testing
**Target Platform**: Vercel serverless functions
**Project Type**: Web application (Next.js API routes)
**Performance Goals**: Response within 3 seconds (per SC-001), stateless request handling
**Constraints**: 10-second Vercel timeout, no persistent connections, all state in database
**Scale/Scope**: Single battle endpoint, one player Pokemon vs one wild opponent per request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Battle logic uses Source JSON for stats, moves, type charts; database stores only user state (HP, PP, XP) |
| II. External JWT Authentication | PASS | Uses existing `authenticateRequest` pattern from lib/authHelper.js |
| III. Row-Level Security | PASS | All queries to player_pokemon use user_id; RLS policies already exist |
| IV. Data Merging Pattern | PASS | Will extend lib/pokemonData.js with move/combat utilities |
| V. Serverless Architecture | PASS | API route at pages/api/battle.js, stateless, uses Supabase client |
| VI. Pokemon 5e Compliance | PASS | Damage formulas, STAB, type effectiveness all from Source rules.json |
| VII. Educational API Design | PASS | Returns detailed battle log with turn-by-turn actions for N8N parsing |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow |

**All gates pass. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/006-battle-api/
  plan.md              # This file
  research.md          # Phase 0 output
  data-model.md        # Phase 1 output
  quickstart.md        # Phase 1 output
  contracts/           # Phase 1 output
    battle-api.yaml    # OpenAPI contract
  tasks.md             # Phase 2 output (speckit.tasks command)
```

### Source Code (repository root)

```text
pages/
  api/
    battle.js          # NEW: Main battle endpoint

lib/
  pokemonData.js       # EXTEND: Add move lookup, combat utilities
  battleEngine.js      # NEW: Battle logic (damage calc, turn processing)
  typeEffectiveness.js # NEW: Type chart utilities

sql/
  004_add_experience_and_pp.sql  # NEW: Add XP, PP tracking, currency fields

Source/
  pokemon/pokemon.json   # READ: Pokemon stats, types, moves by level
  moves/moves.json       # READ: Move power, type, PP, damage formulas
  rules/rules.json       # READ: Combat rules, XP formulas, type chart
```

**Structure Decision**: Extends existing Next.js web application structure. New files follow established patterns (API routes in pages/api/, utilities in lib/, migrations in sql/).

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
