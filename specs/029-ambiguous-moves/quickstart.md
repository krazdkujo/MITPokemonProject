# Quickstart: Ambiguous Move Implementation

**Feature**: 029-ambiguous-moves
**Date**: 2026-01-10

## Overview

This guide covers how to work with the 7 categories of ambiguous moves that require special handling beyond standard damage calculation.

---

## Prerequisites

- Node.js 18+
- Project dependencies installed (`npm install`)
- Understanding of existing combat engine (`lib/battleEngine.js`)

---

## Quick Reference

### New Move Fields

| Field | Purpose | Example Moves |
|-------|---------|---------------|
| `recoil` | User takes damage after attacking | Double-Edge, Brave Bird |
| `formula` | Level-based damage calculation | Seismic Toss, Night Shade |
| `turns` | Multi-turn move state | Dig, Solar Beam, Skull Bash |
| `hit_roll` | Variable hit count | Barrage, Fury Attack |
| `conditional` | HP-based damage scaling | Flail, Reversal |
| `ohko` | One-hit KO mechanics | Fissure, Guillotine |
| `stat_override` | Use different stat for calculation | Foul Play |

---

## Common Tasks

### Adding a Recoil Move

1. Open `Source/moves/moves.json`
2. Find the move entry
3. Add `recoil` field:

```json
{
  "id": "double-edge",
  "recoil": {
    "fraction": "quarter",
    "percentage": 25,
    "type": "typeless"
  }
}
```

### Adding a Level-Based Damage Move

1. Add `formula` field instead of standard `damage`:

```json
{
  "id": "seismic-toss",
  "formula": {
    "expression": "1d6 + user_level",
    "damage_type": "fighting",
    "attack_type": "melee",
    "variables": ["user_level"]
  }
}
```

### Adding a Two-Turn Move

1. Add `turns` field with turn-by-turn structure:

```json
{
  "id": "dig",
  "turns": {
    "count": 2,
    "turn1": {
      "action": "burrow",
      "invulnerable": true,
      "vulnerable_to": ["earthquake", "magnitude"],
      "ac_bonus": 0
    },
    "turn2": {
      "action": "attack"
    },
    "weather_skip": null,
    "interruptable": true
  }
}
```

### Adding an OHKO Move

1. Add `ohko` field with success conditions:

```json
{
  "id": "fissure",
  "ohko": {
    "success_roll": 20,
    "level_restriction": {
      "operator": "lte",
      "compare": "target_level",
      "offset": 10
    },
    "immune_types": ["flying"],
    "effect": "Instant KO"
  }
}
```

---

## Testing

### CLI Test Harness

```bash
# Test a specific move
npm run test:combat -- --pokemon1 machamp --pokemon2 pikachu --level1 10 --level2 5

# Test with seed for reproducibility
npm run test:combat -- --pokemon1 geodude --pokemon2 rattata --seed 12345
```

### Web Test Harness

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/test-combat`
3. Select Pokemon that know the target moves
4. Use step-through mode to verify mechanics

### Verifying Specific Categories

**Recoil**:
- Use Double-Edge
- Verify combat log shows both damage dealt and recoil taken
- Verify attacker HP reduced by correct percentage

**Level-Based**:
- Use Seismic Toss with different level Pokemon
- Damage should be `1d6 + user_level`
- Level 10 should deal more than level 5

**Two-Turn**:
- Use Dig
- Turn 1: User should be "burrowed" and invulnerable
- Turn 2: Attack resolves, user becomes targetable

**OHKO**:
- Use Fissure
- Only natural 20 should succeed
- Should auto-fail if target level > user level + 10

---

## Architecture

### File Locations

```
lib/
  battleEngine.js      # Main combat logic - handles new fields
  moveEffectParser.js  # Parses effects from descriptions (backup)
  formulaEvaluator.js  # NEW: Evaluates level-based formulas
  combatLogger.js      # Logs new effect types

scripts/
  extract-move-data.js # Extraction script - adds new fields

Source/moves/
  moves.json           # Move data with new fields
```

### Processing Order

1. **Extraction** (build time): `extract-move-data.js` adds structured fields
2. **Load** (runtime): `pokemonData.js` loads moves with all fields
3. **Execute** (combat): `battleEngine.js` processes fields in order:
   - Check `ohko` for instant-KO mechanics
   - Check `turns` for multi-turn state
   - Calculate damage (standard or `formula`)
   - Apply `conditional` multipliers
   - Check `hit_roll` for multi-hit
   - Apply `recoil` to attacker
   - Log all effects

---

## Troubleshooting

### Move Not Processing Correctly

1. Check if move has the expected field in `moves.json`
2. Run extraction: `node scripts/extract-move-data.js --verbose`
3. Check extraction warnings: `extraction-warnings.json`

### Two-Turn Move Not Tracking State

1. Verify `turns` field structure is correct
2. Check `battle_state.pending_moves` in combat state
3. Ensure interruption handling is correct

### Level Formula Not Evaluating

1. Verify `formula.expression` syntax
2. Check that `variables` array lists all used variables
3. Ensure `formulaEvaluator.js` supports the expression

### OHKO Always Failing

1. Verify `ohko.level_restriction` is correct
2. Check if target has an immune type
3. Verify natural 20 is being rolled (not modified roll)

---

## Related Documentation

- [Specification](./spec.md) - Feature requirements
- [Research](./research.md) - Technical analysis
- [Data Model](./data-model.md) - Field definitions
- [Tasks](./tasks.md) - Implementation tasks (after `/speckit.tasks`)
