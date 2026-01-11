# Feature Specification: Ambiguous Move Implementation

**Feature Branch**: `029-ambiguous-moves`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "Implement ambiguous move handling for combat engine based on ambiguous-moves-plan.md"

## Overview

This specification covers the implementation of ~35 moves across 7 categories that require special handling beyond standard damage calculation. These moves have mechanics that cannot be captured by simple dice notation and require structured data fields and combat engine logic.

The categories are:
1. Recoil Moves (9 moves) - User takes damage after attacking
2. Level-Based Damage (14 moves) - Damage depends on level, not dice
3. Two-Turn Moves (19 moves) - Attacks span multiple turns
4. Variable Hit Moves (4 moves) - Hit count determined by roll
5. Conditional Damage (3 moves) - Damage varies based on HP
6. OHKO Moves (4 moves) - Instant knockout on natural 20
7. Stat-Dependent Moves (8 moves) - Uses non-standard stat for calculation

Note: Some moves appear in multiple categories and will receive all applicable fields.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recoil Damage Display (Priority: P1)

A player uses a recoil move (e.g., Double-Edge) and sees both the damage dealt to the opponent AND the recoil damage taken by their own Pokemon displayed in the combat log.

**Why this priority**: Recoil moves are common in competitive play. Without proper handling, players cannot make informed tactical decisions about using high-risk, high-reward moves.

**Independent Test**: Can be tested by using any recoil move in the combat test harness and verifying both damage values appear correctly.

**Acceptance Scenarios**:

1. **Given** a Pokemon knows Double-Edge (1/4 recoil), **When** the move hits for 40 damage, **Then** the attacker takes 10 typeless recoil damage and the combat log shows both values.
2. **Given** a Pokemon uses Wave Crash (1/2 recoil), **When** the move deals 30 damage, **Then** the attacker takes 15 recoil damage.
3. **Given** recoil would reduce attacker HP below 0, **When** the attack resolves, **Then** the attacker faints after dealing damage to the target.

---

### User Story 2 - OHKO Move Resolution (Priority: P1)

A player uses an OHKO move (e.g., Fissure) and sees correct resolution based on level comparison and natural 20 roll.

**Why this priority**: OHKO moves are dramatic game-changers. Incorrect handling leads to frustrating player experiences when moves succeed/fail unexpectedly.

**Independent Test**: Can be tested by simulating OHKO moves against targets of various levels and checking success conditions.

**Acceptance Scenarios**:

1. **Given** user Pokemon level >= target level, **When** user rolls natural 20, **Then** target is instantly knocked out (HP = 0).
2. **Given** user Pokemon level < target level, **When** OHKO move is used, **Then** the move automatically fails regardless of roll.
3. **Given** user Pokemon level >= target level, **When** user rolls anything other than natural 20, **Then** the move misses.

---

### User Story 3 - Level-Based Damage Calculation (Priority: P1)

A player uses Seismic Toss and sees damage calculated based on user's level rather than standard dice.

**Why this priority**: Level-based moves are signature moves for many Pokemon. Incorrect damage calculation makes these moves unreliable.

**Independent Test**: Can be tested by using Seismic Toss with Pokemon of different levels and verifying damage formula.

**Acceptance Scenarios**:

1. **Given** a level 15 Pokemon uses Seismic Toss, **When** the move hits, **Then** damage equals 1d6 + 15 (fighting type).
2. **Given** a Pokemon uses Foul Play, **When** the move hits, **Then** damage uses target's level, not user's level.
3. **Given** a Pokemon uses Night Shade, **When** the move hits, **Then** damage equals 1d6 + user_level (ghost type).

---

### User Story 4 - Two-Turn Move Execution (Priority: P2)

A player uses Dig and their Pokemon spends turn 1 burrowing (invulnerable) before attacking on turn 2.

**Why this priority**: Two-turn moves add tactical depth but require state tracking across turns. Important for combat variety but more complex to implement.

**Independent Test**: Can be tested by using Dig in combat harness and verifying turn 1 state and turn 2 attack resolution.

**Acceptance Scenarios**:

1. **Given** a Pokemon uses Dig, **When** turn 1 ends, **Then** the Pokemon is marked as burrowed and invulnerable to most attacks.
2. **Given** a Pokemon is mid-Dig (burrowed), **When** turn 2 begins, **Then** the Pokemon attacks and becomes targetable again.
3. **Given** a Pokemon uses Solar Beam in sunny weather, **When** the move is used, **Then** it executes immediately (skip charge turn).
4. **Given** a Pokemon uses Skull Bash, **When** turn 1 ends, **Then** the Pokemon gains +2 AC until attack resolves.

---

### User Story 5 - Variable Hit Count (Priority: P2)

A player uses Barrage and sees the correct number of hits (2-5) determined by a roll.

**Why this priority**: Multi-hit moves provide damage variance. Less common than other categories but important for move accuracy.

**Independent Test**: Can be tested by using Barrage multiple times and verifying hit counts fall within 2-5 range.

**Acceptance Scenarios**:

1. **Given** a Pokemon uses Barrage, **When** the move executes, **Then** a d4+1 roll determines hit count (2-5 hits).
2. **Given** Barrage rolls 4 hits, **When** each hit resolves, **Then** each hit applies damage separately (can trigger effects multiple times).
3. **Given** Tri Attack hits, **When** damage is calculated, **Then** a d4 determines which status effect (if any) is applied (not multi-hit).

---

### User Story 6 - Conditional Damage Scaling (Priority: P2)

A player uses Flail when their Pokemon is at low HP and sees increased damage output.

**Why this priority**: HP-based damage scaling rewards tactical play and creates comeback potential. Medium complexity.

