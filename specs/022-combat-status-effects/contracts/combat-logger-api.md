# Contract: Combat Logger API Extensions

**Module**: `lib/combatLogger.js`
**Feature**: 022-combat-status-effects

## Overview

Extensions to the existing combat logger for detailed status effect and move effect logging.

---

## New Methods

### logStatusApplied(target, statusType, source, trigger)

Log successful status effect application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name receiving status |
| statusType | string | Status type (BURNED, PARALYZED, etc.) |
| source | string | Move name that applied status |
| trigger | Object | Trigger details `{ type, roll, threshold, dc, saveTotal }` |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  ★ PIKACHU is now PARALYZED!
    └─ Thunder Wave (CON save: 8 vs DC 14 - FAILED)
```

---

### logStatusBlocked(target, statusType, reason)

Log blocked status application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name |
| statusType | string | Status type that was blocked |
| reason | string | Reason code (type_immunity, already_has_status, grace_period) |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  ○ BURNED blocked on CHARIZARD: Fire-type immunity
```

---

### logStatusCheck(target, checkType, roll, threshold, passed, details)

Log status check at start of turn.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name |
| checkType | string | Check type (paralysis, wake, frozen_break, confusion) |
| roll | number | Dice roll result |
| threshold | number | Value needed to pass |
| passed | boolean | Whether check passed |
| details | Object | Additional details `{ rolls, dc, modifier }` |

**Returns**: `string` - Formatted log line

**Example Output (paralysis check)**:
```
  ⚡ JOLTEON paralysis check: d4(1) → Cannot move!
```

**Example Output (wake check)**:
```
  💤 SNORLAX wake check: d20(14) ≥ 11 → Woke up!
```

**Example Output (frozen break)**:
```
  ❄️ ARTICUNO freeze break: STR save d20(12) + 2 = 14 vs DC 12 → Broke free!
```

**Example Output (confusion)**:
```
  💫 PSYDUCK confusion: d8(6) → Hurt itself in confusion!
```

---

### logHealing(target, source, healType, amount, details)

Log healing effect.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name healed |
| source | string | Move name |
| healType | string | Type (drain, dice, fixed) |
| amount | number | HP restored |
| details | Object | `{ hpBefore, hpAfter, damageDealt, percentage, diceExpr, diceRoll }` |

**Returns**: `string` - Formatted log line

**Example Output (drain)**:
```
  💚 VENUSAUR healed 8 HP from GIGA DRAIN (50% of 16 damage)
    └─ HP: 45 → 53
```

**Example Output (dice)**:
```
  💚 BLISSEY healed 12 HP from SOFT-BOILED (4d4(3,2,4,3) = 12)
    └─ HP: 200 → 212
```

---

### logRecoil(target, move, amount, details)

Log recoil damage.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name taking recoil |
| move | string | Move name |
| amount | number | Recoil damage taken |
| details | Object | `{ hpBefore, hpAfter, damageDealt, percentage }` |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  💥 STARAPTOR takes 12 recoil from BRAVE BIRD (25% of 48 damage)
    └─ HP: 78 → 66
```

---

### logACChange(target, source, amount, direction, details)

Log AC modification.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| target | string | Pokemon name |
| source | string | Move/effect name |
| amount | number | AC change amount |
| direction | string | 'increase' or 'decrease' |
| details | Object | `{ newAC, stackCount, maxStack }` |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  🛡️ METAGROSS AC increased by 2 from IRON DEFENSE (now AC 18)
```

```
  🔻 GARCHOMP AC reduced by 1 from ACID SPRAY (now AC 12, stack 2/3)
```

---

### logBurnedPenalty(attacker, roll1, roll2, used)

Log burn damage penalty application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| attacker | string | Pokemon name |
| roll1 | number | First damage roll |
| roll2 | number | Second damage roll |
| used | number | Roll that was used (lower one) |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  🔥 BURNED penalty: 2d6(8,3) → using 3 (lower roll)
```

---

### logFlinchedEffect(pokemon, effectType, details)

Log flinch disadvantage/advantage application.

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| pokemon | string | Pokemon name |
| effectType | string | 'attack_disadvantage' or 'target_advantage' |
| details | Object | `{ rolls, used }` |

**Returns**: `string` - Formatted log line

**Example Output**:
```
  😵 FLINCHED: MACHAMP attacks with disadvantage d20(15,8) → 8
```

---

## Structured Log Output

For programmatic consumption (UI rendering), all methods also populate an internal log array:

```javascript
const logger = createLogger({ colorize: false });

// ... combat actions ...

// Get structured log entries for UI
const entries = logger.getStructuredLog();
// Returns array of CombatLogEntry objects (see data-model.md)
```

---

## Color Coding (CLI)

| Event Type | Color | Symbol |
|------------|-------|--------|
| Status Applied | Magenta | ★ |
| Status Blocked | Dim | ○ |
| Status Damage | Magenta | ★ |
| Healing | Green | 💚 |
| Recoil | Yellow | 💥 |
| AC Increase | Cyan | 🛡️ |
| AC Decrease | Yellow | 🔻 |
| Turn Skip | Yellow | ⚠ |
| Paralysis | Yellow | ⚡ |
| Sleep | Blue | 💤 |
| Frozen | Cyan | ❄️ |
| Confusion | Magenta | 💫 |
| Burned | Red | 🔥 |
| Flinched | Yellow | 😵 |

---

## Integration Example

```javascript
import { createLogger } from './combatLogger.js';

const logger = createLogger({ colorize: true, verbose: true });

// During combat turn processing
function processTurn(attacker, defender, move) {
  // Start of turn status check
  const paraCheck = processParalysisCheck(attacker);
  if (paraCheck.checked) {
    console.log(logger.logStatusCheck(
      attacker.name,
      'paralysis',
      paraCheck.roll,
      1, // threshold (1 = skip)
      paraCheck.roll !== 1,
      { rolls: [paraCheck.roll] }
    ));
  }

  if (paraCheck.skipTurn) {
    console.log(logger.logSkippedTurn(attacker.name, 'is paralyzed and cannot move!'));
    return;
  }

  // ... attack logic ...

  // If status applied
  if (statusResult.applied) {
    console.log(logger.logStatusApplied(
      defender.name,
      statusResult.statusType,
      move.name,
      statusResult.trigger
    ));
  }

  // If healing occurred
  if (healingResult) {
    console.log(logger.logHealing(
      attacker.name,
      move.name,
      'drain',
      healingResult.amount,
      {
        hpBefore: healingResult.hpBefore,
        hpAfter: healingResult.hpAfter,
        damageDealt: damageResult.finalDamage,
        percentage: 50
      }
    ));
  }
}
```
