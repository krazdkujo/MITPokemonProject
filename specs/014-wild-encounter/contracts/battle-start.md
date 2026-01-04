# Contract: Battle Start API (Existing)

**Endpoint**: `POST /api/battle/start`
**Status**: Existing - No Changes Required
**Source**: `pages/api/battle/start.js`

## Purpose

Initialize a new battle between player's Pokemon and a wild opponent. This is the existing endpoint used by the wild encounter page.

## Request

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Body

```json
{
  "player_pokemon_id": "uuid-string",
  "opponent_pokemon_id": "rattata",
  "opponent_level": 5,
  "battle_type": "wild"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| player_pokemon_id | string (UUID) | Yes | ID from player_pokemon table |
| opponent_pokemon_id | string | Yes | Pokemon ID from Source data |
| opponent_level | integer | Yes | Level 1-20 |
| battle_type | string | No | "wild" (default), "gym", "pvp", "trainer" |

## Response

### Success (200)

```json
{
  "success": true,
  "data": {
    "battle_id": "battle-uuid",
    "battle_type": "wild",
    "player_pokemon": {
      "id": "player-pokemon-uuid",
      "pokemon_id": "bulbasaur",
      "name": "Bulbasaur",
      "level": 5,
      "current_hp": 22,
      "max_hp": 22,
      "ac": 13,
      "type": ["grass", "poison"],
      "attributes": { "str": 10, "dex": 14, "con": 12, "int": 8, "wis": 10, "cha": 10 },
      "known_moves": [
        { "id": "tackle", "name": "Tackle", "type": "normal", "pp": 20 },
        { "id": "growl", "name": "Growl", "type": "normal", "pp": 30 }
      ],
      "move_pp": { "tackle": 20, "growl": 30 },
      "abilities": [{ "id": "overgrow", "name": "Overgrow" }],
      "initiative": 15
    },
    "opponent": {
      "pokemon_id": "rattata",
      "name": "Rattata",
      "level": 3,
      "current_hp": 12,
      "max_hp": 12,
      "ac": 12,
      "type": ["normal"],
      "attributes": { "str": 8, "dex": 16, "con": 10, "int": 6, "wis": 8, "cha": 6 },
      "known_moves": [
        { "id": "tackle", "name": "Tackle", "type": "normal", "pp": 20 },
        { "id": "tail-whip", "name": "Tail Whip", "type": "normal", "pp": 30 }
      ],
      "move_pp": { "tackle": 20, "tail-whip": 30 },
      "abilities": [{ "id": "run-away", "name": "Run Away" }],
      "initiative": 18
    },
    "initiative_order": ["opponent", "player"],
    "first_to_act": "opponent",
    "round_number": 1
  }
}
```

### Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 403 | FORBIDDEN | Player doesn't own the Pokemon |
| 422 | POKEMON_FAINTED | Pokemon has 0 HP |
| 422 | VALIDATION_ERROR | Invalid parameters |
| 500 | INTERNAL_ERROR | Server error |

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid opponent level",
    "details": {
      "opponent_level": "opponent_level must be a number between 1 and 20"
    }
  }
}
```

### Pokemon Fainted Error Example

```json
{
  "success": false,
  "error": {
    "code": "POKEMON_FAINTED",
    "message": "This Pokemon has fainted and cannot battle",
    "details": {
      "hint": "Heal your Pokemon at a Pokemon Center first"
    }
  }
}
```

## Usage in Wild Encounter Page

```javascript
// Generate encounter from location
const wildPokemonId = selectRandomPokemon(selectedLocation);
const wildLevel = generateEncounterLevel(selectedLocation);

// Get first healthy Pokemon from party
const playerPokemon = party.find(p => p.current_hp > 0);

// Start battle
const response = await apiFetch('/api/battle/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    player_pokemon_id: playerPokemon.id,
    opponent_pokemon_id: wildPokemonId,
    opponent_level: wildLevel,
    battle_type: 'wild'
  })
});

if (response.success) {
  // Navigate to combat with battle_id
  router.push(`/combat?battle_id=${response.data.battle_id}`);
}
```
