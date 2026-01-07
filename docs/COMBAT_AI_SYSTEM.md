# Combat AI System Documentation

## Overview

The MIT Pokemon Project uses a **weighted scoring system** for AI decision-making in grid-based 5e-style combat. The AI evaluates all possible moves, assigns scores based on tactical factors, and selects the highest-scoring option.

**Key Principle:** The AI can **move AND attack** in the same turn. Move selection considers post-movement range, then the turn executes movement followed by the attack.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Turn Execution Flow](#turn-execution-flow)
3. [Scoring System](#scoring-system)
4. [Movement Logic](#movement-logic)
5. [Combat Calculations](#combat-calculations)
6. [Status Effect Handling](#status-effect-handling)
7. [AI Modes (Test Harness)](#ai-modes-test-harness)
8. [API Integration](#api-integration)
9. [Quick Reference](#quick-reference)

---

## Architecture Overview

### Core Files

| File | Purpose |
|------|---------|
| `lib/combatAI.js` | Scoring weights and live battle AI (`executeAITurn`) |
| `lib/combatSimulator.js` | Test harness with Random/Tactical AI modes |
| `lib/moveRanges.js` | Range parsing and distance calculations |
| `lib/typeEffectiveness.js` | Type chart and damage multipliers |
| `lib/statusEffects.js` | Status conditions and turn processing |
| `lib/gridUtils.js` | Grid math (Manhattan distance, valid targets) |
| `pages/api/battle/ai-turn.js` | API endpoint for live battle AI decisions |
| `pages/api/test-combat/start.js` | Test harness API (accepts aiMode parameter) |

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Combat AI System                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐          ┌─────────────────────────────┐  │
│  │  Live Battles   │          │      Test Harness           │  │
│  │  (API endpoint) │          │   (/test-combat page)       │  │
│  └────────┬────────┘          └──────────────┬──────────────┘  │
│           │                                  │                  │
│           ▼                                  ▼                  │
│  ┌─────────────────┐          ┌─────────────────────────────┐  │
│  │  combatAI.js    │          │   combatSimulator.js        │  │
│  │  executeAITurn()│          │   selectMove()              │  │
│  └────────┬────────┘          └──────────────┬──────────────┘  │
│           │                                  │                  │
│           │                   ┌──────────────┴──────────────┐  │
│           │                   │                             │  │
│           │           ┌───────▼───────┐     ┌───────▼──────┐  │
│           │           │ AI_MODE.RANDOM│     │AI_MODE.TACTICAL│ │
│           │           │ (random pick) │     │(weighted score)│ │
│           │           └───────────────┘     └───────────────┘  │
│           │                                         │          │
│           └────────────────────┬────────────────────┘          │
│                                │                                │
│                                ▼                                │
│                    ┌───────────────────────┐                   │
│                    │     AI_WEIGHTS        │                   │
│                    │   (shared constants)  │                   │
│                    └───────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Turn Execution Flow

### Simulation Turn Flow (`combatSimulator.js`)

Each combatant's turn follows this sequence:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TURN EXECUTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. STATUS CHECK                                                │
│     └─ Process start-of-turn status (paralysis, sleep, etc.)   │
│     └─ Skip turn if incapacitated                              │
│                                                                 │
│  2. MOVE SELECTION  ◄─── Random OR Tactical mode               │
│     ├─ Get available moves (PP > 0)                            │
│     ├─ No moves? → Use Struggle                                │
│     └─ Select best move based on AI mode:                      │
│         ├─ RANDOM: Pick randomly from available                │
│         └─ TACTICAL: Score all moves, pick highest             │
│                      (considers POST-MOVEMENT range)           │
│                                                                 │
│  3. MOVEMENT (if needed)                                        │
│     ├─ Calculate distance to target                            │
│     ├─ Check if selected move is in range                      │
│     ├─ If out of range: Move toward target                     │
│     └─ Update position and movement_remaining                  │
│                                                                 │
│  4. ATTACK EXECUTION                                            │
│     ├─ Roll attack or force save                               │
│     ├─ Calculate damage with type effectiveness                │
│     ├─ Apply status effects if triggered                       │
│     └─ Update target HP                                        │
│                                                                 │
│  5. END OF TURN                                                 │
│     └─ Process end-of-turn status (burn/poison damage)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Point:** Steps 3 and 4 happen in the **same turn**. The AI selects the best move considering whether movement will bring it into range, then executes both movement and attack.

---

## Scoring System

### Weight Constants

Defined in `lib/combatAI.js`:

```javascript
const AI_WEIGHTS = {
  // Type matchups
  TYPE_ADVANTAGE_2X: 50,         // Super effective (2x)
  TYPE_ADVANTAGE_4X: 100,        // Double super effective (4x)
  TYPE_DISADVANTAGE_HALF: -30,   // Not very effective (0.5x)
  TYPE_DISADVANTAGE_QUARTER: -60,// Doubly resisted (0.25x)

  // Move properties
  STATUS_ON_HEALTHY: 20,         // Status move on target without status
  STATUS_ON_STATUSED: -50,       // Status move on already-statused target
  LOW_PP_WARNING: -10,           // Move has ≤2 PP remaining

  // Target selection
  TARGET_LOW_HP: 15,             // Target is at ≤25% HP

  // Range considerations
  IN_RANGE: 100,                 // Target is reachable now
  OUT_OF_RANGE: -1000            // Target cannot be hit even after moving
};
```

### Tactical Scoring (Test Harness)

The tactical AI in `combatSimulator.js` scores moves considering **post-movement range**:

```javascript
function selectMoveTactical(combatant, target, availableMoves) {
  // Calculate current state
  const currentDistance = getManhattanDistance(combatant.position, target.position);
  const movementBudget = combatant.movement_remaining ?? 6;

  for (const move of availableMoves) {
    let score = 0;
    const moveRange = getMoveRange(move);

    // Range scoring - considers movement!
    const inRangeNow = currentDistance <= moveRange;
    const distanceAfterMove = Math.max(1, currentDistance - movementBudget);
    const inRangeAfterMove = distanceAfterMove <= moveRange;

    if (inRangeNow) {
      score += IN_RANGE;              // +100 (already in range)
    } else if (inRangeAfterMove) {
      score += IN_RANGE - 20;         // +80 (reachable after moving)
    } else {
      score += OUT_OF_RANGE;          // -1000 (unreachable)
    }

    // Type effectiveness
    const effectiveness = getEffectiveness(move.type, target.type);
    if (effectiveness.multiplier >= 4) score += TYPE_ADVANTAGE_4X;
    else if (effectiveness.multiplier >= 2) score += TYPE_ADVANTAGE_2X;
    else if (effectiveness.multiplier <= 0.25) score += TYPE_DISADVANTAGE_QUARTER;
    else if (effectiveness.multiplier <= 0.5) score += TYPE_DISADVANTAGE_HALF;
    else if (effectiveness.multiplier === 0) score += -2000; // Immune

    // Target HP
    if ((target.current_hp / target.max_hp) <= 0.25) {
      score += TARGET_LOW_HP;
    }

    // Status moves
    if (isStatusMove) {
      score += target.status_effects?.length > 0
        ? STATUS_ON_STATUSED
        : STATUS_ON_HEALTHY;
    }

    // PP warning
    if (currentPp <= 2) score += LOW_PP_WARNING;
  }
}
```

### Scoring Examples

**Example 1: Super-effective move out of range**
```
Ember (Fire, 30ft range) vs Bulbasaur (Grass), 8 cells away, 6 movement

  Distance after moving: max(1, 8-6) = 2 cells
  Move range: 6 cells (30ft)
  2 ≤ 6 → IN RANGE AFTER MOVING

  Base:                     0
+ In range after move:    +80
+ Super effective (2x):   +50
──────────────────────────────
  TOTAL:                  130   ← AI picks this, moves, then attacks!
```

**Example 2: Weak move already in range**
```
Tackle (Normal, melee) vs Bulbasaur (Grass), adjacent

  Base:                     0
+ In range now:          +100
+ Neutral effectiveness:   +0
──────────────────────────────
  TOTAL:                  100   ← Lower score than Ember above
```

**Example 3: Unreachable move**
```
Flamethrower (Fire, 60ft) vs Bulbasaur, 20 cells away, 6 movement

  Distance after moving: max(1, 20-6) = 14 cells
  Move range: 12 cells (60ft)
  14 > 12 → OUT OF RANGE EVEN AFTER MOVING

  Base:                     0
+ Out of range:         -1000
+ Super effective (4x): +100
──────────────────────────────
  TOTAL:                 -900   ← Heavily penalized, won't pick
```

---

## Movement Logic

### Grid System

- **Grid size:** 10×10 cells (A-J columns, 1-10 rows)
- **Cell size:** 5 feet per cell
- **Distance:** Manhattan distance (no diagonals)
- **Default positions:** Player at D2, Opponent at G9

### Range Parsing

| Move Range | Cells | Type | Example Moves |
|------------|-------|------|---------------|
| `"melee"` or `"5"` | 1 | Single target | Tackle, Scratch |
| `"30ft"` | 6 | Single target | Ember, Water Gun |
| `"60ft"` | 12 | Single target | Flamethrower |
| `"self"` | 0 | Self-buff | Harden, Roost |
| `"self (30ft cone)"` | 6 | AoE attack | Acid |
| `"self (80ft line)"` | 16 | AoE attack | Solar Beam |

### Movement Execution

Located in `executeAIMovement()`:

```
1. Check if already moved this turn → Skip if true
2. Calculate current distance to target
3. Get move range in cells
4. If already in range → No movement needed
5. If out of range:
   a. Get valid movement targets within movement budget
   b. Find cell that minimizes distance to target
   c. Move to that cell
   d. Update position and movement_remaining
```

### Movement Budget

- **Base walking speed:** 6 cells (30ft)
- **Modified by:** DEX modifier (±1-2 cells)
- **Resets:** At start of each round
- **Tracking:** `movement_remaining` and `has_moved_this_turn`

---

## Combat Calculations

### Attack Roll

```
Attack Roll = d20 + Power Modifier + Proficiency Bonus

Natural 1  = Auto-miss
Natural 20 = Critical hit (or move's crit range, e.g., 18-20)
```

### Damage Calculation

```
Damage = Base Dice Roll
       + Power Modifier (STR/DEX/INT/WIS/CHA)
       + STAB Bonus (if move type matches Pokemon type)
       × Type Effectiveness (0x, 0.25x, 0.5x, 1x, 2x, 4x)
       × Critical Multiplier (2x on crit)

STAB Bonus = Proficiency Bonus (if applicable)
```

### Proficiency Bonus by Level

| Level | Proficiency |
|-------|-------------|
| 1-4   | +2 |
| 5-8   | +3 |
| 9-12  | +4 |
| 13-16 | +5 |
| 17-20 | +6 |

---

## Status Effect Handling

### Status Types

| Status | Volatile | Duration | Effect on AI |
|--------|----------|----------|--------------|
| ASLEEP | Yes | 3 rounds | Skip turn |
| BURNED | No | Until cured | Tick damage |
| FROZEN | No | Until cured | Skip turn |
| PARALYZED | No | Until cured | 25% skip turn |
| POISONED | No | Until cured | Tick damage |
| CONFUSED | Yes | 3 rounds | Random behavior |
| FLINCHED | Yes | 1 round | Disadvantage |

### AI Status Scoring

- **+20 points:** Status move on healthy target
- **-50 points:** Status move on already-statused target

---

## AI Modes (Test Harness)

The test harness at `/test-combat` supports two AI modes:

### Random Mode (`AI_MODE.RANDOM`)

- **Behavior:** Picks randomly from available moves
- **Use case:** Stress testing mechanics, balance testing
- **Reproducible:** Yes, via seeded RNG

### Tactical Mode (`AI_MODE.TACTICAL`)

- **Behavior:** Uses weighted scoring system
- **Considers:**
  - Post-movement range (can move AND attack)
  - Type effectiveness
  - Target HP (focus fire)
  - Status move appropriateness
  - PP conservation
- **Use case:** AI decision quality testing, gameplay simulation

### Configuration

```javascript
import { createSimulation, AI_MODE } from './combatSimulator';

const simulation = createSimulation({
  pokemon1: { id: 'bulbasaur', level: 5 },
  pokemon2: { id: 'charmander', level: 5 },
  seed: 12345,
  aiMode: AI_MODE.TACTICAL  // or AI_MODE.RANDOM
});
```

### UI Toggle

The test harness UI includes an AI Mode toggle:
- **Random** button (green when active)
- **Tactical** button (red when active)

The active mode is displayed in the footer alongside the seed.

### AI Reasoning Log

In Tactical mode, the battle log shows AI decision reasoning:
```
[AI] Tactical: Ember (score: 130) | In range after moving (2 cells needed) | Super effective (2x)
```

---

## API Integration

### Test Harness API

**Start Battle:** `POST /api/test-combat/start`

```json
{
  "pokemon1": { "id": "bulbasaur", "level": 5 },
  "pokemon2": { "id": "charmander", "level": 5 },
  "seed": 12345,
  "aiMode": "tactical"
}
```

**Response:**
```json
{
  "simulation": {
    "id": "uuid",
    "seed": 12345,
    "aiMode": "tactical",
    "combatant1": { ... },
    "combatant2": { ... }
  }
}
```

### Live Battle AI API

**AI Turn:** `POST /api/battle/ai-turn`

```json
{
  "battle_id": "uuid",
  "battle_state": { ... },
  "combatant_id": "opponent-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action_type": "attack",
    "move_id": "ember",
    "target_id": "player-pokemon-uuid",
    "score": 150,
    "reasoning": ["In range", "Super effective (2x)"]
  }
}
```

---

## Quick Reference

### Scoring Weights

| Factor | Weight | Notes |
|--------|--------|-------|
| In range now | +100 | Best case |
| In range after moving | +80 | Slight penalty for needing to move |
| Out of range | -1000 | Effectively blocks selection |
| Type 4x | +100 | Double super effective |
| Type 2x | +50 | Super effective |
| Type 0.5x | -30 | Not very effective |
| Type 0.25x | -60 | Doubly resisted |
| Type immune | -2000 | Never use |
| Target low HP | +15 | Focus fire on weak targets |
| Status on healthy | +20 | Good status opportunity |
| Status on statused | -50 | Avoid redundant status |
| Low PP (≤2) | -10 | Conserve moves |
| Self-buff move | +20 | Usable but very low priority |
| Buff already active | -100 | Don't re-apply same buff |
| Status/debuff move | +50 | Lower than attacks, used strategically |

### Decision Priority

1. **Can act?** (not fainted, not status-skipped)
2. **Has moves?** (PP > 0, else Struggle)
3. **Range check** (considering movement)
4. **Type effectiveness**
5. **Target HP focus**
6. **Status appropriateness**
7. **PP conservation**

### File References

| Purpose | File |
|---------|------|
| Scoring weights | `lib/combatAI.js` |
| Test harness AI | `lib/combatSimulator.js` |
| Range utilities | `lib/moveRanges.js` |
| Type chart | `lib/typeEffectiveness.js` |
| Status effects | `lib/statusEffects.js` |
| Grid utilities | `lib/gridUtils.js` |
| Test harness API | `pages/api/test-combat/start.js` |
| Live battle API | `pages/api/battle/ai-turn.js` |
| Test harness UI | `pages/test-combat.js` |
