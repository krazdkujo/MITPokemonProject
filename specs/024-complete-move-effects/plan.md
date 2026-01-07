# Implementation Plan: Complete Move Effects

**Branch**: `024-complete-move-effects` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-complete-move-effects/spec.md`

## Summary

Implement comprehensive move effect parsing and execution for all 800 Pokemon moves in the Source data. Currently, the combat system handles basic attack rolls and damage calculations but lacks full support for status effects, healing/drain, recoil, stat modifications, multi-hit moves, conditional damage, action economy, two-turn moves, concentration/duration tracking, restraint/grapple, and AoE targeting. This feature extends the existing `moveEffectParser.js` and `battleEngine.js` to support the complete range of move mechanics defined in Pokemon 5e rules.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, @supabase/supabase-js 2.39.0, uuid 13.0.0
**Storage**: Supabase PostgreSQL (existing tables: player_pokemon, active_battles) + Source JSON files (moves.json)
**Testing**: Manual via test-combat page (test harness), npm run test:combat for CLI testing
**Target Platform**: Web browser (Next.js SSR/CSR)
**Project Type**: Web application (Next.js Pages Router)
**Performance Goals**: Combat calculations complete in <100ms per turn, all 800 moves parseable
**Constraints**: Must extend existing lib/ modules, maintain backwards compatibility with existing combat system
**Scale/Scope**: 800 moves to support, 12 effect categories, extend ~10 existing lib files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Project constitution is a template without specific gates defined. Applying standard development principles:

| Principle | Status | Notes |
|-----------|--------|-------|
| Extend existing code | PASS | Building on existing moveEffectParser.js, battleEngine.js, statusEffects.js |
| Backwards compatibility | PASS | New effect handlers don't break existing move processing |
| Testability | PASS | Test harness (test-combat.js) provides verification interface |
| Code organization | PASS | Following existing lib/ module structure |

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/024-complete-move-effects/
├── plan.md              # This file
├── research.md          # Phase 0 output - move effect patterns analysis
├── data-model.md        # Phase 1 output - effect data structures
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - effect handler interfaces
├── checklists/          # Quality validation checklists
└── tasks.md             # Phase 2 output (/speckit.tasks command)
\`\`\`

### Source Code (repository root)

\`\`\`text
lib/
├── battleEngine.js      # Core combat logic - EXTEND for new effect execution
├── moveEffectParser.js  # Effect parsing - EXTEND for new effect categories
├── statusEffects.js     # Status conditions - EXTEND for restraint/grapple
├── combatSimulator.js   # Test harness logic - EXTEND for effect testing
├── combatLogger.js      # Battle logging - EXTEND for effect visibility
├── combatUtils.js       # Combat utilities - EXTEND for action economy
├── concentrationTracker.js # Concentration - EXTEND for duration tracking
├── gridUtils.js         # Grid calculations - EXTEND for AoE targeting
├── diceRoller.js        # Dice mechanics - No changes expected
├── diceParser.js        # Dice parsing - No changes expected
└── typeEffectiveness.js # Type system - No changes expected

pages/
├── test-combat.js       # Test harness UI - EXTEND for effect visualization

components/TestCombat/
├── BattleLog.js         # Log display - EXTEND for new effect log entries
└── [new effect UI components as needed]

Source/moves/
└── moves.json           # 800 move definitions (read-only reference)
\`\`\`

**Structure Decision**: Extend existing Next.js Pages Router web application structure. All combat logic lives in \`lib/\` modules. UI components in \`components/\`. Test page at \`pages/test-combat.js\`. No new directories needed - extend existing modules.

## Complexity Tracking

> No constitution violations identified. Implementation follows existing patterns.
