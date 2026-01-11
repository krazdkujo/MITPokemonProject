# Data Model: Ambiguous Move Implementation

**Feature**: 029-ambiguous-moves
**Date**: 2026-01-10

## Overview

This document defines the data structures for the 7 categories of ambiguous moves. All fields extend the existing move JSON structure in `Source/moves/moves.json`.

---

## Entity Definitions

### 1. Move (Extended)

The base move entity from feature 028, extended with new optional fields.

```javascript
{
  // Existing fields (unchanged)
  "id": "string",              // Unique move identifier
  "name": "string",            // Display name
  "type": "string",            // Element type (fire, water, etc.)
  "power": ["string"],         // Stat modifiers (str, dex, etc.)
  "time": "string",            // Action time
  "pp": "number",              // Power points
  "duration": "string",        // Effect duration
  "range": "string",           // Attack range
  "description": "string",     // Full description text
  "higherLevels": "string",    // Level scaling description
  "damage": "Damage|null",     // Damage info (from 028)
  "save": "Save|null",         // Save info (from 028)
  "flavor": "string|null",     // Flavor text (from 028)
  "extra_effects": "string|null", // Free-form effects (from 028)
  "scaling": "object|null",    // Level-based dice scaling (from 028)

  // NEW FIELDS (029)
  "recoil": "Recoil|null",           // Recoil damage to user
  "formula": "Formula|null",          // Level-based damage formula
  "turns": "TwoTurnMove|null",        // Multi-turn move structure
  "hit_roll": "HitRoll|null",         // Variable hit count
  "conditional": "Conditional|null",  // HP-based damage scaling
  "ohko": "OHKO|null",                // One-hit KO mechanics
  "stat_override": "StatOverride|null" // Stat substitution
}
```

---

### 2. Recoil

Damage the user takes after a successful attack.

```javascript
{
  "fraction": "string",    // "quarter" | "third" | "half"
  "percentage": "number",  // 25 | 33 | 50
  "type": "string"         // "typeless" (always for recoil)
}
```

**Validation Rules**:
- `fraction` must be one of: "quarter", "third", "half"
- `percentage` must match fraction (25, 33, 50)
- `type` is always "typeless" for standard recoil

**Example**:
```json
{
  "fraction": "quarter",
  "percentage": 25,
  "type": "typeless"
}
```

**Affected Moves** (9):
- double-edge, take-down, submission, wild-charge
- brave-bird, flare-blitz, wave-crash, wood-hammer, head-smash

---

### 3. Formula

Level-based damage calculation formula.

```javascript
{
  "expression": "string",      // e.g., "1d6 + user_level"
  "damage_type": "string",     // Element type for this formula
  "attack_type": "string",     // "melee" | "ranged" | "save"
  "variables": ["string"]      // Variables used: ["user_level", "target_level"]
}
```

**Supported Variables**:
- `user_level` - Attacking Pokemon's level
- `target_level` - Target Pokemon's level
- `weight_diff` - Weight difference (for Heavy Slam)

**Validation Rules**:
- `expression` must be valid dice notation + variable combination
- `variables` must only contain supported variable names

**Example**:
```json
{
  "expression": "1d6 + user_level",
  "damage_type": "fighting",
  "attack_type": "melee",
  "variables": ["user_level"]
}
```

**Affected Moves** (14):
- seismic-toss, night-shade, foul-play
- hail, sandstorm (weather AOE)
- heavy-slam, pay-day, super-fang, endeavor
- fissure, guillotine, horn-drill, sheer-cold, explosion

---

### 4. TwoTurnMove

Structure for moves that span multiple turns.

```javascript
{
  "count": "number",           // Always 2
  "turn1": {
    "action": "string",        // "charge" | "burrow" | "fly" | "dive" | "vanish"
    "invulnerable": "boolean", // Whether user is untargetable
    "vulnerable_to": ["string"], // Moves that can hit (e.g., ["earthquake"])
    "ac_bonus": "number",      // AC change during charge (0 if none)
    "effect": "string|null"    // Additional effect text
  },
  "turn2": {
    "action": "string",        // "attack"
    "damage": "Damage|null"    // Uses move's main damage if null
  },
  "weather_skip": "string|null", // Weather condition that skips turn1
  "interruptable": "boolean"     // Whether interruption cancels move
}
```

**Validation Rules**:
- `count` must be 2
- `turn1.action` must be recognized action type
- `weather_skip` must be valid weather type if present

**Example** (Dig):
```json
{
  "count": 2,
  "turn1": {
    "action": "burrow",
    "invulnerable": true,
    "vulnerable_to": ["earthquake", "magnitude"],
    "ac_bonus": 0,
    "effect": null
  },
  "turn2": {
    "action": "attack",
    "damage": null
  },
  "weather_skip": null,
  "interruptable": true
}
```

**Example** (Solar Beam):
```json
{
  "count": 2,
  "turn1": {
    "action": "charge",
    "invulnerable": false,
    "vulnerable_to": [],
    "ac_bonus": 0,
    "effect": "Gathering sunlight"
  },
  "turn2": {
    "action": "attack",
    "damage": null
  },
  "weather_skip": "sunny",
  "interruptable": true
}
```

