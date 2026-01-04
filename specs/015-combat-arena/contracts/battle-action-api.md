# API Contract: Battle Action

**Endpoint**: `POST /api/battle/action`
**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04

## Overview

Execute a battle action (attack, move, or use item) during combat. Validates the action against battle rules and returns updated battle state.

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
  "battle_id": "uuid-string",
  "battle_state": {
    "battle_id": "uuid-string",
    "battle_type": "wild",
    "phase": "combat",
    "combatants": {
      "player": [/* Combatant objects */],
      "opponent": [/* Combatant objects */]
    },
    "initiative_order": ["combatant-id-1", "combatant-id-2"],
    "current_turn_index": 0,
    "round_number": 1
  },
  "action_type": "attack",
  "actor_id": "combatant-uuid",
  "move_id": "tackle",
  "target_id": "opponent-combatant-uuid"
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| battle_id | string | Yes | Battle identifier |
| battle_state | object | Yes | Current battle state from client |
| action_type | string | Yes | One of: `attack`, `move`, `item` |
| actor_id | string | Yes | combatant_id performing the action |
| move_id | string | For attack | ID of move to use |
| target_id | string | For attack | combatant_id of target |
| target_position | object | For move | `{ col: 0-9, row: 0-9 }` destination |
| item_id | string | For item | ID of item to use |

### Action Type Specifics

**Attack Action**:
- `move_id` required
- `target_id` required
- Target must be opponent combatant with HP > 0
- Actor must have PP > 0 for the move

**Move Action**:
- `target_position` required
- Position must be within 6 squares (Manhattan distance)
- Position must not be occupied
- Actor must not have moved this turn

**Item Action**:
- `item_id` required
- Item must be in player inventory
- Item must be usable in battle

---

## Response

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "action_type": "attack",
    "actor": {
      "combatant_id": "uuid",
      "name": "Bulbasaur",
      "current_hp": 22,
      "max_hp": 22
    },
    "target": {
      "combatant_id": "uuid",
      "name": "Rattata",
      "hp_before": 18,
      "hp_after": 6,
      "fainted": false
    },
    "attack_result": {
      "move_id": "tackle",
      "move_name": "Tackle",
      "attack_roll": {
        "natural_roll": 15,
        "modifier": 5,
        "total": 20,
        "crit_threshold": 20
      },
      "target_ac": 12,
      "hit": true,
      "damage": {
        "dice_expression": "1d6+2",
        "base_dice_total": 4,
        "power_modifier": 3,
        "stab_bonus": 0,
        "type_multiplier": 1,
        "type_effectiveness": "normal",
        "is_critical": false,
        "final_damage": 12
      },
      "pp_consumed": 1,
      "pp_remaining": 34
    },
    "status_applied": null,
    "updated_state": {
      "combatants": {/* updated combatant arrays */},
      "current_turn_index": 1,
      "round_number": 1,
      "initiative_order": ["id1", "id2"]
    },
    "battle_continues": true,
    "outcome": "ongoing",
    "next_turn": {
      "combatant_id": "opponent-uuid",
      "name": "Rattata",
      "owner": "opponent"
    }
  }
}
```

### Move Action Success Response

```json
{
  "success": true,
  "data": {
    "action_type": "move",
    "actor": {
      "combatant_id": "uuid",
      "name": "Bulbasaur"
    },
    "movement": {
      "from": { "col": 1, "row": 0, "notation": "B1" },
      "to": { "col": 3, "row": 2, "notation": "D3" },
      "distance": 4
    },
    "updated_state": {/* ... */},
    "battle_continues": true,
    "outcome": "ongoing",
    "next_turn": {/* ... */}
  }
}
```

### Victory Response

```json
{
  "success": true,
  "data": {
    "action_type": "attack",
    "actor": {/* ... */},
    "target": {
      "combatant_id": "uuid",
      "name": "Rattata",
      "hp_before": 6,
      "hp_after": 0,
      "fainted": true
    },
    "attack_result": {/* ... */},
    "battle_continues": false,
    "outcome": "victory",
    "rewards": {
      "xp_awarded": 150,
      "currency_awarded": 100
    }
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
      "move_id": "move_id is required for attack actions"
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

### 403 Forbidden - Not Your Turn

```json
{
  "success": false,
  "error": {
    "code": "NOT_YOUR_TURN",
    "message": "It is not this combatant's turn to act"
  }
}
```

### 422 Unprocessable - Pokemon Fainted

```json
{
  "success": false,
  "error": {
    "code": "POKEMON_FAINTED",
    "message": "This Pokemon has fainted and cannot act",
    "details": {
      "hint": "Select a different Pokemon or end the battle"
    }
  }
}
```

### 422 Unprocessable - No PP Remaining

```json
{
  "success": false,
  "error": {
    "code": "NO_PP_REMAINING",
    "message": "This move has no PP remaining",
    "details": {
      "move_id": "tackle",
      "pp_remaining": 0
    }
  }
}
```

### 422 Unprocessable - Invalid Movement

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MOVEMENT",
    "message": "Cannot move to this position",
    "details": {
      "reason": "Position is occupied",
      "target_position": { "col": 5, "row": 3 }
    }
  }
}
```

### 422 Unprocessable - Out of Range

```json
{
  "success": false,
  "error": {
    "code": "OUT_OF_RANGE",
    "message": "Target position is out of movement range",
    "details": {
      "max_distance": 6,
      "actual_distance": 8
    }
  }
}
```

---

## Battle State Synchronization

The API validates the client's battle state and returns the authoritative updated state. Client must:

1. Send current `battle_state` with each action
2. Replace local state with `updated_state` from response
3. Use `next_turn` to determine whose turn it is
4. Handle `battle_continues: false` to trigger end screen

---

## Usage Examples

### Attack Action

```javascript
const response = await fetch('/api/battle/action', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    battle_id: battleState.battle_id,
    battle_state: battleState,
    action_type: 'attack',
    actor_id: selectedPokemon.combatant_id,
    move_id: selectedMove.id,
    target_id: targetPokemon.combatant_id
  })
});
```

### Move Action

```javascript
const response = await fetch('/api/battle/action', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    battle_id: battleState.battle_id,
    battle_state: battleState,
    action_type: 'move',
    actor_id: selectedPokemon.combatant_id,
    target_position: { col: 3, row: 2 }
  })
});
```
