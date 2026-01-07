# Effect Handler Contracts

**Feature**: 024-complete-move-effects
**Date**: 2026-01-06

## Overview

This document defines the interface contracts for move effect handlers. All handlers follow a consistent pattern for parsing and execution.

## Parser Contracts

### Location: `lib/moveEffectParser.js`

Each parser function takes a move description string and returns a structured effect object or null.

---

### parseMultiHitEffect(description)

**Purpose**: Parse multi-hit move mechanics from description

**Input**: `string` - Move description text

**Output**:
```typescript
interface MultiHitEffect {
  minHits: number;
  maxHits: number;
  continueDie: string;
  continueThreshold: number;
  damagePerHit: string;
} | null
```

**Detection Patterns**:
- "roll a d4. On a result of 3 or 4, hit again"
- "Make two attacks"
- "continue this process until"
- "up to a maximum of [X] additional hits"

**Example**:
```javascript
parseMultiHitEffect("roll 1d4 on a hit. You attack with strikes equal to the number shown.")
// Returns: { minHits: 1, maxHits: 4, continueDie: "d4", continueThreshold: 1, damagePerHit: "1d4" }
```

---

### parseConditionalDamageEffect(description)

**Purpose**: Parse conditional damage bonus mechanics

**Input**: `string` - Move description text

**Output**:
```typescript
interface ConditionalDamageEffect {
  condition: 'target_damaged_this_round' | 'user_damaged_since_last_turn' | 'target_has_status';
  statusType?: string;
  multiplier: number;
  affectsBaseDice: boolean;
} | null
```

**Detection Patterns**:
- "If the target has already taken damage this round, double"
- "If you took damage since your last turn, double"
- "If the target is [poisoned/asleep/etc], double"

**Example**:
```javascript
parseConditionalDamageEffect("If the target has already taken damage in the same round, double the damage dice.")
// Returns: { condition: 'target_damaged_this_round', multiplier: 2, affectsBaseDice: true }
```

---

### parseChargeMoveEffect(description, time)

**Purpose**: Parse charge/recharge/invulnerable mechanics

**Input**:
- `description: string` - Move description text
- `time: string` - Move time field (e.g., "1 action, charge")

**Output**:
```typescript
interface ChargeMoveEffect {
  type: 'charge' | 'recharge' | 'invulnerable';
  chargeTurns: number;
  bypassCondition?: string;
  invulnerableFrom: string[];
} | null
```

**Detection Patterns**:
- `time` contains "charge" or "recharge"
- "invulnerable state until your next turn"
- "may not activate it again until after the end of your next turn"
- "If [weather condition], may be used instantly"

**Example**:
```javascript
parseChargeMoveEffect("spend your action to charge up...on your next turn, make a melee attack", "1 action, charge")
// Returns: { type: 'charge', chargeTurns: 1, invulnerableFrom: [] }
```

---

### parseControlEffect(description)

**Purpose**: Parse grapple/restrain/trap mechanics

**Input**: `string` - Move description text

**Output**:
```typescript
interface ControlEffect {
  type: 'grapple' | 'restrain' | 'prevent_flee' | 'trap';
  duration: number | null;
  escapeAbility: string;
  escapeDC: 'move_dc';
  ongoingDamage?: string;
} | null
```

**Detection Patterns**:
- "grappled" / "grapple"
- "restrained and cannot flee or be switched out"
- "cannot flee or switch"
- "trapped" / "wrapped"
- "STR saving throw...to escape"

**Example**:
```javascript
parseControlEffect("On a hit, the target becomes restrained...may make a STR saving throw against your Move DC")
// Returns: { type: 'restrain', duration: null, escapeAbility: 'STR', escapeDC: 'move_dc' }
```

---

### parseAoEEffect(range)

**Purpose**: Parse area of effect from range field

**Input**: `string` - Move range field

**Output**:
```typescript
interface AoEEffect {
  shape: 'cone' | 'line' | 'sphere' | 'radius';
  size: number;
  width?: number;
  centered_on: 'self' | 'point';
} | null
```

**Detection Patterns**:
- "self (30ft cone)"
- "self (50ft line)"
- "self (15ft radius)"
- "10-foot-radius Sphere centered there"

**Example**:
```javascript
parseAoEEffect("self (30ft cone)")
// Returns: { shape: 'cone', size: 30, centered_on: 'self' }
```

---

### parseAutoHit(description)

**Purpose**: Detect guaranteed hit moves

**Input**: `string` - Move description text

**Output**: `boolean`

**Detection Patterns**:
- "guaranteed to hit"
- "This move is guaranteed to hit"

**Example**:
```javascript
parseAutoHit("This move is guaranteed to hit for 1d6 + MOVE flying damage")
// Returns: true
```

---

### parseStatEffect(description)

**Purpose**: Parse ability score/stat modification effects

**Input**: `string` - Move description text

**Output**:
```typescript
interface StatEffect {
  target: 'self' | 'target' | 'allies';
  stat: string;
  amount: number;
  duration: number | null;
  stackable: boolean;
  maxStack: number | null;
} | null
```

**Detection Patterns**:
- "all of your ability scores go up by X"
- "add +X to attack rolls"
- "+X to any saving throw"
- "may be stacked to a maximum of +X"

