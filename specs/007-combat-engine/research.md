# Research: Combat Engine

**Feature**: 007-combat-engine
**Date**: 2026-01-03

## Research Topics

### 1. Status Effect Definitions from rules.json

**Decision**: Use the status condition definitions directly from Source/rules/rules.json

**Rationale**: The constitution mandates using Source files as authoritative. The rules.json contains complete status definitions with:
- Effect mechanics (incapacitated, restrained, disadvantage)
- Duration tracking (volatile = 3 rounds or until switch/combat end)
- Tick damage (proficiency bonus at end of turn for Burn/Poison)
- Type immunities (Fire immune to Burn, Ice to Freeze, Electric to Paralysis, Poison/Steel to Poison)
- Grace period rule (cannot succumb to same effect until after next turn ends)

**Status Conditions Found**:

| Status | Volatility | Duration | Effects |
|--------|------------|----------|---------|
| Asleep (SLP) | Volatile | 3 rounds | Incapacitated, restrained, disadvantage on saves. Roll d20 at end of turn; 11+ ends it. |
| Burned (BRN) | Non-Volatile | Until cured | Damage rolls twice, take lower. Prof bonus damage at end of turn. Fire immune. |
| Frozen (FRZ) | Non-Volatile | 1 hour or STR save | Incapacitated, restrained. Fire damage or burn moves thaw. Ice immune. |
| Paralysis (PAR) | Non-Volatile | Until cured | Disadvantage on STR/DEX saves, half speed. D4 at turn start; 1 = incapacitated. Electric immune. |
| Poisoned (PSN) | Non-Volatile | Until cured | Disadvantage on checks/attacks. Prof bonus damage at end of turn. Poison/Steel immune. |
| Badly Poisoned | Non-Volatile | Until cured | Same as Poisoned but 2x proficiency damage. Poison/Steel immune. |
| Confused (CON) | Volatile | 3 rounds | Cannot take reactions. D8 at turn start with behavior table. |
| Flinched (FLN) | Volatile | Until end of next turn | Disadvantage on attacks, checks, saves. Targets have advantage on saves vs your moves. |

**Alternatives Considered**: Hardcoding status effects - rejected per constitution principle VI.

---

### 2. Move Critical Hit Range Patterns

**Decision**: Parse move descriptions for extended critical ranges using regex patterns

**Rationale**: Critical hit ranges vary per move and are embedded in move descriptions. Analysis of moves.json reveals consistent patterns.

**Patterns Found**:

| Pattern | Example Moves |
|---------|---------------|
| "scores a critical hit on 19 and 20" | Air Cutter, Aqua Cutter |
| "critical hit on rolls of 19 or 20" | Attack Order, Crabhammer |
| "scores a critical hit on 19s and 20s" | Blaze Kick, Cross Chop, Drill Peck, Drill Run |
| "critical hit on natural attack rolls of 19 or 20" | Aqua Tail |
| "critical on 19s and 20s" | Esper Wing |
| "critical range extension" (Focus Energy) | Extends by 1 (crit on 19-20), or 2 at level 10 |

**Regex Pattern**: `/critical\s+(?:hit\s+)?(?:on\s+)?(?:natural\s+attack\s+)?(?:rolls?\s+of\s+)?(\d+)\s*(?:and|or|s\s+and)\s*(\d+)/i`

Default critical range: natural 20 only.
Extended range: natural 19-20 (or wider for special abilities).

**Alternatives Considered**: Creating a manual crit range field in move data - rejected as it would duplicate/override Source data.

---

### 3. Status Application from Move Descriptions

**Decision**: Parse move descriptions for status effects using keyword triggers

**Rationale**: Moves apply status effects through various patterns in their descriptions. Analysis reveals:

**Application Patterns**:

| Trigger Condition | Examples |
|-------------------|----------|
| "target is [status]" | Ember: "19 or 20, the target is burnt" |
| "becomes [status]" | Baneful Bunker: "attacker becomes poisoned" |
| "target [flinches]" | Air Slash: "15 or higher, the target flinches" |
| "fails the save by 5 or more" | Bolt Strike: "paralyzed if fails by 5+" |
| "On a hit" + status | Confuse Ray: "On a hit, they become confused" |
| CON/WIS/DEX save + status | Dark Void: "WIS save...falling asleep on failure" |

