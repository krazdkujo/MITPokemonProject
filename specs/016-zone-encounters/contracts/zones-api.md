# API Contracts: Zone Endpoints

**Feature**: 016-zone-encounters
**Base Path**: /api/zones

## GET /api/zones

Get all available encounter zones, grouped by terrain type.

### Request

```http
GET /api/zones
Authorization: Bearer <jwt>
```

### Response 200 OK

```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "id": "water-pond",
        "name": "Tranquil Pond",
        "terrain": "water",
        "difficulty": "easy",
        "difficultyLabel": "Easy",
        "description": "A peaceful pond where young Water Pokemon gather.",
        "types": ["water", "ice"],
        "srRange": { "min": 0, "max": 0.5 },
        "pokemonCount": 87
      }
    ],
    "terrainGroups": {
      "water": ["water-pond", "water-lake", "water-river", "water-ocean"],
      "fire": ["fire-campfire", "fire-volcano", "fire-caldera"],
      "grass": ["grass-meadow", "grass-garden", "grass-jungle"],
      "electric": ["electric-powerplant", "electric-storm", "electric-factory"],
      "cave": ["cave-tunnel", "cave-cavern", "cave-abyss"],
      "forest": ["forest-grove", "forest-woods", "forest-ancient"],
      "mountain": ["mountain-trail", "mountain-peak", "mountain-summit"],
      "urban": ["urban-alley", "urban-district", "urban-downtown"]
    }
  }
}
```

### Response 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## GET /api/zones/:zoneId

Get details for a specific zone including encounter pool sample.

### Request

```http
GET /api/zones/water-pond
Authorization: Bearer <jwt>
```

### Response 200 OK

```json
{
  "success": true,
  "data": {
    "zone": {
      "id": "water-pond",
      "name": "Tranquil Pond",
      "terrain": "water",
      "difficulty": "easy",
      "difficultyLabel": "Easy",
      "description": "A peaceful pond where young Water Pokemon gather.",
      "types": ["water", "ice"],
      "srRange": { "min": 0, "max": 0.5 }
    },
    "encounterPool": {
      "count": 87,
      "sample": [
        { "id": "magikarp", "name": "Magikarp", "number": 129, "sr": 0 },
        { "id": "poliwag", "name": "Poliwag", "number": 60, "sr": 0.25 },
        { "id": "psyduck", "name": "Psyduck", "number": 54, "sr": 0.5 }
      ]
    }
  }
}
```

### Response 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "ZONE_NOT_FOUND",
    "message": "Zone not found: invalid-zone"
  }
}
```

---

## POST /api/zones/encounter

Start an encounter in a zone. Creates persistent battle record.

### Request

```http
POST /api/zones/encounter
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "zone_id": "water-pond",
  "player_pokemon_ids": ["uuid-1", "uuid-2"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| zone_id | string | Yes | Zone identifier |
| player_pokemon_ids | string[] | Yes | Player Pokemon IDs to bring (1-6) |

### Response 201 Created

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid-battle",
    "zone": {
      "id": "water-pond",
      "name": "Tranquil Pond",
      "terrain": "water"
    },
    "phase": "setup",
    "grid_mode": true,
    "grid": {
      "width": 10,
      "height": 10,
      "deployment_zone": {
        "player": { "rows": [0, 1] },
        "opponent": { "rows": [8, 9] }
      }
    },
    "player_pokemon": [
      {
        "combatant_id": "uuid-combatant-1",
        "pokemon_id": "bulbasaur",
        "number": 1,
        "name": "Bulbasaur",
        "level": 5,
        "current_hp": 22,
        "max_hp": 22,
        "ac": 13,
        "type": ["grass", "poison"],
        "attributes": { "str": 13, "dex": 12, "con": 12, "int": 6, "wis": 10, "cha": 10 },
        "known_moves": ["tackle", "growl", "vine-whip", "leech-seed"],
        "move_pp": { "tackle": 35, "growl": 40, "vine-whip": 25, "leech-seed": 10 },
        "abilities": [{ "id": "overgrow", "hidden": false }],
        "initiative": 14,
        "position": null,
        "placed": false,
        "status_effects": []
      }
    ],
    "opponent_pokemon": [
      {
        "combatant_id": "uuid-opponent-1",
        "pokemon_id": "magikarp",
        "number": 129,
        "name": "Magikarp",
        "level": 3,
        "current_hp": 12,
        "max_hp": 12,
        "ac": 10,
        "type": ["water"],
        "attributes": { "str": 6, "dex": 12, "con": 8, "int": 4, "wis": 6, "cha": 8 },
        "known_moves": ["splash", "tackle"],
        "move_pp": { "splash": 40, "tackle": 35 },
        "abilities": [{ "id": "swift-swim", "hidden": false }],
        "initiative": 11,
        "position": { "col": 5, "row": 9 },
        "placed": true,
        "status_effects": []
      }
    ],
    "initiative_order": ["uuid-combatant-1", "uuid-opponent-1"],
    "first_to_act": "player",
    "round_number": 0,
    "awaiting_placement": true
  }
}
```

### Response 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "zone_id": "Zone not found",
      "player_pokemon_ids": "At least one Pokemon is required"
    }
  }
}
```

### Response 409 Conflict

Returned when user has an active battle.

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_BATTLE_EXISTS",
    "message": "You have an active battle in progress",
    "details": {
      "battle_id": "uuid-existing-battle",
      "zone_id": "water-lake",
      "started_at": "2026-01-04T10:30:00Z"
    }
  }
}
```

### Response 422 Unprocessable Entity

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
