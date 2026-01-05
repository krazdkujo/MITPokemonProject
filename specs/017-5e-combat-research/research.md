# Research Findings: Pokemon 5e Combat System

**Feature**: 017-5e-combat-research
**Date**: 2026-01-04
**Status**: Complete

## 1. Move Saving Throw Patterns

### Decision
Moves indicate saves through their description text. The pattern is: "must make a [STAT] save" or "[STAT] saving throw".

### Rationale
Examining Source/moves/moves.json reveals:
- `acid`: "must make on a DEX save"
- `acid-spray`: "must make a CON save"
- `aeroblast`: "must make a DEX save"
- `anchor-shot`: "may make a STR saving throw"

The `power` field determines the save DC calculation (DC = 8 + power mod + prof).

### Implementation Pattern
```javascript
// Parse move description for save type
function getMoveRequiresSave(move) {
  const savePattern = /must make (?:a |an |on a )?(\w+) sav(?:e|ing throw)/i;
  const match = move.description.match(savePattern);
  return match ? match[1].toUpperCase() : null;
}
```

### Alternatives Considered
- Adding explicit `saveType` field to moves.json: Rejected - requires Source file modification
- Pattern matching: Chosen - works with existing data

---

## 2. Ability Effect Patterns

### Decision
Ability effects are described in natural language in `description` field. Implementation requires per-ability handlers.

### Rationale
From Source/abilities/abilities.json:
- `adaptability`: "may roll the damage twice and choose either total"
- `aftermath`: "deals damage to an attacker equal to half of the damage received when knocked out"
- `battle-armor`: "immune to extra damage dealt by a Critical Hit"
- `anger-point`: "doubles the damage dice for a single move"

No structured effect fields exist - all effects are in prose.

### Implementation Pattern
Create an ability registry mapping ability IDs to effect handlers:
```javascript
const ABILITY_HANDLERS = {
  'adaptability': { trigger: 'onStabDamage', effect: 'rollTwiceChoose' },
  'aftermath': { trigger: 'onFaint', effect: 'damageAttacker' },
  'battle-armor': { trigger: 'onCriticalHit', effect: 'ignoreCritDamage' },
  // ... ~100 abilities
};
```

### Alternatives Considered
- AI parsing of descriptions: Rejected - inconsistent, requires runtime LLM
- Manual mapping: Chosen - deterministic, testable

---

## 3. Weather Effects

### Decision
Implement 6 weather types with effects from Source/rules/rules.json.

### Complete Weather Rules

| Weather | Effects |
|---------|---------|
| Harsh Sunlight | Advantage on damage rolls for Fire moves. Disadvantage on damage rolls for Water moves. |
| Rain | Advantage on damage rolls for Water moves. Disadvantage on damage rolls for Fire moves. |
| Sandstorm | Lightly obscured. Rock-type +1 AC. Pokemon-triggered may deal damage over time. |
| Hail | Pokemon-triggered may deal damage over time. |
| Snow | Ice-type +1 AC. Pokemon-triggered AC bonus may be higher. |
| Fog | Heavily obscured. |

### Implementation Pattern
```javascript
const WEATHER_EFFECTS = {
  'harsh-sunlight': {
    damageAdvantage: ['fire'],
    damageDisadvantage: ['water']
  },
  'rain': {
    damageAdvantage: ['water'],
    damageDisadvantage: ['fire']
  },
  'sandstorm': {
    visibility: 'lightly-obscured',
    acBonus: { types: ['rock'], value: 1 }
  },
  // ...
};
```

---

## 4. Terrain Effects

### Decision
Implement 4 terrain types with effects from Source/rules/rules.json.

### Complete Terrain Rules

| Terrain | Effects |
|---------|---------|
| Electric | Double MOVE modifier on Electric damage. Grounded creatures cannot be asleep. |
| Grassy | Double MOVE modifier on Grass damage. Grounded heal prof bonus HP at end of turn. |
| Misty | Dragon resistance (or normal if vulnerable). Grounded cannot suffer new status. |
| Psychic | Double MOVE modifier on Psychic damage. Grounded cannot use bonus actions. |

