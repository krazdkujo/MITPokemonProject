# Feature Specification: Complete Move Effects Implementation

**Feature Branch**: `024-complete-move-effects`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Go through all moves and ensure they are implemented in every way, not just basic attack rolls"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Damage Moves Work Correctly (Priority: P1)

Players using moves that deal damage through attack rolls or saving throws should see accurate calculations including dice damage, power modifiers, STAB bonuses, type effectiveness, and critical hits.

**Why this priority**: This is the foundational combat functionality. Without correct damage calculation, no other move effects matter.

**Independent Test**: Can be tested by running any damaging move in the test harness and verifying the damage breakdown shows all expected components.

**Acceptance Scenarios**:

1. **Given** a Pokemon uses a melee attack move, **When** the attack hits, **Then** the damage includes dice roll + power modifier + STAB (if applicable) + type effectiveness multiplier
2. **Given** a Pokemon uses a saving throw move, **When** the target fails the save, **Then** full damage is applied; **When** the target succeeds, **Then** half damage is applied
3. **Given** a move has a critical hit threshold (e.g., "19 or 20"), **When** the natural roll meets that threshold, **Then** the attack is marked critical and base dice damage is doubled

---

### User Story 2 - Status Effect Application (Priority: P1)

Moves that inflict status conditions (Burned, Paralyzed, Poisoned, Frozen, Asleep, Confused, Flinched) should apply those effects with proper triggers and type immunities.

**Why this priority**: Status effects are core to Pokemon combat strategy and many moves become meaningless without them.

**Independent Test**: Can be tested by using moves like Thunder Wave (paralysis), Flamethrower (burn), Ice Beam (freeze) and verifying the target gains the status condition with appropriate immunity checks.

**Acceptance Scenarios**:

1. **Given** a move has "On a natural attack roll of 15 or more, the target is burned", **When** the attack hits with natural 15+, **Then** the target gains BURNED status
2. **Given** a move requires a saving throw and "On a fail, the target becomes paralyzed", **When** the save fails, **Then** the target gains PARALYZED status
3. **Given** a Fire-type Pokemon is hit by a burning move, **When** burn would be applied, **Then** the burn is blocked due to type immunity

---

### User Story 3 - Healing and Drain Effects (Priority: P2)

Moves that restore HP to the user (drain moves like Absorb, Giga Drain, or fixed healing like Recover) should correctly calculate and apply healing amounts.

**Why this priority**: Sustain mechanics significantly impact battle outcomes and strategic choices.

**Independent Test**: Can be tested by using Absorb and verifying the user regains 50% of damage dealt, or using Recover and verifying fixed HP restoration.

**Acceptance Scenarios**:

1. **Given** a drain move states "Half the damage done is restored", **When** the move deals 20 damage, **Then** the user regains 10 HP (capped at max HP)
2. **Given** a healing move uses dice (e.g., "regain 4d4 + MOVE hit points"), **When** activated, **Then** the user regains the rolled amount plus power modifier
3. **Given** a user at full HP uses a drain move, **When** healing would be applied, **Then** current HP stays at max HP (no overheal)

---

### User Story 4 - Recoil Damage (Priority: P2)

Moves with recoil (like Take Down, Double-Edge) should deal self-damage to the user proportional to the damage dealt.

**Why this priority**: Recoil is a key risk-reward mechanic that balances powerful moves.

**Independent Test**: Can be tested by using Take Down and verifying the user takes 25% of damage dealt as recoil.

**Acceptance Scenarios**:

1. **Given** a move states "taking a quarter of the damage as recoil", **When** the move deals 40 damage, **Then** the user takes 10 recoil damage
2. **Given** a move states "taking half of the damage as recoil", **When** the move deals 40 damage, **Then** the user takes 20 recoil damage
3. **Given** recoil would reduce user to 0 HP, **When** recoil is applied, **Then** the user faints from recoil damage

---

### User Story 5 - Stat and AC Modifications (Priority: P2)

Moves that modify stats or AC (buffs like Swords Dance, debuffs like Acid Spray) should apply the correct bonuses/penalties to the appropriate targets.

**Why this priority**: Buff/debuff strategies are essential for competitive play and many moves rely on these effects.

**Independent Test**: Can be tested by using Acid Armor (AC +2) and verifying the user's AC increases, or using Acid Spray and verifying the target's AC decreases.

**Acceptance Scenarios**:

1. **Given** a move states "your AC increases by 2", **When** activated, **Then** the user's AC is increased by 2 for the duration
2. **Given** a move states "target's AC is reduced by 1" and "may be stacked up to -3", **When** used 3 times on the same target, **Then** the target's AC is reduced by 3 total
3. **Given** a move boosts an ability score, **When** activated, **Then** the corresponding modifier is recalculated for affected rolls

