# Tasks: Game Navigation Layout

**Input**: Design documents from `/specs/011-game-layout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Components**: `components/layout/` for new layout components
- **Context**: `lib/` for new React Context
- **Pages**: `pages/` for page wrappers
- Follows existing Next.js structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the foundational GameContext that all layout components depend on

- [x] T001 Create GameContext with provider, hooks, and state management in lib/gameContext.js
- [x] T002 Create GameLayout shell component that wraps AuthGuard and provides GameContext in components/layout/GameLayout.js

**Checkpoint**: GameContext available for components, GameLayout shell renders children

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core components required by multiple user stories

**Note**: No foundational tasks - all components are directly tied to specific user stories

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Navigate Between Game Sections (Priority: P1)

**Goal**: Players can navigate between all 6 game sections with visual feedback on active page

**Independent Test**: Click each navigation link and verify correct page loads; active link is highlighted

### Implementation for User Story 1

- [x] T003 [P] [US1] Create NavLink component with active state detection using useRouter in components/layout/NavLink.js
- [x] T004 [P] [US1] Create inline SVG icon components (home, sword, shop, heal, grass, bag) in components/layout/NavIcons.js
- [x] T005 [US1] Create SideNav component with 6 navigation links using NavLink in components/layout/SideNav.js
- [x] T006 [P] [US1] Create placeholder page for /combat wrapped with GameLayout in pages/combat.js
- [x] T007 [P] [US1] Create placeholder page for /pokemart wrapped with GameLayout in pages/pokemart.js
- [x] T008 [P] [US1] Create placeholder page for /pokecenter wrapped with GameLayout in pages/pokecenter.js
- [x] T009 [P] [US1] Create placeholder page for /wild wrapped with GameLayout in pages/wild.js
- [x] T010 [P] [US1] Create placeholder page for /inventory wrapped with GameLayout in pages/inventory.js
- [x] T011 [US1] Update existing dashboard.js to use GameLayout wrapper in pages/dashboard.js
- [x] T012 [US1] Integrate SideNav into GameLayout sidebar area in components/layout/GameLayout.js

**Checkpoint**: All 6 navigation links work, active state shows correctly, layout consistent across pages

---

## Phase 4: User Story 2 - View Currency Balance (Priority: P1)

**Goal**: Players see their current currency balance in top navigation at all times

**Independent Test**: View top navigation and verify currency matches player's actual balance; purchase something and see it update

### Implementation for User Story 2

- [x] T013 [P] [US2] Create CurrencyBadge component with value display and update animation in components/layout/CurrencyBadge.js
- [x] T014 [US2] Add currency fetch to GameContext (from /api/player/inventory) in lib/gameContext.js
- [x] T015 [US2] Create TopNav component shell with currency placement in components/layout/TopNav.js
- [x] T016 [US2] Integrate TopNav with CurrencyBadge into GameLayout in components/layout/GameLayout.js

**Checkpoint**: Currency displays in top nav on all pages, updates after transactions via refreshData()

---

## Phase 5: User Story 3 - View Party Pokemon Status (Priority: P2)

**Goal**: Players see compact view of party Pokemon with color-coded HP bars in sidebar

**Independent Test**: View sidebar and verify up to 6 Pokemon display with accurate HP indicators; click Pokemon navigates to Pokemon Center

### Implementation for User Story 3

- [x] T017 [P] [US3] Create MiniHPBar component with spec thresholds (green >75%, yellow 25-75%, red <25%) in components/layout/MiniHPBar.js
- [x] T018 [P] [US3] Create MiniPartyCard component with sprite, HP bar, fainted indicator in components/layout/MiniPartyCard.js
- [x] T019 [US3] Add party fetch to GameContext (from /api/player/pokemon, filter is_active) in lib/gameContext.js
- [x] T020 [US3] Create MiniPartyDisplay component showing up to 6 Pokemon cards in components/layout/MiniPartyDisplay.js
- [x] T021 [US3] Integrate MiniPartyDisplay into SideNav below navigation links in components/layout/SideNav.js
- [x] T022 [US3] Add click handler on MiniPartyCard to navigate to /pokecenter in components/layout/MiniPartyCard.js

**Checkpoint**: Party Pokemon display in sidebar with HP bars, fainted indicator for 0 HP, click navigates to Pokemon Center

---

## Phase 6: User Story 4 - View Player Identity (Priority: P3)

**Goal**: Players see their name in top navigation to confirm logged-in account

**Independent Test**: Log in and verify player name appears in top navigation

### Implementation for User Story 4

- [x] T023 [US4] Add playerName to GameContext state (from auth context or API) in lib/gameContext.js
- [x] T024 [US4] Add player name display section to TopNav component in components/layout/TopNav.js
- [x] T025 [US4] Add game logo/title to TopNav left section in components/layout/TopNav.js

**Checkpoint**: Player name and game title visible in top navigation

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Handle edge cases, loading/error states, and final styling

- [x] T026 [P] Add loading state UI to GameLayout while fetching player data in components/layout/GameLayout.js
- [x] T027 [P] Add error state with retry button to GameLayout in components/layout/GameLayout.js
- [x] T028 [P] Add empty party state handling (no Pokemon message) to MiniPartyDisplay in components/layout/MiniPartyDisplay.js
- [x] T029 Style GameLayout with consistent spacing, colors, and typography in components/layout/GameLayout.js
- [x] T030 Validate all pages render correctly with GameLayout via quickstart.md manual testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - creates GameContext and GameLayout shell
- **User Stories (Phase 3-6)**: All depend on Setup completion
  - US1 and US2 can proceed in parallel (different components)
  - US3 depends on SideNav from US1
  - US4 depends on TopNav from US2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - Creates SideNav, NavLink, placeholder pages
- **User Story 2 (P1)**: Can start after Setup - Creates TopNav, CurrencyBadge
- **User Story 3 (P2)**: Depends on US1 (integrates into SideNav)
- **User Story 4 (P3)**: Depends on US2 (integrates into TopNav)

### Within Each User Story

- Components marked [P] can be built in parallel
- Integration tasks must wait for component tasks
- GameLayout integration is last step per story

### Parallel Opportunities

- T003 + T004: NavLink and NavIcons in parallel
- T006-T010: All 5 placeholder pages in parallel
- T013 + T014: CurrencyBadge and context update in parallel
- T017 + T018: MiniHPBar and MiniPartyCard in parallel
- T026 + T027 + T028: All Polish error/loading states in parallel

---

## Parallel Example: User Story 1

```bash
# Launch NavLink and NavIcons in parallel:
Task: "Create NavLink component in components/layout/NavLink.js"
Task: "Create inline SVG icon components in components/layout/NavIcons.js"

