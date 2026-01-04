# Data Model: Zone-Based Pokemon Encounters

**Feature**: 016-zone-encounters
**Date**: 2026-01-04

## Entities

### Zone (Source Data - Read Only)

Stored in `Source/zones.json`. Reference data, not user state.

```typescript
interface Zone {
  id: string;                    // Unique identifier (e.g., "water-pond")
  name: string;                  // Display name (e.g., "Tranquil Pond")
  terrain: TerrainType;          // Terrain category
  difficulty: DifficultyTier;    // Easy, Medium, Hard, Expert
  srRange: {
    min: number;                 // Minimum SR for encounters
    max: number;                 // Maximum SR for encounters
  };
  types: PokemonType[];          // Pokemon types that can appear
  description: string;           // Thematic description
}

type TerrainType =
  | "water" | "fire" | "grass" | "electric"
  | "cave" | "forest" | "mountain" | "urban";

type DifficultyTier = "easy" | "medium" | "hard" | "expert";

type PokemonType =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";
```

### Zone Configuration Example

```json
{
  "zones": [
    {
      "id": "water-pond",
      "name": "Tranquil Pond",
      "terrain": "water",
      "difficulty": "easy",
      "srRange": { "min": 0, "max": 0.5 },
      "types": ["water", "ice"],
      "description": "A peaceful pond where young Water Pokemon gather."
    },
    {
      "id": "water-lake",
      "name": "Crystal Lake",
      "terrain": "water",
      "difficulty": "medium",
      "srRange": { "min": 0.5, "max": 2 },
      "types": ["water", "ice"],
      "description": "A large lake home to moderately strong aquatic Pokemon."
    },
    {
      "id": "water-river",
      "name": "Rushing Rapids",
      "terrain": "water",
      "difficulty": "hard",
      "srRange": { "min": 2, "max": 6 },
      "types": ["water", "ice"],
      "description": "Fast-flowing waters where powerful Water Pokemon train."
    },
    {
      "id": "water-ocean",
      "name": "Deep Ocean",
      "terrain": "water",
      "difficulty": "expert",
      "srRange": { "min": 6, "max": 30 },
      "types": ["water", "ice"],
      "description": "The vast ocean depths where legendary aquatic Pokemon dwell."
    }
  ]
}
```

### Active Battle (Database Table)

New table for persisting battle state across sessions.

```sql
-- sql/006_active_battles.sql
CREATE TABLE active_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  zone_id TEXT NOT NULL,
  battle_state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'victory', 'defeat', 'fled', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure only one active battle per user
CREATE UNIQUE INDEX idx_active_battles_user_active
ON active_battles(user_id)
WHERE status = 'active';

-- Enable RLS
ALTER TABLE active_battles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own battles"
ON active_battles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own battles"
ON active_battles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own battles"
ON active_battles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_active_battles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER active_battles_updated_at
BEFORE UPDATE ON active_battles
FOR EACH ROW EXECUTE FUNCTION update_active_battles_updated_at();
```

### Battle State (JSONB Schema)

The `battle_state` column stores full combat state for resume.

```typescript
interface BattleState {
  battle_id: string;             // UUID
  battle_type: "wild";           // Only wild encounters for zones
  phase: "setup" | "combat" | "ended";

  // Grid state (10x10)
  grid: GridCell[][];

  // Combatants
  combatants: {
    player: Combatant[];
    opponent: Combatant[];
  };

  // Turn tracking
  initiative_order: string[];    // Combatant IDs in order
  current_turn_index: number;
  round_number: number;

  // Battle outcome
  outcome: "ongoing" | "victory" | "defeat" | "fled" | "abandoned";

  // Timestamps
  started_at: string;            // ISO timestamp
  last_action_at: string;        // ISO timestamp

  // Selection state (ephemeral, reset on load)
  selected: {
    pokemon: string | null;
    move: string | null;
    action: string | null;
  };

  // Log (optional, for replay)
  battle_log: LogEntry[];
}

interface Combatant {
  combatant_id: string;          // UUID
  pokemon_id: string;            // Reference to Source
  number: number;                // Dex number for sprites
  owner: "player" | "opponent";
  name: string;
  level: number;

  // State that changes during battle
  current_hp: number;
  max_hp: number;
  position: { col: number; row: number } | null;
  status_effects: StatusEffect[];
  move_pp: Record<string, number>;
  has_moved_this_turn: boolean;
  is_fainted: boolean;

  // Reference data (from Source, cached for quick access)
  type: string[];
  attributes: Attributes;
  ac: number;
  known_moves: string[];
  abilities: Ability[];
  sr: number;
  initiative_roll: number;
}

interface GridCell {
  col: number;
  row: number;
  notation: string;              // e.g., "A1"
  occupant_type: "empty" | "pokemon" | "obstacle";
  occupant_id: string | null;
  terrain: string | null;
  is_highlighted: boolean;
  highlight_type: string | null;
}
```

## Relationships

```
users (1) ─────── (0..1) active_battles
                         │
                         │ zone_id references
                         ▼
                  Source/zones.json
                         │
                         │ types filter
                         ▼
                  Source/pokemon/pokemon.json
```

## State Transitions

### Battle Lifecycle

```
[No Battle] ──(select zone)──> [Active: Setup Phase]
                                      │
                                (place Pokemon)
                                      │
                                      ▼
                              [Active: Combat Phase]
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                (all opponent KO)  (all player KO)  (flee/abandon)
                     │                │                │
                     ▼                ▼                ▼
                 [Victory]        [Defeat]       [Fled/Abandoned]
                     │                │                │
                     └────────────────┴────────────────┘
                                      │
                              (record archived)
                                      │
                                      ▼
                                [No Battle]
```

### Status Values

| Status | Description | Can Start New Battle? |
|--------|-------------|----------------------|
| active | Battle in progress | No |
| victory | Player won | Yes (archived) |
| defeat | Player lost | Yes (archived) |
| fled | Player fled during combat | Yes (archived) |
| abandoned | Player explicitly forfeited | Yes (archived) |

## Validation Rules

### Zone Selection
- User must have at least one Pokemon with HP > 0
- User must not have an active battle (status = 'active')

### Encounter Generation
- Pokemon must match at least one zone type (primary or secondary)
- Pokemon SR must be within zone's srRange
- Random selection weighted by inverse rarity (common Pokemon more frequent)

### Battle State Updates
- Only the owning user can update their battle
- Status can only transition forward (active -> any terminal state)
- Combatant HP cannot go below 0 or above max_hp
- Position updates must be to valid, unoccupied grid cells

## Indexes

```sql
-- Fast lookup of user's active battle
CREATE UNIQUE INDEX idx_active_battles_user_active
ON active_battles(user_id) WHERE status = 'active';

-- Query historical battles by user
CREATE INDEX idx_active_battles_user_created
ON active_battles(user_id, created_at DESC);

-- Filter by status for cleanup jobs
CREATE INDEX idx_active_battles_status
ON active_battles(status) WHERE status = 'active';
```