### Implementation Pattern
```javascript
const TERRAIN_EFFECTS = {
  'electric': {
    doubleMoveModifier: ['electric'],
    preventStatus: ['asleep'],
    affectsGrounded: true
  },
  'grassy': {
    doubleMoveModifier: ['grass'],
    endOfTurnHeal: 'proficiency',
    affectsGrounded: true
  },
  // ...
};
```

---

## 5. Transformation Rules

### Decision
Implement 4 transformation types with full rules from Source/rules/rules.json.

### Mega Evolution
**Requirements:**
- Pokemon is capable of Mega Evolution (has Mega stat block)
- Level 10+
- Holding corresponding Mega Stone
- Trainer has Key Stone
- Bond Level +2 or higher

**Effects:**
- Use Mega stat block for stats, abilities, typing
- Lasts until combat ends / 1 minute outside / faints / trainer loses Key Stone

### Z-Move
**Requirements:**
- Level 6+
- Holding Z-Crystal matching move type
- Trainer has Z-Ring

**Effects:**
- Cannot miss
- Save DC +5
- Double dice and MOVE bonus for damage/healing
- Stackable effects get 2 extra stacks

### Dynamax
**Requirements:**
- Level 10+
- Enough space for Gargantuan creature
- Trainer has Dynamax Band

**Effects:**
- Gain temporary HP = current HP
- Size becomes Gargantuan
- Immune to non-volatile status (flinch, confusion, prone)
- Cannot be switched out
- Damage rolls rolled twice, choose either

### Terastallization
**Requirements:**
- Level 6+
- Trainer has Tera Orb

**Effects:**
- Type changes to Tera Type
- Retains STAB of original typing
- If Tera Type matches original, STAB doubles
- Cannot have type changed by other effects
- Becomes vulnerable to Stellar damage

---

## 6. Bond System

### Decision
Implement Bond levels -3 to +3 with Bond Points system.

### Bond Level Effects

| Level | Effect |
|-------|--------|
| +3 | 3 Bond Points. Incredible bond. |
| +2 | 2 Bond Points. Great trust. |
| +1 | 1 Bond Point. Content, fond of trainer. |
| 0 | Neutral. Responds to commands. |
| -1 | Upset. Small grudge affects battle. |
| -2 | On d20 roll 10 or lower, follows command with disadvantage. |
| -3 | On d20 roll 10 or lower, disobeys (does nothing or acts on own). |

### Bond Points Usage
- **Advantage**: Spend 1 BP for advantage on d20 roll
- **Disadvantage**: Spend 1 BP to impose disadvantage on attack against you
- Regained at end of long rest

### Implementation Pattern
```javascript
const BOND_EFFECTS = {
  3: { bondPoints: 3 },
  2: { bondPoints: 2 },
  1: { bondPoints: 1 },
  0: { bondPoints: 0 },
  '-1': { battlePenalty: 'small-grudge' },
  '-2': { obedienceCheck: { dc: 10, onFail: 'disadvantage' } },
  '-3': { obedienceCheck: { dc: 10, onFail: 'disobey' } }
};
```

---

## 7. Catching Mechanics

### Decision
Implement catch DC formula with all Pokeball modifiers.

### Catch DC Formula
```
Base DC = 10 + SR (rounded down) + Pokemon Level
```

### DC Modifiers
- Below 50% HP: -5 DC
- Below 10% HP: -5 DC (additional)
- Status (poisoned, restrained, asleep, burned, confused, paralyzed, frozen): Advantage on roll

### Pokeball Modifiers (from Source/items/items.json)

| Pokeball | Effect |
|----------|--------|
| Poke Ball | No modifier |
| Great Ball | -5 DC |
| Ultra Ball | -10 DC |
| Master Ball | Automatic success |
| Safari Ball | -Nature skill modifier |
| Fast Ball | Reaction throw |
| Level Ball | -5 DC if trainer level > Pokemon level |
| Lure Ball | -10 DC while fishing |
| Heavy Ball | -10 DC if target size Medium+ |
| Love Ball | -2x active Pokemon's CHA modifier |
| Friend Ball | -Persuasion modifier |
| Moon Ball | -10 DC vs Moon Stone evolvers |
| Sport Ball | -Athletics modifier |
| Net Ball | -10 DC vs Water/Bug types |
| Dive Ball | -10 DC underwater |
| Nest Ball | -5 DC if target level 5 or lower |
| Repeat Ball | -10 DC vs caught species |
| Timer Ball | -1 DC per turn concentrating (max -10) |
| Dusk Ball | -10 DC at night/darkness |
| Quick Ball | -8 DC on first round |
| Dream Ball | -5 DC vs sleeping Pokemon |

