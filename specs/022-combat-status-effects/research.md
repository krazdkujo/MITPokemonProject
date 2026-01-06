# Research: Combat Status Effects Integration

**Feature**: 022-combat-status-effects
**Date**: 2026-01-06

## Overview

Research into existing move effect patterns in the Source data (~800 moves) and current implementation gaps.

## Move Effect Patterns Discovered

### 1. Healing Effects

**Pattern Types**:
- "Half the damage done is restored by the user" - Drain moves (Absorb, Drain Punch, etc.)
- "regain X hit points" - Fixed healing
- "regain Xd4 + MOVE hit points" - Dice-based healing
- "cured of any negative status conditions" - Status healing

**Decision**: Create `parseHealingEffect()` function
**Rationale**: Consistent patterns allow regex-based parsing
**Alternatives Considered**: Hardcoded move IDs (rejected - not maintainable with 800 moves)

### 2. Recoil Effects

**Pattern Types**:
- "taking a quarter of the total damage (rounded down) in typeless recoil" - 25% recoil
- "taking half of the total damage (rounded down) in typeless recoil" - 50% recoil
- "taking 1/2 the damage dealt in typeless recoil" - 50% (alternate wording)
- "taking 1/4 of the damage (rounded down) in typeless recoil" - 25% (alternate)

**Decision**: Create `parseRecoilEffect()` function with percentage extraction
**Rationale**: All use "recoil" keyword with fraction indicators
**Alternatives Considered**: Flat recoil values (rejected - not present in data)

### 3. AC Modification Effects

**Pattern Types**:
- "target's AC is reduced by 1" - Defense lowering
- "target's AC is decreased by 1 for the remainder of combat" - Duration-based
- "AC increases by 2" - Self buff
- "gain +2 to their AC" - Ally buff

**Decision**: Create `parseACEffect()` function
**Rationale**: Clear numeric patterns with direction indicators
**Alternatives Considered**: None - straightforward implementation

### 4. Status Effect Triggers

**Pattern Types Confirmed**:
1. **Save-based (fail by 5+)**: "If a creature fails the save by 5 or more, they are burned"
2. **Natural roll threshold**: "On a natural attack roll of 18 or more, the target is burned"
3. **Natural roll range**: "On natural attack rolls of 19 or 20, the target flinches"
4. **Automatic on hit**: "On a hit, the target is paralyzed"
5. **Save failure**: "On a failure, the target is poisoned"

**Decision**: Extend existing `parseStatusTrigger()` to handle all 5 patterns
**Rationale**: Existing function handles some patterns; needs extension for completeness
**Alternatives Considered**: Separate parser (rejected - duplicates existing code)

### 5. Speed Modification Effects

**Pattern Types**:
- "target's speed is halved" - Speed reduction
- "speed increases by 10ft" - Speed buff
- "speed is reduced by 5 feet" - Incremental reduction

**Decision**: Create `parseSpeedEffect()` function
**Rationale**: Speed effects impact movement in grid combat
**Alternatives Considered**: Ignore for now (rejected - affects combat tactics)

### 6. Stat Modification Effects

**Pattern Types**:
- "Strength score by 10" - Stat boost
- "STR and CON scores increase by 2" - Multi-stat boost
- "double your proficiency bonus" - Attack buff (Dragon Dance)
- "advantage on next attack" - Advantage granting

**Decision**: Create `parseStatEffect()` function for stat changes
**Rationale**: Stat changes affect future combat calculations
**Alternatives Considered**: Only track AC changes (rejected - incomplete)

## Current Implementation Gaps

### Gap 1: Healing Not Applied
- **Issue**: Drain moves (Absorb, Giga Drain) deal damage but don't heal attacker
- **Impact**: Players don't benefit from healing moves
- **Solution**: Parse healing pattern, apply after damage calculation

### Gap 2: Recoil Not Applied
- **Issue**: Recoil moves (Take Down, Flare Blitz) don't damage attacker
- **Impact**: High-power moves have no drawback
- **Solution**: Parse recoil pattern, apply self-damage after hit