**Common Status Keywords**:
- `burned` / `burnt` / `burning`
- `paralyzed` / `paralysis`
- `poisoned` / `poison`
- `asleep` / `sleep` / `put to sleep` / `falling asleep`
- `frozen` / `freeze`
- `confused` / `confusion`
- `flinch` / `flinches`

**Natural Roll Thresholds Found**:
- 15+: Flinch (Air Slash, Astonish, Confusion)
- 17+: Flinch (Dark Pulse, Dragon Rush)
- 18+: Burn (Blaze Kick, Fire Punch), Confused (Dizzy Punch), Flinch (Bone Club)
- 19+: Burn (Fire Fang, Flare Blitz), Flinch (Bite, Extrasensory)

---

### 4. Initiative Calculation

**Decision**: Initiative = d20 + DEX modifier (standard 5e formula)

**Rationale**: Pokemon 5e follows D&D 5e combat rules. Each Pokemon rolls initiative independently. Trainers act concurrently with their first Pokemon.

**Implementation**:
```javascript
function rollInitiative(pokemon) {
  const dexMod = Math.floor((pokemon.attributes.dex - 10) / 2);
  const roll = rollD20();
  return {
    roll,
    modifier: dexMod,
    total: roll + dexMod
  };
}
```

**Tie-breaking**: Higher DEX score goes first. If still tied, order is arbitrary (per spec).

---

### 5. PP Tracking and Struggle

**Decision**: Track PP per move in combat state; enable Struggle when all moves at 0 PP

**Rationale**: From rules.json (combat-moves section):
- Each move has PP from Source
- PP decrements by 1 per use
- Readied moves consume PP even if trigger doesn't occur
- When all moves at 0 PP, only Struggle is available

**Struggle Move** (from rules.json, combat-struggle):
- Always available regardless of PP
- Deals typeless damage
- User takes recoil damage

**Implementation Notes**:
- Store `{ moveId: currentPP }` object per combatant
- Initialize from Source move.pp values
- Check all PP values before each action
- Expose `canUseMove(moveId)` and `mustUseStruggle()` helpers

---

### 6. Ability Effects in Combat

**Decision**: Parse Battle Armor and type-based immunities from abilities.json

**Key Combat Abilities Found**:

| Ability | Combat Effect |
|---------|---------------|
| Battle Armor | Immune to extra damage from critical hits |
| Shell Armor | Same as Battle Armor |
| Adaptability | Roll STAB damage twice, choose either total |
| Flash Fire | Immune to fire damage, powers up fire moves |
| Levitate | Immune to ground-type moves |
| Volt Absorb | Immune to electric damage, heals instead |
| Water Absorb | Immune to water damage, heals instead |

**Implementation**: Check defender abilities before applying critical damage or type effectiveness.

---

### 7. Experience Calculation for Catches

**Decision**: Catch XP = Defeat XP / 5

**Rationale**: From rules.json (catching-overview):
> "Catching a Pokemon also gives experience, but at 1/5 the normal amount."

Formula: `XP = (200 * level * SR) / 5 = 40 * level * SR`

Existing `calculateXpAward()` in experienceUtils.js handles defeat XP. Add optional `wasCaught` parameter to apply 1/5 multiplier.

---

## Summary of Findings

All clarifications have been resolved using Source data:

1. **Status effects**: Complete definitions in rules.json with volatility, duration, tick damage
2. **Crit ranges**: Parseable from move descriptions; default is natural 20
3. **Status application**: Keyword patterns and natural roll thresholds in move descriptions
4. **Initiative**: d20 + DEX modifier per standard 5e rules
5. **PP/Struggle**: Track per-move PP, Struggle when all at 0
6. **Abilities**: Battle Armor prevents crit bonus damage; type absorb abilities exist
7. **Catch XP**: 1/5 of defeat XP, trivial to implement

No NEEDS CLARIFICATION items remain.
