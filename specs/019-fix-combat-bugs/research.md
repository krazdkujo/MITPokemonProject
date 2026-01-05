# Research: Fix Combat System Bugs

**Feature**: 019-fix-combat-bugs
**Date**: 2026-01-04

## Bug Investigation Summary

Three interrelated bugs were identified in the grid-based combat system introduced in feature 018-combat-enhancements.

---

## Bug 1: No Opponent Attack Feedback Before Battle Ends

### Symptoms
- Player hits "Pass Turn"
- Pokemon instantly knocked out
- Redirected to PokeCenter with no explanation
- No attack roll, damage, or HP change displayed

### Root Cause Analysis

**Location**: `pages/combat.js` - `processAttackResult()` function (lines 677-749)

**Problem**: When opponent's attack causes a knockout, the battle phase transitions to 'ended' immediately, preventing the UI from rendering the attack feedback.

```javascript
// processAttackResult() - Current flow
if (result.outcome === 'defeat') {
  newState = transitionToEnded(newState, 'defeat');  // Immediate transition
  setBattleResult({ outcome: 'defeat' });            // Shows defeat modal
}
```

The attack log entry IS added to `newState` before this check, but `setBattleResult()` triggers a modal that covers the UI immediately.

### Decision: Delay defeat transition

**Rationale**: Allow time for attack animation and log display before showing defeat screen

**Implementation**:
1. Add attack result to battle log
2. Update HP in state
3. Wait 1.5 seconds for UI feedback
4. Then transition to ended phase and show defeat modal

### Alternatives Considered
1. **Modal delay only**: Just delay the modal, not the state transition. Rejected because state change triggers re-render that may clear animations.
2. **Animation callbacks**: Wait for animation completion. Rejected as overly complex for a bug fix.

---

## Bug 2: HP Not Persisted to Database on Battle End

### Symptoms
- Battle ends in defeat
- Navigate to PokeCenter
- Pokemon shows full HP instead of 0 or damaged HP
- Cannot heal (appears healthy)

### Root Cause Analysis

**Data Flow**:
```
During Battle:
  /api/battle/action -> saves to active_battles.battle_state (combatant HP)
                     -> DOES NOT update player_pokemon.current_hp

Battle End (client-side only):
  transitionToEnded() -> updates local state only
                      -> NO API call to save HP

PokeCenter:
  /api/player/pokemon -> reads player_pokemon.current_hp (original value)
```

**Location**: `pages/combat.js` - No API call on battle end
**Location**: `pages/api/battle/action.js` - Only saves to `active_battles`, not `player_pokemon`

### Decision: Create `/api/battle/end` endpoint

**Rationale**: Centralize battle cleanup in a single endpoint that:
1. Updates `active_battles` status to 'ended'
2. Persists final HP to `player_pokemon` table
3. Returns confirmation

**Implementation**:
- New endpoint: `pages/api/battle/end.js`
- Called from `combat.js` when battle outcome is determined
- Updates both tables in a single transaction-like flow

### Alternatives Considered
1. **Extend /api/battle/action**: Add HP persistence when outcome is returned. Rejected because action.js is already complex and mixing concerns.
2. **Client-side calls**: Make multiple API calls from client. Rejected as error-prone and race-condition susceptible.

---

## Bug 3: Stale Battles Remain in Database

### Symptoms
- Battle ends (victory or defeat)
- Navigate to combat arena later
- "Battle in progress" shows up
- Player has no Pokemon in the battle
- Game is stuck

### Root Cause Analysis

**Current Flow**:
```
Battle Start:
  active_battles { id, user_id, status: 'active', battle_state }

Battle End (grid combat):
  (No API call)
  active_battles still has status: 'active'

Later Navigation:
  /api/battle/active -> finds stale record -> tries to resume broken battle
```

**Location**: `pages/combat.js` - `handleBattleEndContinue()` only navigates, no cleanup
**Comparison**: `/api/battle/abandon.js` DOES update status correctly

### Decision: Use `/api/battle/end` endpoint for cleanup

**Rationale**: The same endpoint that saves HP should also:
1. Update `active_battles.status` to 'victory' or 'defeat'
2. Prevent the record from being loaded as an active battle

**Implementation**:
- `/api/battle/end` accepts `outcome` parameter
- Sets `status` field to match outcome
- Query in `/api/battle/active` already filters by `status = 'active'`

### Alternatives Considered
1. **DELETE the record**: Remove from active_battles on end. Rejected to preserve battle history for potential analytics.
2. **Soft delete with timestamp**: Add `ended_at` timestamp. Rejected as redundant with status field.

---

## Existing Pattern Reference: `/api/battle/abandon.js`

The abandon endpoint shows the correct cleanup pattern:

```javascript
// pages/api/battle/abandon.js - lines 63-78
const updatedState = {
  ...battle.battle_state,
  outcome: 'abandoned',
  phase: 'ended'
};

const { error: updateError } = await supabase
  .from('active_battles')
  .update({
    status: 'abandoned',
    battle_state: updatedState,
    updated_at: new Date().toISOString()
  })
  .eq('id', battle_id);
```

The new `/api/battle/end` endpoint will follow this same pattern with outcome-specific status.

---

## Database Schema Reference

### active_battles table
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
battle_type     TEXT  -- 'wild', 'trainer', 'gym'
status          TEXT  -- 'active', 'abandoned', 'victory', 'defeat'
battle_state    JSONB -- Full combat state including combatant HP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### player_pokemon table
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
pokemon_id      TEXT  -- Reference to Source
level           INTEGER
current_hp      INTEGER  -- <-- MUST BE UPDATED ON BATTLE END
max_hp          INTEGER
selected_moves  TEXT[]
...
```

---

## Implementation Summary

| Fix | File | Change |
|-----|------|--------|
| Attack feedback delay | `combat.js` | Add 1.5s delay before defeat transition |
| HP persistence | New `api/battle/end.js` | Update player_pokemon.current_hp |
| Battle cleanup | New `api/battle/end.js` | Update active_battles.status |
| Client integration | `combat.js` | Call /api/battle/end on victory/defeat |
| Battle log | `combat.js` | Ensure log entry added BEFORE state transition |

---

## Testing Verification

After fixes, verify:
1. Start battle, pass turn, opponent attacks - see attack details in log
2. Pokemon knocked out - see "X took Y damage, fainted" in log
3. 1.5 second delay before defeat modal appears
4. Navigate to PokeCenter - see actual HP (0 or damaged)
5. Heal Pokemon successfully
6. Navigate to zones - no "battle in progress" error
7. Start new battle - works normally