### Gap 3: Status Triggers Incomplete
- **Issue**: `parseStatusTrigger()` handles threshold patterns but not "fail by 5" saves
- **Impact**: ~15 moves with save-fail-5 patterns don't apply status
- **Solution**: Extend parser with save differential check

### Gap 4: Combat Log Missing Context
- **Issue**: Status events logged but lack dice roll details
- **Impact**: Players can't understand why effects did/didn't apply
- **Solution**: Extend `combatLogger.js` with detailed logging methods

### Gap 5: Turn-Affecting Statuses Logged Poorly
- **Issue**: Skip messages exist but lack roll details
- **Impact**: "POKEMON is paralyzed" without showing d4 roll
- **Solution**: Add logging for all status check rolls

## Existing Code Analysis

### statusEffects.js (Current)
- ✅ All 8 status types defined
- ✅ Type immunity checks work
- ✅ Start/end of turn processing exists
- ✅ Burn damage penalty implemented
- ✅ Flinched effects implemented
- ❌ Return values don't include roll details for logging
- ❌ No "fail by 5" pattern support

### battleEngine.js (Current)
- ✅ Calls status processing functions
- ✅ Attack/save rolls work
- ❌ Doesn't parse move extra effects (healing, recoil)
- ❌ Status results not passed to logger

### combatLogger.js (Current)
- ✅ Basic status logging (`logStatus()`)
- ✅ Status damage logging (`logStatusDamage()`)
- ❌ No detailed roll logging for status checks
- ❌ No healing/recoil effect logging
- ❌ No AC/stat change logging

## Technical Decisions

### Decision 1: New moveEffectParser.js Module
- **Rationale**: Separates concern of parsing move descriptions from combat logic
- **Exports**: `parseMoveEffects(move)` returning structured effect object
- **Alternative Rejected**: Embedding in battleEngine.js (too large)

### Decision 2: Enhanced Return Types
- **Rationale**: Functions must return roll details for logging
- **Change**: `processStartOfTurnStatus()` returns `{ skipTurn, reason, rolls, statusChanges }`
- **Alternative Rejected**: Global logging (breaks testability)

### Decision 3: Structured Log Entries
- **Rationale**: UI needs to render different log types differently
- **Format**: `{ type: 'status_applied', actor, target, details: {...} }`
- **Alternative Rejected**: String-only logs (not machine-parseable)

## Parser Regex Patterns

```javascript
// Healing (drain moves)
/half.*damage.*restored|healed.*half.*damage/i

// Healing (fixed/dice)
/regain\s+(\d+d?\d*)\s*\+?\s*(MOVE)?\s*hit\s*points/i

// Recoil
/(?:taking|take)\s+(?:a\s+)?(?:(quarter|half|1\/4|1\/2))\s+(?:of\s+)?(?:the\s+)?(?:total\s+)?damage.*(?:in\s+)?(?:typeless\s+)?recoil/i

// AC reduction
/ac\s+(?:is\s+)?(?:reduced|decreased|lowered)\s+by\s+(\d+)/i

// AC increase
/ac\s+(?:increases?|boosted?)\s+by\s+(\d+)|(?:gain|\+)\s*(\d+)\s+(?:to\s+)?(?:their\s+)?ac/i

// Status (fail by 5)
/fail(?:s|ed)?\s+(?:the\s+)?save\s+by\s+(\d+)\s+or\s+more.*(?:is|becomes?)\s+(burned|poisoned|paralyzed|frozen|asleep|confused)/i

// Status (natural roll)
/natural\s+(?:attack\s+)?roll\s+(?:of\s+)?(\d+)\s+or\s+(?:more|higher|20).*(?:is|becomes?)\s+(burned|poisoned|paralyzed|frozen|asleep|confused|flinch)/i
```

## Next Steps

1. Create `lib/moveEffectParser.js` with parsing functions
2. Modify `statusEffects.js` to return roll details
3. Extend `combatLogger.js` with new log types
4. Integrate effect application in `battleEngine.js`
5. Update UI components to render new log types
