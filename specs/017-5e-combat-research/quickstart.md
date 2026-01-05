# Quickstart: Pokemon 5e Combat System Implementation

**Feature**: 017-5e-combat-research
**Date**: 2026-01-04

## Overview

This guide provides the essential information for implementing the Pokemon 5e combat system. It covers the core mechanics, key formulas, and implementation patterns.

## Core Formulas

### Attack Roll
```javascript
attackRoll = d20 + movePowerModifier + proficiencyBonus
```

### Damage Calculation
```javascript
damage = diceRoll + movePowerModifier + stabBonus
finalDamage = damage * typeEffectivenessMultiplier
```

### STAB (Same Type Attack Bonus)
```javascript
stabBonus = pokemonTypes.includes(moveType) ? proficiencyBonus : 0
```

### Saving Throw DC
```javascript
saveDC = 8 + movePowerModifier + proficiencyBonus
```

### Proficiency Bonus by Level
| Level | Prof |
|-------|------|
| 1-4   | +2   |
| 5-8   | +3   |
| 9-12  | +4   |
| 13-16 | +5   |
| 17-20 | +6   |

### Catch DC
```javascript
baseDC = 10 + Math.floor(sr) + pokemonLevel
hpModifier = (hp < 0.1 * maxHp) ? -10 : (hp < 0.5 * maxHp) ? -5 : 0
finalDC = baseDC + hpModifier + pokeballModifier
```

## Grid System

- **1 cell = 5 feet**
- **Grid size**: 10x10 (50x50 feet)
- **Melee range**: Adjacent cell (1 cell / 5 feet)
- **Movement**: speed / 5 = cells per turn

Example conversions:
- 30ft range = 6 cells
- 60ft range = 12 cells
- 25ft speed = 5 cells movement

## Status Effects Quick Reference

### Non-Volatile (one at a time)

| Status | Key Effect | Tick Damage |
|--------|------------|-------------|
| Burned | Damage rolls twice, take lower | Prof bonus/turn |
| Frozen | Incapacitated. STR save DC 10+prof to break | None |
| Paralyzed | d4=1 skip turn, half speed | None |
| Poisoned | Disadvantage on attacks/checks | Prof bonus/turn |
| Badly Poisoned | Same as poisoned | 2x prof bonus/turn |

### Volatile (can stack, end on switch)

| Status | Duration | Effect |
|--------|----------|--------|
| Asleep | 3 rounds | Incapacitated. d20 >= 11 wakes |
| Confused | 3 rounds | d8 determines behavior |
| Flinched | Until next turn | Disadvantage on everything |

### Type Immunities
- Fire: immune to Burned
- Ice: immune to Frozen
- Electric: immune to Paralyzed
- Poison/Steel: immune to Poisoned

## Implementation Order

### Phase 1: Fix Status Effects (Simple)

1. **Burned damage penalty** in `lib/statusEffects.js`
   ```javascript
   // In damage calculation
   if (attacker.status === 'burned') {
     const roll1 = rollDice(damageDice);
     const roll2 = rollDice(damageDice);
     baseDamage = Math.min(roll1, roll2);
   }
   ```

2. **Flinched full effects** in `lib/statusEffects.js`
   ```javascript
   // When flinched, apply to all d20 rolls
   if (combatant.volatileStatuses.includes('flinched')) {
     return { disadvantage: true, targetsGetAdvantage: true };
   }
   ```

3. **Frozen break DC** in `lib/statusEffects.js`
   ```javascript
   // Track applier proficiency when frozen
   const breakDC = 10 + statusMetadata.applier_proficiency;
   ```

4. **Confused d8 behavior** in `lib/statusEffects.js`
   ```javascript
   const roll = rollD8();
   switch(roll) {
     case 1: case 2: case 3: case 4: return 'normal';
     case 5: return 'skip';
     case 6: return 'self-struggle';
     case 7: return 'nearest-struggle';
     case 8: return 'end-confusion';
   }
   ```

5. **Remove Struggle recoil** in `lib/battleEngine.js`
   ```javascript
   // Delete or comment out applyStruggleRecoil()
   ```

### Phase 2: Saving Throw Moves (Medium)

1. Parse save type from move description
2. Calculate save DC
3. Have target roll save
4. Apply full/half damage based on result

```javascript
function executeSaveMove(move, attacker, target) {
  const saveType = parseSaveType(move.description);
  const dc = 8 + getBestPowerModifier(attacker, move) + getProficiencyBonus(attacker.level);
  const saveRoll = rollD20() + getAttributeModifier(target.attributes[saveType.toLowerCase()]);
  const saved = saveRoll >= dc;
  const damage = calculateDamage(move, attacker);
  return saved ? Math.floor(damage / 2) : damage;
}
```

### Phase 3: Weather & Terrain (Medium)

See `lib/weatherSystem.js` and `lib/terrainSystem.js` patterns in research.md.

### Phase 4: Bond System (Medium)

1. Add bond_level to player_pokemon table
2. Implement obedience checks for negative bond
3. Implement Bond Point spending for advantage/disadvantage

### Phase 5: Transformations (Complex)

Each transformation type needs:
- Requirement validation (level, items, bond)
- State change application
- Duration/revert tracking

## Key Files to Modify

| File | Changes |
|------|---------|
| `lib/battleEngine.js` | Save moves, AoO, switching |
| `lib/statusEffects.js` | Fix Burned/Flinched/Frozen/Confused |
| `lib/combatUtils.js` | Grid conversion (feet to cells) |
| `lib/initiativeUtils.js` | Per-combatant initiative |
| `lib/battleState.js` | Weather, terrain, transformations |

## Key Files to Create

| File | Purpose |
|------|---------|
| `lib/weatherSystem.js` | Weather effect handlers |
| `lib/terrainSystem.js` | Terrain effect handlers |
| `lib/bondSystem.js` | Bond level checks, BP usage |
| `lib/catchingMechanics.js` | Catch DC, Pokeball modifiers |
| `lib/abilityEffects.js` | Per-ability combat handlers |
| `lib/transformations.js` | Mega/Z/Dynamax/Tera logic |
| `lib/concentrationTracker.js` | Concentration state management |

## Testing Checklist

- [ ] Burned Pokemon roll damage twice, take lower
- [ ] Flinched Pokemon have disadvantage on all rolls
- [ ] Frozen Pokemon can break free with STR save
- [ ] Confused Pokemon follow d8 behavior table
- [ ] Struggle has no recoil damage
- [ ] Saving throw moves calculate DC correctly
- [ ] Grid positions convert 5ft = 1 cell
- [ ] Weather affects damage advantage/disadvantage
- [ ] Terrain effects apply to grounded Pokemon
- [ ] Bond Points grant advantage when spent
- [ ] Catch DC includes all modifiers
- [ ] Transformations check all requirements

## Source Data References

- Combat rules: `Source/rules/rules.json` (id: combat-*)
- Status effects: `Source/rules/rules.json` (id: status-*)
- Weather: `Source/rules/rules.json` (id: weather-table)
- Terrain: `Source/rules/rules.json` (id: terrain-table)
- Transformations: `Source/rules/rules.json` (id: transform-*)
- Moves: `Source/moves/moves.json`
- Abilities: `Source/abilities/abilities.json`
- Pokeballs: `Source/items/items.json` (type: pokeball)