**Independent Test**: Can be tested by using Flail at various HP percentages and verifying damage scaling.

**Acceptance Scenarios**:

1. **Given** user HP is below 10%, **When** Flail is used, **Then** damage is at maximum scaling multiplier.
2. **Given** user HP is at 100%, **When** Flail is used, **Then** damage is at minimum scaling.
3. **Given** user HP is below 50%, **When** Water Spout is used, **Then** damage is reduced proportionally.

---

### User Story 7 - Stat Override Moves (Priority: P3)

A player uses Foul Play and damage is calculated using the target's level instead of the user's.

**Why this priority**: Stat override moves are edge cases. Lower priority as they affect fewer moves and scenarios.

**Independent Test**: Can be tested by using Foul Play against targets of varying levels and verifying damage calculation.

**Acceptance Scenarios**:

1. **Given** a level 5 Pokemon uses Foul Play against a level 20 target, **When** damage is calculated, **Then** level 20 is used in the formula.
2. **Given** Endeavor is used, **When** the move hits, **Then** target HP is set equal to user's current HP.

---

### Edge Cases

- What happens when recoil damage would KO the attacker but they have a revival item?
- How does invulnerability from Dig/Dive/Bounce interact with AOE moves?
- What happens if a two-turn move is interrupted (user is switched out)?
- How do multi-hit moves interact with focus sash or similar effects?
- What happens when Foul Play is used against a target with level-modifying effects?
- How do OHKO moves interact with Pokemon that have immunity abilities?
- What happens when Endeavor is used by a Pokemon with 0 HP (impossible state)?

## Requirements *(mandatory)*

### Functional Requirements

#### Data Extraction Requirements

- **FR-001**: Extraction script MUST detect recoil moves using pattern matching that identifies "recoil" keyword while excluding false positives from save damage patterns
- **FR-002**: Extraction script MUST NOT mark moves as recoil when they have "taking X damage on a failure" (save damage pattern)
- **FR-003**: Extraction script MUST add `recoil` field with `fraction` (quarter, third, half) and `type` (typeless) to applicable moves
- **FR-004**: Extraction script MUST add `formula` field for level-based damage moves when dice pattern not found
- **FR-005**: Extraction script MUST add `ohko` field with `success_roll` and `level_restriction` for OHKO moves
- **FR-006**: Extraction script MUST add `turns` field for two-turn moves with `turn1` and `turn2` action definitions
- **FR-007**: Extraction script MUST add `hit_roll` field for variable hit count moves
- **FR-008**: Extraction script MUST add `conditional` field for HP-dependent damage moves
- **FR-009**: Extraction script MUST add `stat_override` field when move uses non-standard stat
- **FR-010**: Moves appearing in multiple categories MUST receive all applicable fields

#### Combat Engine Requirements

- **FR-011**: Combat engine MUST apply recoil damage to attacker after move damage is dealt
- **FR-012**: Combat engine MUST evaluate `formula` expressions at runtime substituting `user_level`, `target_level`
- **FR-013**: Combat engine MUST check level restriction before allowing OHKO move rolls
- **FR-014**: Combat engine MUST track two-turn move state across consecutive turns
- **FR-015**: Combat engine MUST respect invulnerability flags during charging/burrowing turns
- **FR-016**: Combat engine MUST roll to determine hit count for variable hit moves
- **FR-017**: Combat engine MUST calculate conditional damage based on current HP percentage
- **FR-018**: Combat engine MUST substitute overridden stats in damage calculations
- **FR-019**: Combat engine MUST log all special move mechanics in the combat log for player visibility

### Key Entities

- **Recoil Data**: Fraction of damage taken (quarter/third/half), damage type (typically typeless)
- **Formula**: Expression string using variables (user_level, target_level) and dice notation (1d6)
- **Turn State**: Which turn of a multi-turn move the Pokemon is on, invulnerability flag, stored values
- **Hit Roll**: Dice expression for determining number of hits (e.g., d4+1)
- **Conditional**: Condition type and effect (e.g., user_hp_percent triggers damage scaling)
- **Stat Override**: Which stat to substitute and with what (e.g., use target_level instead of user_level)
- **OHKO**: Success roll value, level restriction rule

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 9 confirmed recoil moves correctly apply recoil damage in combat, with 0 false positives from the 9 known false positive moves
- **SC-002**: Level-based damage moves (Seismic Toss, Night Shade, etc.) calculate damage within expected ranges based on level
- **SC-003**: OHKO moves succeed only on natural 20 when level requirement is met, and always fail when target level is higher
- **SC-004**: Two-turn moves correctly track state and resolve over 2 turns, with invulnerable moves avoiding attacks during charge turn
- **SC-005**: Variable hit moves produce hit counts within documented ranges (e.g., Barrage always hits 2-5 times)
- **SC-006**: Conditional damage moves scale appropriately with HP percentage (verifiable damage difference at 100% vs 10% HP)
- **SC-007**: All ~35 ambiguous moves have appropriate structured fields in moves.json
- **SC-008**: Combat test harness can execute and validate each move category without errors

## Assumptions

- The existing combat engine supports extending with new field handlers
- The moves.json structure can be extended with new fields without breaking existing functionality
- The combat log system can display additional damage/effect information
- Weather effects for Solar Beam skip condition are already implemented or will be handled separately
- The existing dice rolling system supports the formula expressions needed
- Level information is available in the battle context for both user and target Pokemon

## Out of Scope

- Weather-dependent move modifications (28 moves mentioned in notes) - separate feature
- Ability interactions with these moves (e.g., Rock Head negating recoil)
- Item interactions (e.g., Life Orb additional recoil)
- Moves from generations beyond those currently in the game
- AI behavior changes for using these moves strategically
