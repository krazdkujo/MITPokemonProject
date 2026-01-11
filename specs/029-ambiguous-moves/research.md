# Research: Ambiguous Move Implementation

**Feature**: 029-ambiguous-moves
**Date**: 2026-01-10

## Research Summary

This document captures findings from analyzing the existing codebase and move data to inform implementation of the 7 ambiguous move categories.

---

## 1. Existing Infrastructure Analysis

### Current Move Data Structure

Moves in `Source/moves/moves.json` already have structured fields from feature 028:

```json
{
  "id": "double-edge",
  "name": "Double-Edge",
  "type": "normal",
  "damage": {
    "dice": "2d10",
    "modifier": "MOVE",
    "damage_type": "normal",
    "attack_type": "melee",
    "hit_count": 1
  },
  "save": null,
  "flavor": "...",
  "extra_effects": null,
  "scaling": { "5": "3d8", "10": "4d10", "17": "7d8" }
}
```

**Key Insight**: The extraction script (`scripts/extract-move-data.js`) and combat engine (`lib/battleEngine.js`) already handle many effect types. We need to extend, not replace.

### Current Effect Parsing

`lib/moveEffectParser.js` already parses:
- Healing effects (drain, fixed, dice-based)
- Recoil effects (quarter, half, third percentages)
- AC effects (increase/decrease)
- Speed effects
- Multi-hit effects
- Conditional damage
- Charge moves
- Control effects
- AoE effects
- Stat effects
- Auto-hit

**Key Finding**: Recoil parsing already exists in `parseRecoilEffect()` - validates "recoil" keyword requirement.

### Combat Engine

`lib/battleEngine.js` already handles:
- Attack rolls with advantage/disadvantage
- Critical hits and misses
- Save-based moves
- Status effect application
- Healing from drain moves (T032)
- Recoil damage application (T033)
- AC modifications (T034)

**Key Finding**: Recoil is already implemented in `executeAttack()` at lines 524-539.

---

## 2. Move Category Analysis

### Category 1: Recoil Moves

**Current State**: PARTIALLY IMPLEMENTED

The extraction script and combat engine already handle recoil via `parseRecoilEffect()`. However, manual review shows some moves may not be correctly tagged.

**Moves to Verify** (from plan.md):
| Move | Expected | Actual in moves.json |
|------|----------|---------------------|
| Double-Edge | 1/4 recoil | Has description with "quarter...typeless recoil" |
| Brave Bird | 1/4 recoil | Has "quarter...typeless recoil" |
| Wave Crash | 1/2 recoil | Needs verification |
| Head Smash | 1/2 recoil | Needs verification |

**Decision**: Run verification pass to ensure all 9 recoil moves have correct `extra_effects` or add new `recoil` structured field.

**Rationale**: Existing `parseRecoilEffect` handles runtime detection. For explicit data, add `recoil` field to move JSON.

---

### Category 2: Level-Based Damage

**Current State**: NOT IMPLEMENTED

Moves like Seismic Toss and Night Shade currently have:
```json
"damage": null,
"description": "...damage equal to 1d6 + the user's level."
```

The extraction script fails to capture level-based formulas.

**Affected Moves**:
- seismic-toss: `1d6 + user_level` fighting damage
- night-shade: `1d6 + user_level` ghost damage
- (Others need investigation)

**Decision**: Add `formula` field to damage object for level-based moves.

**Proposed Structure**:
```json
"damage": {
  "formula": "1d6 + user_level",
  "damage_type": "fighting",
  "attack_type": "melee"
}
```

**Rationale**: Allows runtime evaluation while maintaining structured data.

---

### Category 3: Two-Turn Moves

**Current State**: PARTIALLY DESCRIBED

Dig has `"duration": "1 round, charge"` and description mentions invulnerability.

**Affected Moves**:
- Dig: Burrow (invulnerable) -> Attack
- Dive: Underwater (invulnerable) -> Attack
- Bounce: Fly up (invulnerable) -> Attack
- Solar Beam: Charge (skip in sun) -> Attack
- Skull Bash: Charge (+2 AC) -> Attack
- Sky Attack: Charge -> Attack

**Decision**: Add `turns` field with structured turn-by-turn effects.

**Proposed Structure**:
```json
"turns": {
  "count": 2,
  "turn1": {
    "action": "burrow",
    "invulnerable": true,
    "ac_bonus": 0
  },
  "turn2": {
    "action": "attack"
  },
  "weather_skip": null
}
```

