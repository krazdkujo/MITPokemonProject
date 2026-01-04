# Data Model: Battle API Endpoint

**Feature**: 006-battle-api
**Date**: 2026-01-03

## Entities

### Player Pokemon (Extended)

**Table**: `player_pokemon` (existing, with new columns)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users table |
| pokemon_id | TEXT | Reference to Source pokemon.json |
| level | INTEGER | Current level (1-20) |
| current_hp | INTEGER | Current hit points |
| max_hp | INTEGER | Maximum hit points |
| is_active | BOOLEAN | In active party (vs PC box) |
| slot_number | INTEGER | Party slot (1-6) |
| **experience** | INTEGER | NEW: XP accumulated |
| **pending_levelup** | BOOLEAN | NEW: Awaiting level-up processing |
| **move_pp** | JSONB | NEW: PP remaining per move |
| **selected_moves** | TEXT[] | NEW: Current known moves (max 4) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**New Columns Migration**:
```sql
ALTER TABLE player_pokemon
  ADD COLUMN experience INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN pending_levelup BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN move_pp JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN selected_moves TEXT[] NOT NULL DEFAULT '{}';
```

**Validation Rules**:
- `experience >= 0`
- `selected_moves` max 4 elements
- `selected_moves` elements must be valid move IDs from Source
- `move_pp` keys must match `selected_moves` values

---

### Users (Extended)

**Table**: `users` (existing, with new column)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | User email (unique) |
| name | TEXT | Display name |
| **currency** | INTEGER | NEW: In-game currency balance |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**New Column Migration**:
```sql
ALTER TABLE users
  ADD COLUMN currency INTEGER NOT NULL DEFAULT 0 CHECK (currency >= 0);
```

---

### Battle (Runtime Entity - Not Persisted)

**Purpose**: Represents a battle instance during API request processing

| Field | Type | Description |
|-------|------|-------------|
| battle_id | UUID | Generated for tracking |
| player_pokemon | Object | Player's Pokemon with merged Source data |
| opponent | Object | Generated wild Pokemon |
| turns | Array | Turn-by-turn action log |
| outcome | String | "in_progress", "victory", "defeat", "flee" |
| started_at | ISO8601 | Battle start timestamp |

---

### Turn (Runtime Entity - Part of Battle)

| Field | Type | Description |
|-------|------|-------------|
| turn_number | Integer | Sequential turn number |
| player_action | Action | Player's move result |
| opponent_action | Action | Opponent's move result |

---

### Action (Runtime Entity - Part of Turn)

| Field | Type | Description |
|-------|------|-------------|
| pokemon_name | String | Pokemon performing action |
| move_id | String | Move used |
| move_name | String | Display name of move |
| attack_roll | Integer | d20 + modifiers |
| hit | Boolean | Attack success |
| damage | Integer | Damage dealt (0 if miss) |
| damage_dice | String | Dice rolled (e.g., "1d6") |
| effectiveness | String | "super_effective", "not_effective", "normal", "immune" |
| stab_applied | Boolean | STAB bonus applied |
| target_hp_before | Integer | Target HP before action |
| target_hp_after | Integer | Target HP after action |
| pp_cost | Integer | PP consumed (usually 1) |

---

### Opponent (Runtime Entity - Generated)

| Field | Type | Description |
|-------|------|-------------|
| pokemon_id | String | Source pokemon ID |
| name | String | Pokemon name |
| type | Array<String> | Pokemon types |
| level | Integer | Generated level |
| current_hp | Integer | Current HP |
| max_hp | Integer | Max HP |
| attributes | Object | str, dex, con, int, wis, cha |
| ac | Integer | Armor class |
| moves | Array<Object> | Available moves with full details |

---

## State Transitions

### Player Pokemon HP

```
healthy (current_hp > 0)
    |
    |-- [takes damage] --> damaged (current_hp > 0)
    |                        |
    |                        |-- [takes damage, current_hp <= 0] --> fainted (current_hp = 0)
    |                        |
    |                        |-- [heals] --> healthy
    |
    |-- [instant KO] --> fainted
```

**Fainted State**:
- `current_hp = 0`
- Cannot be used in battle until healed
- Battle API returns error if fainted Pokemon selected

### Experience / Level-Up

```
gaining_xp
    |
    |-- [xp < threshold for next level] --> (no change)
    |
    |-- [xp >= threshold for next level] --> pending_levelup = true
                                               |
                                               |-- [player processes level-up] --> level += 1
                                                                                   pending_levelup = false
                                                                                   (separate endpoint)
```

### PP Management

```
move_pp[move_id] initialized when selected_moves set
    |
    |-- [move used] --> move_pp[move_id] -= 1
    |                    |
    |                    |-- [pp > 0] --> move available
    |                    |
    |                    |-- [pp = 0] --> move unavailable (error if attempted)
    |
    |-- [all moves pp = 0] --> Struggle forced
```

---

## Type Effectiveness Chart

**Implementation Note**: Type chart not in Source data; implement as static utility.

```
Multipliers:
- Super Effective (2x): Attacker type has advantage
- Not Effective (0.5x): Attacker type has disadvantage
- Immune (0x): No damage possible
- Normal (1x): No modifier
```

**Chart Data Structure**:
```javascript
const TYPE_CHART = {
  fire: {
    strong_against: ['grass', 'ice', 'bug', 'steel'],
    weak_against: ['fire', 'water', 'rock', 'dragon'],
    immune_to: [],
    no_effect_on: []
  },
  // ... all 18 types
};
```

---

## Proficiency Table

| Level | Proficiency Bonus |
|-------|-------------------|
| 1-4   | +2 |
| 5-8   | +3 |
| 9-12  | +4 |
| 13-16 | +5 |
| 17-20 | +6 |

---

## Experience Thresholds

| Level | Total XP Required |
|-------|-------------------|
| 1 | 0 |
| 2 | 200 |
| 3 | 800 |
| 4 | 2,000 |
| 5 | 6,000 |
| 6 | 12,000 |
| 7 | 20,000 |
| 8 | 30,000 |
| 9 | 44,000 |
| 10 | 62,000 |
| 11 | 82,000 |
| 12 | 104,000 |
| 13 | 128,000 |
| 14 | 158,000 |
| 15 | 194,000 |
| 16 | 234,000 |
| 17 | 278,000 |
| 18 | 326,000 |
| 19 | 382,000 |
| 20 | 450,000 |
