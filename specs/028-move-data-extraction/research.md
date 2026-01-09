# Research: Move Data Extraction Patterns

**Feature**: 028-move-data-extraction
**Date**: 2026-01-08

## Overview

Analysis of description patterns in `Source/moves/moves.json` to determine extraction strategies for structured fields.

## Existing Infrastructure

The codebase already has robust parsing utilities:

| Module | Relevant Functions | Status |
|--------|-------------------|--------|
| `lib/diceParser.js` | `parseDamageDice()`, `parseDiceForLevel()`, `extractDiceFromText()` | Reusable |
| `lib/moveEffectParser.js` | `parseHealingEffect()`, `parseRecoilEffect()`, `parseACEffect()`, etc. | Extendable |
| `lib/combatUtils.js` | `parseSaveType()` | Reusable |

**Decision**: Extend existing parsers rather than creating new modules.
**Rationale**: Constitution principle V (Simplicity Over Abstraction) + principle VII (Library Module Organization).

## Pattern Categories

### 1. Attack Type Patterns

**Melee Attack** (most common):
- `"Make a melee attack"` - ~200 moves
- Pattern: `/make\s+a\s+melee\s+attack/i`

**Ranged Attack**:
- `"Make a ranged attack"` - ~150 moves
- Pattern: `/make\s+a\s+ranged\s+attack/i`

**Auto-Hit**:
- `"guaranteed to hit"` / `"is guaranteed to hit"` - ~10 moves
- Pattern: `/(?:is\s+)?guaranteed\s+to\s+hit/i`

**Save-Based** (no attack roll):
- `"must make a DEX save"` / `"must succeed on a CON save"` - ~150 moves
- Pattern: `/must\s+(?:make|succeed\s+on)\s+(?:a\s+)?(\w+)\s+sav(?:e|ing)/i`

### 2. Save Patterns

**Standard Save**:
- `"must make a DEX save against your Move DC"`
- `"CON save against your Move DC"`
- Pattern: `/(\w+)\s+sav(?:e|ing)(?:\s+throw)?\s+(?:against\s+(?:your\s+)?)?(?:Move\s+)?DC/i`

**Extracted Save Types**: STR, DEX, CON, INT, WIS, CHA

**Save Outcomes**:
- `"taking Xd6 damage on a fail, and half as much on a success"` - ~100 moves
- `"on a failure, the target..."` - status effect application
- Pattern: `/(?:taking\s+)?(\d+d\d+).*?damage\s+on\s+(?:a\s+)?fail(?:ure)?.*?half.*?(?:on\s+)?(?:a\s+)?(?:success|save)/i`

### 3. Damage Patterns

**Standard Damage**:
- `"1d6 + MOVE grass damage"`
- `"2d8 fire damage on a hit"`
- Pattern: `/(\d+d\d+)\s*(?:\+\s*MOVE)?\s*(\w+)\s+damage/i`

**Components**:
- Dice: `\d+d\d+`
- Modifier: `+ MOVE` or none
- Type: `grass`, `fire`, `water`, etc.

### 4. Flavor Text Patterns

Flavor text typically:
- Comes first in the description
- Ends before mechanical keywords (`Make a`, `must make`, damage dice)
- Describes the visual/thematic effect

**Extraction Strategy**:
1. Split on first occurrence of mechanical pattern
2. First segment = flavor (if not starting with mechanical pattern)
3. Remainder = mechanics

**Example** (Tri Attack):
```
"You strike with a simultaneous three-beam attack. Each creature in a 30 foot cone..."
 |___________ Flavor ___________| |______________ Mechanics ______________|
```

**Pattern**: Split before patterns like:
- `/(?:Make|Each\s+creature|Choose|The\s+target|Creatures?\s+(?:in|within|caught))/i`

### 5. Extra Effects Patterns

**Status on Hit**:
- `"On a natural attack roll of 15 or higher, the target flinches"`
- Pattern: `/on\s+(?:a\s+)?natural\s+(?:attack\s+)?roll\s+of\s+(\d+)(?:\s+or\s+(?:higher|more))?.*?(flinch|burn|paralyz|poison|freez|sleep|confus)/i`

**Status on Failed Save**:
- `"Targets that fail the save by 5 or more must roll a d4..."`
- Pattern: `/fail.*?(?:the\s+)?save\s+by\s+(\d+)\s+or\s+more/i`

**Conditional Damage**:
- `"If the target has already taken damage, double the damage dice"`
- Pattern: `/(?:double|twice).*?damage/i`

**Multi-Hit**:
- `"After successfully hitting, roll a d4. On 3 or 4, hit again..."`
- Pattern: `/roll\s+a\s+d4.*?(?:3\s+or\s+4|hit\s+again)/i`

### 6. Higher Levels Patterns

**Standard Format**:
- `"The damage dice roll for this move changes to 2d4 at level 5, 1d12 at level 10, and 4d4 at level 17."`
- Pattern: `/(\d+d\d+)\s+at\s+level\s+(\d+)/gi`

**Extraction**: Already handled by `parseDiceForLevel()` in diceParser.js

**Decision**: Reuse existing parser, convert to structured object.
**Rationale**: Consistent with existing code, no duplication.

## Field Schemas

### damage (object|null)

```javascript
{
  dice: "2d6",           // Base dice expression
  modifier: "MOVE",      // "MOVE" or null
  type: "normal",        // Damage type (fire, water, etc.)
  attack_type: "save"    // "melee", "ranged", "save", "auto"
}
```

### save (object|null)

```javascript
{
  type: "DEX",           // STR, DEX, CON, INT, WIS, CHA
  dc: "Move DC",         // Always "Move DC" in current data
  on_fail: "full",       // "full" for damage, or status description
  on_success: "half"     // "half", "none", or null
}
```

### flavor (string|null)

Plain text narrative without mechanical notation.

### extra_effects (string|null)

Free-form text for complex effects that don't fit structured patterns:
- Status triggers with conditions
- Multi-hit mechanics
- Conditional damage modifiers
- AC/stat modifications

### scaling (object|null)

```javascript
{
  5: "2d4",
  10: "1d12",
  17: "4d4"
}
```

## Extraction Algorithm

```
1. Parse higherLevels -> scaling object
2. Detect attack_type (melee/ranged/save/auto)
3. If save-based:
   a. Extract save type (DEX, CON, etc.)
   b. Extract on_fail/on_success
4. Extract damage dice + modifier + type
5. Split description for flavor text
6. Collect remaining effects -> extra_effects
7. Validate: description still preserved unchanged
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Inconsistent description formatting | Log warnings for manual review |
| Edge cases in parsing | Extra_effects captures unstructured content |
| Data corruption | Validate before writing, backup original file |
| Combat engine breakage | Test harness verification after extraction |

## Alternatives Considered

1. **LLM-based extraction**: More accurate but non-reproducible, requires API calls
   - Rejected: Adds complexity, external dependency, non-deterministic

2. **Manual data entry**: Most accurate
   - Rejected: 800 moves too time-consuming, error-prone

3. **Hybrid (regex + manual review)**: Selected approach
   - Regex extracts what it can, logs uncertain cases for review
   - Extra_effects field captures complex patterns as-is