Solar Beam would have `"weather_skip": "sunny"`.

**Rationale**: Combat engine needs structured data to track state across turns.

---

### Category 4: Variable Hit Moves

**Current State**: PARTIALLY DETECTED

Barrage has description: "rolling 1d4 on a hit...equal to the number shown"

Current `hit_count: 1` is incorrect.

**Decision**: Add `hit_roll` field for variable hit determination.

**Proposed Structure**:
```json
"damage": {
  "dice": "1d4",
  "hit_roll": "1d4",
  "hit_range": [1, 4]
}
```

**Rationale**: Combat engine rolls `hit_roll` to determine iterations.

---

### Category 5: Conditional Damage

**Current State**: PARTIALLY DETECTED via `parseConditionalDamageEffect()`

Flail has description: "If you are below 50%...double the damage. If you are at 10% or below...triple the damage."

**Decision**: Add `conditional` field with HP thresholds.

**Proposed Structure**:
```json
"conditional": {
  "type": "user_hp_scaling",
  "thresholds": [
    { "hp_percent": 50, "multiplier": 2 },
    { "hp_percent": 10, "multiplier": 3 }
  ]
}
```

**Rationale**: Clear threshold-based lookup for combat engine.

---

### Category 6: OHKO Moves

**Current State**: DESCRIBED IN extra_effects

Fissure has:
```json
"extra_effects": "roll a d20. On a 20, the target falls into the crack..."
```

**Moves**: Fissure, Guillotine, Horn Drill, Sheer Cold

**Actual Mechanic** (from description):
- Roll d20
- On natural 20: instant KO
- Level check: "If the target's level is 10 more than your own, this move automatically fails"

**Decision**: Add `ohko` field with structured success conditions.

**Proposed Structure**:
```json
"ohko": {
  "success_roll": 20,
  "level_restriction": "target_level <= user_level + 10"
}
```

**Rationale**: Combat engine can evaluate conditions before allowing roll.

---

### Category 7: Stat-Dependent Moves

**Current State**: NOT EXPLICITLY HANDLED

Foul Play uses target's level for damage calculation.

**Decision**: Add `stat_override` field.

**Proposed Structure**:
```json
"stat_override": {
  "use": "target_level",
  "instead_of": "user_level"
}
```

**Rationale**: Combat engine substitutes stat in formula evaluation.

---

## 3. Implementation Approach

### Phase 1: Data Enhancement

1. Extend `extract-move-data.js` with 7 new field parsers
2. Add validation for new field structures
3. Re-run extraction on all moves
4. Manual verification of ~35 target moves

### Phase 2: Combat Engine Integration

1. Create `lib/formulaEvaluator.js` for level-based formulas
2. Extend `battleEngine.js` with handlers for:
   - `ohko` field processing
   - `turns` state machine
   - `conditional` damage scaling
   - `stat_override` substitution
3. Extend `combatLogger.js` for new effect logging

### Phase 3: Test Harness Validation

1. Add test cases for each category
2. Validate via CLI harness with seeded RNG
3. Verify in web harness for visual confirmation

---

## 4. Alternatives Considered

### Alternative 1: Pure Runtime Parsing

**Rejected**: Parsing descriptions at runtime is fragile and slow. Structured fields are more reliable.

### Alternative 2: Separate Effects Table

**Rejected**: Would require joining data at load time. Inline fields are simpler per constitution.

### Alternative 3: Effect Inheritance System

**Rejected**: Over-engineering. Direct field assignment is sufficient for ~35 moves.

---

## 5. Risk Assessment

| Risk | Mitigation |
|------|------------|
| False positives in extraction | Manual verification pass for all 35 moves |
| Combat engine performance | Level-based formulas are simple arithmetic - negligible impact |
| State tracking for two-turn moves | Use existing battle_state JSONB for persistence |
| Breaking existing moves | Add fields without modifying existing damage/save fields |

---

## 6. Dependencies

- Feature 028 extraction infrastructure (COMPLETE)
- Existing combat test harness (COMPLETE)
- Battle state persistence (COMPLETE via active_battles table)

---

## 7. Open Questions (Resolved)

1. **Q: Should recoil be a separate field or parsed from extra_effects?**
   A: Add explicit `recoil` field for clarity. `parseRecoilEffect()` handles runtime backup.

2. **Q: How to handle moves in multiple categories?**
   A: Add all applicable fields. Combat engine processes each independently.

3. **Q: Level formula format?**
   A: Use string expression: `"1d6 + user_level"` - simple to parse and evaluate.