**Affected Moves** (19):
- dig, dive, bounce, fly
- solar-beam, sky-attack, razor-wind
- skull-bash, bide, focus-punch
- charge, shadow-force, phantom-force
- (and others)

---

### 5. HitRoll

Variable hit count determination.

```javascript
{
  "dice": "string",         // Dice to roll (e.g., "1d4")
  "min_hits": "number",     // Minimum hits
  "max_hits": "number",     // Maximum hits
  "modifier": "number",     // Added to roll (e.g., +1 for 2-5 range)
  "until_miss": "boolean"   // True if "until miss" mechanic
}
```

**Validation Rules**:
- If `until_miss` is true, `max_hits` should be practical maximum (10)
- `min_hits` must be >= 1
- `max_hits` must be >= `min_hits`

**Example** (Barrage):
```json
{
  "dice": "1d4",
  "min_hits": 1,
  "max_hits": 4,
  "modifier": 0,
  "until_miss": false
}
```

**Affected Moves** (4):
- barrage, fury-attack, fury-swipes, comet-punch
- (Note: Tri Attack uses d4 for status, not hits)

---

### 6. Conditional

HP-based damage scaling.

```javascript
{
  "type": "string",              // "user_hp_scaling" | "target_hp_scaling"
  "thresholds": [
    {
      "hp_percent": "number",    // HP percentage threshold
      "multiplier": "number",    // Damage multiplier when below threshold
      "effect": "string|null"    // Description of effect
    }
  ],
  "inverse": "boolean"           // True if higher HP = more damage (Water Spout)
}
```

**Validation Rules**:
- `thresholds` must be sorted by `hp_percent` descending
- `multiplier` must be positive
- Only one of `thresholds` or `inverse` scaling applies

**Example** (Flail):
```json
{
  "type": "user_hp_scaling",
  "thresholds": [
    { "hp_percent": 10, "multiplier": 3, "effect": "Triple damage at 10% or below" },
    { "hp_percent": 50, "multiplier": 2, "effect": "Double damage below 50%" }
  ],
  "inverse": false
}
```

**Example** (Water Spout):
```json
{
  "type": "user_hp_scaling",
  "thresholds": [],
  "inverse": true
}
```

**Affected Moves** (3):
- flail, reversal, water-spout

---

### 7. OHKO

One-hit knockout mechanics.

```javascript
{
  "success_roll": "number",           // Natural roll needed (typically 20)
  "level_restriction": {
    "operator": "string",             // "gte" | "lte" | "gt" | "lt"
    "compare": "string",              // "user_level" | "target_level"
    "offset": "number"                // Level difference allowed
  },
  "immune_types": ["string"],         // Types immune to this OHKO
  "effect": "string"                  // Description of success effect
}
```

**Validation Rules**:
- `success_roll` is typically 20 (natural 20)
- `level_restriction` defines when move auto-fails

**Example** (Fissure):
```json
{
  "success_roll": 20,
  "level_restriction": {
    "operator": "lte",
    "compare": "target_level",
    "offset": 10
  },
  "immune_types": ["flying"],
  "effect": "Target falls into crack and faints"
}
```

**Affected Moves** (4):
- fissure, guillotine, horn-drill, sheer-cold

---

### 8. StatOverride

Stat substitution for damage calculation.

```javascript
{
  "use": "string",           // Stat to use: "target_level", "target_attack", etc.
  "instead_of": "string",    // Stat being replaced: "user_level", "user_attack"
  "context": "string"        // Where override applies: "damage", "formula"
}
```

**Example** (Foul Play):
```json
{
  "use": "target_level",
  "instead_of": "user_level",
  "context": "formula"
}
```

**Affected Moves** (8):
- foul-play, endeavor, crunch (partial list)

---

## State Tracking (Battle State Extension)

For two-turn moves, the `battle_state` JSONB in `active_battles` table needs to track:

```javascript
{
  // Existing battle state fields...

  "pending_moves": {
    "[combatant_id]": {
      "move_id": "string",
      "turn": "number",          // Current turn (1 or 2)
      "started_round": "number", // Round when move started
      "stored_values": {
        "damage_taken": "number", // For Bide
        "target_id": "string"     // For moves that lock target
      }
    }
  }
}
```

---

## Relationships

```
Move 1--0..1 Recoil
Move 1--0..1 Formula
Move 1--0..1 TwoTurnMove
Move 1--0..1 HitRoll
Move 1--0..1 Conditional
Move 1--0..1 OHKO
Move 1--0..1 StatOverride

BattleState 1--* PendingMove
PendingMove *--1 Move
PendingMove *--1 Combatant
```

---

## Migration Notes

1. New fields are optional - existing moves continue to work
2. Fields are added alongside existing `damage` and `save` fields
3. Combat engine checks for new fields and processes them if present
4. No database schema changes required (all in static JSON)
