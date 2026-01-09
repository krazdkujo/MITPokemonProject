# Data Model: Move Data Extraction

**Feature**: 028-move-data-extraction
**Date**: 2026-01-08

## Overview

This document defines the schema for new fields added to move objects in `Source/moves/moves.json`.

## Existing Move Schema

Current fields (preserved unchanged):

```javascript
{
  "id": "tri-attack",           // string - unique identifier
  "name": "Tri Attack",         // string - display name
  "type": "normal",             // string - damage type
  "power": ["str", "dex"],      // string[] - attributes for MOVE modifier
  "time": "1 action",           // string - action economy
  "pp": 5,                      // number - power points
  "duration": "instantaneous",  // string - effect duration
  "range": "self (30ft cone)",  // string - range specification
  "description": "...",         // string - full description (PRESERVED)
  "higherLevels": "..."         // string - level scaling text (PRESERVED)
}
```

## New Fields

### damage (object | null)

Extracted damage information. Null for non-damaging moves.

```javascript
{
  "dice": "2d6",           // string - base dice expression
  "modifier": "MOVE",      // string | null - "MOVE" if + MOVE in description
  "damage_type": "normal", // string - type of damage dealt
  "attack_type": "save"    // string - "melee" | "ranged" | "save" | "auto"
}
```

**Examples**:

```javascript
// Absorb (melee attack, drain)
"damage": {
  "dice": "1d4",
  "modifier": "MOVE",
  "damage_type": "grass",
  "attack_type": "melee"
}

// Acid (save for half)
"damage": {
  "dice": "1d6",
  "modifier": "MOVE",
  "damage_type": "poison",
  "attack_type": "save"
}

// Aerial Ace (auto-hit)
"damage": {
  "dice": "1d6",
  "modifier": "MOVE",
  "damage_type": "flying",
  "attack_type": "auto"
}

// Agility (no damage)
"damage": null
```

### save (object | null)

Saving throw requirements. Null for moves without saves.

```javascript
{
  "type": "DEX",           // string - "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"
  "dc": "Move DC",         // string - always "Move DC" currently
  "on_fail": "full",       // string - "full" (damage) or effect description
  "on_success": "half"     // string | null - "half", "none", or null
}
```

**Examples**:

```javascript
// Acid (damage save)
"save": {
  "type": "DEX",
  "dc": "Move DC",
  "on_fail": "full",
  "on_success": "half"
}

// Acid Armor (reactive save for damage)
"save": {
  "type": "CON",
  "dc": "Move DC",
  "on_fail": "1d6 poison damage",
  "on_success": "none"
}

// Tackle (no save)
"save": null
```

### flavor (string | null)

Thematic/narrative text without mechanical notation.

```javascript
"flavor": "You strike with a simultaneous three-beam attack."
```

**Extraction Rules**:
- First sentence(s) before mechanical keywords
- Must not contain dice notation (XdY)
- Must not contain "damage", "save", "attack roll"
- Null if no flavor text present

### extra_effects (string | null)

Complex effects that don't fit structured patterns. Free-form text preserving the original wording.

```javascript
"extra_effects": "Targets that fail the save by 5 or more must roll a d4, gaining the status condition as follows: 1. The target becomes burned. 2. The target becomes frozen. 3. The target becomes paralyzed. 4. Must reroll until any number other than 4 appears."
```

**Captured Effects**:
- Status triggers with conditions
- Multi-hit mechanics
- Conditional damage (double if X)
- Stat/AC modifications
- Movement effects
- Special mechanics

### scaling (object | null)

Level-based damage scaling. Null if no higherLevels field.

```javascript
{
  "5": "2d4",
  "10": "1d12",
  "17": "4d4"
}
```

**Derived from**: Parsing `higherLevels` field.

## Complete Example

**Before** (current):
```json
{
  "id": "tri-attack",
  "name": "Tri Attack",
  "type": "normal",
  "power": ["str", "dex"],
  "time": "1 action",
  "pp": 5,
  "duration": "instantaneous",
  "range": "self (30ft cone)",
  "description": "You strike with a simultaneous three-beam attack. Each creature in a 30 foot cone, centered on you, must make a DEX save against your Move DC, taking 2d6 + MOVE normal damage on a fail, and half as much on a success. Targets that fail the save by 5 or more must roll a d4, gaining the status condition as follows: 1. The target becomes burned. 2. The target becomes frozen. 3. The target becomes paralyzed. 4. Must reroll until any number other than 4 appears.",
  "higherLevels": "The damage dice roll for this move changes to 2d8 at level 5, 4d6 at level 10, and 6d6 at level 17."
}
```

**After** (with new fields):
```json
{
  "id": "tri-attack",
  "name": "Tri Attack",
  "type": "normal",
  "power": ["str", "dex"],
  "time": "1 action",
  "pp": 5,
  "duration": "instantaneous",
  "range": "self (30ft cone)",
  "description": "You strike with a simultaneous three-beam attack. Each creature in a 30 foot cone, centered on you, must make a DEX save against your Move DC, taking 2d6 + MOVE normal damage on a fail, and half as much on a success. Targets that fail the save by 5 or more must roll a d4, gaining the status condition as follows: 1. The target becomes burned. 2. The target becomes frozen. 3. The target becomes paralyzed. 4. Must reroll until any number other than 4 appears.",
  "higherLevels": "The damage dice roll for this move changes to 2d8 at level 5, 4d6 at level 10, and 6d6 at level 17.",
  "damage": {
    "dice": "2d6",
    "modifier": "MOVE",
    "damage_type": "normal",
    "attack_type": "save"
  },
  "save": {
    "type": "DEX",
    "dc": "Move DC",
    "on_fail": "full",
    "on_success": "half"
  },
  "flavor": "You strike with a simultaneous three-beam attack.",
  "extra_effects": "Targets that fail the save by 5 or more must roll a d4, gaining the status condition as follows: 1. The target becomes burned. 2. The target becomes frozen. 3. The target becomes paralyzed. 4. Must reroll until any number other than 4 appears.",
  "scaling": {
    "5": "2d8",
    "10": "4d6",
    "17": "6d6"
  }
}
```

## Validation Rules

1. **damage.dice**: Must match pattern `/^\d+d\d+$/`
2. **damage.damage_type**: Must be valid Pokemon type
3. **damage.attack_type**: Must be one of: `melee`, `ranged`, `save`, `auto`
4. **save.type**: Must be one of: `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`
5. **scaling keys**: Must be numeric strings representing levels
6. **Original fields**: `description` and `higherLevels` must remain unchanged

## Backward Compatibility

- All existing fields preserved
- New fields are additive
- Combat engine can check for new fields with fallback:

```javascript
// Current (parsing at runtime)
const dice = parseDamageDice(move.description, move.higherLevels, level);

// After (structured data with fallback)
const dice = move.damage?.dice
  ? getScaledDice(move.damage.dice, move.scaling, level)
  : parseDamageDice(move.description, move.higherLevels, level);
```
