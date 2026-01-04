# Quickstart: Combat Engine

**Feature**: 007-combat-engine
**Date**: 2026-01-03

## Overview

This guide covers how to use the enhanced combat engine for Pokemon 5e battles. The combat engine handles damage calculation, status effects, initiative, PP tracking, and experience awards.

## Prerequisites

1. Player must have at least one Pokemon (via starter selection or catching)
2. Valid JWT authentication token
3. Opponent Pokemon data (from Source or generated)

## Basic Battle Flow

### 1. Start a Battle

```bash
POST /api/battle/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "player_pokemon_id": "your-pokemon-uuid",
  "opponent_pokemon_id": "rattata",
  "opponent_level": 3,
  "battle_type": "wild"
}
```

Response includes:
- Initiative rolls for both Pokemon
- Who acts first
- Full stat blocks for both combatants
- Initial PP for all moves

### 2. Execute Turns

```bash
POST /api/battle
Authorization: Bearer <token>
Content-Type: application/json

{
  "player_pokemon_id": "your-pokemon-uuid",
  "move_id": "tackle",
  "battle_state": { /* from previous response */ }
}
```

Each turn processes:
1. Player action (attack roll, damage, status effects)
2. Check for opponent faint
3. Opponent action (if still conscious)
4. Check for player faint
5. End-of-turn effects (status damage)

### 3. Handle Battle End

When `outcome` is `"victory"` or `"defeat"`:
- `battle_continues: false`
- `rewards` object contains XP and currency (on victory)
- Player Pokemon HP is updated in database

## Damage Calculation Example

For a level 5 Charmander using Ember (fire-type) against Bulbasaur (grass/poison):

```
Attack Roll: d20 + DEX mod + proficiency = d20 + 1 + 3 = d20+4
Damage: 1d4 + DEX mod + STAB = 1d4 + 1 + 3 = 1d4+4
Type: Fire vs Grass = 2x multiplier
Final: (dice + 4) * 2
```

The API response breaks this down:
```json
{
  "damage": {
    "dice_expression": "1d4",
    "dice_rolls": [3],
    "base_dice_total": 3,
    "power_modifier": 1,
    "stab_bonus": 3,
    "type_multiplier": 2.0,
    "type_effectiveness": "super_effective",
    "is_critical": false,
    "final_damage": 14
  }
}
```

## Status Effects

Status effects are applied automatically based on move descriptions:

| Status | Trigger Example | Effect |
|--------|-----------------|--------|
| Burn | "natural roll 19+, burned" | Half damage rolls, prof damage/turn |
| Paralysis | "save by 5+, paralyzed" | d4 at turn start, 1 = skip turn |
| Poison | "becomes poisoned" | Disadvantage, prof damage/turn |
| Sleep | "falling asleep" | Incapacitated, d20 > 10 to wake |
| Confusion | "becomes confused" | d8 behavior table |
| Flinch | "15+, flinches" | Disadvantage until next turn |

The API tracks:
- Which status is applied
- Whether it's volatile (clears on switch)
- Remaining duration
- End-of-turn damage

## PP Tracking

Every move consumes 1 PP per use:

```json
{
  "move_pp": {
    "tackle": 34,
    "growl": 40,
    "vine-whip": 14
  }
}
```

When all moves reach 0 PP, use `"move_id": "struggle"`:
- Struggle always hits
- Deals 1d4 recoil damage to user
- No PP cost

## Experience Calculation

On victory:
```
XP = 200 x opponent_level x opponent_SR
```

On catch:
```
XP = (200 x opponent_level x opponent_SR) / 5
```

Example: Defeating a level 5, SR 0.5 Rattata awards `200 * 5 * 0.5 = 500 XP`.

## Critical Hits

Default: Natural 20 on attack roll.

Some moves have extended crit ranges:
- Air Cutter: 19-20
- Cross Chop: 19-20
- Blaze Kick: 19-20

Critical hits double all damage dice (not modifiers).

## Initiative

At battle start:
```
Initiative = d20 + DEX modifier
```

Higher total acts first. Ties broken by DEX score.

The `initiative_order` array in `battle_state` determines turn order.

## Error Handling

Common errors:

| Error | Cause | Solution |
|-------|-------|----------|
| NO_PP_REMAINING | Move has 0 PP | Use different move or Struggle |
| POKEMON_FAINTED | Your Pokemon at 0 HP | Battle ended in defeat |
| INVALID_POWER_STAT | Wrong stat for move | Check move's `power` field |

## Testing Tips

1. Use a Fire-type move against Grass-type to verify 2x multiplier
2. Test status immunity (Fire vs Burn, Electric vs Paralysis)
3. Verify STAB adds proficiency bonus
4. Check critical hit doubles dice only
5. Exhaust PP to trigger Struggle availability
