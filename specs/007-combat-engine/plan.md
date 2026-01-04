# Implementation Plan: Combat Engine

**Branch**: `007-combat-engine` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-combat-engine/spec.md`

## Summary

Extend the existing battle engine (from 006-battle-api) to support full Pokemon 5e combat mechanics including status effects, initiative/turn order, PP tracking with Struggle fallback, extended critical hit ranges, and experience calculation. The combat engine will remain a pure calculation layer, referencing Source JSON files as authoritative per the constitution.

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, uuid (existing)
**Storage**: Supabase PostgreSQL with RLS (player_pokemon table with current_hp, pp tracking)
**Testing**: Jest (unit tests for combat calculations)
**Target Platform**: Vercel serverless (API routes)
**Project Type**: Web application (Next.js)
**Performance Goals**: Combat engine processes 5-round battle in <100ms (calculation only)
**Constraints**: 10-second API timeout, stateless requests, all state in database
**Scale/Scope**: Existing battle system serving educational platform users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence/Notes |
|-----------|--------|----------------|
| I. Two-Tier Data Model | PASS | All combat formulas reference Source JSON (moves.json, pokemon.json, rules.json). Database stores only PP state and current_hp. |
| II. External JWT Authentication | PASS | Battle endpoint already validates JWT; this feature extends calculation layer only. |
| III. Row-Level Security | PASS | Player HP/PP updates use existing RLS-protected player_pokemon table. |
| IV. Data Merging Pattern | PASS | Extends lib/pokemonData.js utilities for move/ability lookups. |
| V. Serverless Architecture | PASS | Pure calculation functions, no long-running processes. |
| VI. Pokemon 5e Compliance | PASS | All formulas (damage, STAB, type effectiveness, XP) derived from rules.json and Source data. |
| VII. Educational API Design | PASS | Battle responses include detailed breakdown (dice, modifiers, effectiveness) for transparency. |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow. |

## Project Structure

### Documentation (this feature)

```text
specs/007-combat-engine/
  plan.md              # This file
  research.md          # Phase 0 output
  data-model.md        # Phase 1 output
  quickstart.md        # Phase 1 output
  contracts/           # Phase 1 output
  tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
  pokemonData.js       # Existing: Source data loading, extends with ability lookups
  combatUtils.js       # Existing: Proficiency, attribute mods, STAB calculation
  typeEffectiveness.js # Existing: Type chart and multiplier calculation
  diceRoller.js        # Existing: Dice rolling utilities
  diceParser.js        # Existing: Parse damage dice from move descriptions
  battleEngine.js      # Existing: Attack/damage calculation, turn processing
  experienceUtils.js   # Existing: XP calculation and level thresholds
  statusEffects.js     # NEW: Status condition application and effects
  initiativeUtils.js   # NEW: Initiative rolling and turn order management
  ppTracker.js         # NEW: PP consumption tracking and Struggle detection

pages/api/
  battle.js            # Existing: Battle endpoint (extend to use new combat features)

Source/
  pokemon/pokemon.json # Read: Stats, types, abilities
  moves/moves.json     # Read: Move data, PP, power, effects
  rules/rules.json     # Read: Status effect definitions, combat rules
  abilities/abilities.json # Read: Ability effects (Battle Armor, etc.)
```

**Structure Decision**: Extend existing lib/ utilities with new combat-specific modules. No new API routes needed; existing battle.js will integrate the enhanced combat engine.

## Complexity Tracking

No violations identified. The feature extends existing patterns without introducing new complexity.

## Existing Code Analysis

### Already Implemented (006-battle-api)

The following components are already complete and tested:

1. **combatUtils.js**: Proficiency bonus, attribute modifiers, STAB detection, attack/damage bonus calculation
2. **typeEffectiveness.js**: Full 18-type chart, getEffectiveness() for multiplier calculation
3. **diceRoller.js**: rollD20(), rollDice(), rollDiceDetailed(), critical hit/miss detection
4. **diceParser.js**: Parse damage dice from move descriptions, level scaling via higherLevels
5. **battleEngine.js**: calculateAttackRoll(), calculateDamage(), processBattleTurn(), createBattle()
6. **experienceUtils.js**: XP thresholds, calculateXpAward(), checkLevelUp()

### Gaps to Address (007-combat-engine)

| Requirement | Current State | Action Needed |
|-------------|---------------|---------------|
| Initiative/Turn Order | Player always first | Add rollInitiative(), sortByInitiative() |
| Status Effects | Not implemented | Create statusEffects.js with full status system |
| PP Tracking | Not implemented | Create ppTracker.js, add Struggle move support |
| Extended Crit Ranges | Only natural 20 | Add move-specific crit range parsing |
| Ability Effects | Not implemented | Parse Battle Armor, type immunities from abilities |
| Volatile vs Non-Volatile | Not implemented | Track status volatility, clear on switch/combat end |
| End-of-Turn Damage | Not implemented | Burn/Poison tick damage at end of turn |
| Catch XP | Not implemented | 1/5 XP modifier for catches |

## Phase Dependencies

```
Phase 0: Research
  -> Resolves: Status effect parsing from rules.json, move crit range patterns

Phase 1: Data Model & Contracts
  -> Depends on: Phase 0 research findings
  -> Produces: data-model.md, contracts/, quickstart.md

Phase 2: Task Generation (via /speckit.tasks)
  -> Depends on: Phase 1 artifacts
  -> Produces: tasks.md
```
