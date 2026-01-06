# Implementation Plan: Fix Combat Encounter Bugs

**Branch**: `020-fix-combat-encounter-bugs` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-fix-combat-encounter-bugs/spec.md`

## Summary

Fix three interconnected combat bugs caused by HP data inconsistency:
1. Pokemon not appearing as available to join active encounters
2. False knockout detection redirecting players to Pokemon Center
3. Heal button incorrectly disabled despite Pokemon needing healing

The root cause is inconsistent handling of NULL/undefined HP values across `pokemonData.js`, `battleEngine.js`, `zones.js`, `combat.js`, and `pokecenter.js`. The fix standardizes HP defaults: NULL current_hp defaults to max_hp (healthy), and NULL max_hp is calculated from Pokemon base stats.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, @supabase/supabase-js 2.39.0
**Storage**: Supabase PostgreSQL with RLS (tables: player_pokemon, active_battles, users)
**Testing**: ESLint only (no unit test framework currently configured)
**Target Platform**: Web browser (Next.js serverless deployment)
**Project Type**: Web application (pages/ + lib/ + components/ structure)
**Performance Goals**: Standard web app responsiveness (<1s page loads, immediate UI feedback)
**Constraints**: Must be backward-compatible with existing player data containing NULL HP values
**Scale/Scope**: Single-player game with ~20 pages, ~30 lib modules, ~50 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is in template state (no specific gates defined). Proceeding with standard best practices:

| Gate | Status | Notes |
|------|--------|-------|
| No new dependencies required | PASS | Bug fix uses existing modules only |
| Backward compatibility | PASS | Fix handles existing NULL data gracefully |
| No breaking API changes | PASS | Internal logic fix, same API contracts |
| Code in existing patterns | PASS | Follows existing lib/ module patterns |

## Project Structure

### Documentation (this feature)

```text
specs/020-fix-combat-encounter-bugs/
├── plan.md              # This file
├── research.md          # Phase 0 output - bug analysis
├── data-model.md        # Phase 1 output - HP data flow
├── quickstart.md        # Phase 1 output - testing guide
├── contracts/           # Phase 1 output - none needed (internal fix)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (affected files)

```text
lib/
├── pokemonData.js       # FIX: buildPlayerPokemonResponse HP defaults
├── battleEngine.js      # FIX: buildCombatant HP initialization
├── combatUtils.js       # FIX: HP helper functions
└── gameContext.js       # FIX: Party HP calculation

pages/
├── zones.js             # FIX: hasHealthyPokemon check
├── combat.js            # FIX: getUnplacedPokemon logic
└── pokecenter.js        # FIX: needsHealing calculation

pages/api/
├── heal.js              # VERIFY: Heal logic handles NULL max_hp
└── zones/encounter.js   # FIX: Party filtering for combat

components/
├── Combat/BattleGrid.js # FIX: Combatant rendering HP check
└── Dashboard/PartyCard.js # VERIFY: HP bar display
```

**Structure Decision**: Existing Next.js Pages Router structure. Bug fix modifies existing files only - no new files or structural changes required.

## Complexity Tracking

No constitution violations - this is a targeted bug fix with no new complexity introduced.

| Aspect | Complexity | Justification |
|--------|-----------|---------------|
| Files Modified | ~10 | Centralized HP handling affects multiple touchpoints |
| New Dependencies | 0 | Uses existing modules only |
| Database Changes | 0 | No schema changes, only data handling logic |
| New APIs | 0 | Internal logic fix only |
