# Data Model: Fix Combat System Bugs

**Feature**: 019-fix-combat-bugs
**Date**: 2026-01-04

## Overview

This bug fix does not introduce new database tables. It ensures proper state transitions and data persistence for existing tables.

---

## Entities Modified

### 1. active_battles

**Purpose**: Tracks in-progress battles for resume capability

**Status Values** (extended):
| Value | Description | Query Behavior |
|-------|-------------|----------------|
| `active` | Battle in progress | Returned by /api/battle/active |
| `abandoned` | User abandoned battle | Excluded from active query |
| `victory` | Player won (NEW) | Excluded from active query |
| `defeat` | Player lost (NEW) | Excluded from active query |

**State Transition Diagram**:
```
                    ┌─────────────┐
                    │   active    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  victory   │  │   defeat   │  │  abandoned │
    └────────────┘  └────────────┘  └────────────┘
```

**Update on Battle End**:
```javascript
{
  status: outcome,        // 'victory' or 'defeat'
  battle_state: {
    ...existingState,
    phase: 'ended',
    outcome: outcome,
    ended_at: timestamp
  },
  updated_at: timestamp
}
```

---

### 2. player_pokemon

**Purpose**: Stores user's Pokemon with current state

**Fields Updated on Battle End**:
| Field | Type | Update Rule |
|-------|------|-------------|
| `current_hp` | INTEGER | Set to combatant's final HP from battle state |
| `move_pp` | JSONB | (Future) Could persist PP state |

**Update Query**:
```sql
UPDATE player_pokemon
SET current_hp = $final_hp
WHERE id = $pokemon_id
  AND user_id = $user_id
```

---

## State Flow: Battle End

### Before Fix (Broken)
```
1. Opponent attacks, knockout
2. processAttackResult() transitions to 'ended' immediately
3. Defeat modal shows (no feedback visible)
4. User navigates away
5. active_battles: status still 'active'
6. player_pokemon: current_hp unchanged
```

### After Fix (Correct)
```
1. Opponent attacks, knockout
2. processAttackResult() adds log entry, updates HP in UI
3. Wait 1.5 seconds for UI feedback
4. Call /api/battle/end with outcome
5. API updates:
   - active_battles.status = 'defeat'
   - player_pokemon.current_hp = 0
6. Show defeat modal
7. User navigates to PokeCenter
8. Sees correct HP, can heal
```

---

## API Data Contracts

### Request: POST /api/battle/end
```javascript
{
  battle_id: "uuid",
  outcome: "victory" | "defeat",
  combatants: {
    player: [
      { combatant_id: "uuid", pokemon_db_id: "uuid", current_hp: 0 }
    ],
    opponent: [
      { combatant_id: "uuid", current_hp: 15 }
    ]
  }
}
```

### Response: POST /api/battle/end
```javascript
{
  success: true,
  data: {
    battle_id: "uuid",
    outcome: "defeat",
    hp_updated: [
      { pokemon_id: "uuid", new_hp: 0 }
    ],
    battle_status: "defeat"
  }
}
```

---

## Validation Rules

### Battle End Request
1. `battle_id` must exist in `active_battles`
2. `battle_id` must belong to authenticated user
3. `status` must currently be `'active'`
4. `outcome` must be `'victory'` or `'defeat'`
5. All `pokemon_db_id` values must exist in `player_pokemon` for user

### HP Update
1. `current_hp` must be >= 0
2. `current_hp` must be <= `max_hp` (validated at persistence)
3. Only player's Pokemon HP is updated (not opponent's)

---

## Error Handling

| Error Condition | Response Code | Message |
|-----------------|---------------|---------|
| Battle not found | 404 | "Battle not found" |
| Battle not active | 400 | "Battle already ended" |
| Invalid outcome | 400 | "Invalid outcome value" |
| DB write failure | 500 | "Failed to save battle result" |

---

## Backward Compatibility

- No schema changes required
- Existing battles with `status: 'active'` will continue to work
- New status values ('victory', 'defeat') are additive
- `/api/battle/active` already filters by `status = 'active'`
