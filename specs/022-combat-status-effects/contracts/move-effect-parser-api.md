# Contract: Move Effect Parser API

**Module**: `lib/moveEffectParser.js`
**Feature**: 022-combat-status-effects

## Overview

Parses move description text to extract structured effect data for healing, recoil, status triggers, AC changes, speed changes, and stat changes.

---

## Exports

### parseMoveEffects(move)

Parse all effects from a move's description.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| move | Object | Yes | Move object with `description` property |

**Returns**: `MoveEffect` object

**Example**:
```javascript
import { parseMoveEffects } from './moveEffectParser.js';

const move = {
  id: 'absorb',
  description: 'On a hit, the creature takes 1d4 + MOVE grass damage. Half the damage done is restored by the user.'
};

const effects = parseMoveEffects(move);
// {
//   healing: { type: 'drain', percentage: 50, diceExpr: null, addMoveMod: false },
//   recoil: null,
//   statusTrigger: null,
//   acEffect: null,
//   speedEffect: null,
//   statEffect: null,
//   hasEffects: true
// }
```

---

### parseHealingEffect(description)

Parse healing effect from description.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| description | string | Yes | Move description text |

**Returns**: `HealingEffect | null`

**Patterns Matched**:
- `"Half the damage done is restored"` → `{ type: 'drain', percentage: 50 }`
- `"regain 4d4 + MOVE hit points"` → `{ type: 'dice', diceExpr: '4d4', addMoveMod: true }`
- `"regain 10 hit points"` → `{ type: 'fixed', amount: 10 }`

---

### parseRecoilEffect(description)

Parse recoil effect from description.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| description | string | Yes | Move description text |

**Returns**: `RecoilEffect | null`

**Patterns Matched**:
- `"taking a quarter of the total damage...in typeless recoil"` → `{ percentage: 25, typeless: true }`
- `"taking half of the damage...in typeless recoil"` → `{ percentage: 50, typeless: true }`
- `"taking 1/4 of the damage...in recoil"` → `{ percentage: 25, typeless: true }`

---

### parseStatusTrigger(description, naturalRoll, saveResult)

Extended status trigger parsing (enhances existing `statusEffects.parseStatusTrigger`).

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| description | string | Yes | Move description text |
| naturalRoll | number | No | Natural d20 roll (for threshold checks) |
| saveResult | Object | No | Save result with `{ saved, total, dc }` |

**Returns**: `StatusTrigger | null`

**Patterns Matched**:
- `"On a natural attack roll of 18 or more, the target is burned"` → threshold trigger
- `"If a creature fails the save by 5 or more, they are paralyzed"` → save_fail_by trigger
- `"On a failure, the target is poisoned"` → save_fail trigger
- `"On a hit, the target flinches"` → on_hit trigger

---

### parseACEffect(description)

Parse AC modification effect.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| description | string | Yes | Move description text |

**Returns**: `ACEffect | null`

**Patterns Matched**:
- `"target's AC is reduced by 1"` → `{ direction: 'decrease', amount: 1, target: 'target' }`
- `"your AC increases by 2"` → `{ direction: 'increase', amount: 2, target: 'self' }`
- `"allies...gain +2 to their AC"` → `{ direction: 'increase', amount: 2, target: 'allies' }`

---

### parseSpeedEffect(description)

Parse speed modification effect.

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| description | string | Yes | Move description text |

**Returns**: `SpeedEffect | null`

**Patterns Matched**:
- `"target's speed is halved"` → `{ type: 'halve', target: 'target' }`
- `"speed increases by 10ft"` → `{ type: 'increase', amount: 10, target: 'self' }`
- `"speed is reduced by 5 feet"` → `{ type: 'decrease', amount: 5, target: 'target' }`

---

## Usage in Combat Flow

```javascript
// In battleEngine.js executeAttack()
import { parseMoveEffects } from './moveEffectParser.js';

function executeAttack(attacker, defender, move, roundNumber) {
  const effects = parseMoveEffects(move);

  // ... existing attack/damage logic ...

  // Apply healing if present and attack hit
  if (hit && effects.healing) {
    const healAmount = calculateHealing(effects.healing, damageDealt, attacker);
    attacker.current_hp = Math.min(attacker.max_hp, attacker.current_hp + healAmount);
    // Log healing event
  }

  // Apply recoil if present and attack hit
  if (hit && effects.recoil) {
    const recoilAmount = Math.floor(damageDealt * (effects.recoil.percentage / 100));
    attacker.current_hp = Math.max(0, attacker.current_hp - recoilAmount);
    // Log recoil event
  }

  // ... other effects ...
}
```

---

## Error Handling

- Returns `null` for unrecognized patterns (graceful degradation)
- Does not throw exceptions for malformed descriptions
- Logs warnings for partially matched patterns (development aid)
