# Research: Complete Move Effects

**Feature**: 024-complete-move-effects
**Date**: 2026-01-06

## Summary

Analysis of 800 moves in Source/moves/moves.json to identify effect categories, detection patterns, and implementation priorities.

## Move Effect Categories Analysis

### 1. Basic Attack Rolls (Damage Only)
- **Count**: ~280-300 moves (~35-40% of total)
- **Characteristic**: Melee or ranged attack with damage dice, no secondary effects
- **Detection Pattern**: Contains "Make a [melee/ranged] attack" with damage dice, no status/conditional keywords
- **Example Moves**: `quick-attack`, `thunderbolt`, `acrobatics`, `aqua-tail`, `branch-poke`
- **Implementation Status**: EXISTING - already implemented in battleEngine.js

### 2. Saving Throw Moves
- **Count**: ~77 moves
- **Characteristic**: Force targets to make saves (DEX, STR, CON, WIS, CHA)
- **Detection Pattern**: "must make on a [ability] save" or "[ability] save against your Move DC"
- **Example Moves**: `acid` (DEX), `earthquake` (STR), `aeroblast` (DEX), `astral-barrage` (WIS)
- **Implementation Status**: EXISTING - processSaveMove() in battleEngine.js

### 3. Status Effects
- **Count**: ~165 moves total
- **Sub-categories**:
  | Status | Count | Pattern Keywords |
  |--------|-------|------------------|
  | Burn | 29 | "burned", "burning" |
  | Poison | 31 | "poisoned", "badly poisoned" |
  | Paralysis | 20 | "paralyzed", "paralysis" |
  | Confusion | 24 | "confused", "confusion" |
  | Sleep | 19 | "asleep", "put to sleep", "falling asleep" |
  | Freeze | 2 | "frozen", "freeze" |
  | Flinch | ~30 | "flinches", "flinch" |
  | Prone | 18 | "knocked prone", "prone" |
  | Restrained | 20 | "restrained", "cannot flee" |
  | Frightened | 3 | "frightened" |
  | Blindness | 5 | "blinded", "blind" |
  | Charm | 4 | "charmed" |
- **Implementation Status**: PARTIAL - statusEffects.js handles core 10 statuses, needs extension for prone/charm/blind

### 4. Healing/Drain Effects
- **Count**: ~37 moves
- **Detection Patterns**:
  - Drain: "Half the damage done is restored" / "regain half"
  - Dice heal: "regain Xd4 + MOVE hit points"
  - Fixed heal: "regain X hit points"
- **Example Moves**: `absorb`, `giga-drain`, `recover`, `dream-eater`, `bitter-blade`
- **Implementation Status**: EXISTING - parseHealingEffect() in moveEffectParser.js

### 5. Recoil Moves
- **Count**: ~12 moves
- **Detection Patterns**:
  - "taking half of the damage as recoil"
  - "taking a quarter of the damage"
  - "On a miss, you take X damage"
- **Example Moves**: `take-down`, `double-edge`, `jump-kick`, `high-jump-kick`
- **Implementation Status**: EXISTING - parseRecoilEffect() in moveEffectParser.js

### 6. Stat/AC Modifications
- **Count**: ~51 moves
- **Detection Patterns**:
  - AC increase: "AC increases by X", "gain +X to AC"
  - AC decrease: "AC is reduced by X"
  - Attack bonus: "+X to attack rolls", "advantage on attacks"
  - Save bonus: "+X to saving throws", "add a dX to saving throws"
  - Ability boost: "ability scores go up by X"
- **Example Moves**: `acid-armor` (+2 AC), `acid-spray` (-1 AC stackable), `ancient-power` (+1 all stats on crit), `swords-dance`, `bulk-up`
- **Implementation Status**: PARTIAL - parseACEffect() exists, needs stat modification parsers

### 7. Speed/Movement Effects
- **Count**: ~54 moves
- **Detection Patterns**:
  - Speed increase: "movement speed increases by Xft", "speed increases"
  - Speed decrease: "speed is halved", "speed reduced to 0"
  - Free movement: "move up to Xft", "avoiding attacks of opportunity"
- **Example Moves**: `agility` (+20ft), `autotomize` (+10ft stackable), `aqua-jet`, `accelerock`
- **Implementation Status**: PARTIAL - parseSpeedEffect() exists in moveEffectParser.js

### 8. Multi-Hit Moves
- **Count**: ~7-10 moves
- **Detection Patterns**:
  - "roll a dX. On a result of Y or higher, hit again"
  - "Make two attacks"
  - "continue this process until"
- **Example Moves**: `arm-thrust`, `double-kick`, `barrage`, `bullet-seed`, `fury-attack`
- **Implementation Status**: NOT IMPLEMENTED - needs new parser and execution logic

### 9. Conditional Damage Bonuses
- **Count**: ~15-20 moves
- **Detection Patterns**:
  - "if the target has already taken damage this round, double"
  - "if you took damage since your last turn, double"
  - "if target is [status], double"
- **Example Moves**: `assurance`, `avalanche`, `hex`, `venoshock`, `wake-up-slap`
- **Implementation Status**: NOT IMPLEMENTED - needs combat state tracking

### 10. Action Economy (Bonus Action/Reaction)
- **Count**: 38 bonus action + 53 reaction = ~91 moves
- **Detection Pattern**: `"time": "1 bonus action"` or `"time": "1 reaction"`
- **Bonus Action Examples**: `agility`, `aqua-jet`, `accelerock`, `quick-attack`
- **Reaction Examples**: `protect`, `detect`, `baneful-bunker`, `baby-doll-eyes`
- **Implementation Status**: PARTIAL - moves execute but action economy not enforced

