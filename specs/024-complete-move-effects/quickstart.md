# Quickstart Guide: Complete Move Effects

**Feature**: 024-complete-move-effects
**Date**: 2026-01-06

## Overview

This guide provides a quick reference for implementing the complete move effects feature. The implementation extends existing modules without creating new files.

## Implementation Order

### Phase 1: Extend Parser (lib/moveEffectParser.js)

1. Add new parser functions:
   - `parseMultiHitEffect(description)` - Multi-hit continuation mechanics
   - `parseConditionalDamageEffect(description)` - Conditional damage bonuses
   - `parseChargeMoveEffect(description, time)` - Two-turn move detection
   - `parseControlEffect(description)` - Grapple/restrain/trap
   - `parseAoEEffect(range)` - Area of effect parsing
   - `parseAutoHit(description)` - Guaranteed hit detection
   - `parseStatEffect(description)` - Stat modification parsing

2. Update `parseMoveEffects(move)` to include new parsers

### Phase 2: Extend Combatant State (lib/combatSimulator.js)

Add to combatant object:
```javascript
// Action economy
has_action: true,
has_bonus_action: true,
has_reaction: true,

// Two-turn state
charging_move: null,
is_invulnerable: false,
invulnerable_until: null,
is_recharging: false,
recharge_until_round: 0,

// Conditional damage tracking
took_damage_this_round: false,
damage_taken_since_last_turn: 0,
last_move_used: null,

// Control effects
is_grappling: null,
grappled_by: null,
cannot_flee: false,
flee_prevented_until_round: 0,

// Stat tracking
stat_modifiers: [],
ac_modifiers: [],
speed_modifiers: []
```

### Phase 3: Extend Battle Engine (lib/battleEngine.js)

1. Add execution functions for each new effect type
2. Integrate into `executeAttack()` and `executeSaveAttack()`
3. Add turn start/end hooks for state management

### Phase 4: Extend Grid Utils (lib/gridUtils.js)

Add AoE calculation functions:
- `getConeTargets(origin, direction, size)`
- `getLineTargets(origin, direction, length, width)`
- `getSphereTargets(center, radius)`
- `getRadiusTargets(origin, radius)`

### Phase 5: Extend Combat Logger (lib/combatLogger.js)

Add log entry types for new effects:
- Multi-hit results
- Conditional damage triggers
- Charge/recharge state changes
- Control effect applications
- AoE target lists

### Phase 6: Update Test Harness (pages/test-combat.js)

Add UI elements to display:
- Multi-hit breakdowns
- Conditional damage indicators
- Charge state visualization
- Control effect status
- AoE targeting overlay

## Key Patterns

### Parser Pattern

```javascript
export function parseNewEffect(description) {
  if (!description) return null;

  // Check for effect keywords
  const match = description.match(/pattern/i);
  if (!match) return null;

  return {
    // Structured effect data
  };
}
```

### Execution Pattern

```javascript
function executeNewEffect(attacker, defender, effect, context) {
  // Validate preconditions
  if (!effect) return null;

  // Apply effect
  const result = {
    // Effect result data
  };

  // Mutate combatant state if needed

  return result;
}
```

### State Tracking Pattern

```javascript
// At turn start
function onTurnStart(combatant, roundNumber) {
  combatant.has_action = true;
  combatant.has_bonus_action = true;
  combatant.took_damage_this_round = false;
  combatant.movement_remaining = calculateSpeed(combatant);

  // Check charge completion
  if (combatant.charging_move?.executesRound === roundNumber) {
    // Execute charged move
  }
}

// At turn end
function onTurnEnd(combatant, roundNumber) {
  // Update damage tracking
  combatant.damage_taken_since_last_turn = combatant.took_damage_this_round
    ? totalDamageTaken
    : 0;

  // Decrement durations
  // Process escape attempts
}
```

## Testing Checklist

### Parser Tests
- [ ] Multi-hit: Arm Thrust, Barrage, Fury Attack
- [ ] Conditional: Assurance, Avalanche, Hex, Venoshock
- [ ] Charge: Solar Beam, Fly, Dig, Bounce
- [ ] Control: Anchor Shot, Wrap, Mean Look
- [ ] AoE: Acid, Earthquake, Aeroblast
- [ ] Auto-hit: Aerial Ace, Aura Sphere, Swift
- [ ] Stats: Ancient Power, Swords Dance, Bulk Up

### Execution Tests
- [ ] Multi-hit produces correct hit counts
- [ ] Conditional damage doubles when condition met
- [ ] Charge moves execute on correct turn
- [ ] Control prevents movement/switching
- [ ] AoE affects correct targets
- [ ] Auto-hit bypasses attack roll

### Integration Tests
- [ ] Multiple effects on single move work together
- [ ] Action economy prevents double actions
- [ ] State resets correctly between turns
- [ ] Logging shows all effect details

## Files Modified

| File | Changes |
|------|---------|
| lib/moveEffectParser.js | Add 7 new parser functions |
| lib/battleEngine.js | Add effect execution, integrate into attack flow |
| lib/combatSimulator.js | Extend combatant state |
| lib/combatUtils.js | Add action economy helpers |
| lib/gridUtils.js | Add AoE calculation functions |
| lib/combatLogger.js | Add new log entry types |
| lib/statusEffects.js | Add grapple/restrain handling |
| pages/test-combat.js | Add effect visualization |
| components/TestCombat/BattleLog.js | Display new effects |

## Common Gotchas

1. **Multi-hit damage scaling**: Each hit uses same dice expression, not cumulative
2. **Conditional damage timing**: "this round" means since current turn started
3. **Charge bypass**: Solar Beam instant in harsh sunlight - check weather
4. **AoE friendly fire**: Some AoE excludes user, some doesn't - check description
5. **Grapple movement**: Grappler can drag grappled target when moving
6. **Recharge blocking**: Recharging Pokemon can still use other moves
7. **Invulnerable targeting**: Some moves (Earthquake) hit Dig, etc.