---

### User Story 6 - Speed and Movement Effects (Priority: P3)

Moves that modify movement speed (Agility, Scary Face) should apply correct speed changes to appropriate targets.

**Why this priority**: Movement speed affects tactical grid positioning in 5e-style combat.

**Independent Test**: Can be tested by using Agility and verifying movement speed increases by 20 feet, or Scary Face reducing target speed.

**Acceptance Scenarios**:

1. **Given** a move states "Increase your movement speed by 20 feet", **When** activated, **Then** the user's movement increases by 4 cells (20ft / 5ft per cell)
2. **Given** a move states "target's speed is halved", **When** the move affects a target with 30ft speed, **Then** target's speed becomes 15ft (3 cells)
3. **Given** a speed buff has a duration, **When** the duration expires, **Then** the speed returns to baseline

---

### User Story 7 - Multi-Hit and Conditional Damage (Priority: P3)

Moves that hit multiple times (Arm Thrust, Barrage) or have conditional damage bonuses (Assurance, Avalanche) should correctly handle their special mechanics.

**Why this priority**: These mechanics add depth to move selection and reward tactical timing.

**Independent Test**: Can be tested by using Arm Thrust and verifying multiple hits according to d4 rolls, or using Avalanche after taking damage and verifying doubled damage.

**Acceptance Scenarios**:

1. **Given** a multi-hit move like Arm Thrust, **When** used successfully, **Then** the move continues hitting (roll d4, 3-4 to continue) up to the maximum
2. **Given** Assurance states "double damage if target took damage this round", **When** target was damaged earlier, **Then** damage dice are doubled
3. **Given** Avalanche states "double damage if you took damage since last turn", **When** user took damage, **Then** damage is doubled

---

### User Story 8 - Action Economy (Actions, Bonus Actions, Reactions) (Priority: P3)

Moves with different action types should consume the correct action type and respect action economy rules.

**Why this priority**: Proper action economy is fundamental to 5e-style combat flow.

**Independent Test**: Can be tested by using a bonus action move (Agility) and verifying a standard action is still available, or using a reaction move (Protect) in response to being attacked.

**Acceptance Scenarios**:

1. **Given** a move has "1 bonus action" time, **When** used, **Then** it consumes the bonus action but not the main action
2. **Given** a move has "1 reaction" time, **When** the trigger condition occurs, **Then** it can be used as a reaction
3. **Given** a Pokemon has already used their action, **When** they try to use a "1 action" move, **Then** the move cannot be used

---

### User Story 9 - Charge and Two-Turn Moves (Priority: P3)

Moves requiring charge-up (Beak Blast, Solar Beam) or creating invulnerable states (Fly, Dig, Bounce) should properly handle multi-turn mechanics.

**Why this priority**: Two-turn moves have unique strategic implications and vulnerability windows.

**Independent Test**: Can be tested by using Fly and verifying invulnerability during the charge turn, then attack execution on the following turn.

**Acceptance Scenarios**:

1. **Given** a charge move like Beak Blast, **When** activated, **Then** the user charges on turn 1 and attacks on turn 2
2. **Given** a Pokemon is in the invulnerable stage of Fly, **When** targeted by most attacks, **Then** those attacks automatically miss
3. **Given** an invulnerable Pokemon, **When** hit by a move that specifically targets Fly/Dig, **Then** the attack connects normally

---

### User Story 10 - Concentration and Duration Effects (Priority: P3)

Moves with durations and concentration requirements should track their effects and end appropriately.

**Why this priority**: Duration-based buffs/debuffs require proper tracking for accurate combat state.

**Independent Test**: Can be tested by using a concentration move (Aqua Ring) and verifying the effect persists for its duration and ends when concentration breaks.

**Acceptance Scenarios**:

1. **Given** a move with "1 minute, concentration" duration, **When** concentration is maintained, **Then** the effect persists for up to 10 rounds
2. **Given** a concentrating Pokemon takes damage, **When** they fail the concentration save, **Then** the concentrated effect ends
3. **Given** a move with "3 rounds" duration, **When** 3 rounds pass, **Then** the effect automatically ends

---

### User Story 11 - Restraint, Grapple, and Movement Control (Priority: P3)

Moves that restrain, grapple, or prevent movement/switching (Anchor Shot, Bind, Mean Look) should properly control target mobility.

**Why this priority**: Control effects are tactical tools that affect positioning and escape options.

**Independent Test**: Can be tested by using Anchor Shot and verifying the target cannot flee or switch, with escape save mechanics.

**Acceptance Scenarios**:

