# Research: Combat AI System Analysis

**Feature**: 026-combat-ai-docs
**Date**: 2026-01-07
**Status**: Complete

## Overview

This document contains the complete analysis of the combat AI system extracted from the source code. All findings are verified against `lib/combatAI.js` and `lib/combatSimulator.js`.

---

## 1. AI Weight Constants

**Source**: `lib/combatAI.js:15-34`

### Complete Weight Reference

| Constant | Value | Category | Purpose |
|----------|-------|----------|---------|
| `TYPE_ADVANTAGE_2X` | +50 | Type Matchup | Bonus for 2x super effective moves |
| `TYPE_ADVANTAGE_4X` | +100 | Type Matchup | Bonus for 4x super effective moves |
| `TYPE_DISADVANTAGE_HALF` | -30 | Type Matchup | Penalty for 0.5x not very effective |
| `TYPE_DISADVANTAGE_QUARTER` | -60 | Type Matchup | Penalty for 0.25x not very effective |
| `MOVE_POWER_PER_10` | +1 | Move Property | Unused in current implementation |
| `STATUS_ON_HEALTHY` | +20 | Move Property | Bonus for status moves on healthy targets |
| `STATUS_ON_STATUSED` | -50 | Move Property | Penalty for status moves on already-statused targets |
| `LOW_PP_WARNING` | -10 | Move Property | Penalty when PP <= 2 |
| `TARGET_LOW_HP` | +15 | Target Selection | Bonus when target HP <= 25% |
| `IN_RANGE` | +100 | Range | Bonus when target is in range |
| `OUT_OF_RANGE` | -1000 | Range | Heavy penalty when target is out of range |

### Weight Design Philosophy

- **IN_RANGE (+100)** is the baseline for viable moves
- **OUT_OF_RANGE (-1000)** effectively eliminates out-of-range options
- Type advantages can swing scores by +50 to +100
- Status considerations prevent wasteful status stacking

---

## 2. AI Modes

**Source**: `lib/combatSimulator.js:49-52`

### Mode Constants

```javascript
export const AI_MODE = {
  RANDOM: 'random',     // Random move selection
  TACTICAL: 'tactical'  // Weighted scoring from combatAI.js
};
```

### Mode Behavior Differences

| Aspect | Random Mode | Tactical Mode |
|--------|-------------|---------------|
| Move Selection | Random from available | Highest scored |
| Type Awareness | None | Uses TYPE_ADVANTAGE weights |
| Range Awareness | None | Uses IN_RANGE/OUT_OF_RANGE |
| PP Conservation | None | LOW_PP_WARNING penalty |
| Target Priority | None | TARGET_LOW_HP bonus |

---

## 3. Decision Flow Analysis

### Main Orchestration: `executeAITurn()`

**Source**: `lib/combatAI.js:276-360`

```
START
  │
  ├─► Check combatant/battleState validity
  │     └─► Invalid? Return 'pass'
  │
  ├─► Filter moves with PP > 0
  │     └─► No moves? Return 'attack' with 'struggle'
  │
  ├─► Filter valid targets (HP > 0, not fainted)
  │     └─► No targets? Return 'pass'
  │
  ├─► Score all (move × target) combinations
  │     └─► Track bestScore, bestMove, bestTarget
  │
  ├─► If bestScore < 0 (likely out of range)
  │     ├─► Calculate optimal movement
  │     └─► If movement possible, return 'move' action
  │
  └─► Return 'attack' with bestMove and bestTarget
```

### Move Scoring: `scoreMoveOption()`

**Source**: `lib/combatAI.js:61-131`

```
START with score = 0
  │
  ├─► Check PP availability
  │     ├─► PP = 0? Return -Infinity
  │     └─► PP <= 2? score += LOW_PP_WARNING (-10)
  │
  ├─► Range check
  │     ├─► In range? score += IN_RANGE (+100)
  │     └─► Out of range? score += OUT_OF_RANGE (-1000)
  │
  ├─► Type effectiveness
  │     ├─► 4x effective? score += TYPE_ADVANTAGE_4X (+100)
  │     ├─► 2x effective? score += TYPE_ADVANTAGE_2X (+50)
  │     ├─► 0.25x effective? score += TYPE_DISADVANTAGE_QUARTER (-60)
  │     └─► 0.5x effective? score += TYPE_DISADVANTAGE_HALF (-30)
  │
  ├─► Target HP check
  │     └─► HP <= 25%? score += TARGET_LOW_HP (+15)
  │
  └─► Status move check
        ├─► Target has status? score += STATUS_ON_STATUSED (-50)
        └─► Target healthy? score += STATUS_ON_HEALTHY (+20)
```

