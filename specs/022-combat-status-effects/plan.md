# Implementation Plan: Combat Status Effects Integration

**Branch**: `022-combat-status-effects` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-combat-status-effects/spec.md`

## Summary

Enhance the combat system to fully integrate all status effects and move extra effects (healing, recoil, stat changes, AC modifiers) into damage calculation. Extend the combat logger to display detailed status effect information including application results, tick damage, turn effects, and all dice rolls/thresholds for transparency.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, existing lib/ battle utilities (battleEngine.js, statusEffects.js, combatLogger.js, combatSimulator.js)
**Storage**: N/A (uses in-memory battle state, existing Supabase for persistence)
**Testing**: Combat test harness (npm run test:combat), seeded random for deterministic tests
**Target Platform**: Web browser (Next.js SSR + client-side)
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: Combat calculations complete in <100ms per turn
**Constraints**: Must maintain compatibility with existing combat UI, no breaking changes to combat API
**Scale/Scope**: 8 status types, ~700 moves with various effect patterns to parse

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| No new external dependencies | PASS | Uses existing libs only |
| Extends existing patterns | PASS | Builds on statusEffects.js, combatLogger.js |
| Test coverage required | PASS | Test harness with seeded random exists |
| No database schema changes | PASS | In-memory battle state only |

## Project Structure

### Documentation (this feature)

```text
specs/022-combat-status-effects/
├── plan.md              # This file
├── research.md          # Phase 0 output - move effect patterns
├── data-model.md        # Phase 1 output - effect structures
├── quickstart.md        # Phase 1 output - integration guide
├── contracts/           # Phase 1 output - logger API
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── statusEffects.js        # MODIFY: Enhanced status processing with log entries
├── battleEngine.js         # MODIFY: Integrate move extra effects
├── combatLogger.js         # MODIFY: New log methods for effects
├── combatSimulator.js      # MODIFY: Wire up enhanced logging
├── moveEffectParser.js     # NEW: Parse move descriptions for effects
└── combatUtils.js          # MINOR: Helper additions if needed

pages/
├── combat.js               # MINOR: Display enhanced log entries
└── test-combat.js          # MINOR: Display enhanced log entries

components/TestCombat/
└── BattleLog.js            # MODIFY: Render new log entry types
```

**Structure Decision**: Extends existing lib/ structure. New `moveEffectParser.js` encapsulates move description parsing for healing, recoil, stat changes, and AC effects.

## Complexity Tracking

No constitution violations - feature extends existing patterns without new complexity.

---

## Phase Outputs

### Phase 0: Research Complete
- [research.md](./research.md) - Move effect pattern analysis, implementation gaps

### Phase 1: Design Complete
- [data-model.md](./data-model.md) - Effect structures, log entry types
- [contracts/move-effect-parser-api.md](./contracts/move-effect-parser-api.md) - Parser API
- [contracts/combat-logger-api.md](./contracts/combat-logger-api.md) - Logger extensions
- [quickstart.md](./quickstart.md) - Integration guide

### Phase 2: Tasks (Next)
Run `/speckit.tasks` to generate implementation tasks.

---

## Post-Design Constitution Re-Check

| Gate | Status | Notes |
|------|--------|-------|
| No new external dependencies | PASS | Only internal modules created |
| Extends existing patterns | PASS | New parser follows existing module patterns |
| Test coverage required | PASS | Seeded random enables deterministic testing |
| No database schema changes | PASS | All structures in-memory |
| API backward compatibility | PASS | Existing functions extended with optional params |

**Ready for**: `/speckit.tasks` to generate implementation tasks
