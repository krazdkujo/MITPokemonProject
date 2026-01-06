# Quickstart: Combat Test Harness

**Date**: 2026-01-06
**Branch**: `021-combat-test-harness`

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Development server running for web UI (`npm run dev`)

## Quick Start - Web UI

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser to: `http://localhost:3000/test-combat`

3. Select Pokemon:
   - Choose Pokemon 1 from dropdown (defaults to Pikachu)
   - Choose Pokemon 2 from dropdown (defaults to Bulbasaur)
   - Optionally set levels (default: 5)

4. Run simulation:
   - **Step-by-step**: Click "Start Battle", then "Next Turn" for each turn
   - **Auto-run**: Toggle "Auto-run" on, adjust speed slider, click "Start Battle"

5. Review logs in the scrollable log panel on the right

## Quick Start - CLI

Run a default simulation (Pikachu vs Bulbasaur, both level 5):
```bash
npm run test:combat
```

Customize the battle:
```bash
npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle --level1 10 --level2 8
```

Reproduce a specific battle:
```bash
npm run test:combat -- --seed 1704537600000
```

## Common Use Cases

### Testing a Specific Matchup

Test Fire vs Water type effectiveness:
```bash
npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle
```

### Testing High-Level Combat

See how combat scales at higher levels:
```bash
npm run test:combat -- --level1 15 --level2 15
```

### Reproducing a Bug

1. Note the seed from a previous run
2. Re-run with that seed:
   ```bash
   npm run test:combat -- --seed 1704537600000
   ```

### Finding Calculation Bugs

Look for these patterns in the log:
- **Attack Roll Issues**: Check `d20(X) + Y = Z` math
- **Damage Issues**: Verify dice rolls, modifiers, STAB, type multipliers
- **Status Issues**: Look for "Status applied/blocked" entries

## Log Reading Guide

### Attack Entry Format
```
▶ POKEMON uses MOVE
  Target: TARGET
  ├─ Attack Roll: d20(14) + 5 = 19 vs AC 13 → HIT
  ├─ Damage: 2d6(4,3) + 3 + 2 = 12
  ├─ Type: Fire vs Grass → 2x (super effective)
  └─ Result: 24 damage → TARGET HP: 35→11
```

### Key Indicators
- `→ HIT/MISS` - Attack outcome
- `(super effective)` / `(not very effective)` / `(immune)` - Type matchup
- `STAB` - Same Type Attack Bonus applied
- `CRIT!` - Critical hit (double damage)
- `Status: BURNED` - Status condition applied

## Troubleshooting

### "Pokemon not found" Error
- Verify Pokemon ID is lowercase (e.g., "pikachu" not "Pikachu")
- Check Pokemon exists in Source/pokemon/pokemon.json

### Combat Takes Too Long
- Max turns default is 100
- Low-damage matchups may take many turns
- Use higher levels for faster resolution

### Results Not Reproducible
- Ensure same `--seed` value
- Verify same Pokemon IDs and levels
- Check no code changes between runs

## Next Steps

After running simulations:
1. Identify bugs in combat calculations
2. Check `lib/battleEngine.js` for attack/damage logic
3. Check `lib/statusEffects.js` for status application
4. Check `lib/typeEffectiveness.js` for type multipliers
