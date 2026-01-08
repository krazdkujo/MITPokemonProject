# Data Model: Combat AI System

**Feature**: 026-combat-ai-docs
**Date**: 2026-01-07

## Entities

### AI_WEIGHTS

The central configuration object controlling AI scoring behavior.

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| TYPE_ADVANTAGE_2X | number | 50 | Score bonus for 2x super effective moves |
| TYPE_ADVANTAGE_4X | number | 100 | Score bonus for 4x super effective moves |
| TYPE_DISADVANTAGE_HALF | number | -30 | Score penalty for 0.5x effectiveness |
| TYPE_DISADVANTAGE_QUARTER | number | -60 | Score penalty for 0.25x effectiveness |
| MOVE_POWER_PER_10 | number | 1 | Per-10 power bonus (unused) |
| STATUS_ON_HEALTHY | number | 20 | Bonus for status on healthy target |
| STATUS_ON_STATUSED | number | -50 | Penalty for status on statused target |
| LOW_PP_WARNING | number | -10 | Penalty when PP <= 2 |
| TARGET_LOW_HP | number | 15 | Bonus when target HP <= 25% |
| IN_RANGE | number | 100 | Bonus when target in range |
| OUT_OF_RANGE | number | -1000 | Penalty when target out of range |

### AI_MODE

Constants for AI behavior mode selection.

| Field | Type | Value | Description |
|-------|------|-------|-------------|
| RANDOM | string | "random" | Random move selection |
| TACTICAL | string | "tactical" | Weighted scoring selection |

### ScoreMoveResult

Return type from `scoreMoveOption()`.

| Field | Type | Description |
|-------|------|-------------|
| score | number | Calculated score (higher = better) |
| reasoning | string[] | Human-readable explanation steps |

### FindTargetResult

Return type from `findBestTarget()`.

| Field | Type | Description |
|-------|------|-------------|
| target | Object\|null | Selected target combatant |
| reasoning | string[] | Selection explanation |

### MovementResult

Return type from `calculateOptimalMovement()`.

| Field | Type | Description |
|-------|------|-------------|
| destination | {col, row}\|null | Target cell coordinates |
| reasoning | string[] | Movement explanation |

### AITurnResult

Return type from `executeAITurn()`.

| Field | Type | Description |
|-------|------|-------------|
| action_type | string | "attack", "move", or "pass" |
| move_id | string\|null | Selected move ID |
| target_id | string\|null | Target combatant ID |
| destination | {col, row}\|null | Movement destination |
| score | number | Final action score |
| reasoning | string[] | Complete decision trace |

### TacticalSelectResult

Return type from `selectMoveTactical()`.

| Field | Type | Description |
|-------|------|-------------|
| move | Object\|null | Selected move object |
| reasoning | string[] | Scoring explanation |

---

## Relationships

```
AI_MODE
    │
    └───► selectMove() ─────► selectMoveTactical() (if tactical)
                │                      │
                │                      ├───► scoreMoveOption()
                │                      │         │
                │                      │         └───► AI_WEIGHTS
                │                      │
                │                      └───► AITurnResult
                │
                └───► random selection (if random)

executeAITurn()
    │
    ├───► scoreMoveOption() ×N (all move+target combos)
    │         │
    │         └───► AI_WEIGHTS
    │
    ├───► calculateOptimalMovement() (if out of range)
    │         │
    │         └───► findBestTarget()
    │
    └───► AITurnResult
```

---

## State Transitions

### AI Turn Flow

```
[IDLE]
    │
    ▼
[EVALUATING_MOVES]
    │
    ├── No PP available ──────────────► [STRUGGLE]
    │
    ├── No valid targets ─────────────► [PASS]
    │
    ├── Best move in range ───────────► [ATTACK]
    │
    └── Best move out of range
            │
            ├── Can move closer ──────► [MOVE]
            │
            └── Cannot reach ─────────► [ATTACK] (suboptimal)
```

### Score Calculation Flow

```
[BASE_SCORE = 0]
    │
    ├── PP Check ────► PP=0? REJECT (-Infinity)
    │                  PP<=2? score -= 10
    │
    ├── Range Check ──► In range? score += 100
    │                   Out of range? score -= 1000
    │
    ├── Type Check ───► 4x? score += 100
    │                   2x? score += 50
    │                   0.5x? score -= 30
    │                   0.25x? score -= 60
    │                   0x? score -= 2000
    │
    ├── HP Check ─────► Target HP <= 25%? score += 15
    │
    └── Status Check ─► Status on healthy? score += 20
                        Status on statused? score -= 50
```

---

## Validation Rules

| Rule | Enforcement | Source |
|------|-------------|--------|
| PP must be > 0 to use move | `scoreMoveOption()` returns -Infinity | combatAI.js:70-74 |
| Target must have HP > 0 | Filtered before scoring | combatAI.js:147 |
| Target must not be fainted | Filtered before scoring | combatAI.js:147 |
| Cannot move onto occupied cell | Path calculation stops | combatAI.js:244-252 |
| Movement <= walking_speed | Movement budget enforced | combatAI.js:228 |
