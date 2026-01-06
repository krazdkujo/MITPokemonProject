# Implementation Plan: Combat Test Harness

**Branch**: `021-combat-test-harness` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-combat-test-harness/spec.md`

## Summary

Create a combat test harness with both a web UI (`/test-combat` page) and CLI script (`npm run test:combat`) for debugging the Pokemon 5e battle system. The harness simulates turn-by-turn combat between two configurable Pokemon with verbose logging of all calculations (attack rolls, damage, status effects). Supports step-by-step execution and auto-run modes with AI-controlled move selection.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, existing lib/ battle utilities
**Storage**: N/A (no persistence required - uses existing Source data files for Pokemon/moves)
**Testing**: Manual testing via UI and CLI; optional Jest for unit tests
**Target Platform**: Web browser (test page) + Node.js CLI
**Project Type**: Web application (Next.js)
**Performance Goals**: Complete simulation in <5 seconds
**Constraints**: Must use existing battle engine logic unchanged; dev-only feature
**Scale/Scope**: Single developer tool; ~500 lines of new code estimated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template has placeholders, indicating no specific project constraints are defined. Proceeding with standard best practices:

- [x] **Library Reuse**: Will reuse existing lib/battleEngine.js, combatUtils.js, statusEffects.js
- [x] **Simplicity**: Minimal new code; leverages existing infrastructure
- [x] **No Breaking Changes**: Test harness is additive; does not modify production battle logic

**Status**: PASS - No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/021-combat-test-harness/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── test-combat.js       # NEW: Web UI test page

scripts/
├── test-combat.js       # NEW: CLI script for npm run test:combat

lib/
├── combatSimulator.js   # NEW: Shared simulation logic for UI and CLI
├── combatLogger.js      # NEW: Verbose logging formatter
├── battleEngine.js      # EXISTING: Core combat calculations (unchanged)
├── combatUtils.js       # EXISTING: Combat utilities (unchanged)
├── combatAI.js          # EXISTING: AI move selection (unchanged)
├── statusEffects.js     # EXISTING: Status effect processing (unchanged)
├── pokemonData.js       # EXISTING: Pokemon/move data loading (unchanged)
└── diceRoller.js        # EXISTING: Dice mechanics (unchanged)

components/
└── TestCombat/          # NEW: UI components for test page
    ├── PokemonSelector.js
    ├── BattleLog.js
    └── ControlPanel.js
```

**Structure Decision**: Next.js Pages Router pattern with new page at `/test-combat`, supporting CLI script in `/scripts/`, and shared simulation logic in `/lib/combatSimulator.js`.

## Complexity Tracking

No violations to justify. Implementation is straightforward:
- One new page
- One CLI script
- Two new lib files (simulator + logger)
- Three UI components
