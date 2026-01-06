# Quickstart: Testing Combat Encounter Bug Fixes

**Date**: 2026-01-06
**Feature**: 020-fix-combat-encounter-bugs

## Overview

This guide provides steps to verify the bug fixes for the three combat encounter issues:
1. Pokemon not showing as available to join encounters
2. False knockout detection
3. Heal button incorrectly disabled

---

## Prerequisites

- Local development environment running (`npm run dev`)
- Supabase connection configured (`.env.local`)
- A test user account

---

## Test Setup: Create NULL HP State

To reproduce the bugs, you need Pokemon with NULL HP values in the database.

### Option 1: Direct Database Update (Supabase Console)

```sql
-- Set current_hp to NULL for a test user's Pokemon
UPDATE player_pokemon
SET current_hp = NULL, max_hp = NULL
WHERE user_id = 'YOUR_USER_ID'
LIMIT 1;
```

### Option 2: Use Fresh Starter Selection

1. Create a new test account
2. Select a starter Pokemon
3. Starter should have NULL HP (not yet set by combat)

---

## Test Case 1: Fresh Pokemon Displays Correctly

**Steps**:
1. Log in with a user who has Pokemon with NULL HP
2. Navigate to Dashboard
3. Check the party display

**Expected (After Fix)**:
- Pokemon shows full HP bar (green)
- HP displays as "XX/XX" where XX is calculated from source data
- Pokemon is not marked as fainted

**Bug Behavior (Before Fix)**:
- Pokemon shows tiny HP bar (1/1)
- May appear nearly dead

---

## Test Case 2: Pokemon Available for Encounter

**Steps**:
1. Log in with a user who has Pokemon with NULL HP
2. Navigate to Zones page
3. Find a zone and start an encounter
4. Check the Pokemon placement panel

**Expected (After Fix)**:
- All healthy Pokemon (including those with NULL HP) appear in placement list
- Can place Pokemon on the battle grid
- No "all knocked out" error

**Bug Behavior (Before Fix)**:
- No Pokemon shown as available
- May redirect to Pokemon Center with "knocked out" message

---

## Test Case 3: Heal Button State Correct

**Steps**:
1. Log in with a user who has:
   - At least one Pokemon with NULL HP (should be treated as healthy)
   - Optionally, one Pokemon with actual damage (current_hp < max_hp)
2. Navigate to Pokemon Center

**Expected (After Fix)**:

| Party State | Heal Button | Message |
|-------------|-------------|---------|
| All NULL HP | Disabled | "Your Pokemon are already healthy!" |
| All full HP | Disabled | "Your Pokemon are already healthy!" |
| Any damaged | Enabled | (no message) |
| Any fainted | Enabled | (no message) |

**Bug Behavior (Before Fix)**:
- Button disabled when it should be enabled
- Or button enabled for "healthy" Pokemon that are actually at 1/1 HP

---

## Test Case 4: Battle Flow End-to-End

**Steps**:
1. Start with fresh/healed Pokemon
2. Navigate to Zones
3. Start an encounter
4. Place Pokemon on grid
5. Take damage from opponent (let opponent hit you)
6. Either win or flee the battle
7. Check Dashboard - Pokemon should show damage
8. Navigate to Pokemon Center
9. Heal button should be enabled
10. Click Heal
11. All Pokemon should return to full HP
12. Navigate back to Zones
13. All Pokemon should be available for new encounter

**Expected**: Complete flow without soft-locks or incorrect states

---

## Test Case 5: Mixed Party States

**Steps**:
1. Create a party with:
   - Pokemon A: NULL HP (fresh)
   - Pokemon B: current_hp = max_hp (full health)
   - Pokemon C: current_hp = 20, max_hp = 45 (damaged)
   - Pokemon D: current_hp = 0 (fainted)
2. Check Zones page

**Expected**:
- Pokemon A, B, C available for combat
- Pokemon D NOT available (fainted)
- Heal button ENABLED (Pokemon C and D need healing)

---

## Verification Commands

### Check Database State

```sql
-- View HP values for your test user
SELECT
  pokemon_id,
  current_hp,
  max_hp,
  is_active
FROM player_pokemon
WHERE user_id = 'YOUR_USER_ID'
ORDER BY slot_number;
```

### Check API Response

Open browser dev tools, navigate to Dashboard, and check Network tab:
- Request: `GET /api/player/pokemon`
- Response should show correct HP values (not 1/1)

---

## Common Issues After Fix

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Still seeing 1 HP | Browser cache | Hard refresh (Ctrl+Shift+R) |
| API returns old data | Server cache | Restart dev server |
| HP shows NaN | Source Pokemon not found | Check pokemon_id in DB |

---

## Rollback Plan

If the fix causes unexpected issues:

1. Revert `lib/pokemonData.js` to previous version
2. Restart dev server
3. Report specific failure case with:
   - Database HP values
   - API response
   - Expected vs actual behavior