### 11. Charge/Two-Turn Moves
- **Count**: ~18 moves (8 charge + 8 recharge + invulnerable states)
- **Detection Patterns**:
  - Charge: "spend your action to charge", "on your next turn"
  - Recharge: "may not activate it again until after the end of your next turn"
  - Invulnerable: "invulnerable state until your next turn"
- **Example Moves**: `solar-beam`, `fly`, `dig`, `bounce`, `dive`, `hyper-beam`, `beak-blast`
- **Implementation Status**: NOT IMPLEMENTED - needs state machine

### 12. Concentration/Duration Effects
- **Count**: ~117 moves with concentration, 880 with duration
- **Detection Pattern**: `"duration": "X, concentration"` or `"duration": "X rounds"`
- **Duration Types**:
  - Instantaneous: Single effect
  - X rounds: Timed effect
  - 1 minute: 10 rounds
  - Until cured: Permanent until removed
- **Example Moves**: `acid-armor` (1 min concentration), `aqua-ring` (1 min concentration), `agility` (1 min concentration)
- **Implementation Status**: PARTIAL - concentrationTracker.js exists but not fully integrated

### 13. Restraint/Grapple/Movement Control
- **Count**: ~31 moves (grapple) + 27 moves (restrain) + trapping effects
- **Detection Patterns**:
  - Grapple: "grappled", "grapple"
  - Restrain: "restrained", "cannot flee or switch"
  - Trap: "trapped", "cannot move"
- **Example Moves**: `anchor-shot`, `wrap`, `bind`, `fire-spin`, `mean-look`, `spider-web`
- **Implementation Status**: PARTIAL - basic restrained status exists, needs grapple mechanics

### 14. Area of Effect Moves
- **Count**: ~41 moves
- **AoE Types**:
  | Type | Count | Pattern |
  |------|-------|---------|
  | Cone | 14 | "self (Xft cone)" |
  | Line | 23 | "Xft line" |
  | Sphere | 4 | "Xft sphere" |
  | Radius | varies | "Xft radius" |
- **Example Moves**: `acid` (30ft cone), `aeroblast` (50ft line), `earthquake` (20ft radius)
- **Implementation Status**: NOT IMPLEMENTED - needs gridUtils.js extension

### 15. Auto-Hit/Guaranteed Moves
- **Count**: ~8-10 moves
- **Detection Pattern**: "guaranteed to hit", "this move is guaranteed"
- **Example Moves**: `aerial-ace`, `aura-sphere`, `swift`, `magical-leaf`, `feint-attack`
- **Implementation Status**: NOT IMPLEMENTED - needs attack roll bypass

## Implementation Priority Decisions

### Decision 1: Prioritize Parser Extensions Over New Mechanics
- **Rationale**: The existing moveEffectParser.js structure is well-designed. Most new effects can be added by extending the existing pattern.
- **Alternatives Rejected**: Creating separate effect handler classes (over-engineering for this scope)

### Decision 2: Multi-Hit as Recursive Attack Execution
- **Rationale**: Multi-hit moves follow a predictable pattern. Execute base attack, then conditionally recurse based on dice roll.
- **Alternatives Rejected**: Pre-rolling all hits (changes probability distribution)

### Decision 3: Conditional Damage via Combat State Flag
- **Rationale**: Track "took_damage_this_round" and "damage_taken_since_last_turn" on combatants
- **Alternatives Rejected**: Scanning action history (more complex, slower)

### Decision 4: Two-Turn Moves via Combatant State Machine
- **Rationale**: Add `charging_move`, `invulnerable`, `recharging` states to combatant object
- **Alternatives Rejected**: Separate turn queue system (overkill for ~18 moves)

### Decision 5: AoE Targeting via Grid Geometry Functions
- **Rationale**: Extend gridUtils.js with cone/line/sphere calculation functions
- **Alternatives Rejected**: Pre-computed lookup tables (memory overhead for edge case)

### Decision 6: Auto-Hit via Attack Roll Bypass
- **Rationale**: Check move for "guaranteed to hit" pattern, skip attack roll, apply damage directly
- **Alternatives Rejected**: Special attack roll result (confusing semantics)

## Key Detection Regex Patterns

```javascript
// Status triggers
/on a natural (?:attack )?roll of (\d+) or (?:higher|more)/i
/on a (?:fail|failure)/i
/fail(?:s|ed)? (?:the )?save by (\d+) or more/i

// Healing
/half.*damage.*restored|regain.*half/i
/regain\s+(\d+d\d+)\s*(?:\+\s*MOVE)?\s*hit\s*points/i

// Recoil
/(?:taking|take)\s+(?:a\s+)?(?:half|quarter|1\/2|1\/4).*(?:damage|recoil)/i

// Multi-hit
/roll\s+a\s+d\d+.*(?:continue|hit again|additional)/i

// Conditional damage
/(?:if|when)\s+.*(?:already taken damage|took damage)/i
/double\s+(?:the\s+)?damage/i

// AoE
/self\s+\((\d+)ft\s+(cone|line|sphere|radius)\)/i

// Auto-hit
/guaranteed to hit/i

// Charge/recharge
/charge|recharge|invulnerable state/i
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regex misses edge cases | Medium | Low | Test with all 800 moves, iterate |
| Multi-effect moves cause conflicts | Medium | Medium | Process effects in defined order |
| Performance degradation | Low | Medium | Profile after implementation |
| Breaking existing combat | Low | High | Run existing test harness before/after |
