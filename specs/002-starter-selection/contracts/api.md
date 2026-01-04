# API Contracts: Starter Pokemon Selection

**Feature**: 002-starter-selection
**Date**: 2026-01-03

## Overview

All endpoints follow the Educational API Design principle (Constitution VII) using the standard response envelope:

```json
{
  "success": true | false,
  "data": { ... },      // on success
  "error": {            // on failure
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }  // optional field-level details
  }
}
```

---

## Endpoints

### GET /api/pokemon/starters

Retrieve all starter-eligible Pokemon (SR <= 0.5) from Source data.

**Authentication**: Required (session token in cookie or Authorization header)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| types | string | No | Comma-separated type filter (e.g., "fire,water"). Max 2 types. |

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "pokemon": [
      {
        "id": "bulbasaur",
        "name": "Bulbasaur",
        "number": 1,
        "type": ["grass", "poison"],
        "sr": 0.5,
        "sprite": "https://raw.githubusercontent.com/.../1.png",
        "artwork": "https://raw.githubusercontent.com/.../1.png"
      },
      {
        "id": "charmander",
        "name": "Charmander",
        "number": 4,
        "type": ["fire"],
        "sr": 0.5,
        "sprite": "https://raw.githubusercontent.com/.../4.png",
        "artwork": "https://raw.githubusercontent.com/.../4.png"
      }
    ],
    "available_types": ["bug", "dark", "dragon", "electric", "fairy", "fighting", "fire", "flying", "ghost", "grass", "ground", "ice", "normal", "poison", "psychic", "rock", "steel", "water"],
    "total": 42
  }
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

500 Internal Error:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to load Pokemon data",
    "details": { "hint": "Check server logs for more information" }
  }
}
```

---

### GET /api/player/pokemon

Retrieve the authenticated user's Pokemon roster.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "pokemon": [
      {
        "id": "uuid-here",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "type": ["grass", "poison"],
        "level": 1,
        "is_active": true,
        "slot_number": 1,
        "sprite": "https://raw.githubusercontent.com/.../1.png"
      }
    ],
    "has_starter": true,
    "active_count": 1,
    "total_count": 1
  }
}
```

**Empty roster response** (200):
```json
{
  "success": true,
  "data": {
    "pokemon": [],
    "has_starter": false,
    "active_count": 0,
    "total_count": 0
  }
}
```

---

### POST /api/player/pokemon

Add a Pokemon to the user's roster (used for starter selection).

**Authentication**: Required

**Request Body**:
```json
{
  "pokemon_id": "bulbasaur",
  "is_starter": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| pokemon_id | string | Yes | ID from Source data (e.g., "bulbasaur") |
| is_starter | boolean | No | If true, validates as starter selection (default: false) |

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "pokemon": {
      "id": "uuid-here",
      "pokemon_id": "bulbasaur",
      "name": "Bulbasaur",
      "type": ["grass", "poison"],
      "level": 1,
      "is_active": true,
      "slot_number": 1,
      "sprite": "https://raw.githubusercontent.com/.../1.png"
    },
    "message": "Starter Pokemon selected successfully"
  }
}
```

**Error Responses**:

400 Validation Error (invalid pokemon_id):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid Pokemon selection",
    "details": {
      "pokemon_id": "Pokemon not found in source data"
    }
  }
}
```

400 Validation Error (not starter eligible):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid starter selection",
    "details": {
      "pokemon_id": "This Pokemon is not eligible as a starter (SR > 0.5)"
    }
  }
}
```

409 Conflict (already has starter):
```json
{
  "success": false,
  "error": {
    "code": "STARTER_ALREADY_SELECTED",
    "message": "You have already selected a starter Pokemon",
    "details": {
      "hint": "Starter selection is permanent and cannot be changed"
    }
  }
}
```

---

### GET /api/player/pokemon/check

Quick check if user has any Pokemon (for redirect logic).

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "has_pokemon": true,
    "count": 1
  }
}
```

Or:
```json
{
  "success": true,
  "data": {
    "has_pokemon": false,
    "count": 0
  }
}
```

---

## Authentication

All endpoints require authentication via the session token from test-login.

**Header format**:
```
Authorization: Bearer <session_token>
```

**Or cookie**:
```
Cookie: session=<session_token>
```

The API extracts `user_id` from the decoded token to scope all database operations.

---

## Rate Limiting

No specific rate limits for this feature. Standard Vercel limits apply.

---

## Caching

- GET /api/pokemon/starters: Can be cached (Source data is static)
- GET /api/player/pokemon: No caching (user-specific)
- POST /api/player/pokemon: No caching (write operation)
