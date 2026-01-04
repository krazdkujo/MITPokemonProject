# Research: Battle API Endpoint

**Feature**: 006-battle-api
**Date**: 2026-01-03
**Status**: Complete

## Research Topics

### 1. Pokemon 5e Damage Formula

**Decision**: Use the Pokemon 5e formula from `Source/rules/rules.json`

**Rationale**: The rules.json defines combat mechanics clearly:
- **Attack Roll Bonus**: Move Power Mod + Proficiency Mod
- **Damage Bonus**: Move Power Mod + STAB (if applicable)
- **Move Power**: Each move has a `power` array specifying which attribute(s) to use (str, dex, con, int, wis, cha)
- **Dice**: Parsed from move `description` (e.g., "1d6 + MOVE") with `higherLevels` for scaling

**Key Formulas**:
```
Attack Roll = d20 + (Attribute Mod for Move Power) + Proficiency Bonus
Damage = Dice Roll + (Attribute Mod for Move Power) + STAB + Type Effectiveness
STAB = Proficiency Bonus (if move type matches Pokemon type)
Proficiency by Level: L1-4: +2, L5-8: +3, L9-12: +4, L13-16: +5, L17-20: +6
```

**Alternatives Considered**:
- Simplified flat damage: Rejected - loses strategic depth
- Video game formulas: Rejected - not compatible with D&D 5e system

---

### 2. Type Effectiveness Implementation

**Decision**: Build type chart utility using standard Pokemon type rules since `vulnerabilities`, `resistances`, `immunities` arrays in pokemon.json are empty (indicating "use standard type chart")

**Rationale**: Per rules.json section "damage-types-resistance":
- Vulnerability: 2x damage
- Resistance: 0.5x damage
- Immunity: 0x damage
- No double vulnerability/resistance from dual types

**Type Chart Data Source**: Must be implemented as a static lookup table since not present in Source files. Standard 18-type chart:
- Normal, Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy

**Alternatives Considered**:
- Store type chart in Source JSON: Could do later, but static implementation is simpler for initial battle system
- Ignore type effectiveness: Rejected - core to Pokemon battles

---

### 3. Move Structure in Source Data

**Decision**: Parse moves from `Source/moves/moves.json` using the existing structure

**Move Object Shape**:
```json
{
  "id": "tackle",
  "name": "Tackle",
  "type": "normal",
  "power": ["str", "dex"],  // Array of eligible power attributes
  "time": "1 action",
  "pp": 20,
  "duration": "instantaneous",
  "range": "melee",
  "description": "...doing 1d6 + MOVE normal damage on a hit.",
  "higherLevels": "...changes to 1d10 at level 5, 2d8 at level 10, and 5d4 at level 17."
}
```

**Key Insights**:
- `power: "none"` means non-damaging move
- `power: ["str", "dex"]` means choose higher modifier
- Damage dice extracted via regex from description
- Higher level dice specified in `higherLevels` string

**Alternatives Considered**:
- Add structured damage data to moves.json: Would require Source data modification
- Only support subset of moves: Rejected - limits gameplay

---

### 4. Opponent Generation Strategy

**Decision**: Random wild Pokemon selection from Source data, level matched to player Pokemon (+/- 2 levels)

**Rationale**: Provides variety while maintaining fair difficulty. Simple implementation for MVP.

**Algorithm**:
1. Filter Pokemon with SR <= player_trainer_level (use SR 5 max for now)
2. Select random Pokemon from filtered list
3. Set level = player_pokemon_level + random(-2, +2), clamped to 1-20
4. Calculate HP using: `base_hp + (level * hit_die_average) + (CON mod * level)`
5. Select moves available at that level from pokemon.moves

**Alternatives Considered**:
- Fixed opponent list: Rejected - boring, no replayability
- Area-based encounters: Future enhancement
- NPC trainer battles: Future enhancement

---

### 5. PP Tracking in Database

**Decision**: Add `move_pp` JSONB column to `player_pokemon` table storing remaining PP per move

