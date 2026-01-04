# API Contract: Battle Flee

**Endpoint**: `POST /api/battle/flee`
**Feature Branch**: `015-combat-arena`
**Created**: 2026-01-04

## Overview

Attempt to flee from battle. Success chance is based on relative speed of player's active Pokemon vs fastest opponent. Only available during player's turn.

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
      "player": [/* Combatant objects with DEX attributes */],
      "opponent": [/* Combatant objects with DEX attributes */]
    },
    "current_turn_index": 0
  },
  "actor_id": "player-combatant-uuid"
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| battle_id | string | Yes | Battle identifier |
| battle_state | object | Yes | Current battle state from client |
| actor_id | string | Yes | combatant_id of Pokemon attempting flee |

---

## Response

### Success - Fled Successfully (200)

```json
{
  "success": true,
  "data": {
    "fled": true,
    "battle_id": "uuid-string",
    "flee_details": {
      "roll": 15,
      "threshold": 12,
      "player_speed_mod": 3,
      "opponent_speed_mod": 1
    },
    "message": "Got away safely!",
    "battle_continues": false,
    "outcome": "fled"
  }
}
```

### Success - Flee Failed (200)

```json
{
  "success": true,
  "data": {
    "fled": false,
    "battle_id": "uuid-string",
    "flee_details": {
      "roll": 8,
      "threshold": 12,
      "player_speed_mod": 2,
      "opponent_speed_mod": 4
    },
    "message": "Can't escape!",
    "battle_continues": true,
    "outcome": "ongoing",
    "turn_consumed": true,
    "next_turn": {
      "combatant_id": "opponent-uuid",
      "name": "Rattata",
      "owner": "opponent"
    }
  }
}
```

---

## Flee Mechanics

### Formula

```
Flee Roll = d20 + Player DEX Modifier
Flee Threshold = 10 + Opponent DEX Modifier

Success if: Flee Roll >= Flee Threshold
```

### DEX Modifier Calculation

```javascript
// Standard D&D 5e attribute modifier
function getDexModifier(dex) {
  return Math.floor((dex - 10) / 2);
}
```

### Multiple Opponents

When facing multiple opponents, use the highest DEX modifier among all non-fainted opponents.

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
      "battle_id": "battle_id is required"
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
    "message": "Cannot flee - it is not your turn"
  }
}
```

### 422 Unprocessable - Cannot Flee Trainer Battle

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_FLEE",
    "message": "Cannot flee from trainer battles",
    "details": {
      "battle_type": "trainer",
      "hint": "Defeat or be defeated - there is no escape!"
    }
  }
}
```

### 422 Unprocessable - Battle Already Ended

```json
{
  "success": false,
  "error": {
    "code": "BATTLE_ENDED",
    "message": "This battle has already concluded",
    "details": {
      "outcome": "victory"
    }
  }
}
```

---

## Usage Example

```javascript
const attemptFlee = async () => {
  const response = await fetch('/api/battle/flee', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      battle_id: battleState.battle_id,
      battle_state: battleState,
      actor_id: currentPokemon.combatant_id
    })
  });

  const result = await response.json();

  if (result.data.fled) {
    // Navigate back to previous location
    router.push('/dashboard');
  } else {
    // Update battle state - opponent gets to attack
    setBattleState(prev => ({
      ...prev,
      current_turn_index: result.data.next_turn_index
    }));
    addToLog('flee_failed', result.data.message);
  }
};
```

---

## Notes

1. Flee attempt consumes the player's turn, even if unsuccessful
2. Wild battles always allow flee attempts
3. Trainer/gym battles do not allow fleeing
4. Failed flee gives opponent a free attack (turn passes to them)
5. Natural 20 always succeeds, natural 1 always fails
