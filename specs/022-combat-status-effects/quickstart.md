# Quickstart: Combat Status Effects Integration

**Feature**: 022-combat-status-effects
**Date**: 2026-01-06

## Overview

This guide covers integrating the enhanced status effects and move effect parsing into the existing combat system.

## Prerequisites

- Existing `lib/statusEffects.js` module
- Existing `lib/battleEngine.js` module
- Existing `lib/combatLogger.js` module
- Combat test harness (`npm run test:combat`)

## Quick Integration Steps

### 1. Create Move Effect Parser

Create `lib/moveEffectParser.js`:

```javascript
// lib/moveEffectParser.js

/**
 * Parse all effects from a move description
 */
export function parseMoveEffects(move) {
  const description = move.description || '';

  return {
    healing: parseHealingEffect(description),
    recoil: parseRecoilEffect(description),
    statusTrigger: null, // Use enhanced parseStatusTrigger
    acEffect: parseACEffect(description),
    speedEffect: parseSpeedEffect(description),
    statEffect: null, // Future enhancement
    hasEffects: false // Set true if any effect found
  };
}

export function parseHealingEffect(description) {
  // Drain pattern: "Half the damage done is restored"
  if (/half.*damage.*restored|healed.*half|regain.*half/i.test(description)) {
    return { type: 'drain', percentage: 50 };
  }

  // Dice healing: "regain 4d4 + MOVE hit points"
  const diceMatch = description.match(/regain\s+(\d+d\d+)\s*(?:\+\s*MOVE)?\s*hit\s*points/i);
  if (diceMatch) {
    return {
      type: 'dice',
      diceExpr: diceMatch[1],
      addMoveMod: description.toLowerCase().includes('+ move')
    };
  }

  return null;
}

export function parseRecoilEffect(description) {
  const recoilMatch = description.match(
    /(?:taking|take)\s+(?:a\s+)?(?:(quarter|half|1\/4|1\/2)).*recoil/i
  );

  if (recoilMatch) {
    const fraction = recoilMatch[1].toLowerCase();
    const percentage = (fraction === 'quarter' || fraction === '1/4') ? 25 : 50;
    return { percentage, typeless: true };
  }

  return null;
}

export function parseACEffect(description) {
  // AC decrease
  const decreaseMatch = description.match(/ac\s+(?:is\s+)?(?:reduced|decreased|lowered)\s+by\s+(\d+)/i);
  if (decreaseMatch) {
    return {
      direction: 'decrease',
      amount: parseInt(decreaseMatch[1]),
      target: 'target',
      stackable: description.includes('stacked')
    };
  }

  // AC increase
  const increaseMatch = description.match(/ac\s+(?:increases?|boost)\s+by\s+(\d+)/i);
  if (increaseMatch) {
    return {
      direction: 'increase',
      amount: parseInt(increaseMatch[1]),
      target: 'self'
    };
  }

  return null;
}

export function parseSpeedEffect(description) {
  if (/speed\s+is\s+halved/i.test(description)) {
    return { type: 'halve', target: 'target' };
  }

  const speedMatch = description.match(/speed\s+(?:increases?|decreases?|reduced)\s+by\s+(\d+)/i);
  if (speedMatch) {
    const isIncrease = /increases?/i.test(description);
    return {
      type: isIncrease ? 'increase' : 'decrease',
      amount: parseInt(speedMatch[1]),
      target: isIncrease ? 'self' : 'target'
    };
  }

  return null;
}
```

### 2. Extend Status Effects

Modify `lib/statusEffects.js` to return roll details:

```javascript
// In processStartOfTurnStatus()
function processStartOfTurnStatus(combatant) {
  const statusChanges = [];
  const rolls = []; // NEW: Track all rolls
  let skipTurn = false;
  let reason = null;

  // ... existing logic ...

  // For paralysis check
  if (effect.status_type === StatusType.PARALYZED) {
    const paraRoll = rollDice('1d4');
    rolls.push({ type: 'paralysis', roll: paraRoll, threshold: 1 }); // NEW
    if (paraRoll === 1) {
      skipTurn = true;
      reason = 'paralyzed';
    }
  }

  return { skipTurn, reason, statusChanges, rolls }; // NEW: include rolls
}
```

### 3. Extend Combat Logger

Add new methods to `lib/combatLogger.js`:

