# Combat API Contract

**Feature**: 007-combat-engine
**Date**: 2026-01-03

## Overview

The combat engine extends the existing battle API with enhanced combat mechanics. All endpoints follow the established response envelope pattern.

## Base URL

```
/api/battle
```

## Response Envelope

All responses follow this structure:

```json
{
  "success": boolean,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

---

## Endpoints

### POST /api/battle

Execute a battle turn with combat calculations.

#### Request Body

```json
{
  "player_pokemon_id": "uuid",
  "move_id": "tackle",
  "power_stat_choice": "str",
  "battle_state": {
    "battle_id": "uuid",
    "opponent": {
      "pokemon_id": "rattata",
      "level": 3,
      "current_hp": 12,
      "max_hp": 15,
      "move_pp": {
        "tackle": 35,
        "tail-whip": 30
      },
      "status_effects": []
    },
    "round_number": 1,
    "initiative_order": ["player", "opponent"]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| player_pokemon_id | UUID | Yes | Player's Pokemon record ID |
| move_id | string | Yes | Move to use (or "struggle") |
| power_stat_choice | string | No | Which power stat to use if move has multiple options |
| battle_state | object | No | Current battle state for multi-turn battles |

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "turn": {
      "round_number": 1,
      "player_action": {
        "pokemon_name": "Bulbasaur",
        "move_id": "tackle",
        "move_name": "Tackle",
        "attack_roll": {
          "natural_roll": 15,
          "modifier": 4,
          "total": 19,
          "crit_threshold": 20
        },
        "target_ac": 12,
        "hit": true,
        "damage": {
          "dice_expression": "1d6",
          "dice_rolls": [4],
          "base_dice_total": 4,
          "power_modifier": 2,
          "stab_bonus": 0,
          "type_multiplier": 1.0,
          "type_effectiveness": "normal",
          "is_critical": false,
          "final_damage": 6
        },
        "status_applied": null,
        "pp_consumed": 1,
        "target_hp_before": 15,
        "target_hp_after": 9,
        "target_fainted": false
      },
      "opponent_action": {
        "pokemon_name": "Rattata",
        "move_id": "tackle",
        "move_name": "Tackle",
        "attack_roll": {
          "natural_roll": 8,
          "modifier": 3,
          "total": 11,
          "crit_threshold": 20
        },
        "target_ac": 13,
        "hit": false,
        "damage": null,
        "status_applied": null,
        "pp_consumed": 1,
        "target_hp_before": 17,
        "target_hp_after": 17,
        "target_fainted": false
      },
      "end_of_turn": {
        "status_damage": [],
        "status_changes": []
      }
    },
    "battle_state": {
      "battle_id": "uuid",
      "round_number": 1,
      "outcome": "ongoing",
      "player_pokemon": {
        "current_hp": 17,
        "max_hp": 22,
        "move_pp": {
          "tackle": 34,
          "growl": 40
        },
        "status_effects": []
      },
      "opponent": {
        "pokemon_id": "rattata",
        "current_hp": 9,
        "max_hp": 15,
        "move_pp": {
          "tackle": 34,
          "tail-whip": 30
        },
        "status_effects": []
      },
      "initiative_order": ["player", "opponent"]
    },
    "outcome": "ongoing",
    "battle_continues": true
  }
}
```

#### Response (Victory)

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "turn": { ... },
    "battle_state": { ... },
    "outcome": "victory",
    "battle_continues": false,
    "rewards": {
      "xp_awarded": 300,
      "currency_awarded": 300,
      "xp_distributed_to": ["uuid-of-player-pokemon"]
    }
  }
}
```

