# Feature Specification: Combat Engine

**Feature Branch**: `007-combat-engine`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Implement the core combat calculation system that processes battles according to Pokemon 5e rules"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Basic Attack Turn (Priority: P1)

A player's Pokemon uses a damaging move against an opponent Pokemon during combat. The system calculates the attack result including hit/miss determination, damage calculation with all modifiers (move power, attacker stats, defender defenses, type effectiveness, STAB), and updates the defender's HP.

**Why this priority**: This is the fundamental building block of all combat. Without accurate damage calculation, no battle can occur.

**Independent Test**: Can be fully tested by providing an attacker Pokemon, defender Pokemon, and move, then verifying the damage output matches Pokemon 5e formulas.

**Acceptance Scenarios**:

1. **Given** a level 5 Charmander with STR 14 (+2 mod) using Ember (fire-type, 1d4 base) against a Bulbasaur, **When** the attack connects, **Then** damage equals 1d4 + 2 (STR mod) + 3 (STAB = proficiency at level 5), doubled for type vulnerability (fire vs grass)
2. **Given** a Pokemon using a move with power stat "dex", **When** calculating attack bonus, **Then** the system uses DEX modifier + proficiency bonus for the attack roll
3. **Given** a move targets a defender with type immunity, **When** the move connects, **Then** zero damage is dealt and secondary effects do not apply

---

### User Story 2 - Determine Turn Order (Priority: P1)

At the start of combat or when a new round begins, the system determines the order in which Pokemon act based on their initiative rolls using their initiative bonus derived from DEX modifier.

**Why this priority**: Combat cannot proceed without knowing who acts first. This is foundational for any battle flow.

**Independent Test**: Can be tested by providing multiple Pokemon with different DEX scores and verifying they are ordered correctly after initiative rolls.

**Acceptance Scenarios**:

1. **Given** three Pokemon entering combat, **When** initiative is rolled, **Then** each Pokemon rolls d20 + DEX modifier to determine turn order from highest to lowest
2. **Given** two Pokemon roll the same initiative value, **When** determining order, **Then** the Pokemon with higher DEX score goes first (if still tied, either order is acceptable)

---

### User Story 3 - Apply Status Effects (Priority: P2)

When a move inflicts a status condition (burn, paralysis, poison, sleep, freeze, confusion, flinch), the system applies the condition to the target Pokemon and tracks its ongoing effects per Pokemon 5e rules.

**Why this priority**: Status effects add tactical depth and are frequently used in battles, but basic damage works without them.

**Independent Test**: Can be tested by applying each status type and verifying the correct mechanical effects are applied.

**Acceptance Scenarios**:

1. **Given** a Pokemon becomes Burned, **When** rolling damage, **Then** the Pokemon rolls damage dice twice and takes the lower result, and takes damage equal to proficiency bonus at end of turn
2. **Given** a Pokemon has Paralysis, **When** its turn begins, **Then** it rolls d4; on a 1, it is incapacitated and restrained for that turn, and moves at half speed otherwise
3. **Given** a Pokemon is Asleep (volatile), **When** it is switched out or combat ends, **Then** the sleep condition ends immediately
4. **Given** a Pokemon already has a non-volatile status, **When** a move attempts to apply another non-volatile status, **Then** the new status is not applied
5. **Given** a Fire-type Pokemon is targeted with Burn, **When** checking immunity, **Then** the Burn is not applied (Fire-types are immune)

---

### User Story 4 - Track PP Consumption (Priority: P2)

When a Pokemon uses a move, the system decrements that move's PP by 1. When a move has 0 PP remaining, the Pokemon cannot use that move until PP is restored.

**Why this priority**: PP management is core to Pokemon combat resource management but battles can technically occur without tracking PP for short encounters.

**Independent Test**: Can be tested by having a Pokemon use moves and verifying PP decrements correctly and zero-PP moves become unavailable.

**Acceptance Scenarios**:

1. **Given** a move with 15 PP remaining, **When** the move is used, **Then** PP becomes 14
2. **Given** a move with 0 PP, **When** the Pokemon attempts to use it, **Then** the move fails and the Pokemon may use Struggle instead
3. **Given** a Pokemon readies a move as a reaction, **When** the trigger never occurs or concentration breaks, **Then** the PP is still consumed

---

### User Story 5 - Calculate Critical Hits (Priority: P2)

When an attack roll is made, the system determines if a critical hit occurs based on the natural d20 roll and any move-specific critical range modifications.

**Why this priority**: Critical hits add excitement and variance to combat but battles function without them.

**Independent Test**: Can be tested by simulating attack rolls and verifying critical hits trigger on natural 20 (or extended range per move description).

**Acceptance Scenarios**:

1. **Given** a natural 20 on the attack roll, **When** damage is calculated, **Then** all damage dice are doubled (modifiers remain the same)
2. **Given** Air Cutter (scores critical on 19-20), **When** a natural 19 is rolled, **Then** the attack is a critical hit
3. **Given** a Pokemon with Battle Armor ability, **When** the attacker rolls a critical hit, **Then** the extra damage from the critical is negated (normal damage applies)

---

### User Story 6 - Calculate Experience on Victory (Priority: P3)

When a Pokemon is defeated in battle, the system calculates experience points awarded to the participating Pokemon using the Pokemon 5e formula.

**Why this priority**: Experience is awarded after battles conclude, so combat can function without this for testing. However, it is essential for progression.

**Independent Test**: Can be tested by simulating a defeated Pokemon scenario and verifying XP calculation matches the formula.

**Acceptance Scenarios**:

