# Quickstart: Testing Combat Bug Fixes

**Feature**: 019-fix-combat-bugs
**Date**: 2026-01-04

## Prerequisites

1. Dev server running: `npm run dev`
2. Logged in via `/test-auth`
3. At least one Pokemon in your party

---

## Test Scenarios

### Test 1: Opponent Attack Feedback

**Goal**: Verify opponent attacks show full details before defeat

**Steps**:
1. Navigate to `/zones`
2. Click on a zone to encounter a wild Pokemon
3. Start the battle and place your Pokemon
4. Click "Pass Turn" repeatedly until your Pokemon is knocked out
5. **OBSERVE**: Before defeat modal appears:
   - Battle log shows opponent's attack
   - Move name visible
   - Damage/HP change visible
   - ~1.5 second delay before modal

**Expected Result**:
- See log entry like: "Rattata used Tackle. Hit! 8 damage. Growlithe HP: 4 -> 0"
- HP bar animates to 0
- Brief pause
- Then defeat modal appears

---

### Test 2: HP Persistence to Database

**Goal**: Verify HP is saved correctly after battle

**Steps**:
1. Start a battle (per Test 1)
2. Let opponent damage your Pokemon (but don't faint)
3. **Note the current HP** (e.g., 15/25)
4. Flee the battle (or get defeated)
5. Navigate to `/pokecenter`
6. Check your Pokemon's HP display

**Expected Result**:
- PokeCenter shows the SAME HP as end of battle (15/25 or 0/25)
- NOT full HP
- Heal button is available and functional

---

### Test 3: Battle Cleanup (No Stale Battles)

**Goal**: Verify ended battles don't block new encounters

**Steps**:
1. Complete a battle (victory or defeat)
2. Navigate to `/zones`
3. Try to encounter another wild Pokemon
4. Start the new battle

**Expected Result**:
- No "Battle in progress" error
- New battle starts fresh
- Previous battle not loaded

---

### Test 4: Victory Path

**Goal**: Verify victory also triggers cleanup

**Steps**:
1. Start a battle against weak Pokemon (low level zone)
2. Defeat the opponent
3. Collect any rewards
4. Navigate to `/zones`
5. Start another battle

**Expected Result**:
- Victory modal shows with rewards
- New battle available immediately
- No stale battle blocking

---

### Test 5: PokeCenter Healing After Defeat

**Goal**: Verify healing works after battle

**Steps**:
1. Get defeated in battle (Pokemon at 0 HP)
2. Navigate to `/pokecenter`
3. Click heal on your fainted Pokemon

**Expected Result**:
- Pokemon shows 0 HP (not full)
- Heal button is clickable
- After healing, HP is restored to max
- Currency deducted appropriately

---

## Verification Checklist

| Test | Description | Pass/Fail |
|------|-------------|-----------|
| 1 | Opponent attack feedback visible | [ ] |
| 2 | HP persisted correctly | [ ] |
| 3 | No stale battles after defeat | [ ] |
| 4 | No stale battles after victory | [ ] |
| 5 | PokeCenter healing works | [ ] |

---

## Console Debugging

If issues occur, check browser console for:

```javascript
// Expected log on battle end
console.log('Calling /api/battle/end with:', { battle_id, outcome, combatants });

// Expected response
{ success: true, data: { battle_id, outcome, hp_updated: [...], battle_status } }
```

Check Network tab for:
- POST `/api/battle/end` - should return 200
- GET `/api/player/pokemon` - should show updated HP

---

## Rollback

If fixes cause new issues:
1. Revert changes to `combat.js`
2. Revert changes to `processAttackResult()` delay
3. Delete `pages/api/battle/end.js`
4. Original behavior restored (with original bugs)