# After above complete, launch all placeholder pages in parallel:
Task: "Create placeholder page for /combat in pages/combat.js"
Task: "Create placeholder page for /pokemart in pages/pokemart.js"
Task: "Create placeholder page for /pokecenter in pages/pokecenter.js"
Task: "Create placeholder page for /wild in pages/wild.js"
Task: "Create placeholder page for /inventory in pages/inventory.js"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (GameContext, GameLayout shell)
2. Complete Phase 3: User Story 1 (Navigation works)
3. Complete Phase 4: User Story 2 (Currency displays)
4. **STOP and VALIDATE**: Test navigation and currency display
5. Deploy/demo basic layout

### Incremental Delivery

1. Complete Setup -> GameContext and shell ready
2. Add US1 (Navigation) -> Test navigation works -> Demo
3. Add US2 (Currency) -> Test currency displays -> Demo
4. Add US3 (Party) -> Test HP bars work -> Demo
5. Add US4 (Identity) -> Test name shows -> Demo
6. Complete Polish -> Final validation

### Parallel Execution (if 2 developers)

1. Both complete Setup together
2. Once Setup is done:
   - Developer A: User Story 1 (Navigation)
   - Developer B: User Story 2 (Currency)
3. After US1 complete:
   - Developer A: User Story 3 (Party - integrates into SideNav)
4. After US2 complete:
   - Developer B: User Story 4 (Identity - integrates into TopNav)
5. Both complete Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks included (not requested in spec)
- All new components go in components/layout/
- Reuse existing HPBar patterns but with adjusted thresholds for mini display
- GameContext follows AuthContext pattern from existing codebase
- Placeholder pages are minimal - just GameLayout wrapper with title
