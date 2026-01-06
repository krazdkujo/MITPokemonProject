# Data Model: Combat Status Effects Integration

**Feature**: 022-combat-status-effects
**Date**: 2026-01-06

## Overview

Data structures for parsed move effects and enhanced combat log entries. No database changes required - all structures are in-memory during combat.

## Entities

### MoveEffect

Represents parsed effects from a move's description text.

```javascript
/**
 * @typedef {Object} MoveEffect
 * @property {HealingEffect|null} healing - Healing effect if present
 * @property {RecoilEffect|null} recoil - Recoil effect if present
 * @property {StatusTrigger|null} statusTrigger - Status application trigger
 * @property {ACEffect|null} acEffect - AC modification effect
 * @property {SpeedEffect|null} speedEffect - Speed modification effect
 * @property {StatEffect|null} statEffect - Stat modification effect
 * @property {boolean} hasEffects - True if any effect was parsed
 */
```

### HealingEffect

```javascript
/**
 * @typedef {Object} HealingEffect
 * @property {'drain'|'fixed'|'dice'} type - Type of healing
 * @property {number|null} percentage - For drain: percentage of damage (e.g., 50)
 * @property {string|null} diceExpr - For dice: dice expression (e.g., "4d4")
 * @property {boolean} addMoveMod - Whether to add MOVE modifier
 */
```

### RecoilEffect

```javascript
/**
 * @typedef {Object} RecoilEffect
 * @property {number} percentage - Percentage of damage taken as recoil (25, 50)
 * @property {boolean} typeless - Whether recoil bypasses type resistance (always true)
 */
```

### StatusTrigger

```javascript
/**
 * @typedef {Object} StatusTrigger
 * @property {string} statusType - Status to apply (BURNED, PARALYZED, etc.)
 * @property {'natural_roll'|'save_fail'|'save_fail_by'|'on_hit'} triggerType
 * @property {number|null} threshold - For natural_roll: minimum roll (e.g., 18)
 * @property {number|null} failBy - For save_fail_by: margin (e.g., 5)
 */
```

### ACEffect

```javascript
/**
 * @typedef {Object} ACEffect
 * @property {'increase'|'decrease'} direction - Whether AC goes up or down
 * @property {number} amount - Amount of AC change (1, 2, etc.)
 * @property {'self'|'target'|'allies'} target - Who is affected
 * @property {'turn'|'combat'|'duration'} duration - How long effect lasts
 * @property {boolean} stackable - Whether effect can stack
 * @property {number|null} maxStack - Maximum stack count if stackable
 */
```

### SpeedEffect

```javascript
/**
 * @typedef {Object} SpeedEffect
 * @property {'increase'|'decrease'|'halve'} type - Type of speed change
 * @property {number|null} amount - Amount in feet (for increase/decrease)
 * @property {'self'|'target'} target - Who is affected
 */
```

### StatEffect

```javascript
/**
 * @typedef {Object} StatEffect
 * @property {string[]} stats - Affected stats ['str', 'dex', etc.]
 * @property {number} amount - Change amount
 * @property {'increase'|'decrease'} direction
 * @property {string|null} condition - Condition for effect (e.g., "while in battle")
 */
```

---

## Combat Log Entry Types

### CombatLogEntry (Base)

```javascript
/**
 * @typedef {Object} CombatLogEntry
 * @property {string} type - Entry type (see below)
 * @property {number} turn - Turn number when event occurred
 * @property {number} timestamp - Unix timestamp
 * @property {Object} details - Type-specific details
 */
```

### Log Entry Types

| Type | Description | Details Fields |
|------|-------------|----------------|
| `attack` | Attack roll made | attacker, move, target, roll, hit |
| `damage` | Damage dealt | source, target, amount, effectiveness |
| `status_applied` | Status effect applied | target, statusType, source, trigger |
| `status_blocked` | Status application blocked | target, statusType, reason |
| `status_damage` | End-of-turn status damage | target, statusType, damage, hpBefore, hpAfter |
| `status_check` | Turn-affecting status check | target, statusType, roll, threshold, result |
| `status_removed` | Status effect ended | target, statusType, reason |
| `healing` | HP restored | target, source, amount, hpBefore, hpAfter |
| `recoil` | Recoil damage taken | target, move, amount, hpBefore, hpAfter |
| `ac_change` | AC modified | target, amount, direction, source |
| `speed_change` | Speed modified | target, change, source |
| `stat_change` | Stat modified | target, stats, amount, direction, source |
| `turn_skip` | Turn skipped due to status | target, statusType, reason, roll |
| `concentration_broken` | Concentration ended | target, move, reason |

