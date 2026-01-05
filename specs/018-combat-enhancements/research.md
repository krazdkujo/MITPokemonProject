# Research: Combat System Enhancements

**Feature**: 018-combat-enhancements
**Date**: 2026-01-04

## 1. PP Display Bug Root Cause Analysis

### Decision: Fix inconsistent known_moves data structure

**Findings**:
The "No PP" bug occurs due to inconsistent data structures between player and opponent combatants:

- **Player combatants** (battle/start.js line 200): `known_moves` returns full move objects with `id`, `name`, `type`, `power`, `pp`, etc.
- **Opponent combatants** (battle/start.js line 219): `known_moves` returns move IDs only (string array)

When MoveSelector receives opponent data, it expects move objects with `.id` property. When it receives strings (move IDs), `move.id` is undefined, causing PP lookup to fail.

**Root Cause Code** (components/Combat/MoveSelector.js line 52):
```javascript
const remainingPp = movePp[move.id] ?? move.pp ?? 0;  // move.id is undefined if move is a string
```

**Rationale**: The fix should normalize data at the API level (buildOpponentCombatant) to match player structure, rather than adding defensive code everywhere.

**Alternatives Considered**:
1. Fix in MoveSelector to handle both formats - Rejected: Creates fragile code, doesn't fix root cause
2. Fix in combat.js before passing to MoveSelector - Rejected: Bandaid fix, other components would still fail
3. Fix in battleEngine.js buildOpponentCombatant - **Selected**: Single source of truth, consistent data structure

---

## 2. Move Range Parsing Strategy

### Decision: Parse range strings into numeric cell distances with type classification

**Findings**:
Source moves.json uses string-based ranges with these patterns:

| Pattern | Examples | Proposed Cell Distance | Type |
|---------|----------|----------------------|------|
| `"melee"` | absorb, accelerock, acrobatics | 1 | single-target |
| `"self"` | acid-armor, agility, amnesia | 0 | self |
| `"Xft"` (direct) | 30ft, 50ft, 60ft, 80ft | X/5 (rounded) | single-target |
| `"self (Xft cone)"` | acid (30ft cone), ancient-power (15ft cone) | X/5 | area-cone |
| `"self (Xft line)"` | aeroblast (50ft line) | X/5 | area-line |
| `"self (Xft radius)"` | aurora-veil (10ft radius) | X/5 | area-radius |
| `"5ft"` | aura-sphere | 1 | single-target |
| `"varies"` | assist | 6 (default) | variable |

**Conversion Formula**: 1 grid cell = 5 feet (standard D&D/5e scale)

**Rationale**:
- Pokemon 5e uses D&D 5e distance conventions (5ft = 1 square)
- Parsing at runtime allows Source data to remain unchanged
- Type classification enables different targeting UI behaviors

**Alternatives Considered**:
1. Add `range_cells` field to moves.json - Rejected: Violates constitution (Source is read-only, would require maintaining two values)
2. Hard-code all ranges - Rejected: Unmaintainable, error-prone
3. Runtime parsing with caching - **Selected**: Flexible, respects Source authority

---

## 3. Movement Range Implementation

### Decision: Use speed attribute with 6-cell default, track remaining movement per turn

**Findings**:
Current implementation has `movement_remaining: 30` in combatant structure (30 feet = 6 cells).
The action.js enforces a hard-coded 6-cell limit at line 306:
```javascript
const maxDistance = 6;  // Hard-coded
```

Pokemon 5e base walking speed is 30ft (6 cells), which aligns with current implementation.

**Rationale**:
- Keep default of 6 cells (30ft) for all Pokemon
- Track `movement_remaining` per turn for future partial movement support
- Reset movement at start of each turn

**Alternatives Considered**:
1. Use Pokemon speed stat - Rejected: Not all Pokemon have speed in Source data, adds complexity
2. Fixed 6-cell for all - **Selected**: Matches Pokemon 5e base speed, consistent behavior
3. Variable by Pokemon type - Rejected: Over-engineering for initial implementation

---

## 4. AI Decision-Making Strategy

### Decision: Weighted scoring system with tactical factors

**Findings**:
Current AI (combat.js line 529) uses random selection:
```javascript
const randomMoveIndex = Math.floor(Math.random() * availableMoves.length);
const randomTargetIndex = Math.floor(Math.random() * availableTargets.length);
```

