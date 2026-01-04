# Tasks: Pokemon Images Download

**Input**: Design documents from `/specs/004-pokemon-images/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec. Manual verification via visual inspection.

**Organization**: Tasks grouped by user story to enable independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js web application:
- Images: `public/images/pokemon/`
- Scripts: `scripts/`
- Library: `lib/`
- Components: `components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and placeholder image

- [x] T001 Create images directory structure at public/images/pokemon/
- [x] T002 [P] Create placeholder.png fallback image at public/images/pokemon/placeholder.png

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Download script and helper library that all user stories depend on

**CRITICAL**: Download must complete before any image display tasks can be verified

- [x] T003 Create download script at scripts/download-pokemon-images.js
- [x] T004 Run download script to fetch all 151 Pokemon sprites to public/images/pokemon/
- [x] T005 Verify download: confirm 151 PNG files exist in public/images/pokemon/

**Checkpoint**: All 152 files present (151 Pokemon + placeholder) - image foundation ready

---

## Phase 3: User Story 1 - Developer Accesses Pokemon Sprites (Priority: P1)

**Goal**: Developers can access Pokemon images via predictable file paths and helper functions

**Independent Test**: Verify image files exist for all Pokemon and paths can be constructed programmatically

### Implementation for User Story 1

- [x] T006 [US1] Create pokemonImages helper module at lib/pokemonImages.js with getPokemonImagePath() and getPlaceholderPath() functions
- [x] T007 [US1] Add pokemonImageExists() function to lib/pokemonImages.js for server-side validation
- [x] T008 [US1] Verify integration: test getPokemonImagePath() returns correct paths for dex numbers 1, 25, 151

**Checkpoint**: Helper library complete - developers can programmatically access image paths

---

## Phase 4: User Story 2 - Application Displays Pokemon Consistently (Priority: P2)

**Goal**: React component provides consistent Pokemon image display with sizing and fallback support

**Independent Test**: Render PokemonSprite component with various Pokemon IDs and verify consistent appearance

### Implementation for User Story 2

- [x] T009 [US2] Create PokemonSprite React component at components/PokemonSprite.js
- [x] T010 [US2] Add size prop support for customizable dimensions (default 96px)
- [x] T011 [US2] Add onError fallback to placeholder.png when image fails to load
- [x] T012 [US2] Support both pokemonId (string) and pokemonNumber (number) props

**Checkpoint**: PokemonSprite component complete - images display consistently across the app

---

## Phase 5: User Story 3 - Offline Image Availability (Priority: P3)

**Goal**: Confirm images work offline and are bundled with deployments

**Independent Test**: Disconnect from network and verify images still load

### Implementation for User Story 3

- [x] T013 [US3] Verify .gitignore does NOT exclude public/images/pokemon/ (images must be committed)
- [x] T014 [US3] Add all Pokemon images to git staging and commit
- [x] T015 [US3] Verify build includes images: run npm run build and check .next/static contains images

**Checkpoint**: Images bundled with project - offline availability confirmed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Integration verification and documentation

- [x] T016 Update existing pages to use PokemonSprite component where applicable
- [x] T017 Run quickstart.md validation: verify all documented usage examples work
- [x] T018 Start dev server and visually verify sample Pokemon images load correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - create directories first
- **Foundational (Phase 2)**: Depends on Phase 1 - download images into created directories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - needs images to exist for path validation
- **User Story 2 (Phase 4)**: Depends on Phase 3 - uses pokemonImages.js helper
- **User Story 3 (Phase 5)**: Depends on Phase 2 - needs images downloaded to commit
- **Polish (Phase 6)**: Depends on Phases 3 and 4 - needs component and helper ready

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - independent
- **User Story 2 (P2)**: Depends on US1 (uses pokemonImages.js helper)
- **User Story 3 (P3)**: Independent of other stories (just commits existing files)

### Parallel Opportunities

Within Phase 1:
- T001 and T002 can run in parallel (different files)

Within User Story 2 (Phase 4):
- T010, T011, T012 are sequential changes to same file

---

## Parallel Example: Phase 1

```text
# These can run together:
Task T001: Create images directory structure at public/images/pokemon/
Task T002: Create placeholder.png fallback image at public/images/pokemon/placeholder.png
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup - create directories
2. Complete Phase 2: Foundational - download all images
3. Complete Phase 3: User Story 1 - helper library
4. **STOP and VALIDATE**: Test that getPokemonImagePath(25) returns '/images/pokemon/25.png'
5. Developers can now access images programmatically

### Incremental Delivery

1. Setup + Foundational -> 151 Pokemon images available in project
2. Add User Story 1 -> Helper functions for image paths (MVP!)
3. Add User Story 2 -> React component for consistent display
4. Add User Story 3 -> Images committed to git for offline availability
5. Polish -> Integration with existing pages

### Single Developer Strategy

Execute phases sequentially in order. Each phase builds on the previous.
Total estimated tasks: 18
Key blocking task: T004 (download) must complete before verification tasks.

---

## Notes

- No automated tests in this feature - verification is visual/manual
- Download script runs once during setup, not on every build
- Images are static assets, not database entities
- pokemonImages.js must load Source/pokemon/pokemon.json for ID-to-number mapping
- PokemonSprite component should handle both string IDs ("bulbasaur") and numbers (1)