1. **Given** a level 10 Pokemon with SR 5 is defeated, **When** calculating XP, **Then** XP awarded = 200 x 10 x 5 = 10,000
2. **Given** multiple Pokemon participated in the fight, **When** distributing XP, **Then** only Pokemon that took an action can receive XP (including fainted ones)
3. **Given** a Pokemon is caught instead of defeated, **When** calculating XP, **Then** XP awarded is 1/5 of the normal amount

---

### User Story 7 - Handle Struggle Move (Priority: P3)

When a Pokemon has exhausted PP on all known moves, the only offensive action available is the Struggle move, which deals typeless damage and damages the user.

**Why this priority**: Struggle is a fallback mechanic that only occurs in extended battles.

**Independent Test**: Can be tested by setting all move PP to 0 and verifying only Struggle is available.

**Acceptance Scenarios**:

1. **Given** a Pokemon with 0 PP on all moves, **When** attempting an offensive action, **Then** only Struggle is available
2. **Given** a Pokemon uses Struggle, **When** damage is dealt, **Then** the user also takes recoil damage

---

### Edge Cases

- What happens when a move has multiple valid Move Power stats (e.g., "str" or "dex")? System allows the attacker to choose which stat to use for calculations.
- What happens when a defender has both resistance and vulnerability to the move type? Standard 5e rules apply: they cancel out, resulting in normal damage.
- What happens when a move's description references "MOVE" for damage calculation? The MOVE placeholder is replaced with the chosen Move Power modifier.
- What happens when damage reduces a Pokemon to 0 HP in sanctioned combat? The Pokemon faints but does not make death saving throws.
- What happens when a Pokemon with immunity is targeted by a non-damaging move of that type? The move can still affect them (e.g., Confuse Ray affects Normal-types).
- What happens when status effect damage (burn/poison) would reduce HP to 0? Standard 0 HP rules apply based on combat context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate initiative order using d20 + DEX modifier for each Pokemon at combat start
- **FR-002**: System MUST determine attack hit/miss by comparing attack roll (d20 + Move Power modifier + proficiency) against defender AC
- **FR-003**: System MUST calculate damage using the formula: dice roll + Move Power modifier + STAB bonus (if applicable)
- **FR-004**: System MUST apply type effectiveness multipliers: 2x for vulnerability, 0.5x for resistance, 0x for immunity
- **FR-005**: System MUST apply STAB bonus equal to attacker's proficiency bonus when move type matches Pokemon type
- **FR-006**: System MUST track and decrement PP for each move used
- **FR-007**: System MUST restrict move usage when that move's PP reaches 0
- **FR-008**: System MUST detect critical hits on natural 20 (or extended range per move) and double damage dice
- **FR-009**: System MUST apply status conditions with correct effects per Pokemon 5e rules
- **FR-010**: System MUST prevent multiple non-volatile status conditions on the same Pokemon
- **FR-011**: System MUST respect type-based status immunities (Fire immune to Burn, Ice immune to Freeze, Electric immune to Paralysis, Poison/Steel immune to Poison)
- **FR-012**: System MUST clear volatile status conditions (Sleep, Confusion, Flinch) when Pokemon switches out or combat ends
- **FR-013**: System MUST calculate experience using formula: 200 x defeated_pokemon_level x SR
- **FR-014**: System MUST award 1/5 XP for catching instead of defeating
- **FR-015**: System MUST allow the Struggle move when all other moves have 0 PP
- **FR-016**: System MUST reference Source JSON files (moves.json, pokemon.json, rules.json) for all stat lookups and calculations
- **FR-017**: System MUST support multiple Move Power options, allowing the attacker to select which stat to use when a move lists multiple power stats
- **FR-018**: System MUST scale move damage dice at levels 5, 10, and 17 per the higherLevels field in moves.json
- **FR-019**: System MUST handle moves with "1 bonus action" time correctly in the action economy
- **FR-020**: System MUST apply end-of-turn status damage (Burn, Poison) equal to the affected Pokemon's proficiency bonus

### Key Entities

- **CombatState**: Represents the current state of a battle including all participants, turn order, round number, and active effects
- **Combatant**: A Pokemon participating in combat with current HP, PP per move, active status conditions, and position in initiative
- **MoveAction**: An attempted use of a move including attacker, target(s), move data from Source, and chosen Move Power stat
- **DamageResult**: The calculated damage from an attack including base roll, modifiers, type multiplier, critical status, and final total
- **StatusEffect**: An active condition on a Pokemon including type (volatile/non-volatile), duration/remaining rounds, and tick effects

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All damage calculations match Pokemon 5e formulas when verified against manual calculations for 10+ diverse test scenarios
- **SC-002**: Combat engine processes a complete 5-round battle between two Pokemon in under 100ms (excluding network latency)
- **SC-003**: Status effect application achieves 100% accuracy against the Pokemon 5e rulebook definitions
- **SC-004**: Experience calculations match the published formula (200 x Level x SR) with zero deviation
- **SC-005**: PP tracking correctly reflects move usage across at least 20 consecutive moves without drift
- **SC-006**: Type effectiveness multipliers produce correct damage for all 18x18 type matchup combinations
- **SC-007**: The combat engine functions identically for wild encounters, gym battles, and PvP contexts when using the same inputs

## Assumptions

- Type effectiveness chart data will need to be added to Source or computed from Pokemon type data
- The existing lib/pokemonData.js provides foundation utilities that can be extended
- The battle endpoint already exists and will integrate with this combat engine
- Dice rolling logic uses standard PRNG unless specified otherwise
- "Melee" range moves require adjacency; "ranged" moves use the specified distance
- The combat engine is a calculation layer and does not handle real-time multiplayer synchronization
