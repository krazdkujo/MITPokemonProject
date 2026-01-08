# Feature Specification: Remove Random Mode from Combat Harness

**Feature Branch**: `027-combat-ai-harness`
**Created**: 2026-01-07
**Status**: Draft
**Input**: User description: "remove the random feature from the combat harness, all tests should use the combat AI for tuning."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat AI Tuning via Test Harness (Priority: P1)

As a developer tuning the combat AI, I want the test harness to always use the tactical AI mode so that I can observe and refine AI decision-making without random noise affecting test results.

**Why this priority**: This is the core purpose of the feature - ensuring consistent AI behavior for tuning and debugging. Without this, developers cannot reliably test AI improvements.

**Independent Test**: Can be fully tested by starting any battle in the test harness and verifying AI reasoning logs appear for every move selection, showing tactical decision-making rather than random selection.

**Acceptance Scenarios**:

1. **Given** the test combat page is loaded, **When** I start a new battle, **Then** the AI should use tactical mode by default (no random selection option visible)
2. **Given** a battle is in progress, **When** the AI selects moves, **Then** the battle log should display AI reasoning with weighted scoring details for each decision
3. **Given** I use the Quick Battle generator, **When** a random battle is created, **Then** both combatants should use tactical AI for move selection

---

### User Story 2 - Consistent Test Results for AI Comparison (Priority: P2)

As a developer comparing AI behavior across different configurations, I want all simulations to use the same AI logic so that I can make meaningful comparisons between test runs.

**Why this priority**: Enables reliable A/B testing of AI parameter changes by eliminating the variable of random vs tactical behavior.

**Independent Test**: Can be tested by running the same battle configuration (Pokemon, levels, seed) multiple times and verifying the AI reasoning produces identical decision patterns.

**Acceptance Scenarios**:

1. **Given** a seed is specified for a battle, **When** the battle runs to completion, **Then** the same tactical decisions should be made in the same order
2. **Given** I am reviewing battle logs, **When** I examine move selections, **Then** each move should have associated AI reasoning showing score calculations

---

### Edge Cases

- What happens if the tactical AI cannot score any move (all moves out of PP)? The system should fall back to Struggle, which is already implemented.
- How does removal affect the API endpoint? The `aiMode` parameter should be removed or ignored, defaulting to tactical.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the AI mode toggle UI from the test combat page
- **FR-002**: System MUST default all combat simulations to tactical AI mode
- **FR-003**: System MUST remove the `AI_MODE.RANDOM` constant and related random selection logic from `combatSimulator.js`
- **FR-004**: Battle logs MUST display AI reasoning for every move selection during combat
- **FR-005**: The `/api/test-combat/start` endpoint MUST ignore any `aiMode` parameter and always use tactical mode
- **FR-006**: The Quick Battle generator MUST use tactical AI for generated battles
- **FR-007**: System MUST preserve seeded RNG behavior for reproducible tactical decisions

### Key Entities

- **Combat Simulation**: Battle instance that now always uses tactical AI scoring for move selection
- **AI Reasoning Log**: Detailed log entries showing weighted scoring rationale for each move decision
- **Tactical AI Weights**: The `AI_WEIGHTS` configuration in `combatAI.js` that drives all move scoring

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of battles started via the test harness use tactical AI mode
- **SC-002**: AI reasoning logs are visible for every move selection in the battle log
- **SC-003**: No UI elements for selecting "Random" vs "Tactical" mode remain in the test combat page
- **SC-004**: Battles with the same seed produce identical AI decisions across multiple runs
- **SC-005**: Developers can observe and iterate on AI tuning by reviewing consistent tactical decision patterns

## Assumptions

- The tactical AI (`selectMoveTactical` function) is mature enough to be the sole move selection method
- The `AI_WEIGHTS` configuration in `combatAI.js` provides sufficient parameters for ongoing tuning
- Existing seeded RNG infrastructure continues to work with tactical-only mode for reproducibility
- No other parts of the codebase depend on the random AI mode being available
