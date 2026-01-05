# Implementation Plan: Combat System Enhancements

**Branch**: `018-combat-enhancements` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-combat-enhancements/spec.md`

## Summary

This feature enhances the grid-based combat system with six key improvements: (1) Pokemon stat tooltips on hover, (2) fixing the "No PP" bug in move selection caused by inconsistent known_moves data structures, (3) validating and improving combat state database persistence, (4) adding move range mechanics with visual grid highlighting, (5) adding Pokemon movement range mechanics with visual feedback, and (6) implementing tactical AI for opponent move selection and positioning.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/combatUtils.js, lib/gridUtils.js, lib/ppTracker.js
**Storage**: Supabase PostgreSQL (active_battles table with JSONB battle_state, player_pokemon table with move_pp JSONB)
**Testing**: Manual testing via dev server, existing battle flow tests
**Target Platform**: Web browser (desktop-first, responsive)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Stat tooltip appears within 500ms, AI turn completes under 3 seconds
**Constraints**: Serverless API routes with 10-second timeout, stateless request handling
**Scale/Scope**: Single-player battles, 10x10 grid, 1-6 Pokemon per side

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Two-Tier Data Model | PASS | Move ranges derived from Source moves.json, movement defaults stored in Source. No new reference data in DB. |
| II. External JWT Authentication | PASS | Battle APIs already validate JWT; no changes to auth flow needed. |
| III. Row-Level Security | PASS | active_battles table has RLS; user_id filtering in place. |
| IV. Data Merging Pattern | PASS | Will use lib/pokemonData.js utilities for merging move data; fixes known_moves inconsistency. |
| V. Serverless Architecture | PASS | All logic in API routes; AI decision-making within timeout limits. |
| VI. Pokemon 5e Compliance | PASS | Range defaults from Source; movement uses existing speed/movement_remaining fields. |
| VII. Educational API Design | PASS | Error responses already follow envelope pattern; no changes needed. |
| VIII. Spec-Driven Development | PASS | Following spec-driven workflow with numbered feature folder. |

**All gates pass. No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/018-combat-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── battle-api.yaml  # Updated battle API contracts
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── api/
│   └── battle/
│       ├── start.js     # Fix opponent known_moves to include full move objects
│       ├── action.js    # Add range validation, fix PP tracking
│       └── state/[battleId].js  # Validate state persistence
├── combat.js            # Add hover tooltip, range/movement highlighting, AI improvements

components/
├── Combat/
│   ├── MoveSelector.js  # Fix PP display, add range indicator
│   ├── PokemonTooltip.js       # NEW: Stat tooltip component
│   ├── GridHighlight.js        # NEW: Range/movement visualization
│   └── ActionPanel.js   # Add movement action button

lib/
├── battleEngine.js      # Ensure consistent combatant building
├── gridUtils.js         # Add range calculation utilities
├── moveRanges.js        # NEW: Move range lookup/calculation
└── combatAI.js          # NEW: AI decision-making logic

Source/
└── moves/moves.json     # Reference for range parsing
```

**Structure Decision**: Web application pattern with existing Next.js structure. New components added to Combat/ folder. New lib modules for range and AI logic.
