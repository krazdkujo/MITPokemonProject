# Quickstart: Gen 1 Pokemon Reduction

**Feature Branch**: `025-gen1-pokemon`
**Date**: 2026-01-07

## Overview

Reduce the Pokemon roster from 1,142 to the original 151 (Gen 1: Bulbasaur through Mew).

## Prerequisites

- Node.js 18+
- Access to project repository
- Git checkout on branch `025-gen1-pokemon`

## Quick Implementation Steps

### Step 1: Filter Pokemon Data

Filter `Source/pokemon/pokemon.json` to keep only entries where `number` is 1-151.

```javascript
// Filter script concept
const pokemon = require('./Source/pokemon/pokemon.json');
const gen1 = pokemon.filter(p => p.number >= 1 && p.number <= 151);
// Write back to file
```

**Expected result**: 151 Pokemon entries (down from 1,142)

### Step 2: Update Location Encounters

Update `Source/locations.json` to remove references to Pokemon #152+.

For each location's `pokemon` array, keep only IDs that exist in the filtered pokemon.json.

### Step 3: Filter Evolution Chains

Update `Source/evolution/evolution.json`:
- Remove entries for Pokemon #152+
- Remove evolution paths leading to Pokemon #152+

Key cases:
- Eevee: Keep Vaporeon, Jolteon, Flareon
- Eevee: Remove Espeon, Umbreon, Leafeon, Glaceon, Sylveon

### Step 4: Delete Non-Gen 1 Images

Remove image files from `public/images/pokemon/`:

```bash
# Delete images 152-1025
cd public/images/pokemon
rm -f {152..1025}.png
```

**Expected result**: 152 files remain (1-151 + placeholder.png)

### Step 5: Verify

1. Start dev server: `npm run dev`
2. Check starter selection shows only Gen 1 starters
3. Verify wild encounters only spawn Gen 1 Pokemon
4. Test battle system with Gen 1 Pokemon
5. Confirm all Pokemon images load without errors

## Key Files

| File | Action |
|------|--------|
| `Source/pokemon/pokemon.json` | Filter to #1-151 |
| `Source/locations.json` | Update encounter arrays |
| `Source/evolution/evolution.json` | Remove non-Gen 1 evolutions |
| `public/images/pokemon/` | Delete #152-1025 images |

## No Changes Needed

- `Source/moves/moves.json` - Keep all moves
- `Source/abilities/abilities.json` - Keep all abilities
- `Source/zones.json` - Auto-filters based on pokemon.json
- `lib/*.js` - Data-agnostic code
- `pages/**/*.js` - Data-agnostic code
- `components/**/*.js` - Data-agnostic code

## Validation Checklist

- [ ] pokemon.json has exactly 151 entries
- [ ] All Pokemon numbers are 1-151
- [ ] No location references invalid Pokemon
- [ ] No evolution chain references Pokemon #152+
- [ ] Only 152 image files in pokemon directory
- [ ] Application runs without errors
- [ ] All Pokemon sprites display correctly

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Missing Pokemon image | Check file exists as `{number}.png` |
| Empty encounter pool | Verify location has valid Gen 1 Pokemon |
| Evolution error | Ensure evolution targets are Gen 1 |
| API returns non-Gen 1 | Clear cache, verify pokemon.json filtered |

## Next Steps

After basic reduction:
1. Run `/speckit.tasks` to generate detailed implementation tasks
2. Execute tasks in dependency order
3. Run tests: `npm test`
4. Verify with lint: `npm run lint`
