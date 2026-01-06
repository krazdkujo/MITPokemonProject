# Feature Specification: Combat Test Harness

**Feature Branch**: `021-combat-test-harness`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "bugfix the combat system by making a test that allows the program to simulate turn by turn combat with two pokemon with verbose logging so we can test the combat system faster. we should be able to see two pokemon fight turn by turn using the fight logic."

## Clarifications

### Session 2026-01-06

- Q: What interface type should the test harness provide? → A: Both - Web UI for interactive testing plus CLI script for automated/CI testing
- Q: How should battles execute in the UI? → A: Both modes - Toggle between auto-run and step-by-step with speed control
- Q: How should moves be selected during battle? → A: AI auto-selects moves for both Pokemon (random or smart AI)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Interactive Combat Test Screen (Priority: P1)

As a developer, I want a dedicated test page where I can select two Pokemon from dropdowns and watch them fight turn-by-turn with live battle logs so that I can quickly identify bugs in the combat logic with visual feedback.

**Why this priority**: This is the core functionality that enables rapid debugging of the combat system. Without it, developers must manually navigate the UI to test each combat scenario, which is time-consuming and error-prone.

**Independent Test**: Can be fully tested by navigating to the test page, selecting Pokemon, and observing the live battle log output.

**Acceptance Scenarios**:

1. **Given** the test page is loaded, **When** I select two Pokemon from dropdowns, **Then** I can initiate a battle between them.
2. **Given** I click "Next Turn" in step-by-step mode, **When** the turn executes, **Then** I see that turn's log entry and can analyze it before proceeding.
3. **Given** I enable auto-run mode, **When** the battle runs, **Then** turns execute automatically with adjustable speed until one Pokemon faints.
4. **Given** the battle completes, **When** I review the log, **Then** I can scroll through the exact sequence of events that led to victory.

---

### User Story 2 - Configure Test Pokemon via UI (Priority: P2)

As a developer, I want to configure Pokemon levels and optionally select specific moves on the test page so that I can test specific matchups and edge cases interactively.

**Why this priority**: Testing specific matchups is essential for reproducing and debugging reported bugs. The UI provides quick iteration without command-line parameters.

**Independent Test**: Can be tested by selecting different Pokemon, adjusting levels, and verifying the configured combatants battle correctly.

**Acceptance Scenarios**:

1. **Given** the test page is loaded, **When** I select Pokemon and set their levels, **Then** those exact Pokemon at those levels battle each other.
2. **Given** I want to test a specific move, **When** I optionally select moves for each Pokemon, **Then** those moves are available during the battle.
3. **Given** I leave level fields empty, **When** the simulation runs, **Then** sensible defaults are used (level 5).

---

### User Story 3 - CLI Script for Automated Testing (Priority: P2)

As a developer, I want a command-line script that runs combat simulations so that I can automate testing or integrate with CI pipelines.

**Why this priority**: CLI access enables scripted testing scenarios and integration with automated test suites without requiring browser interaction.

**Independent Test**: Can be tested by running the CLI command and verifying output matches expected format.

**Acceptance Scenarios**:

1. **Given** the CLI script exists, **When** I run `npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur`, **Then** I see a complete battle log in the terminal.
2. **Given** I specify levels via CLI, **When** I run with `--level1 10 --level2 8`, **Then** the Pokemon battle at those levels.
3. **Given** I run the CLI without arguments, **When** the script executes, **Then** it uses default Pokemon (Pikachu vs Bulbasaur at level 5).

---

### User Story 4 - Verbose Logging Output (Priority: P2)

As a developer, I want to see detailed, human-readable logging of every combat calculation so that I can trace exactly how damage is computed, why attacks hit or miss, and how status effects are applied.

**Why this priority**: Verbose logging is critical for identifying where calculations deviate from expected behavior. Without detailed logs, developers must add temporary console.log statements throughout the codebase.

**Independent Test**: Can be tested by running a simulation and verifying that all calculation steps are logged with their intermediate values.

**Acceptance Scenarios**:

1. **Given** a combat turn occurs, **When** I view the log, **Then** I see: attack roll (d20 + modifier), target AC, hit/miss result, damage dice, modifiers, STAB, type effectiveness, and final damage.
2. **Given** a status effect triggers, **When** I view the log, **Then** I see the condition check, application result, and any effects (skip turn, damage reduction, etc.).
3. **Given** the log is produced, **When** I scan for issues, **Then** the formatting is clear with labeled values and turn separators.

---

### User Story 5 - Reproducible Test Runs (Priority: P3)