**Proposed Scoring Factors**:

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Type advantage (2x/4x) | +50/+100 | Primary tactical consideration |
| Type disadvantage (0.5x/0.25x) | -30/-60 | Discourage poor matchups |
| Move power (base damage) | +1 per 10 power | Prefer stronger moves |
| Status move on healthy target | +20 | Strategic value |
| Status move on statused target | -50 | Don't stack status |
| PP remaining < 3 | -10 | Conserve low PP moves |
| Target at low HP (<25%) | +15 | Finish off weakened targets |
| In range vs out of range | +100 / -1000 | Must be in range to attack |

**Movement AI**:
1. If best target is in range, don't move (attack immediately)
2. If no targets in range, move toward closest target
3. Use A* or simple Manhattan distance for pathfinding
4. Avoid moving through occupied cells

**Rationale**:
- Weighted scoring provides deterministic but varied behavior
- Easy to tune and debug
- Completes within serverless timeout (< 2 seconds)

**Alternatives Considered**:
1. Pure random - Rejected: Current approach, provides no challenge
2. Machine learning - Rejected: Overkill, requires training data, unpredictable
3. Minimax/game tree - Rejected: Too slow for serverless, over-engineered
4. Weighted scoring - **Selected**: Simple, tunable, fast, observable behavior

---

## 5. Stat Tooltip Design

### Decision: React component with absolute positioning relative to grid cell

**Findings**:
Current grid cells display minimal info:
- Pokemon sprite
- HP bar (color-coded)
- Status effect abbreviations (3 chars)
- Damage animation

**Proposed Tooltip Content**:
```
+----------------------------------+
| Bulbasaur (Lv. 5)               |
| HP: 18/22                        |
| Type: Grass / Poison             |
| AC: 12                           |
+----------------------------------+
| STR: 10 (+0)  INT: 14 (+2)      |
| DEX: 12 (+1)  WIS: 12 (+1)      |
| CON: 14 (+2)  CHA: 10 (+0)      |
+----------------------------------+
| Proficiency: +2                  |
+----------------------------------+
| Moves:                           |
|   Tackle     [15/20 PP]         |
|   Growl      [20/20 PP]         |
|   Vine Whip  [10/15 PP]         |
|   Leech Seed [ 8/10 PP]         |
+----------------------------------+
| Status: None                     |
+----------------------------------+
```

**Positioning Logic**:
- Appear on right side of cell if cell is in left half of grid
- Appear on left side of cell if cell is in right half of grid
- Never overlap other Pokemon or battle log

**Rationale**:
- Comprehensive stat display for tactical decisions
- PP display helps plan move usage
- Consistent with D&D 5e character sheet layout

**Alternatives Considered**:
1. Modal popup on click - Rejected: Breaks flow, requires extra action
2. Sidebar always visible - Rejected: Takes screen space, can't see all Pokemon
3. Hover tooltip - **Selected**: Intuitive, non-intrusive, standard UX pattern

---

## 6. Database Persistence Validation

### Decision: Verify state integrity with checksums and automated testing

**Findings**:
Current persistence flow:
1. Battle state saved after each action (action.js)
2. State stored as JSONB in `battle_state` column of `active_battles` table
3. State loaded on page load via `GET /api/battle/state/[battleId]`

**Identified Gaps**:
- No verification that saved state matches in-memory state after reload
- No error handling for partial writes
- No logging of state changes for debugging

**Proposed Validation**:
1. Add state hash to battle_state for integrity checking
2. Compare loaded state hash with saved hash
3. Add retry logic for failed saves (3 attempts with exponential backoff)
4. Log state snapshots for debugging

**Rationale**:
- Integrity checking catches corruption
- Retry logic handles transient failures
- Logging aids debugging without performance impact

**Alternatives Considered**:
1. Trust database always works - Rejected: Naive, will eventually fail
2. Full state comparison on every load - Rejected: Performance overhead
3. Hash-based verification - **Selected**: Lightweight, catches most issues

---

## Summary of Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| PP Bug | Fix in buildOpponentCombatant | Single source of truth |
| Move Ranges | Parse at runtime, 1 cell = 5ft | Respects Source authority |
| Movement | 6-cell default, track per turn | Matches Pokemon 5e base speed |
| AI | Weighted scoring system | Fast, tunable, observable |
| Tooltip | Hover-based React component | Intuitive UX, comprehensive info |
| Persistence | Hash verification + retry | Reliability without overhead |