### Tactical Selection: `selectMoveTactical()`

**Source**: `lib/combatSimulator.js:804-933`

Enhanced scoring that considers:
- Post-movement range (can move AND attack same turn)
- Self-target move detection (buffs like Harden)
- Damaging vs non-damaging move classification
- Immunity detection (score -= 2000)

---

## 4. Component Reference

### Core Functions

| Function | File:Line | Purpose |
|----------|-----------|---------|
| `calculateTypeEffectiveness()` | combatAI.js:43-50 | Get type multiplier |
| `scoreMoveOption()` | combatAI.js:61-131 | Score a single move |
| `findBestTarget()` | combatAI.js:141-169 | Select best target |
| `calculateOptimalMovement()` | combatAI.js:179-266 | Plan movement path |
| `executeAITurn()` | combatAI.js:276-360 | Main turn orchestration |

### Helper Functions (combatSimulator.js)

| Function | Purpose |
|----------|---------|
| `selectMove()` | Dispatch to random or tactical |
| `selectMoveTactical()` | Enhanced tactical scoring |
| `isSelfTargetMove()` | Detect buff moves |
| `checkIfDamagingMove()` | Check for damage dice |
| `getMoveRange()` | Parse move range |
| `executeAIMovement()` | Execute movement toward target |

---

## 5. Edge Cases

### Struggle Fallback

**Trigger**: No moves with PP > 0
**Behavior**: Returns `{ action_type: 'attack', move_id: 'struggle' }`
**Source**: combatAI.js:299-304

### No Valid Targets

**Trigger**: All player combatants fainted or HP <= 0
**Behavior**: Returns `{ action_type: 'pass' }`
**Source**: combatAI.js:310-313

### Out of Range with Movement

**Trigger**: Best scoring move has negative score (OUT_OF_RANGE penalty)
**Behavior**:
1. Calculate optimal movement toward targets
2. If movement possible, return 'move' action
3. Otherwise, proceed with attack (will miss/fail)
**Source**: combatAI.js:334-345

### Tie Breaking

**Current Behavior**: First move evaluated with highest score wins
**Note**: No explicit tie-breaking logic - iteration order determines winner

### Immunity Detection

**Trigger**: Type effectiveness multiplier = 0
**Behavior**: score -= 2000 (never selected)
**Source**: combatSimulator.js:893-896

---

## 6. Movement Algorithm

### Path Calculation

**Algorithm**: Manhattan distance pathfinding
**Priority**: Horizontal movement first, then vertical
**Constraint**: Cannot move onto target's cell

```
1. Find closest valid target (lowest Manhattan distance)
2. If already adjacent (distance <= 1), skip movement
3. Move toward target within movement budget:
   - Move horizontally until aligned
   - Then move vertically
4. Stop one cell before target position
```

### Movement Budget

- Default: 6 cells (30ft)
- Can be modified by `walking_speed` property
- Tracked per turn via `movement_remaining`

---

## 7. Integration Points

### Dependencies

- `lib/typeEffectiveness.js` - `getEffectiveness()`
- `lib/moveRanges.js` - `parseRange()`, `isInRange()`
- `lib/gridUtils.js` - `getManhattanDistance()`, `getValidMoveTargets()`

### Consumers

- `lib/combatSimulator.js` - Main battle simulation
- `pages/api/battle/*.js` - Battle API endpoints

---

## Decisions & Rationale

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Weight-based scoring | Simple, tunable, explainable | Neural network (too complex), rule-based (less flexible) |
| Heavy OUT_OF_RANGE penalty | Forces movement before attack | Could allow ranged anticipation |
| Lowest HP targeting | Efficient KO strategy | Type advantage targeting (more complex) |
| Manhattan distance | Simple grid pathfinding | A* (overkill for simple grid) |