### Implementation Pattern
```javascript
function calculateCatchDC(pokemon, pokeball, context) {
  let dc = 10 + Math.floor(pokemon.sr) + pokemon.level;

  // HP modifiers
  const hpPercent = pokemon.currentHp / pokemon.maxHp;
  if (hpPercent < 0.5) dc -= 5;
  if (hpPercent < 0.1) dc -= 5;

  // Pokeball modifier
  dc += getPokeballModifier(pokeball, pokemon, context);

  return dc;
}
```

---

## 8. Concentration Mechanics

### Decision
Moves with "concentration" in duration field require concentration tracking.

### Rationale
From Source/moves/moves.json:
- `acid-armor`: "duration": "1 minute, concentration"
- `agility`: "duration": "1 minute, concentration"
- `aqua-ring`: "duration": "1 minute, concentration"

### Concentration Rules (from D&D 5e)
- Only one concentration effect at a time
- Ends when: starting new concentration, taking damage (CON save DC 10 or half damage), incapacitated, voluntary end
- CON save to maintain on damage

### Implementation Pattern
```javascript
function requiresConcentration(move) {
  return move.duration && move.duration.toLowerCase().includes('concentration');
}

function checkConcentration(pokemon, damage) {
  const dc = Math.max(10, Math.floor(damage / 2));
  const conMod = getAttributeModifier(pokemon.attributes.con);
  const roll = rollD20() + conMod;
  return roll >= dc;
}
```

---

## 9. PP Restoration Rules

### Decision
Implement short rest (no PP) and long rest (full PP) restoration.

### Rules (from Source/rules/rules.json)
- **Long Rest**: "eight hours and refresh all Pokemon health, statuses, and PP"
- **Short Rest**: "PP is not recovered on short rests"
- **Items**: Ether and similar items restore PP (from Source/items/items.json)

### Implementation Pattern
```javascript
function longRest(pokemon) {
  // Full HP
  pokemon.currentHp = pokemon.maxHp;
  // Clear statuses
  pokemon.status = null;
  pokemon.volatileStatus = [];
  // Full PP
  pokemon.moves.forEach(move => {
    move.currentPp = move.maxPp;
  });
  // Restore Bond Points
  pokemon.bondPoints = Math.max(0, pokemon.bondLevel);
}

function shortRest(pokemon, hitDiceUsed) {
  // Only HP via hit dice, no PP restore
  const healing = rollHitDice(pokemon, hitDiceUsed);
  pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + healing);
}
```

---

## 10. Status Effect Clarifications

### Confused Behavior (d8 Roll)
From Source/rules/rules.json:
- 1-4: Creature chooses its behavior (normal)
- 5: Doesn't move or take actions
- 6: Takes Struggle action against itself, automatically hits
- 7: Takes Struggle action against nearest Pokemon target
- 8: Condition ends

### Flinched Effects
From Source/rules/rules.json:
- Disadvantage on all attack rolls, ability checks, and saving throws until end of next turn
- If creature uses action requiring saving throw, targets have advantage

### Burned Damage Penalty
From Source/rules/rules.json:
- Rolls all damage rolls twice, takes lower result

### Frozen Break DC
From Source/rules/rules.json:
- STR save DC = 10 + proficiency of creature that caused the condition

---

## Summary of Key Decisions

| Area | Decision | Source Reference |
|------|----------|------------------|
| Save Moves | Parse from description | moves.json description field |
| Abilities | Manual handler registry | abilities.json (100+ abilities) |
| Weather | 6 types with type-based modifiers | rules.json "weather-table" |
| Terrain | 4 types affecting grounded creatures | rules.json "terrain-table" |
| Transformations | 4 types with level + item requirements | rules.json "transform-*" |
| Bond | -3 to +3 with Bond Points | rules.json "bonds-*" |
| Catching | DC = 10 + SR + Level, 23 Pokeball types | rules.json + items.json |
| Concentration | Parse from duration field | moves.json duration field |
| PP Restore | Long rest = full, Short rest = none | rules.json "fainting-resting" |
| Status Effects | Verified all 8 effects | rules.json "status-*" |
