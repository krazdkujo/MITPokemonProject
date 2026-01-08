# Quick Reference: Combat AI System

**Feature**: 026-combat-ai-docs
**Date**: 2026-01-07

## At a Glance

The combat AI uses **weighted scoring** to select the best move against the best target.

### AI Modes

| Mode | Behavior |
|------|----------|
| `random` | Picks randomly from available moves |
| `tactical` | Scores all options, picks highest |

---

## Weight Cheat Sheet

### Positive Weights (Higher = Better)

| Weight | Value | When Applied |
|--------|-------|--------------|
| `IN_RANGE` | +100 | Target within move range |
| `TYPE_ADVANTAGE_4X` | +100 | 4x super effective |
| `TYPE_ADVANTAGE_2X` | +50 | 2x super effective |
| `STATUS_ON_HEALTHY` | +20 | Status move on target without status |
| `TARGET_LOW_HP` | +15 | Target HP <= 25% |

### Negative Weights (Lower = Worse)

| Weight | Value | When Applied |
|--------|-------|--------------|
| `OUT_OF_RANGE` | -1000 | Target outside move range |
| `TYPE_DISADVANTAGE_QUARTER` | -60 | 0.25x effectiveness |
| `STATUS_ON_STATUSED` | -50 | Status move on already-statused target |
| `TYPE_DISADVANTAGE_HALF` | -30 | 0.5x effectiveness |
| `LOW_PP_WARNING` | -10 | Move has PP <= 2 |

---

## Decision Flow (TL;DR)

```
1. Filter moves with PP > 0
2. Filter targets with HP > 0
3. Score every (move, target) pair
4. If best score < 0 → try to move closer
5. Execute highest-scoring action
```

---

## Score Calculation Example

**Scenario**: Charizard vs Venusaur, Fire Blast in range

```
Base score:              0
+ IN_RANGE:           +100
+ TYPE_ADVANTAGE_4X:  +100  (Fire vs Grass/Poison)
───────────────────────────
Final score:           200
```

**Scenario**: Same move, out of range

```
Base score:              0
+ OUT_OF_RANGE:      -1000
+ TYPE_ADVANTAGE_4X:  +100
───────────────────────────
Final score:          -900  (AI will move instead)
```

---

## Key Functions

| Function | Purpose | File |
|----------|---------|------|
| `executeAITurn()` | Main entry point | combatAI.js |
| `scoreMoveOption()` | Score a single move | combatAI.js |
| `selectMoveTactical()` | Enhanced scoring | combatSimulator.js |
| `calculateOptimalMovement()` | Path to target | combatAI.js |

---

## Edge Cases

| Situation | AI Behavior |
|-----------|-------------|
| No PP left | Uses Struggle |
| All targets fainted | Passes turn |
| Out of range | Moves toward target |
| Tied scores | First evaluated wins |
| Immune target | score -= 2000 (never selected) |

---

## Tuning Tips

- Increase `TYPE_ADVANTAGE_*` to make AI more type-aware
- Decrease `OUT_OF_RANGE` penalty to allow risky positioning
- Increase `TARGET_LOW_HP` to make AI more aggressive at finishing
- Adjust `STATUS_ON_*` to control status move frequency
