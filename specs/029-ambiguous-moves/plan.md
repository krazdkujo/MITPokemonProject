# Implementation Plan: Ambiguous Move Implementation

**Branch**: `029-ambiguous-moves` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/029-ambiguous-moves/spec.md`

## Summary

Implement special handling for ~35 moves across 7 categories (recoil, level-based damage, two-turn moves, variable hits, conditional damage, OHKO, stat-dependent) that require mechanics beyond standard dice-based damage calculation. This includes extending the extraction script to add structured fields and enhancing the combat engine to process these fields at runtime.

## Technical Context

**Language/Version**: JavaScript ES2020+ (Node.js 18+)
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, existing lib/ utilities (battleEngine.js, moveEffectParser.js, combatSimulator.js, diceParser.js)
**Storage**: Static JSON file (Source/moves/moves.json) + Supabase PostgreSQL (active_battles JSONB for battle state)
**Testing**: Combat test harness (npm run test:combat), Web harness (/test-combat)
**Target Platform**: Web (Next.js)
**Project Type**: Web application
**Performance Goals**: Combat turn calculation under 100ms
**Constraints**: Gen-1 only, educational focus, seeded RNG for reproducibility
**Scale/Scope**: ~35 ambiguous moves requiring special handling across 7 categories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Two-Tier Data Architecture | PASS | Extends Source/moves/moves.json (static) - no runtime modifications |
| D&D 5e Combat System | PASS | All mechanics align with 5e rules (nat 20 OHKO, level-based damage formulas, recoil as typed damage) |
| Test Harness First | PASS | Combat test harness already exists; new mechanics testable via existing infrastructure |
| Security by Default | N/A | No user data tables affected |
| Simplicity Over Abstraction | PASS | Direct field additions to existing structures, no new abstractions |
| Consistent Code Patterns | PASS | Uses existing lib/ module organization and utility patterns |
| Library Module Organization | PASS | Extends existing battleEngine.js and moveEffectParser.js |
| API Response Standards | N/A | No new API endpoints |
| Feature Branch Convention | PASS | Using 029-ambiguous-moves pattern |

**Constitution Violations**: None

## Project Structure

### Documentation (this feature)

```text
specs/029-ambiguous-moves/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (empty - no new APIs)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
# Existing files to be modified
lib/
├── battleEngine.js       # Add handlers for new move fields
├── moveEffectParser.js   # Enhance effect parsing for ambiguous moves
├── diceParser.js         # Add formula evaluation support
└── combatLogger.js       # Log new effect types

scripts/
└── extract-move-data.js  # Extend extraction for 7 new categories

Source/moves/
└── moves.json            # Add structured fields for ~35 moves

# New files (minimal)
lib/
└── formulaEvaluator.js   # Evaluate level-based damage formulas (user_level, target_level)
```

**Structure Decision**: Extend existing lib/ modules rather than creating new ones. Only new file is formulaEvaluator.js for parsing/evaluating level-based damage formulas.

## Complexity Tracking

No violations to justify.
