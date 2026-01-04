# Quickstart: Battle API Endpoint

**Feature**: 006-battle-api
**Date**: 2026-01-03

## Overview

This feature adds a battle API endpoint that allows N8N workflows to execute Pokemon battles. The endpoint handles combat calculations, HP/PP tracking, experience rewards, and returns detailed battle logs.

## Prerequisites

1. User must be authenticated (JWT bearer token)
2. User must own at least one Pokemon (starter selection completed)
3. Pokemon must not be fainted (current_hp > 0)
4. Pokemon must have moves with PP remaining

## Quick Test

### 1. Get a valid Pokemon ID

```bash
curl -X GET http://localhost:3000/api/player/pokemon \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Execute a battle

```bash
curl -X POST http://localhost:3000/api/battle \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "player_pokemon_id": "YOUR_POKEMON_UUID",
    "move_id": "tackle"
  }'
```

### 3. Expected Response

```json
{
  "success": true,
  "data": {
    "battle_id": "uuid",
    "outcome": "victory",
    "turns": [
      {
        "turn_number": 1,
        "player_action": {
          "pokemon_name": "Bulbasaur",
          "move_id": "tackle",
          "move_name": "Tackle",
          "attack_roll": 15,
          "target_ac": 12,
          "hit": true,
          "damage": 8,
          "effectiveness": "normal",
          "stab_applied": false,
          "target_hp_before": 15,
          "target_hp_after": 7
        },
        "opponent_action": {
          "pokemon_name": "Rattata",
          "move_id": "tackle",
          "move_name": "Tackle",
          "attack_roll": 10,
          "target_ac": 13,
          "hit": false,
          "damage": 0,
          "target_hp_before": 18,
          "target_hp_after": 18
        }
      }
    ],
    "rewards": {
      "experience_gained": 100,
      "total_experience": 100,
      "currency_gained": 300,
      "total_currency": 300,
      "level_up_pending": false
    },
    "final_state": {
      "player_pokemon": {
        "id": "uuid",
        "pokemon_id": "bulbasaur",
        "name": "Bulbasaur",
        "level": 1,
        "current_hp": 18,
        "max_hp": 18,
        "is_fainted": false,
        "pp_remaining": {
          "tackle": 19,
          "growl": 35
        }
      },
      "opponent": {
        "pokemon_id": "rattata",
        "name": "Rattata",
        "level": 3,
        "current_hp": 0,
        "max_hp": 15,
        "is_fainted": true
      }
    }
  }
}
```

## N8N Workflow Integration

### Workflow Pattern

```
[HTTP Request Node] --> [IF Node: Check outcome] --> [Branch: Victory/Defeat]
                                                        |
                                                        v
                                              [Parse rewards/state]
```

### Key Response Fields for N8N

| Field | Path | Use Case |
|-------|------|----------|
| Battle outcome | `data.outcome` | Decide next action |
| Pokemon HP | `data.final_state.player_pokemon.current_hp` | Check if can continue |
| XP gained | `data.rewards.experience_gained` | Track progress |
| Level up? | `data.rewards.level_up_pending` | Trigger level-up flow |
| PP remaining | `data.final_state.player_pokemon.pp_remaining` | Choose next move |

### Error Handling

All errors follow the standard envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { "field": "specific issue" }
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Missing/invalid token
- `FORBIDDEN` - Pokemon not owned
- `POKEMON_FAINTED` - Pokemon at 0 HP
- `VALIDATION_ERROR` - Invalid move, no PP, etc.

## Database Changes

This feature adds columns to existing tables:

```sql
-- player_pokemon table
experience INTEGER DEFAULT 0
pending_levelup BOOLEAN DEFAULT false
move_pp JSONB DEFAULT '{}'
selected_moves TEXT[] DEFAULT '{}'

-- users table
currency INTEGER DEFAULT 0
```

## File Structure

```
pages/api/battle.js       - API endpoint
lib/battleEngine.js       - Combat logic
lib/typeEffectiveness.js  - Type chart
lib/moveData.js           - Move utilities (extend pokemonData.js)
sql/004_battle_system.sql - Database migration
```

## Combat Rules Reference

### Damage Formula
```
Attack Roll = d20 + Move Power Mod + Proficiency
Damage = Dice + Move Power Mod + STAB
```

### STAB (Same Type Attack Bonus)
When move type matches Pokemon type, add Proficiency to damage.

### Type Effectiveness
- Super Effective: 2x damage
- Not Effective: 0.5x damage
- Immune: 0 damage

### Proficiency by Level
- L1-4: +2
- L5-8: +3
- L9-12: +4
- L13-16: +5
- L17-20: +6

### XP Award Formula
```
XP = 200 x Opponent Level x Opponent SR
```
