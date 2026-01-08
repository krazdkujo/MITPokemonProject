# Quickstart: Remove Random Mode from Combat Harness

**Feature**: 027-combat-ai-harness
**Date**: 2026-01-07

## Overview

This feature removes the random AI mode from the combat test harness. After implementation, all battles use tactical AI exclusively for consistent AI tuning.

## Verification Steps

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Web Harness

1. Navigate to `http://localhost:3000/test-combat`
2. Verify NO AI mode toggle/dropdown is visible
3. Select two Pokemon and start a battle
4. Observe battle log - every move should have AI reasoning:
   ```
   [AI] Tactical: Vine Whip (score: 150) | In range | Super effective (2x)
   ```

### 3. Test CLI Harness

```bash
# Run a test battle
npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur --level1 5 --level2 5

# Verify output shows AI reasoning for each move
# Look for lines like: [AI] Tactical: Thunder Shock (score: 120)
```

### 4. Verify Reproducibility

Run the same battle twice with the same seed:

```bash
npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle --seed 12345
npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle --seed 12345
```

Both runs should produce identical AI decisions and battle outcomes.

### 5. Quick Battle Generator

1. In web harness, use "Quick Battle" to generate random matchup
2. Verify the generated battle uses tactical AI (reasoning in logs)

## Expected Changes

### UI Changes
- **Removed**: AI mode selector dropdown
- **Unchanged**: All other controls (seed, speed, step mode, Pokemon selection)

### Log Changes
- AI reasoning now appears for **every** move selection
- Format: `[AI] Tactical: {MoveName} (score: {N}) | {reasons...}`

### API Changes
- `POST /api/test-combat/start` ignores any `aiMode` parameter
- Response no longer includes `aiMode` in simulation config

## Troubleshooting

### No AI Reasoning in Logs?
- Check that `combatSimulator.js` was properly updated
- Verify the conditional logging check was removed

### Different Results with Same Seed?
- This should not happen - tactical mode is deterministic
- If it does, verify no random calls outside seeded RNG

### UI Still Shows AI Toggle?
- Hard refresh the page (Ctrl+Shift+R)
- Clear browser cache if needed
- Verify `pages/test-combat.js` changes are deployed

## Files Modified

| File | Change |
|------|--------|
| `lib/combatSimulator.js` | Remove AI_MODE, always use tactical |
| `pages/test-combat.js` | Remove aiMode state and UI |
| `pages/api/test-combat/start.js` | Remove aiMode handling |
| `scripts/test-combat.js` | Remove --aiMode flag (if present) |
