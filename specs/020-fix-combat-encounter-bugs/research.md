# Research: Fix Combat Encounter Bugs

**Date**: 2026-01-06
**Feature**: 020-fix-combat-encounter-bugs

## Executive Summary

Investigation reveals three interconnected bugs caused by inconsistent HP default handling across multiple code paths. The core issue: when `current_hp` is NULL in the database, different modules apply different defaults (1, max_hp, or source base HP), causing state desynchronization.

---

## Bug 1: Pokemon Not Showing as Available to Join Encounter

### Root Cause Analysis

**Location**: `lib/pokemonData.js:134` and `lib/gameContext.js:87-88`

**The Problem**:
```javascript
// pokemonData.js line 134
current_hp: dbRecord.current_hp || 1,  // NULL defaults to 1

// gameContext.js line 87-88
is_fainted: p.current_hp === 0,  // 1 !== 0, so not fainted
hp_percentage: p.max_hp > 0 ? Math.round((p.current_hp / p.max_hp) * 100) : 0
```

When `current_hp` is NULL in the database:
1. `pokemonData.js` defaults it to 1
2. `gameContext.js` sees `current_hp = 1`, considers Pokemon alive
3. But `battleEngine.js:358` uses a different chain: `dbRecord.current_hp || dbRecord.max_hp || sourcePokemon.hp`
4. This mismatch means the zones page and combat page calculate availability differently

**Evidence**: The zones page filters `party.filter(p => p.current_hp > 0)` but the party data comes through `gameContext.js` which already applied the faulty default.

### Decision

**Fix**: Standardize HP defaults at the data layer (`pokemonData.js`):
- `current_hp`: If NULL, default to `max_hp` (healthy), not 1
- `max_hp`: If NULL, calculate from `sourcePokemon.hp`

**Rationale**: A Pokemon with no HP record should be assumed healthy (never been in combat), not nearly dead.

**Alternatives Rejected**:
- Fix at each consumption point: Too many places to change, error-prone
- Database migration to set defaults: Doesn't prevent future NULL values

---

## Bug 2: False Knockout Detection

### Root Cause Analysis

**Location**: `lib/pokemonData.js:119-120, 134-135`

**The Problem**:
```javascript
// When sourcePokemon not found (line 119-120)
current_hp: dbRecord.current_hp || 1,
max_hp: dbRecord.max_hp || 1,

// Normal path (line 134-135)
current_hp: dbRecord.current_hp || 1,
max_hp: dbRecord.max_hp || 1,
```

Both paths default to 1 HP, which:
1. Makes Pokemon appear nearly dead (1 HP)
2. Creates visual confusion (tiny HP bar)
3. Triggers "all knocked out" logic when combined with other bugs

**Evidence**: If `max_hp` is also NULL, both become 1, and `hp_percentage` shows 100% (1/1=100%), but actual HP is 1. The heal button sees `current_hp (1) < max_hp (1)` as false (1 is not less than 1), so healing is disabled.

### Decision

**Fix**: Use source Pokemon HP for defaults:
```javascript
const effectiveMaxHp = dbRecord.max_hp || sourcePokemon.hp || 20;
const effectiveCurrentHp = dbRecord.current_hp ?? effectiveMaxHp;
```

**Rationale**: NULL means "no data yet", not "1 HP". Source data provides the correct max HP.

**Key Change**: Use `??` (nullish coalescing) instead of `||` to only trigger on NULL/undefined, not on 0 (actual knockout).

---

## Bug 3: Heal Button Greyed Out Incorrectly

### Root Cause Analysis

**Location**: `pages/pokecenter.js:305-307`

**The Problem**:
```javascript
const needsHealing = party.length > 0 && party.some(
  (pokemon) => pokemon.current_hp < pokemon.max_hp
);
```

This logic is correct, but fails when:
1. `current_hp` defaulted to 1 at `pokemonData.js` level
2. `max_hp` also defaulted to 1
3. Result: `1 < 1` = false, button disabled
4. But HP bar shows 100% (1/1) visually

