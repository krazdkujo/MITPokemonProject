# Implementation Plan: Pokemon 5e Combat System Alignment

**Branch**: `017-5e-combat-research` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-5e-combat-research/spec.md`

## Summary

Implement the complete Pokemon 5e combat system by aligning the existing codebase with Source/ rules. This includes fixing status effect implementations (Burned, Flinched, Frozen, Confused), implementing all moves with saving throw support, adding weather/terrain effects, implementing the Bond system, catching mechanics, ability effects, and Pokemon transformations. The architecture will support double battles (2v2) while initially implementing single battles (1v1). Grid positioning uses 1 cell = 5 feet conversion.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, React 18, @supabase/supabase-js, existing lib/ utilities
**Storage**: Supabase PostgreSQL with RLS (existing tables: player_pokemon, users, player_inventory, active_battles)
**Testing**: Jest for unit tests, manual testing via dev server
**Target Platform**: Web application (Vercel serverless)
**Project Type**: Web application (Next.js pages + API routes)
**Performance Goals**: Battle actions complete in <500ms, support 100 concurrent battles
**Constraints**: Serverless 10s timeout, stateless requests, all state in database
**Scale/Scope**: ~800 moves in Source/moves/moves.json, ~100 abilities in Source/abilities/abilities.json, 8 status effects, 6 weather types, 4 terrain types, 4 transformation types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Compliance Notes |
|-----------|--------|------------------|
| I. Two-Tier Data Model | PASS | All combat rules, moves, abilities from Source/. Database stores only user state (HP, PP, status, position) |
| II. External JWT Authentication | PASS | Existing auth pattern continues. Battle endpoints validate JWT |
| III. Row-Level Security | PASS | active_battles table has RLS. New tables (if any) will have RLS |
| IV. Data Merging Pattern | PASS | lib/pokemonData.js pattern extended for combat. Move/ability data merged at runtime |
| V. Serverless Architecture | PASS | All combat logic in API routes. No long-running processes |
| VI. Pokemon 5e Compliance | PASS | Primary goal of this feature. Source/ is authoritative |
| VII. Educational API Design | PASS | Battle responses include full game state for N8N debugging |
| VIII. Spec-Driven Development | PASS | Following spec workflow with numbered spec folder |

**Gate Status**: PASSED - No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/017-5e-combat-research/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── battleEngine.js      # Core battle mechanics (MODIFY)
├── battleState.js       # Battle state management (MODIFY)
├── combatUtils.js       # Combat calculations (MODIFY)
├── statusEffects.js     # Status effect logic (MODIFY)
├── initiativeUtils.js   # Initiative system (MODIFY)
├── typeEffectiveness.js # Type chart (EXISTS - minimal changes)
├── diceRoller.js        # Dice rolling (EXISTS - no changes)
├── diceParser.js        # Dice parsing (EXISTS - no changes)
├── experienceUtils.js   # XP calculations (EXISTS - no changes)
├── pokemonData.js       # Data merging (MODIFY for abilities)
├── weatherSystem.js     # Weather effects (NEW)
├── terrainSystem.js     # Terrain effects (NEW)
├── bondSystem.js        # Bond mechanics (NEW)
├── catchingMechanics.js # Catch DC calculations (NEW)
├── abilityEffects.js    # Ability effect handlers (NEW)
├── transformations.js   # Mega/Z/Dynamax/Tera (NEW)
├── concentrationTracker.js # Move concentration (NEW)
└── gridUtils.js         # Grid positioning (MODIFY for 5ft conversion)

pages/api/
├── battle/
│   ├── action.js        # Execute battle action (MODIFY)
│   ├── switch.js        # Switch Pokemon (NEW)
│   ├── catch.js         # Attempt catch (NEW/MODIFY)
│   └── [battleId].js    # Get battle state (MODIFY)
└── pokemon/
    └── rest.js          # PP restoration (NEW)

Source/
├── moves/moves.json     # Move definitions (READ)
├── abilities/abilities.json # Ability definitions (READ)
├── rules/rules.json     # Combat rules (READ)
├── pokemon/pokemon.json # Pokemon stats (READ)
└── items/items.json     # Pokeball data (READ)

tests/
├── unit/
│   ├── statusEffects.test.js
│   ├── weatherSystem.test.js
│   ├── terrainSystem.test.js
│   ├── bondSystem.test.js
│   ├── catchingMechanics.test.js
│   └── abilityEffects.test.js
└── integration/
    └── battleFlow.test.js
```

**Structure Decision**: Extend existing lib/ structure with new combat system modules. Keep all Source/ data as read-only reference. API routes in pages/api/battle/ for combat endpoints.

## Complexity Tracking

No constitution violations requiring justification.

## Phase 0: Research Areas

The following areas require research before implementation:

1. **Move Saving Throw Patterns**: How are saving throw moves structured in Source/moves/moves.json? What fields indicate save vs attack roll?

2. **Ability Effect Patterns**: How are ability effects described in Source/abilities/abilities.json? What's the structure for combat-time triggers?

3. **Weather/Terrain Rules**: Complete weather and terrain effect rules from Source/rules/rules.json

4. **Transformation Rules**: Complete Mega Evolution, Z-Move, Dynamax, and Terastallization rules from Source/rules/rules.json

5. **Bond System Rules**: Complete Bond level mechanics from Source/rules/rules.json

6. **Catch DC Formula**: Exact catching mechanics and Pokeball modifiers from Source/rules/rules.json and Source/items/items.json

7. **Concentration Mechanics**: Which moves require concentration and how is it tracked?

8. **PP Restoration Rules**: Short rest and long rest PP recovery formulas

## Phase 1: Design Deliverables

After research, generate:

1. **data-model.md**: Entity definitions for battle state, weather, terrain, bond, concentration
2. **contracts/**: API contracts for battle actions, switching, catching, resting
3. **quickstart.md**: Developer guide for combat system implementation
