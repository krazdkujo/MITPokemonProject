# Implementation Plan: Movement Test Harness

**Branch**: `023-movement-test-harness` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-movement-test-harness/spec.md`

## Summary

Extend the existing combat test harness (`/test-combat` page) with a visual 10x10 battle grid and movement controls. This enables developers to test Pokemon movement mechanics, walking speed restrictions, and attack range calculations. The enhancement adds grid visualization, click-to-move interactions, range highlighting, and detailed movement logging - all building on existing `gridUtils.js` and `battleEngine.js` infrastructure.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, existing lib/gridUtils.js, lib/battleEngine.js, lib/combatSimulator.js
**Storage**: N/A (in-memory only - extends existing test harness)
**Testing**: Manual testing via UI; existing patterns from 021-combat-test-harness
**Target Platform**: Web browser (test page extension)
**Project Type**: Web application (Next.js)
**Performance Goals**: Grid updates <500ms; smooth highlighting interactions
**Constraints**: Must use existing gridUtils.js and battleEngine.js movement calculations unchanged; dev-only feature
**Scale/Scope**: Single developer tool; ~400 lines of new component code estimated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template has placeholders, indicating no specific project constraints are defined. Proceeding with standard best practices:

- [x] **Library Reuse**: Will reuse existing lib/gridUtils.js, lib/battleEngine.js, lib/combatSimulator.js
- [x] **Simplicity**: Minimal new code; extends existing test harness
- [x] **No Breaking Changes**: Enhancement is additive; does not modify production combat logic
- [x] **Pattern Consistency**: Follows established 021-combat-test-harness patterns

**Status**: PASS - No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/023-movement-test-harness/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI component contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── test-combat.js             # EXISTING: Add grid integration

lib/
├── gridUtils.js               # EXISTING: Grid coordinate utilities (unchanged)
├── battleEngine.js            # EXISTING: buildCombatant with walking_speed (unchanged)
├── battleState.js             # EXISTING: updateCombatantPosition (unchanged)
├── combatSimulator.js         # MODIFY: Add position initialization and movement support

components/TestCombat/
├── BattleLog.js               # EXISTING: Add movement log entries support
├── ControlPanel.js            # EXISTING: Add movement mode toggle
├── PokemonSelector.js         # EXISTING: Unchanged
├── BattleGrid.js              # NEW: 10x10 visual grid component
├── GridCell.js                # NEW: Individual cell component with highlighting
├── MovementPanel.js           # NEW: Movement stats and remaining movement display
└── RangeIndicator.js          # NEW: Move range highlighting overlay
```

**Structure Decision**: Extend existing `/test-combat` page with new grid components. No new pages or APIs - purely UI enhancement to existing test harness.

## Complexity Tracking

No violations to justify. Implementation is straightforward:
- Four new UI components (BattleGrid, GridCell, MovementPanel, RangeIndicator)
- Minor modifications to existing combatSimulator.js for position handling
- No new lib files - reuses existing gridUtils.js infrastructure
