# API Contracts: Battle Persistence Endpoints

**Feature**: 016-zone-encounters
**Base Path**: /api/battle

## GET /api/battle/active

Check if user has an active battle and return its state.

### Request

```http
GET /api/battle/active
Authorization: Bearer <jwt>
```

### Response 200 OK (Active Battle Exists)

```json
{
  "success": true,
  "data": {
    "has_active_battle": true,
    "battle": {
      "battle_id": "uuid-battle",
      "zone_id": "water-pond",
      "zone_name": "Tranquil Pond",
      "phase": "combat",
      "round_number": 3,
      "started_at": "2026-01-04T10:30:00Z",
      "updated_at": "2026-01-04T10:35:00Z",
      "player_pokemon": [
        {
          "combatant_id": "uuid-1",
          "name": "Bulbasaur",
          "number": 1,
          "current_hp": 18,
          "max_hp": 22,
          "position": { "col": 3, "row": 2 },
          "is_fainted": false
        }
      ],
      "opponent_pokemon": [
        {
          "combatant_id": "uuid-opp-1",
          "name": "Magikarp",
          "number": 129,
          "current_hp": 6,
          "max_hp": 12,
          "position": { "col": 5, "row": 7 },
          "is_fainted": false
        }
      ]
    }
  }
}
```

### Response 200 OK (No Active Battle)

```json
{
  "success": true,
  "data": {
    "has_active_battle": false,
    "battle": null
  }
}
```

---

## GET /api/battle/state/:battleId

Get full battle state for resuming combat.

### Request

```http
GET /api/battle/state/uuid-battle
Authorization: Bearer <jwt>
```

### Response 200 OK

Returns the complete battle state from database, merged with Source data.

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid-battle",
    "battle_type": "wild",
    "zone": {
      "id": "water-pond",
      "name": "Tranquil Pond",
      "terrain": "water"
    },
    "phase": "combat",
    "grid": [
      [
        { "col": 0, "row": 0, "notation": "A1", "occupant_type": "empty", "occupant_id": null },
        ...
      ],
      ...
    ],
    "combatants": {
      "player": [
        {
          "combatant_id": "uuid-1",
          "pokemon_id": "bulbasaur",
          "number": 1,
          "owner": "player",
          "name": "Bulbasaur",
          "level": 5,
          "current_hp": 18,
          "max_hp": 22,
          "ac": 13,
          "type": ["grass", "poison"],
          "attributes": { "str": 13, "dex": 12, "con": 12, "int": 6, "wis": 10, "cha": 10 },
          "position": { "col": 3, "row": 2 },
          "status_effects": [],
          "move_pp": { "tackle": 33, "growl": 40, "vine-whip": 24, "leech-seed": 10 },
          "known_moves": ["tackle", "growl", "vine-whip", "leech-seed"],
          "abilities": [{ "id": "overgrow", "hidden": false }],
          "initiative_roll": 14,
          "has_moved_this_turn": false,
          "is_fainted": false,
          "sr": 0.5
        }
      ],
      "opponent": [
        {
          "combatant_id": "uuid-opp-1",
          "pokemon_id": "magikarp",
          "number": 129,
          "owner": "opponent",
          "name": "Magikarp",
          "level": 3,
          "current_hp": 6,
          "max_hp": 12,
          "ac": 10,
          "type": ["water"],
          "attributes": { "str": 6, "dex": 12, "con": 8, "int": 4, "wis": 6, "cha": 8 },
          "position": { "col": 5, "row": 7 },
          "status_effects": [],
          "move_pp": { "splash": 40, "tackle": 34 },
          "known_moves": ["splash", "tackle"],
          "moves": [
            { "id": "splash", "name": "Splash", "type": "normal", ... },
            { "id": "tackle", "name": "Tackle", "type": "normal", ... }
          ],
          "abilities": [{ "id": "swift-swim", "hidden": false }],
          "initiative_roll": 11,
          "has_moved_this_turn": false,
          "is_fainted": false,
          "sr": 0
        }
      ]
    },
    "trainers": {
      "player": { "position": { "col": 0, "row": 4 } },
      "opponent": { "position": { "col": 9, "row": 4 } }
    },
    "initiative_order": ["uuid-1", "uuid-opp-1"],
    "current_turn_index": 0,
    "round_number": 3,
    "battle_log": [
      {
        "id": "log-1",
        "timestamp": "2026-01-04T10:31:00Z",
        "type": "attack",
        "actor": "Bulbasaur",
        "target": "Magikarp",
        "move": "Tackle",
        "result": "Hit for 6 damage"
      }
    ],
    "outcome": "ongoing",
    "started_at": "2026-01-04T10:30:00Z"
  }
}
```

### Response 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This battle does not belong to you"
  }
}
```

### Response 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BATTLE_NOT_FOUND",
    "message": "Battle not found"
  }
}
```

---

## POST /api/battle/abandon

Abandon the current active battle. Treated same as flee.

### Request

```http
POST /api/battle/abandon
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "battle_id": "uuid-battle"
}
```

### Response 200 OK

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid-battle",
    "outcome": "abandoned",
    "message": "Battle abandoned. This counts as fleeing from combat."
  }
}
```

### Response 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_BATTLE",
    "message": "No active battle to abandon"
  }
}
```

### Response 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This battle does not belong to you"
  }
}
```

---

## PATCH /api/battle/state/:battleId

Update battle state after an action. Internal use by action endpoints.

### Request

```http
PATCH /api/battle/state/uuid-battle
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "battle_state": { ... },
  "status": "active"
}
```

### Response 200 OK

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid-battle",
    "updated_at": "2026-01-04T10:36:00Z"
  }
}
```

---

## Extended: POST /api/battle/action

The existing action endpoint is extended to persist state.

### Behavior Change

After processing the action:
1. Update `active_battles.battle_state` with new state
2. Update `active_battles.updated_at`
3. If battle ends (victory/defeat), update `active_battles.status`

### Request (No Change)

```http
POST /api/battle/action
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "battle_id": "uuid-battle",
  "action_type": "attack",
  "combatant_id": "uuid-1",
  "move_id": "tackle",
  "target_id": "uuid-opp-1"
}
```

### Response 200 OK (Extended)

Response now includes persistence confirmation:

```json
{
  "success": true,
  "data": {
    "action_result": { ... },
    "battle_state": { ... },
    "persisted": true,
    "updated_at": "2026-01-04T10:36:00Z"
  }
}
```

---

## Extended: POST /api/battle/flee

The existing flee endpoint is extended to persist termination.

### Behavior Change

After processing flee:
1. Update `active_battles.status` to 'fled'
2. Update `active_battles.battle_state` with final state

### Response 200 OK (Extended)

```json
{
  "success": true,
  "data": {
    "fled": true,
    "message": "You fled from the battle!",
    "battle_terminated": true,
    "outcome": "fled"
  }
}
```
