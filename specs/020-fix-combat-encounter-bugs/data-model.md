# Data Model: Fix Combat Encounter Bugs

**Date**: 2026-01-06
**Feature**: 020-fix-combat-encounter-bugs

## Overview

This document describes the HP data flow through the system and identifies the fix points. No schema changes are required - this is a data handling fix only.

---

## Entities Involved

### Player Pokemon (Database Table: `player_pokemon`)

**Current Schema** (unchanged):
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | No | Foreign key to users |
| pokemon_id | String | No | Reference to Source pokemon |
| level | Integer | No | Pokemon level (1-20) |
| current_hp | Integer | **Yes** | Current health points |
| max_hp | Integer | **Yes** | Maximum health points |
| is_active | Boolean | No | In active party (max 6) |
| slot_number | Integer | Yes | Party position (1-6) |
| selected_moves | JSONB | Yes | Array of move IDs |
| move_pp | JSONB | Yes | PP tracking per move |

**Key Insight**: Both `current_hp` and `max_hp` are nullable. New Pokemon or Pokemon that haven't been in combat may have NULL values.

### Active Battle (Database Table: `active_battles`)

**Current Schema** (unchanged):
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owning player |
| battle_state | JSONB | Full battle state including combatants |
| zone_id | String | Zone where encounter started |
| status | String | 'active', 'completed', 'abandoned' |

**Battle State Structure** (JSONB):
```json
{
  "combatants": {
    "player": [
      {
        "combatant_id": "uuid",
        "pokemon_id": "bulbasaur",
        "current_hp": 45,
        "max_hp": 45,
        "position": { "x": 3, "y": 2 },
        ...
      }
    ],
    "opponent": [...]
  },
  "round": 1,
  "turn_order": [...],
  ...
}
```

---

## Data Flow

```
                                    ┌─────────────────────┐
                                    │   Supabase DB       │
                                    │   player_pokemon    │
                                    │   (may have NULL)   │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                              ┌────────────────────────────────┐
                              │     API: /api/player/pokemon   │
                              │     Uses: pokemonData.js       │
                              │                                │
                              │  ❌ BUG: NULL → 1 HP default   │
                              │  ✅ FIX: NULL → max_hp default │
                              └────────────────┬───────────────┘
                                               │
                                               ▼
                              ┌────────────────────────────────┐
                              │     gameContext.js             │
                              │     Calculates hp_percentage   │
                              │     Sets is_fainted flag       │
                              └────────────────┬───────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       │                       │                       │
                       ▼                       ▼                       ▼
            ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
            │   zones.js       │   │   pokecenter.js  │   │   combat.js      │
            │   (encounters)   │   │   (healing)      │   │   (battle)       │
            │                  │   │                  │   │                  │
            │ Uses: party data │   │ Uses: party data │   │ Uses: battleState│
            │ to show avail.   │   │ for heal button  │   │ from API         │
            └──────────────────┘   └──────────────────┘   └──────────────────┘
                                                                   │
                                                                   ▼
                                                    ┌──────────────────────────┐
                                                    │     battleEngine.js      │
                                                    │     buildCombatant()     │
                                                    │                          │
                                                    │ ✅ Already better logic: │
                                                    │ current_hp || max_hp ||  │
                                                    │ sourcePokemon.hp         │
                                                    └──────────────────────────┘
```

---

## HP Default Logic

### Current (Buggy) Behavior

**pokemonData.js** (`buildPlayerPokemonResponse`):
```javascript
current_hp: dbRecord.current_hp || 1,  // ❌ NULL → 1
max_hp: dbRecord.max_hp || 1,          // ❌ NULL → 1
```

**Result with NULL HP**:
| State | current_hp | max_hp | hp_percentage | is_fainted | needsHealing |
|-------|------------|--------|---------------|------------|--------------|
| Fresh Pokemon (NULL, NULL) | 1 | 1 | 100% | false | false |
| Should be | max_hp | max_hp | 100% | false | false |

**Problem**: 1 HP is incorrect, creates desync with battleEngine.

### Fixed Behavior

**pokemonData.js** (`buildPlayerPokemonResponse`):
```javascript
const effectiveMaxHp = dbRecord.max_hp || sourcePokemon.hp || 20;
const effectiveCurrentHp = dbRecord.current_hp ?? effectiveMaxHp;
```

**Result with NULL HP**:
| State | current_hp | max_hp | hp_percentage | is_fainted | needsHealing |
|-------|------------|--------|---------------|------------|--------------|
| Fresh Pokemon (NULL, NULL) | 45 | 45 | 100% | false | false |
| Damaged (30, 45) | 30 | 45 | 67% | false | true |
| Fainted (0, 45) | 0 | 45 | 0% | true | true |

---

## Validation Rules

### HP Values

| Rule | Validation |
|------|------------|
| current_hp range | 0 to max_hp (inclusive) |
| max_hp source | Database → Source pokemon.hp → 20 (fallback) |
| current_hp default | max_hp (healthy) when NULL |
| Fainted check | current_hp === 0 (strict equality) |

### State Transitions

```
         ┌────────────────┐
         │ Fresh Pokemon  │
         │ (NULL in DB)   │
         └───────┬────────┘
                 │ Battle starts
                 ▼
         ┌────────────────┐
         │ Healthy        │
         │ current = max  │◄────────────────┐
         └───────┬────────┘                 │
                 │ Takes damage             │ Healed
                 ▼                          │
         ┌────────────────┐                 │
         │ Damaged        │─────────────────┤
         │ 0 < current    │                 │
         │    < max       │                 │
         └───────┬────────┘                 │
                 │ HP reaches 0             │
                 ▼                          │
         ┌────────────────┐                 │
         │ Fainted        │─────────────────┘
         │ current = 0    │
         └────────────────┘
```

---

## No Schema Changes Required

The existing database schema correctly allows NULL values for HP fields. The fix is entirely in the JavaScript data handling layer.

**Rationale for NOT changing schema**:
1. NULL means "not yet set" - valid state for new Pokemon
2. Default constraints in DB would hide application bugs
3. Keeping schema flexible allows different default strategies