1. **Given** a move states "target becomes restrained and cannot flee", **When** the move hits, **Then** the target cannot move or switch
2. **Given** a restrained target, **When** it makes a STR save against Move DC at turn start, **Then** success releases it
3. **Given** a grappled target, **When** the grappler moves, **Then** the grappled creature moves with them (or grapple breaks)

---

### User Story 12 - Area of Effect Moves (Priority: P2)

Moves with AoE patterns (cones, spheres, lines, radius) should affect all targets in the specified area.

**Why this priority**: AoE moves are strategically significant and require proper spatial targeting.

**Independent Test**: Can be tested by using Acid (30ft cone) and verifying all creatures in the cone must make the save.

**Acceptance Scenarios**:

1. **Given** a move with "self (30ft cone)" range, **When** used, **Then** all creatures in a 30ft cone make the saving throw
2. **Given** a move with "self (15ft radius)" range, **When** used, **Then** all creatures within 15ft of the user are affected
3. **Given** a move with "50ft line" range, **When** used, **Then** all creatures in the 50ft x 5ft line are affected

---

### Edge Cases

- What happens when a move has multiple effects (damage + status + debuff)? All effects should be resolved in order: damage first, then status, then additional effects.
- What happens when a move targets self and allies (Aromatherapy)? The effect should apply to all valid targets in range.
- What happens when a move's effect conflicts with an existing effect? Effects should stack if stackable, or the stronger/newer effect should take precedence based on move description.
- What happens when PP reaches 0 for all moves? The Pokemon should use Struggle (basic typeless damage, no special effects).
- What happens when a charge move user faints during the charge turn? The move is cancelled and no effect occurs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST parse all 800 moves from Source/moves/moves.json and identify their effect types
- **FR-002**: System MUST calculate damage correctly using dice expression + power modifier + STAB + type effectiveness
- **FR-003**: System MUST apply status effects when trigger conditions are met (natural roll thresholds, save failures)
- **FR-004**: System MUST respect type immunities for status effects (Fire immune to burn, Electric immune to paralysis, etc.)
- **FR-005**: System MUST track and apply healing effects (drain percentage, dice healing, fixed amounts)
- **FR-006**: System MUST apply recoil damage proportionally based on damage dealt
- **FR-007**: System MUST track stat/AC modifications with stacking limits where specified
- **FR-008**: System MUST track movement speed modifications and apply them to grid movement calculations
- **FR-009**: System MUST handle multi-hit moves with appropriate continuation mechanics
- **FR-010**: System MUST evaluate conditional damage bonuses based on combat state (took damage this round, etc.)
- **FR-011**: System MUST enforce action economy (action, bonus action, reaction usage per turn)
- **FR-012**: System MUST track charge/invulnerable states for two-turn moves
- **FR-013**: System MUST track concentration and duration for buff/debuff effects
- **FR-014**: System MUST apply restraint/grapple conditions with escape mechanics
- **FR-015**: System MUST calculate AoE targeting based on range patterns (cone, sphere, line, radius)
- **FR-016**: System MUST log all move effects comprehensively for test harness visibility
- **FR-017**: System MUST handle "guaranteed to hit" moves (Aerial Ace, Aura Sphere) by skipping attack roll

### Key Entities

- **Move**: A Pokemon move with id, name, type, power, time, pp, duration, range, description, and higherLevels
- **Combatant**: A Pokemon in battle with stats, status effects, position, and action/bonus action/reaction availability
- **Effect**: A temporary modification to a combatant (stat buff, status condition, speed change, concentration)
- **Action Result**: The outcome of using a move, including all damage, healing, status, and effect applications

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 800 moves can be parsed and categorized by their effect types (damage, status, healing, buff, etc.)
- **SC-002**: The test harness can demonstrate any move's full effect chain visually (damage + status + healing + etc.)
- **SC-003**: 95% of move descriptions have their primary effect correctly identified and implemented
- **SC-004**: Status effect application respects type immunities with 100% accuracy
- **SC-005**: Healing amounts match move descriptions within rounding (50% drain, dice + modifier, etc.)
- **SC-006**: Recoil damage matches specified percentages within rounding
- **SC-007**: Multi-hit moves produce hit counts within their specified ranges
- **SC-008**: Conditional damage bonuses activate correctly when conditions are met
- **SC-009**: Duration and concentration effects persist for their full duration unless broken
- **SC-010**: All move types (action, bonus action, reaction) can be executed through the test harness

## Assumptions

- The existing moveEffectParser.js will be extended to handle additional effect categories
- The test harness (test-combat page) will be the primary testing interface
- Move descriptions in moves.json contain all necessary information to determine effects
- The 5e-style combat rules from feature 017 are the authoritative source for mechanics