**Example**:
```javascript
parseStatEffect("For the next minute, choose to add +1 to your attack rolls OR +1 to AC. This move can be stacked to a maximum of +5")
// Returns: { target: 'self', stat: 'attack_or_ac', amount: 1, duration: 10, stackable: true, maxStack: 5 }
```

---

## Execution Contracts

### Location: `lib/battleEngine.js`

---

### executeMultiHit(attacker, defender, move, baseHitResult, rng)

**Purpose**: Execute multi-hit move with continuation rolls

**Input**:
- `attacker: Combatant`
- `defender: Combatant`
- `move: Move`
- `baseHitResult: ActionResult` - Result of first hit
- `rng: SeededRandom`

**Output**:
```typescript
interface MultiHitResult {
  totalHits: number;
  rolls: number[];
  damagePerHit: number[];
  totalDamage: number;
}
```

**Behavior**:
1. First hit already calculated in baseHitResult
2. Roll continuation die
3. If roll >= threshold, calculate next hit damage
4. Repeat until roll < threshold or maxHits reached
5. Return aggregated results

---

### evaluateConditionalDamage(attacker, defender, condition, baseDamage)

**Purpose**: Check condition and apply damage multiplier

**Input**:
- `attacker: Combatant`
- `defender: Combatant`
- `condition: ConditionalDamageEffect`
- `baseDamage: number`

**Output**:
```typescript
interface ConditionalDamageResult {
  conditionMet: boolean;
  condition: string;
  multiplierApplied: number;
  baseDamage: number;
  finalDamage: number;
}
```

**Behavior**:
1. Check `defender.took_damage_this_round` for 'target_damaged_this_round'
2. Check `attacker.damage_taken_since_last_turn > 0` for 'user_damaged_since_last_turn'
3. Check `defender.status_effects` for 'target_has_status'
4. Apply multiplier if condition met

---

### processChargeMove(attacker, move, roundNumber)

**Purpose**: Handle charge/recharge state transitions

**Input**:
- `attacker: Combatant`
- `move: Move`
- `roundNumber: number`

**Output**:
```typescript
interface ChargeStateResult {
  type: 'started_charge' | 'executed' | 'started_recharge' | 'became_invulnerable';
  moveId: string;
  executesRound?: number;
  recoversRound?: number;
}
```

**Behavior**:
1. If move is charge type and not already charging:
   - Set `attacker.charging_move`
   - Set `attacker.is_invulnerable` if applicable
   - Return 'started_charge'
2. If already charging and `roundNumber >= executesRound`:
   - Execute the move
   - Clear charging state
   - Return 'executed'
3. If move is recharge type after execution:
   - Set `attacker.is_recharging = true`
   - Return 'started_recharge'

---

### applyControlEffect(attacker, defender, effect, roundNumber)

**Purpose**: Apply grapple/restrain/trap effects

**Input**:
- `attacker: Combatant`
- `defender: Combatant`
- `effect: ControlEffect`
- `roundNumber: number`

**Output**:
```typescript
interface ControlResult {
  type: string;
  applied: boolean;
  reason?: string;
  escapeAbility: string;
  escapeDC: number;
}
```

**Behavior**:
1. Check if target already has conflicting control
2. Apply control status to defender
3. If grapple: set `attacker.is_grappling` and `defender.grappled_by`
4. If prevent_flee: set `defender.cannot_flee`
5. Return DC for escape attempts

---

### calculateAoETargets(origin, aoeEffect, allCombatants)

**Purpose**: Determine which combatants are in AoE area

**Input**:
- `origin: GridPosition`
- `aoeEffect: AoEEffect`
- `allCombatants: Combatant[]`

**Output**: `Combatant[]` - Combatants in the affected area

**Behavior**:
1. For cone: calculate cone cells from origin in facing direction
2. For line: calculate line cells from origin
3. For sphere/radius: calculate circular area
4. Filter combatants by position intersection

---

### processEscapeAttempt(combatant, roundNumber)

**Purpose**: Allow restrained/grappled combatant to attempt escape

**Input**:
- `combatant: Combatant`
- `roundNumber: number`

**Output**:
```typescript
{
  attempted: boolean;
  success: boolean;
  roll: number;
  dc: number;
  freedFrom: string | null;
}
```

**Behavior**:
1. Check if combatant is restrained or grappled
2. Roll save vs stored DC
3. If success: remove control effect
4. Return result for logging

---

## Action Economy Contract

### Location: `lib/combatUtils.js`

---

### canUseMove(combatant, move)

**Purpose**: Check if combatant has required action type available

**Input**:
- `combatant: Combatant`
- `move: Move`

**Output**:
```typescript
{
  canUse: boolean;
  reason?: string;  // If canUse is false
}
```

**Behavior**:
1. Parse `move.time` for action type
2. Check corresponding flag on combatant
3. Check `is_recharging` if move matches recharging move
4. Return result

---

### consumeAction(combatant, actionType)

**Purpose**: Mark action type as used

**Input**:
- `combatant: Combatant`
- `actionType: 'action' | 'bonus_action' | 'reaction'`

**Output**: `void` (mutates combatant)

**Behavior**:
1. Set corresponding flag to false
2. Update combat log

---

### resetTurnActions(combatant)

**Purpose**: Reset action availability at turn start

**Input**: `combatant: Combatant`

**Output**: `void` (mutates combatant)

**Behavior**:
1. Set `has_action = true`
2. Set `has_bonus_action = true`
3. Set `has_reaction = true` (if not already true from previous turn)