**Rationale**:
- PP varies per move (5-40 range in Source data)
- Must persist between battles
- JSONB allows flexible structure: `{"tackle": 20, "growl": 35}`

**Schema Change**:
```sql
ALTER TABLE player_pokemon ADD COLUMN move_pp JSONB DEFAULT '{}';
```

**Alternatives Considered**:
- Separate junction table: Over-engineered for 4 moves max
- Reset PP after each battle: Doesn't match Pokemon gameplay

---

### 6. Experience and Level-Up Handling

**Decision**: Award XP per Pokemon 5e formula, queue level-ups for player processing

**XP Formula** (from rules.json):
```
XP Awarded = 200 x Opponent Level x Opponent SR
```

**Level-Up Thresholds** (from rules.json):
- L1: 0, L2: 200, L3: 800, L4: 2000, L5: 6000, L6: 12000...

**Schema Change**:
```sql
ALTER TABLE player_pokemon ADD COLUMN experience INTEGER DEFAULT 0;
ALTER TABLE player_pokemon ADD COLUMN pending_levelup BOOLEAN DEFAULT false;
```

**Level-Up Queue**: Set `pending_levelup = true` when XP crosses threshold. Player must call separate endpoint to process level-up (choose moves, allocate ASI points).

**Alternatives Considered**:
- Auto level-up: Rejected - Pokemon 5e requires player choices (ASI, new moves)
- Ignore XP system: Rejected - core progression mechanic

---

### 7. Currency System

**Decision**: Add `currency` column to users table, award on victory

**Currency Formula**:
```
Currency Awarded = Opponent Level * 100
```

**Schema Change**:
```sql
ALTER TABLE users ADD COLUMN currency INTEGER DEFAULT 0;
```

**Alternatives Considered**:
- Per-Pokemon currency: Doesn't match game design
- Complex economy: Over-engineered for MVP

---

### 8. Battle Log Structure

**Decision**: Return structured JSON with turn-by-turn actions for N8N parsing

**Battle Log Shape**:
```json
{
  "battle_id": "uuid",
  "outcome": "victory|defeat|flee",
  "turns": [
    {
      "turn_number": 1,
      "player_action": {
        "pokemon": "bulbasaur",
        "move": "tackle",
        "roll": 15,
        "hit": true,
        "damage": 8,
        "effectiveness": "normal",
        "target_hp_before": 20,
        "target_hp_after": 12
      },
      "opponent_action": {
        "pokemon": "rattata",
        "move": "quick-attack",
        "roll": 12,
        "hit": true,
        "damage": 5,
        "effectiveness": "normal",
        "target_hp_before": 18,
        "target_hp_after": 13
      }
    }
  ],
  "rewards": {
    "experience": 100,
    "currency": 300,
    "level_up_pending": false
  },
  "final_state": {
    "player_pokemon": {
      "current_hp": 13,
      "pp_remaining": {"tackle": 19, "growl": 35}
    }
  }
}
```

**Alternatives Considered**:
- Text-based log: Rejected - harder for N8N to parse
- Minimal response: Rejected - insufficient detail for workflow decisions

---

## Summary of Schema Changes Required

```sql
-- Migration 004: Battle System Support
ALTER TABLE player_pokemon
  ADD COLUMN experience INTEGER DEFAULT 0,
  ADD COLUMN pending_levelup BOOLEAN DEFAULT false,
  ADD COLUMN move_pp JSONB DEFAULT '{}',
  ADD COLUMN selected_moves TEXT[] DEFAULT '{}';

ALTER TABLE users
  ADD COLUMN currency INTEGER DEFAULT 0;
```

## Dependencies Identified

| Dependency | Purpose | Status |
|------------|---------|--------|
| lib/pokemonData.js | Existing Source data loading | Extend with move utilities |
| lib/authHelper.js | JWT authentication | Use as-is |
| lib/apiResponse.js | Response envelope | Use as-is |
| Source/moves/moves.json | Move data | Read-only |
| Source/pokemon/pokemon.json | Pokemon data | Read-only |
| Source/rules/rules.json | Combat rules reference | Read-only |
