# API Contract: Battle Start (Extended for Grid)

**Endpoint**: `POST /api/battle/start`
**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04

## Overview

Extended contract for the existing `/api/battle/start` endpoint to support grid-based combat. The endpoint initializes battle state including grid setup for the Combat Arena page.

---

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <jwt_token>` |
| Content-Type | Yes | `application/json` |

### Body

```json
{
  "player_pokemon_ids": ["uuid-1", "uuid-2"],
  "opponent_pokemon_id": "rattata",
  "opponent_level": 5,
  "battle_type": "wild",
  "grid_mode": true
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| player_pokemon_ids | string[] | Yes | Array of player_pokemon UUIDs (1-6) |
| opponent_pokemon_id | string | Yes | Pokemon ID from Source data |
| opponent_level | number | Yes | Opponent level (1-20) |
| battle_type | string | No | 'wild', 'trainer', 'gym', 'pvp' (default: 'wild') |
| grid_mode | boolean | No | Enable grid-based combat (default: false) |

**Note**: For backward compatibility, single `player_pokemon_id` string is also accepted and converted to array.

---

## Response

### Success Response (200) - Grid Mode

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid-string",
    "battle_type": "wild",
    "phase": "setup",
    "grid_mode": true,
    "grid": {
      "width": 10,
      "height": 10,
      "deployment_zone": {
        "player": { "rows": [0, 1] },
        "opponent": { "rows": [8, 9] }
      },
      "trainers": {
        "player": { "col": 0, "row": 4, "notation": "A5" },
        "opponent": { "col": 9, "row": 4, "notation": "J5" }
      }
    },
    "player_pokemon": [
      {
        "combatant_id": "uuid",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "level": 5,
        "current_hp": 22,
        "max_hp": 22,
        "ac": 12,
        "type": ["Grass", "Poison"],
        "attributes": {
          "str": 10, "dex": 12, "con": 14,
          "int": 10, "wis": 10, "cha": 10
        },
        "known_moves": ["tackle", "growl", "vine-whip"],
        "move_pp": {
          "tackle": 35,
          "growl": 40,
          "vine-whip": 25
        },
        "abilities": ["overgrow"],
        "initiative": 14,
        "position": null,
        "placed": false
      }
    ],
    "opponent_pokemon": [
      {
        "combatant_id": "uuid",
        "pokemon_id": "rattata",
        "name": "Rattata",
        "level": 5,
        "current_hp": 18,
        "max_hp": 18,
        "ac": 13,
        "type": ["Normal"],
        "attributes": {
          "str": 8, "dex": 16, "con": 10,
          "int": 8, "wis": 10, "cha": 8
        },
        "known_moves": ["tackle", "tail-whip", "quick-attack"],
        "move_pp": {
          "tackle": 35,
          "tail-whip": 30,
          "quick-attack": 30
        },
        "abilities": ["run-away"],
        "initiative": 17,
        "position": { "col": 5, "row": 9, "notation": "F10" },
        "placed": true
      }
    ],
    "initiative_order": ["opponent-uuid", "player-uuid"],
    "first_to_act": "opponent",
    "round_number": 0,
    "awaiting_placement": true
  }
}
```

### Success Response (200) - Legacy Mode (grid_mode: false)

Existing response format preserved for backward compatibility:

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "battle_type": "wild",
    "player_pokemon": {/* single combatant */},
    "opponent": {/* single combatant */},
    "initiative_order": [/* ... */],
    "first_to_act": "player",
    "round_number": 1
  }
}
```

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field",
    "details": {
      "player_pokemon_ids": "At least one player Pokemon is required"
    }
  }
}
```

### 400 Bad Request - Too Many Pokemon

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Too many Pokemon selected",
    "details": {
      "player_pokemon_ids": "Maximum 6 Pokemon allowed in battle party"
    }
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not own one or more of these Pokemon"
  }
}
```

### 422 Unprocessable - All Pokemon Fainted

```json
{
  "success": false,
  "error": {
    "code": "ALL_POKEMON_FAINTED",
    "message": "All selected Pokemon have fainted",
    "details": {
      "hint": "Heal your Pokemon at a Pokemon Center first"
    }
  }
}
```

---

## Placement Phase

When `grid_mode: true`, the battle starts in `setup` phase with `awaiting_placement: true`. The client should:

1. Display the grid with deployment zone highlighted (rows 1-2)
2. Show player Pokemon in a selection panel
3. Allow player to click Pokemon, then click grid cell to place
4. Track placed Pokemon positions locally
5. Call `/api/battle/place` or send placement with first action

---

## Usage Example

```javascript
const startGridBattle = async (partyIds, opponentId, level) => {
  const response = await fetch('/api/battle/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      player_pokemon_ids: partyIds,
      opponent_pokemon_id: opponentId,
      opponent_level: level,
      battle_type: 'wild',
      grid_mode: true
    })
  });

  const result = await response.json();

  if (result.success) {
    setBattleState(result.data);
    setPhase('setup');
  }
};
```

---

## Notes

1. Initiative is rolled for all combatants at battle start
2. Opponent Pokemon are auto-placed in rows 9-10
3. Player must place at least 1 Pokemon to begin combat
4. The `round_number` starts at 0 during setup, increments to 1 when combat begins
5. Trainers are always placed at fixed positions (A5 and J5)