**Evidence**: `gameContext.js:88` calculates `hp_percentage: Math.round((p.current_hp / p.max_hp) * 100)` which gives 100% when both are 1.

### Decision

**Fix**: The pokecenter logic is correct. Fixing the data layer (`pokemonData.js`) resolves this automatically.

**Rationale**: Don't add workarounds in the UI - fix the data source.

---

## Code Change Summary

### Files to Modify

| File | Change | Risk |
|------|--------|------|
| `lib/pokemonData.js` | Fix HP defaults in `buildPlayerPokemonResponse` | Low - central data layer |
| `lib/battleEngine.js` | Verify `buildCombatant` alignment (already better) | Low - already uses fallback chain |

### Files to Verify (No Changes Expected)

| File | Verification |
|------|--------------|
| `lib/gameContext.js` | Confirm it correctly passes through fixed data |
| `pages/pokecenter.js` | Confirm needsHealing logic works with fixed data |
| `pages/zones.js` | Confirm availability filter works with fixed data |
| `pages/combat.js` | Confirm unplaced Pokemon logic works with fixed data |

### Key Code Fix

**Before** (`lib/pokemonData.js:108-141`):
```javascript
export function buildPlayerPokemonResponse(dbRecord) {
  const sourcePokemon = getPokemonById(dbRecord.pokemon_id);

  if (!sourcePokemon) {
    return {
      // ...
      current_hp: dbRecord.current_hp || 1,  // BAD: defaults to 1
      max_hp: dbRecord.max_hp || 1,          // BAD: defaults to 1
      // ...
    };
  }

  return {
    // ...
    current_hp: dbRecord.current_hp || 1,  // BAD: defaults to 1
    max_hp: dbRecord.max_hp || 1,          // BAD: defaults to 1
    // ...
  };
}
```

**After**:
```javascript
export function buildPlayerPokemonResponse(dbRecord) {
  const sourcePokemon = getPokemonById(dbRecord.pokemon_id);

  if (!sourcePokemon) {
    // Fallback for unknown Pokemon - use 1 as we have no source data
    const fallbackMaxHp = dbRecord.max_hp || 1;
    return {
      // ...
      max_hp: fallbackMaxHp,
      current_hp: dbRecord.current_hp ?? fallbackMaxHp,  // NULL = healthy
      // ...
    };
  }

  // Use source Pokemon HP as authoritative max
  const effectiveMaxHp = dbRecord.max_hp || sourcePokemon.hp || 20;
  return {
    // ...
    max_hp: effectiveMaxHp,
    current_hp: dbRecord.current_hp ?? effectiveMaxHp,  // NULL = healthy
    // ...
  };
}
```

---

## Verification Test Cases

After fix, these scenarios must work:

1. **Fresh Pokemon (NULL HP in DB)**:
   - Should display at 100% HP
   - Should be selectable for combat
   - Heal button should be disabled (already healthy)

2. **Damaged Pokemon (current_hp < max_hp in DB)**:
   - Should display correct HP percentage
   - Should be selectable for combat
   - Heal button should be enabled

3. **Fainted Pokemon (current_hp = 0 in DB)**:
   - Should display at 0% HP
   - Should NOT be selectable for combat
   - Heal button should be enabled

4. **Mixed Party (some NULL, some damaged, some fainted)**:
   - Each Pokemon displays correct status
   - Only healthy/damaged Pokemon selectable for combat
   - Heal button enabled if ANY Pokemon needs healing

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing Pokemon data | Low | High | Using `??` preserves 0 values |
| Regression in combat calculations | Low | Medium | battleEngine already handles nulls well |
| Visual display issues | Low | Low | HP percentage calculation unchanged |

---

## Conclusion

Single-point fix at `lib/pokemonData.js` resolves all three bugs by establishing correct HP defaults at the data layer. No database changes required. Existing combat engine code (`battleEngine.js`) already uses a better fallback pattern that we're aligning to.
