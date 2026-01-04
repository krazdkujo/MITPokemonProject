# API Contract: Player Pokemon Endpoint

**Feature**: 003-player-dashboard
**Endpoint**: GET /api/player/pokemon
**Date**: 2026-01-03

## Overview

Returns the authenticated player's Pokemon roster with dashboard summary statistics. This endpoint is enhanced from the existing implementation to include HP fields and summary counts.

## Authentication

**Required**: Bearer token in Authorization header
```
Authorization: Bearer <jwt-token>
```

**Failure Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

## Request

**Method**: GET
**Path**: /api/player/pokemon
**Query Parameters**: None

## Response

### Success (200 OK)

```json
{
  "success": true,
  "data": {
    "pokemon": [
      {
        "id": "uuid-of-player-pokemon-record",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "type": ["Grass", "Poison"],
        "level": 5,
        "current_hp": 18,
        "max_hp": 22,
        "is_active": true,
        "slot_number": 1,
        "sprite": "https://example.com/sprites/bulbasaur.png",
        "artwork": "https://example.com/artwork/bulbasaur.png"
      },
      {
        "id": "uuid-of-second-pokemon",
        "pokemon_id": "pikachu",
        "name": "Pikachu",
        "type": ["Electric"],
        "level": 3,
        "current_hp": 14,
        "max_hp": 14,
        "is_active": true,
        "slot_number": 2,
        "sprite": "https://example.com/sprites/pikachu.png",
        "artwork": "https://example.com/artwork/pikachu.png"
      }
    ],
    "has_starter": true,
    "active_count": 2,
    "box_count": 5,
    "pokedex_caught": 7,
    "badge_count": 0,
    "total_count": 7
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| pokemon | Array | List of all player Pokemon (active first, then storage) |
| pokemon[].id | UUID | Database record ID for this player-Pokemon association |
| pokemon[].pokemon_id | String | Reference to Source Pokemon ID |
| pokemon[].name | String | Pokemon name from Source data |
| pokemon[].type | String[] | Pokemon types from Source data |
| pokemon[].level | Integer | Current level (1-20) |
| pokemon[].current_hp | Integer | Current hit points |
| pokemon[].max_hp | Integer | Maximum hit points |
| pokemon[].is_active | Boolean | True if in active party |
| pokemon[].slot_number | Integer/null | Party slot (1-6) if active, null if in storage |
| pokemon[].sprite | String/null | Sprite image URL from Source, or null |
| pokemon[].artwork | String/null | Artwork image URL from Source, or null |
| has_starter | Boolean | True if player has at least one Pokemon |
| active_count | Integer | Number of Pokemon in active party (0-6) |
| box_count | Integer | Number of Pokemon in storage |
| pokedex_caught | Integer | Count of distinct Pokemon species owned |
| badge_count | Integer | Number of gym badges earned (0 until badges implemented) |
| total_count | Integer | Total Pokemon owned (active + storage) |

### Empty State (200 OK)

When player has no Pokemon:
```json
{
  "success": true,
  "data": {
    "pokemon": [],
    "has_starter": false,
    "active_count": 0,
    "box_count": 0,
    "pokedex_caught": 0,
    "badge_count": 0,
    "total_count": 0
  }
}
```

### Error: Database Failure (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch Pokemon roster"
  }
}
```

## Ordering

Pokemon are returned in the following order:
1. Active Pokemon ordered by slot_number ASC (1, 2, 3, 4, 5, 6)
2. Storage Pokemon ordered by created_at DESC (most recent first)

## Data Merging

The API performs the following merge operations:

1. Fetch player_pokemon records from database
2. For each record, call `buildPlayerPokemonResponse(record)` from lib/pokemonData.js
3. This merges database fields (level, HP, is_active) with Source fields (name, type, sprite)
4. Calculate summary counts using SQL aggregations
5. Return combined response

## Performance Requirements

- Response time: < 500ms for typical user (< 50 Pokemon)
- Database queries: Maximum 2 queries (Pokemon list + summary counts)
- The endpoint should handle users with up to 1000 Pokemon without timeout

## Example cURL

```bash
curl -X GET "https://api.example.com/api/player/pokemon" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```
