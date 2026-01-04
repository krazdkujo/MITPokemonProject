# Implementation Plan: Combat Arena Page

**Branch**: `015-combat-arena` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-combat-arena/spec.md`

## Summary

Implement a 10x10 grid-based Combat Arena page for Pokemon 5e battles. The page displays a chess-like battle grid with columns A-J and rows 1-10, supporting turn-based combat with initiative ordering, Pokemon placement in deployment zones, and visual feedback for attacks, damage, and status effects. Leverages existing battle engine (`lib/battleEngine.js`), combat utilities (`lib/combatUtils.js`), and status effect systems (`lib/statusEffects.js`).

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+ and Next.js 14
**Primary Dependencies**: React 18, @supabase/supabase-js, existing lib/battleEngine.js, lib/combatUtils.js, lib/statusEffects.js
**Storage**: Supabase PostgreSQL (existing player_pokemon table)
**Testing**: Manual testing via browser, API testing via curl/Postman
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js)
**Performance Goals**: Grid renders in <2 seconds, turn actions complete in <5 seconds
**Constraints**: 10-second API route timeout (Vercel serverless), stateless requests
**Scale/Scope**: Single player vs AI opponent, 6 Pokemon max per side

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Battle state uses pokemon_id references, merges with Source data via lib/pokemonData.js |
| II. External JWT Authentication | PASS | All API routes use authenticateRequest() to validate Bearer tokens |
| III. Row-Level Security | PASS | player_pokemon table has RLS; battle actions validate user owns Pokemon |
| IV. Data Merging Pattern | PASS | Use buildPlayerPokemonResponse() for all Pokemon in battle state |
| V. Serverless Architecture | PASS | All battle API routes are Next.js serverless functions |
| VI. Pokemon 5e Compliance | PASS | Damage, initiative, status effects use existing battle engine from Source data |
| VII. Educational API Design | PASS | All responses use { success, data, error } envelope with detailed roll info |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow |

## Project Structure

### Documentation (this feature)

```text
specs/015-combat-arena/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── battle-grid-api.md
│   └── battle-actions-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
pages/
├── combat.js                    # Combat Arena page (main implementation)
└── api/
    └── battle/
        ├── start.js             # Existing - initialize battle
        ├── index.js             # Existing - execute combat action (attack)
        ├── catch.js             # Existing - catch wild Pokemon
        ├── place.js             # NEW - place Pokemon during setup
        ├── move.js              # NEW - move Pokemon on grid
        └── flee.js              # NEW - attempt to flee battle

components/
└── Combat/
    ├── BattleGrid.js            # 10x10 grid with coordinate labels
    ├── GridSquare.js            # Individual cell (Pokemon/trainer/empty)
    ├── PokemonToken.js          # Pokemon sprite with HP bar and status icons
    ├── MoveSelector.js          # Available moves list with PP
    ├── BattleLog.js             # Scrollable action log
    ├── TurnIndicator.js         # Current turn and initiative order
    ├── BattleControls.js        # Action buttons (Attack, Move, Catch, Flee)
    └── BattleEndScreen.js       # Victory/Defeat overlay

lib/
├── battleEngine.js              # Existing - extend with grid positioning
├── gridUtils.js                 # NEW - grid coordinate helpers
└── battleState.js               # NEW - client-side battle state management
```

**Structure Decision**: Web application structure following existing Next.js patterns. New components in `components/Combat/` directory. New API routes extend existing `/api/battle/` namespace.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
