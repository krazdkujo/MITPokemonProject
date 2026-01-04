# Tasks: Pokemon Center Page

**Input**: Design documents from `/specs/012-pokecenter-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Manual browser testing only (no automated tests requested)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js)**: `pages/`, `components/`, `lib/` at repository root

---

## Phase 1: Setup

**Purpose**: Verify existing infrastructure is ready (no new setup needed)

- [x] T001 Verify existing stub at pages/pokecenter.js exists and is accessible
- [x] T002 [P] Verify GameLayout component works at components/layout/GameLayout.js
- [x] T003 [P] Verify HPBar component works at components/Dashboard/HPBar.js
- [x] T004 [P] Verify PartyCard component works at components/Dashboard/PartyCard.js
- [x] T005 [P] Verify useGame hook exports party and refreshData from lib/gameContext.js
- [x] T006 [P] Verify apiFetch is available from lib/apiFetch.js

**Checkpoint**: All existing infrastructure verified - implementation can begin

---

## Phase 2: Foundational (Page Structure)

**Purpose**: Core page structure that ALL user stories depend on

- [x] T007 Implement base PokeCenterPage export with GameLayout wrapper in pages/pokecenter.js
- [x] T008 Implement PokeCenterContent inner component with useGame hook in pages/pokecenter.js
- [x] T009 Add local state for healing, message, and messageType in pages/pokecenter.js
- [x] T010 Add base page styles (background, container, responsive grid) in pages/pokecenter.js
- [x] T011 Implement NurseJoyWelcome styled header component in pages/pokecenter.js

**Checkpoint**: Foundation ready - page loads with welcome message, user story implementation can begin

---

## Phase 3: User Story 1 - Heal Damaged Pokemon Party (Priority: P1) - MVP

**Goal**: Players can heal all damaged Pokemon with one button click

**Independent Test**: Visit page with damaged Pokemon, click "Heal All", verify HP restored and success message shown

### Implementation for User Story 1

- [x] T012 [US1] Implement handleHeal async function calling POST /api/heal in pages/pokecenter.js
- [x] T013 [US1] Add HealButton component with onClick handler in pages/pokecenter.js
- [x] T014 [US1] Implement loading state (button disabled, "Healing..." text) during heal in pages/pokecenter.js
- [x] T015 [US1] Call refreshData() after successful heal to update GameContext in pages/pokecenter.js
- [x] T016 [US1] Implement StatusMessage component for success/error display in pages/pokecenter.js
- [x] T017 [US1] Show "Your Pokemon have been healed!" message on success in pages/pokecenter.js
- [x] T018 [US1] Handle network errors with error message and retry option in pages/pokecenter.js
- [x] T019 [US1] Add button disabled state while healing to prevent duplicate clicks in pages/pokecenter.js

**Checkpoint**: User Story 1 complete - healing flow works end-to-end

---

## Phase 4: User Story 2 - View Party Health Status (Priority: P2)

**Goal**: Players see all party Pokemon with sprites, names, levels, and color-coded HP bars

**Independent Test**: Visit page with Pokemon at various HP levels, verify all display correctly without healing

### Implementation for User Story 2

- [x] T020 [US2] Implement PartyDisplay container component with responsive grid in pages/pokecenter.js
- [x] T021 [US2] Map party array to PartyCard components in pages/pokecenter.js
- [x] T022 [US2] Pass pokemon data (sprite, name, level, current_hp, max_hp) to PartyCard in pages/pokecenter.js
- [x] T023 [US2] Verify HPBar color coding (green >50%, yellow 25-50%, red <25%) works in pages/pokecenter.js
- [x] T024 [US2] Add loading state display while party data loads in pages/pokecenter.js
- [x] T025 [US2] Add error state display if party data fails to load in pages/pokecenter.js
- [x] T026 [US2] Style party grid for responsive layout (3 cols desktop, 2 tablet, 1 mobile) in pages/pokecenter.js

**Checkpoint**: User Story 2 complete - party displays correctly with all health information

---

## Phase 5: User Story 3 - Handle Already Healthy Party (Priority: P3)

**Goal**: Players see clear feedback when party is already at full health

**Independent Test**: Visit page with all Pokemon at max HP, verify button disabled and info message shown

### Implementation for User Story 3

- [x] T027 [US3] Implement needsHealing derived state from party data in pages/pokecenter.js
- [x] T028 [US3] Disable "Heal All" button when needsHealing is false in pages/pokecenter.js
- [x] T029 [US3] Show "Your Pokemon are already healthy!" info message when party healthy in pages/pokecenter.js
- [x] T030 [US3] Style disabled button state (reduced opacity, different cursor) in pages/pokecenter.js

**Checkpoint**: User Story 3 complete - healthy party edge case handled gracefully

---

## Phase 6: User Story 4 - Handle Empty Party (Priority: P3)

**Goal**: New players without Pokemon see helpful guidance

**Independent Test**: Visit page with no active Pokemon, verify empty state message displayed

### Implementation for User Story 4

- [x] T031 [US4] Detect empty party state (party.length === 0) in pages/pokecenter.js
- [x] T032 [US4] Implement EmptyPartyMessage component with starter link in pages/pokecenter.js
- [x] T033 [US4] Display "You have no Pokemon! Select a starter first." message in pages/pokecenter.js
- [x] T034 [US4] Hide heal button and party grid when party is empty in pages/pokecenter.js

**Checkpoint**: User Story 4 complete - empty party edge case handled with helpful guidance

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements across all user stories

- [x] T035 [P] Add CSS transition to HPBar width for animation effect in pages/pokecenter.js
- [x] T036 [P] Ensure consistent styling with other game pages (color scheme, fonts) in pages/pokecenter.js
- [x] T037 Review accessibility (button focus states, screen reader text) in pages/pokecenter.js
- [x] T038 Manual test all user stories in sequence on localhost
- [x] T039 Verify page works in GameLayout navigation flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1, US2, US3, US4 can technically proceed in parallel
  - Recommended: sequential in priority order (P1 -> P2 -> P3)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Heal)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2 - View)**: Can start after Foundational - Independent, but logically pairs with US1
- **User Story 3 (P3 - Healthy)**: Requires needsHealing logic - Depends on US1 implementation
- **User Story 4 (P3 - Empty)**: Can start after Foundational - Truly independent

### Within Each Phase

- Tasks in the same phase without [P] marker must be sequential
- Tasks with [P] marker can run in parallel (different files or independent code)

### Parallel Opportunities

- T002-T006 can all run in parallel (verification tasks)
- T035-T036 can run in parallel (different concerns)
- User stories share same file, so parallelization is limited

---

## Parallel Example: Setup Verification

```bash
# All verification tasks can run in parallel:
Task: T002 "Verify GameLayout component"
Task: T003 "Verify HPBar component"
Task: T004 "Verify PartyCard component"
Task: T005 "Verify useGame hook"
Task: T006 "Verify apiFetch"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational (page structure)
3. Complete Phase 3: User Story 1 (heal functionality)
4. **STOP and VALIDATE**: Test healing works end-to-end
5. This delivers core value - healing works!

### Incremental Delivery

1. Setup + Foundational -> Page loads with welcome message
2. Add User Story 1 -> Healing works (MVP!)
3. Add User Story 2 -> Party displays properly
4. Add User Story 3 -> Healthy party handled
5. Add User Story 4 -> Empty party handled
6. Polish -> Animation, accessibility, final review

### Single File Strategy

Since all tasks target `pages/pokecenter.js`:
- Work sequentially through user stories
- Each story adds functionality to the single file
- Commit after each checkpoint for safe rollback points

---

## Notes

- All implementation in single file: `pages/pokecenter.js`
- Reuses existing components: GameLayout, HPBar, PartyCard
- Uses existing APIs: GET /api/player/pokemon, POST /api/heal
- No automated tests - manual browser testing only
- CSS-in-JS styling with `<style jsx>`
- GameContext provides party data via useGame() hook