### Status Check Details

```javascript
/**
 * @typedef {Object} StatusCheckDetails
 * @property {string} target - Pokemon name
 * @property {string} statusType - Status being checked
 * @property {string} checkType - Type of check (wake, paralysis, frozen_break, confusion)
 * @property {number} roll - Dice roll value
 * @property {number[]} allRolls - All dice rolled (for showing both on advantage)
 * @property {number} threshold - Value needed to pass
 * @property {boolean} passed - Whether check passed
 * @property {string} result - Human-readable result
 */
```

### Status Applied Details

```javascript
/**
 * @typedef {Object} StatusAppliedDetails
 * @property {string} target - Pokemon name
 * @property {string} statusType - Status applied
 * @property {string} source - Move or effect that caused it
 * @property {Object} trigger - How status was triggered
 * @property {string} trigger.type - 'natural_roll', 'save_fail', etc.
 * @property {number|null} trigger.roll - Roll value if applicable
 * @property {number|null} trigger.threshold - Threshold if applicable
 * @property {number|null} trigger.saveTotal - Save total if save-based
 * @property {number|null} trigger.dc - DC if save-based
 */
```

### Healing Details

```javascript
/**
 * @typedef {Object} HealingDetails
 * @property {string} target - Pokemon healed
 * @property {string} source - Move that caused healing
 * @property {string} healType - 'drain', 'fixed', 'dice'
 * @property {number} damageDealt - For drain: damage that was dealt
 * @property {number} percentage - For drain: percentage restored
 * @property {string|null} diceExpr - For dice: expression rolled
 * @property {number|null} diceRoll - For dice: roll result
 * @property {number} amount - Final healing amount
 * @property {number} hpBefore - HP before healing
 * @property {number} hpAfter - HP after healing (capped at max)
 */
```

### Recoil Details

```javascript
/**
 * @typedef {Object} RecoilDetails
 * @property {string} target - Pokemon taking recoil
 * @property {string} move - Move that caused recoil
 * @property {number} damageDealt - Damage dealt to opponent
 * @property {number} percentage - Recoil percentage
 * @property {number} amount - Recoil damage taken
 * @property {number} hpBefore - HP before recoil
 * @property {number} hpAfter - HP after recoil
 */
```

---

## State Transitions

### Status Effect Lifecycle

```
[none] -> applied -> (active) -> removed
                  -> blocked (immunity/existing status)
```

### Status Check Flow

```
Turn Start
  -> Has PARALYZED? -> Roll d4 -> 1: Skip turn, 2-4: Normal
  -> Has ASLEEP? -> Roll d20 -> <11: Stay asleep, 11+: Wake up
  -> Has FROZEN? -> STR save vs DC -> Fail: Frozen, Pass: Thaw
  -> Has CONFUSED? -> Roll d8 -> 1-4: Normal, 5: Skip, 6: Self-hit, 7: Nearest, 8: End confusion
```

### Effect Application Order

```
1. Start of turn status checks (may skip turn)
2. If not skipped:
   a. Attack roll or Save DC
   b. Damage calculation (with burn penalty if applicable)
   c. Apply damage to target
   d. Check status trigger -> Apply status
   e. Parse move effects -> Apply healing/recoil/AC/speed/stat
3. End of turn status damage (burn, poison)
4. Duration countdown for volatile statuses
```

---

## Validation Rules

### Status Application
- Cannot apply non-volatile status if target already has one
- Type immunity blocks status (Fire immune to Burn, Electric to Paralysis, etc.)
- Grace period prevents immediate re-application after cure

### Effect Calculations
- Healing cannot exceed max HP
- Recoil damage is typeless (ignores resistance)
- AC changes stack up to specified max (-5 max reduction typically)
- Speed cannot go below 0

### Log Entry Requirements
- All entries must include turn number
- Roll-based entries must include all dice values
- Threshold-based entries must show comparison (roll vs threshold)