As a developer, I want to optionally seed the random number generator so that I can reproduce exact combat sequences for debugging specific issues.

**Why this priority**: Reproducibility is valuable for tracking down intermittent bugs, but most debugging can be done with unseeded runs that expose general logic errors.

**Independent Test**: Can be tested by running two simulations with the same seed and verifying identical output.

**Acceptance Scenarios**:

1. **Given** I provide a random seed value, **When** I run the simulation twice with the same seed, **Then** the output is identical both times.
2. **Given** I run without a seed, **When** the simulation completes, **Then** the seed used is displayed so I can reproduce the run if needed.

---

### Edge Cases

- What happens when a Pokemon has no available moves (all PP exhausted)? Should use Struggle and log appropriately.
- How does the system handle Pokemon that faint from status damage (e.g., Poison) at end of turn?
- What happens if both Pokemon faint simultaneously?
- How are multi-hit moves logged (multiple damage applications)?
- How are moves that miss logged differently from moves that hit for 0 damage?

## Requirements *(mandatory)*

### Functional Requirements

**Web UI (Test Page)**
- **FR-001**: System MUST provide a dedicated test page (`/test-combat`) with Pokemon selection dropdowns for both combatants.
- **FR-002**: System MUST allow setting Pokemon levels via input fields (default: level 5).
- **FR-003**: System MUST display a scrollable log panel that updates in real-time as battle turns execute.
- **FR-004**: System MUST include a "Start Battle" button that initiates the combat simulation.
- **FR-005**: System MUST support two execution modes: step-by-step ("Next Turn" button) and auto-run (continuous with speed slider).

**CLI Script**
- **FR-006**: System MUST provide a runnable CLI script (`npm run test:combat`) that executes combat with command-line arguments.
- **FR-007**: System MUST accept CLI parameters: `--pokemon1`, `--pokemon2`, `--level1`, `--level2`, and optional `--seed`.

**Shared Combat Logic**
- **FR-008**: System MUST auto-select moves for both Pokemon using AI (random selection from available moves with PP).
- **FR-009**: System MUST log each combat turn with: turn number, active Pokemon, move used, attack roll details, damage calculation breakdown, and HP changes.
- **FR-010**: System MUST continue combat until one Pokemon faints (HP reaches 0) or a maximum turn limit is reached (100 turns).
- **FR-011**: System MUST use the same combat logic as the production system (battleEngine.js, combatUtils.js, statusEffects.js).
- **FR-012**: System MUST log status effect applications, start-of-turn effects, and end-of-turn effects with clear labeling.
- **FR-013**: System MUST display a summary at battle end showing: winner, total turns, total damage dealt by each side, and final HP values.
- **FR-014**: System MUST handle edge cases gracefully: no PP (use Struggle), simultaneous faints, status-induced faints.

### Key Entities

- **Combat Simulation**: A single automated battle run between two Pokemon from start to completion.
- **Combat Log Entry**: A structured record of a single combat event (attack, damage, status, HP change) with all relevant calculation details.
- **Test Pokemon**: A Pokemon instance configured for testing, with specified ID, level, moves, and optionally pre-set status effects.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can run a complete combat simulation in under 5 seconds (excluding setup time).
- **SC-002**: Combat log output contains all data needed to manually verify any calculation (dice rolls, modifiers, multipliers, final values).
- **SC-003**: Running the same simulation with identical seed produces byte-for-byte identical output.
- **SC-004**: The test harness catches at least 3 types of combat bugs that would otherwise require UI testing: attack roll miscalculations, damage formula errors, and status effect timing issues.
- **SC-005**: A developer new to the codebase can run their first simulation within 2 minutes of reading the documentation.

## Assumptions

- The existing battleEngine.js and related combat libraries are the source of truth for combat logic; the test harness will not implement alternate combat logic.
- Pokemon data (stats, moves, types) comes from the existing Source data files.
- The test harness is intended for local development use, not for end-user interaction or production deployment.
- Default Pokemon selection, when not specified, will use well-known Pokemon (e.g., Pikachu vs Bulbasaur) to provide meaningful test output.
- Maximum turn limit defaults to 100 turns to prevent runaway simulations.

## Dependencies

- Existing lib/battleEngine.js for combat calculations
- Existing lib/combatUtils.js for utility functions
- Existing lib/statusEffects.js for status effect processing
- Existing lib/pokemonData.js for Pokemon and move data
- Existing lib/diceRoller.js for dice mechanics
- Existing lib/typeEffectiveness.js for type calculations