```javascript
// Add to createLogger() return object

logStatusApplied(target, statusType, source, trigger) {
  let triggerStr = '';
  if (trigger.type === 'save_fail') {
    triggerStr = `(${trigger.saveType} save: ${trigger.saveTotal} vs DC ${trigger.dc} - FAILED)`;
  } else if (trigger.type === 'natural_roll') {
    triggerStr = `(natural ${trigger.roll} ≥ ${trigger.threshold})`;
  }

  return `  ${c('magenta', '★')} ${target.toUpperCase()} is now ${c('magenta', statusType)}!\n    └─ ${source} ${triggerStr}`;
},

logStatusCheck(target, checkType, roll, threshold, passed, details) {
  const symbols = {
    paralysis: '⚡',
    wake: '💤',
    frozen_break: '❄️',
    confusion: '💫'
  };

  const symbol = symbols[checkType] || '?';
  const result = passed ? c('green', 'Passed') : c('red', 'Failed');

  return `  ${symbol} ${target.toUpperCase()} ${checkType}: ${details.diceExpr || 'd20'}(${roll}) vs ${threshold} → ${result}`;
},

logHealing(target, source, healType, amount, details) {
  const { hpBefore, hpAfter, damageDealt, percentage } = details;
  let healInfo = '';

  if (healType === 'drain') {
    healInfo = `(${percentage}% of ${damageDealt} damage)`;
  } else if (healType === 'dice') {
    healInfo = `(${details.diceExpr}(${details.diceRoll}) = ${amount})`;
  }

  return `  ${c('green', '💚')} ${target.toUpperCase()} healed ${amount} HP from ${source} ${healInfo}\n    └─ HP: ${hpBefore} → ${hpAfter}`;
},

logRecoil(target, move, amount, details) {
  const { hpBefore, hpAfter, damageDealt, percentage } = details;
  return `  ${c('yellow', '💥')} ${target.toUpperCase()} takes ${amount} recoil from ${move} (${percentage}% of ${damageDealt} damage)\n    └─ HP: ${hpBefore} → ${hpAfter}`;
}
```

### 4. Integrate in Battle Engine

Modify `lib/battleEngine.js` `executeAttack()`:

```javascript
import { parseMoveEffects } from './moveEffectParser.js';

function executeAttack(attacker, defender, move, roundNumber = 1) {
  const effects = parseMoveEffects(move);

  // ... existing attack logic ...

  if (hit) {
    // ... existing damage calculation ...

    // Apply healing effect
    if (effects.healing && effects.healing.type === 'drain') {
      const healAmount = Math.floor(damage * (effects.healing.percentage / 100));
      const hpBefore = attacker.current_hp;
      attacker.current_hp = Math.min(attacker.max_hp, attacker.current_hp + healAmount);

      result.healing = {
        type: 'drain',
        amount: healAmount,
        hpBefore,
        hpAfter: attacker.current_hp,
        damageDealt: damage,
        percentage: effects.healing.percentage
      };
    }

    // Apply recoil effect
    if (effects.recoil) {
      const recoilAmount = Math.floor(damage * (effects.recoil.percentage / 100));
      const hpBefore = attacker.current_hp;
      attacker.current_hp = Math.max(0, attacker.current_hp - recoilAmount);

      result.recoil = {
        amount: recoilAmount,
        hpBefore,
        hpAfter: attacker.current_hp,
        damageDealt: damage,
        percentage: effects.recoil.percentage
      };
    }
  }

  return result;
}
```

## Testing

### Test Status Effect Application

```bash
# Run test combat with specific seed
npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur --seed 12345
```

### Test Specific Moves

```javascript
// In test-combat.js or via API
const result = await fetch('/api/test-combat/start', {
  method: 'POST',
  body: JSON.stringify({
    pokemon1: { id: 'charizard', level: 10, moves: ['flamethrower'] },
    pokemon2: { id: 'bulbasaur', level: 10 },
    seed: 42
  })
});
```

### Verify Log Output

Expected log for drain move:
```
▶ VENUSAUR uses GIGA DRAIN
  Target: GEODUDE
  ├─ Attack Roll: d20(15) + 6 = 21
  ├─ vs AC 13 → HIT
  ├─ Damage: 2d6(4,5) + 3 (power) = 12
  ├─ Type: 2x (super effective)
  └─ Result: 24 damage → GEODUDE HP: 35→11
  💚 VENUSAUR healed 12 HP from GIGA DRAIN (50% of 24 damage)
    └─ HP: 45 → 57
```

## Common Patterns

### Adding New Effect Type

1. Add parser function in `moveEffectParser.js`
2. Add TypeDef in `data-model.md`
3. Add logger method in `combatLogger.js`
4. Integrate in `battleEngine.js` `executeAttack()`
5. Update UI components to render new log type

### Debugging Effect Parsing

```javascript
import { parseMoveEffects } from './moveEffectParser.js';
import { getMoveById } from './pokemonData.js';

const move = getMoveById('flare-blitz');
const effects = parseMoveEffects(move);
console.log(JSON.stringify(effects, null, 2));
```

## Files Modified

| File | Changes |
|------|---------|
| `lib/moveEffectParser.js` | NEW - Effect parsing |
| `lib/statusEffects.js` | Return roll details |
| `lib/combatLogger.js` | New log methods |
| `lib/battleEngine.js` | Effect integration |
| `lib/combatSimulator.js` | Wire up logging |
| `components/TestCombat/BattleLog.js` | Render new types |
