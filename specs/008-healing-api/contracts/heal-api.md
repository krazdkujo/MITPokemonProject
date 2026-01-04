# API Contract: Heal Endpoint

**Feature**: 008-healing-api
**Date**: 2026-01-03
**Endpoint**: `POST /api/heal`

## Overview

Restores all active party Pokemon to full health. Free to use, no currency cost.

## Endpoint

```
POST /api/heal
```

## Authentication

**Required**: Yes (JWT Bearer Token)

```
Authorization: Bearer <jwt_token>
```

The JWT must contain valid `email` and `name` claims. The user_id is extracted from the authenticated session.

## Request

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer <token> | Yes |
| Content-Type | application/json | Optional |

### Body

No request body required. The endpoint operates on all active Pokemon owned by the authenticated user.

```json
{}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "healed": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "type": ["Grass", "Poison"],
        "level": 5,
        "current_hp": 22,
        "max_hp": 22,
        "is_active": true,
        "slot_number": 1,
        "sprite": "/images/pokemon/001.png",
        "artwork": "/images/pokemon/001.png"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "pokemon_id": "charmander",
        "name": "Charmander",
        "type": ["Fire"],
        "level": 4,
        "current_hp": 18,
        "max_hp": 18,
        "is_active": true,
        "slot_number": 2,
        "sprite": "/images/pokemon/004.png",
        "artwork": "/images/pokemon/004.png"
      }
    ],
    "healed_count": 2,
    "message": "Party healed successfully"
  }
}
```

### Success Response - No Active Pokemon (200 OK)

When the player has no active Pokemon (empty party or all in box):

```json
{
  "success": true,
  "data": {
    "healed": [],
    "healed_count": 0,
    "message": "No active Pokemon to heal"
  }
}
```

### Error Responses

#### 401 Unauthorized

Missing or invalid JWT token.

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 405 Method Not Allowed

Request used wrong HTTP method.

```json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Method GET not allowed",
    "allowed": ["POST"]
  }
}
```

#### 500 Internal Server Error

Database or server error.

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to heal Pokemon"
  }
}
```

## Examples

### cURL Example

```bash
curl -X POST https://your-domain.vercel.app/api/heal \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### N8N Workflow Integration

```javascript
// HTTP Request Node Configuration
{
  "method": "POST",
  "url": "={{$env.API_BASE_URL}}/api/heal",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "options": {}
}

// Response Parsing
const healedPokemon = $json.data.healed;
const healedCount = $json.data.healed_count;

// Check if any Pokemon were healed
if (healedCount > 0) {
  return healedPokemon.map(p => ({
    name: p.name,
    hp: `${p.current_hp}/${p.max_hp}`,
    slot: p.slot_number
  }));
}
```

### JavaScript Fetch Example

```javascript
async function healParty(authToken) {
  const response = await fetch('/api/heal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (result.success) {
    console.log(`Healed ${result.data.healed_count} Pokemon`);
    return result.data.healed;
  } else {
    throw new Error(result.error.message);
  }
}
```

## Behavior Notes

1. **Idempotent**: Calling the endpoint multiple times has the same effect as calling it once. Already full-health Pokemon remain unchanged.

2. **Free**: No currency is deducted. This is intentional to provide a friction-free recovery mechanism.

3. **Active Only**: Only Pokemon with `is_active = true` are healed. Box Pokemon are not affected.

4. **PP Restoration**: Move PP is fully restored to Source-defined maximums, not just incremented.

5. **Revives Fainted**: Pokemon with 0 HP are fully restored to max_hp.

6. **No Status Effects**: Status effects are not persisted in the database (they exist only during battle sessions), so there is nothing to clear.

## Rate Limiting

No rate limiting is applied to this endpoint. Students may call it as often as needed in their workflows.

## Related Endpoints

| Endpoint | Relationship |
|----------|--------------|
| `GET /api/player/pokemon` | Returns current party state (use to check HP before deciding to heal) |
| `POST /api/battle` | Combat endpoint that depletes HP/PP (call heal after battles) |
| `POST /api/battle/start` | Initiates a new battle encounter |