#### Response (Defeat)

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "turn": { ... },
    "battle_state": { ... },
    "outcome": "defeat",
    "battle_continues": false,
    "player_pokemon_fainted": true
  }
}
```

---

### POST /api/battle/start

Initialize a new battle with initiative rolls.

#### Request Body

```json
{
  "player_pokemon_id": "uuid",
  "opponent_pokemon_id": "rattata",
  "opponent_level": 3,
  "battle_type": "wild"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| player_pokemon_id | UUID | Yes | Player's Pokemon record ID |
| opponent_pokemon_id | string | Yes | Opponent Pokemon ID from Source |
| opponent_level | number | Yes | Opponent level (1-20) |
| battle_type | string | No | 'wild', 'gym', 'pvp', 'trainer' (default: 'wild') |

#### Response

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "battle_type": "wild",
    "player_pokemon": {
      "id": "uuid",
      "pokemon_id": "bulbasaur",
      "name": "Bulbasaur",
      "level": 5,
      "current_hp": 22,
      "max_hp": 22,
      "ac": 13,
      "type": ["grass", "poison"],
      "attributes": { "str": 13, "dex": 12, "con": 12, "int": 6, "wis": 10, "cha": 10 },
      "known_moves": ["tackle", "growl", "vine-whip"],
      "move_pp": { "tackle": 35, "growl": 40, "vine-whip": 15 },
      "abilities": ["overgrow"],
      "initiative": { "natural_roll": 12, "modifier": 1, "total": 13 }
    },
    "opponent": {
      "pokemon_id": "rattata",
      "name": "Rattata",
      "level": 3,
      "current_hp": 12,
      "max_hp": 12,
      "ac": 12,
      "type": ["normal"],
      "attributes": { "str": 10, "dex": 14, "con": 10, "int": 8, "wis": 10, "cha": 8 },
      "known_moves": ["tackle", "tail-whip"],
      "move_pp": { "tackle": 35, "tail-whip": 30 },
      "abilities": ["run-away"],
      "initiative": { "natural_roll": 8, "modifier": 2, "total": 10 }
    },
    "initiative_order": ["player", "opponent"],
    "first_to_act": "player",
    "round_number": 1
  }
}
```

---

### POST /api/battle/catch

Attempt to catch a wild Pokemon (awards reduced XP).

#### Request Body

```json
{
  "battle_id": "uuid",
  "pokeball_type": "pokeball",
  "battle_state": { ... }
}
```

#### Response (Catch Success)

```json
{
  "success": true,
  "data": {
    "caught": true,
    "battle_id": "uuid",
    "outcome": "caught",
    "pokemon_caught": {
      "pokemon_id": "rattata",
      "level": 3
    },
    "rewards": {
      "xp_awarded": 60,
      "xp_is_catch_bonus": true
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MOVE_NOT_FOUND | 400 | Invalid move_id |
| NO_PP_REMAINING | 400 | Selected move has 0 PP |
| INVALID_POWER_STAT | 400 | power_stat_choice not valid for move |
| POKEMON_FAINTED | 400 | Attempted action with fainted Pokemon |
| INVALID_BATTLE_STATE | 400 | Malformed battle_state object |
| UNAUTHORIZED | 401 | Missing or invalid JWT |
| POKEMON_NOT_OWNED | 403 | Player does not own this Pokemon |
| BATTLE_ALREADY_ENDED | 409 | Battle outcome is not 'ongoing' |

---

## Status Effect Representation

Status effects in responses include:

```json
{
  "status_effects": [
    {
      "type": "BURNED",
      "is_volatile": false,
      "remaining_rounds": null,
      "applied_at_round": 2,
      "tick_damage_per_turn": 2
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| type | ASLEEP, BURNED, FROZEN, PARALYZED, POISONED, BADLY_POISONED, CONFUSED, FLINCHED |
| is_volatile | True for conditions that clear on switch/combat end |
| remaining_rounds | Countdown for volatile conditions, null for non-volatile |
| applied_at_round | When the status was applied |
| tick_damage_per_turn | End-of-turn damage amount (for Burn/Poison) |

---

## Initiative Details

Initiative is rolled once at battle start. The response includes:

```json
{
  "initiative": {
    "natural_roll": 15,
    "modifier": 2,
    "total": 17
  }
}
```

Turn order is determined by sorting combatants by `initiative.total` descending. Ties are broken by higher DEX score.
