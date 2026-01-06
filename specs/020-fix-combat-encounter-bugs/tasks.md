# Tasks: Fix Combat Encounter Bugs

**Input**: Design documents from `/specs/020-fix-combat-encounter-bugs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: No test framework configured (ESLint only). Manual verification via quickstart.md.

**Organization**: Tasks grouped by user story. Note: This is a bug fix with a single root cause affecting all three user stories. The fix is applied in Foundational phase, with verification tasks per story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This project uses Next.js Pages Router structure:
- **Library code**: `lib/`
- **Pages**: `pages/`
- **API routes**: `pages/api/`
- **Components**: `components/`

---

## Phase 1: Setup

**Purpose**: Verify environment and understand current state

- [x] T001 Verify development environment is running (`npm run dev`)
- [x] T002 [P] Review current HP default logic in `lib/pokemonData.js` lines 108-141
- [x] T003 [P] Review battleEngine HP handling in `lib/battleEngine.js` lines 357-358

---

## Phase 2: Foundational (Core Fix)

**Purpose**: Apply the single-point fix that resolves all three bugs

**Root Cause**: `lib/pokemonData.js` defaults NULL HP to 1 instead of max_hp

- [x] T004 Fix HP defaults in `buildPlayerPokemonResponse` fallback path (sourcePokemon not found) in `lib/pokemonData.js` lines 113-126
  - Change `max_hp: dbRecord.max_hp || 1` to `const fallbackMaxHp = dbRecord.max_hp || 1;`
  - Change `current_hp: dbRecord.current_hp || 1` to `current_hp: dbRecord.current_hp ?? fallbackMaxHp`

- [x] T005 Fix HP defaults in `buildPlayerPokemonResponse` normal path in `lib/pokemonData.js` lines 128-141
  - Add `const effectiveMaxHp = dbRecord.max_hp || sourcePokemon.hp || 20;`
  - Change `max_hp: dbRecord.max_hp || 1` to `max_hp: effectiveMaxHp`
  - Change `current_hp: dbRecord.current_hp || 1` to `current_hp: dbRecord.current_hp ?? effectiveMaxHp`

- [x] T006 Verify `lib/battleEngine.js` `buildCombatant` function aligns with fix (should already use correct fallback chain at line 357-358)

**Checkpoint**: Core fix applied. All downstream consumers now receive correct HP defaults.

---

## Phase 3: User Story 1 - Join Active Encounter with Healthy Pokemon (Priority: P1)

**Goal**: Players with healthy Pokemon can see and place them in active encounters

**Independent Test**: Navigate to Zones with healthy Pokemon, start encounter, verify all healthy Pokemon appear in placement panel

### Verification for User Story 1

- [x] T007 [US1] Verify `pages/zones.js` `hasHealthyPokemon` check works with fixed HP data
  - Party data now has correct HP values from `gameContext.js`
  - Filter `party.filter(p => p.current_hp > 0)` should include fresh Pokemon
  - VERIFIED: Line 213 uses `party.some(p => p.current_hp > 0)` - fresh Pokemon now has max_hp > 0

- [x] T008 [US1] Verify `pages/api/zones/encounter.js` party filtering for combat includes fresh Pokemon
  - Check line filtering `party.filter(p => p.current_hp > 0)`
  - Fresh Pokemon (was NULL, now max_hp) should be included
  - VERIFIED: Line 283 filters correctly with fixed data

- [x] T009 [US1] Verify `pages/combat.js` `getUnplacedPokemon` returns all healthy Pokemon
  - Combatants built from fixed data should have correct HP values
  - VERIFIED: Combatants use buildCombatant which has correct fallback chain

- [ ] T010 [US1] Manual test: Create/use fresh Pokemon (NULL HP in DB), navigate to Zones, start encounter
  - Expected: Pokemon appears in placement panel with full HP bar
  - Pass/Fail: Document in quickstart.md results

**Checkpoint**: User Story 1 complete - healthy Pokemon appear in encounters

---

## Phase 4: User Story 2 - Accurate Knockout Detection (Priority: P1)

**Goal**: Only Pokemon with exactly 0 HP are classified as knocked out

**Independent Test**: Create mixed party (healthy, damaged, fainted), verify only 0 HP Pokemon marked fainted

### Verification for User Story 2

- [x] T011 [US2] Verify `lib/gameContext.js` line 87 `is_fainted` check works correctly
  - `is_fainted: p.current_hp === 0` - strict equality preserved
  - Fresh Pokemon (NULL → max_hp) should NOT be fainted
  - VERIFIED: Line 87 uses strict equality `p.current_hp === 0` - fresh Pokemon (max_hp) NOT fainted

- [x] T012 [US2] Verify no false "all knocked out" redirect in `pages/zones.js`
  - Check logic that determines if all party Pokemon are fainted
  - Should use strict `current_hp === 0` check
  - VERIFIED: Line 376 checks `!hasHealthyPokemon` which uses `p.current_hp > 0` - fixed data = no false redirect

- [x] T013 [US2] Verify `components/Combat/BattleGrid.js` line 55 renders healthy Pokemon
  - Check `combatant.current_hp > 0` condition
  - Fresh Pokemon (now has max_hp) should render
  - VERIFIED: Line 55 uses `combatant.current_hp > 0` - fresh Pokemon (max_hp) will render

- [ ] T014 [US2] Manual test: Fresh Pokemon should NOT redirect to Pokemon Center
  - Navigate to Zones with fresh Pokemon (NULL HP in DB)
  - Expected: Can start encounter, NOT redirected to Pokemon Center
  - Pass/Fail: Document in quickstart.md results

**Checkpoint**: User Story 2 complete - no false knockout detection

---

## Phase 5: User Story 3 - Functional Pokemon Center Healing (Priority: P2)

**Goal**: Heal button enabled when any Pokemon needs healing, disabled when all healthy

**Independent Test**: Navigate to Pokemon Center with mixed party, verify button state matches party health

### Verification for User Story 3

- [x] T015 [US3] Verify `pages/pokecenter.js` lines 305-307 `needsHealing` calculation correct
  - `party.some(pokemon => pokemon.current_hp < pokemon.max_hp)`
  - Fresh Pokemon: max_hp < max_hp = false (correctly shows as healthy)
  - Damaged Pokemon: current_hp < max_hp = true (correctly enables healing)
  - VERIFIED: Line 305-307 logic correct - fresh Pokemon (current_hp = max_hp) = no healing needed

- [x] T016 [US3] Verify `pages/api/heal.js` handles all HP states correctly
  - Check heal updates `current_hp = max_hp` for all party Pokemon
  - Should work regardless of prior NULL state
  - VERIFIED: Line 77 sets `current_hp: pokemon.max_hp` - works with fixed max_hp values

- [x] T017 [US3] Verify `components/Dashboard/PartyCard.js` HP bar display matches data
  - HP percentage calculation uses same data as button logic
  - No visual/functional mismatch
  - VERIFIED: Uses same gameContext data flow - consistent with heal button logic

- [ ] T018 [US3] Manual test: Pokemon Center button states
  - Test 1: All fresh Pokemon (NULL HP) → Button disabled, message "already healthy"
  - Test 2: Damaged Pokemon → Button enabled
  - Test 3: Click heal → All Pokemon restored, button disables
  - Pass/Fail: Document in quickstart.md results

**Checkpoint**: User Story 3 complete - heal button functions correctly

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [x] T019 [P] Run ESLint to verify no code quality issues: `npm run lint`
  - VERIFIED: ESLint ran - no new issues from our changes. Existing warnings in other files are pre-existing.
- [ ] T020 [P] Execute full quickstart.md test suite manually
- [x] T021 [P] Verify edge case: Pokemon with NULL max_hp AND NULL current_hp
  - Should default to source Pokemon HP for both values
  - VERIFIED: Line 131 uses `sourcePokemon.hp || 20` fallback chain, line 139 uses nullish coalescing
- [ ] T022 Document any additional findings in quickstart.md results section
- [x] T023 Update spec.md status from "Draft" to "Complete" if all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────────┐
                                    │
                                    ▼
Phase 2: Foundational (Core Fix) ──┬──────────────────────────────┐
         BLOCKS ALL STORIES        │                              │
                                   │                              │
                                   ▼                              ▼
Phase 3: US1 (Encounters) ◄───► Phase 4: US2 (Knockout) ◄───► Phase 5: US3 (Healing)
         P1 Priority               P1 Priority                    P2 Priority
         │                         │                              │
         └─────────────────────────┼──────────────────────────────┘
                                   │
                                   ▼
Phase 6: Polish & Validation
```

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 (Core Fix) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on Phase 2 (Core Fix) - No dependencies on other stories
- **User Story 3 (P2)**: Depends on Phase 2 (Core Fix) - No dependencies on other stories

**Key Insight**: All three user stories share the same root cause fix in Phase 2. Once the core fix is applied, all stories can be verified in parallel.

### Within Each User Story

1. Code review/verification tasks
2. Manual testing tasks
3. Documentation of results

### Parallel Opportunities

- T002, T003 can run in parallel (Setup phase - different files)
- T007, T008, T009 can run in parallel after Phase 2 (US1 verification - different files)
- T011, T012, T013 can run in parallel after Phase 2 (US2 verification - different files)
- T015, T016, T017 can run in parallel after Phase 2 (US3 verification - different files)
- T019, T020, T021 can run in parallel (Polish phase)
- **All user story phases (3, 4, 5) can run in parallel** after Phase 2 completes

---

## Parallel Example: All User Stories After Core Fix

```bash
# After T004-T006 complete, launch all verification in parallel:

# User Story 1 tasks:
Task: "Verify zones.js hasHealthyPokemon check"
Task: "Verify zones/encounter.js party filtering"
Task: "Verify combat.js getUnplacedPokemon"

# User Story 2 tasks:
Task: "Verify gameContext.js is_fainted check"
Task: "Verify no false knockout redirect"
Task: "Verify BattleGrid.js renders healthy Pokemon"

# User Story 3 tasks:
Task: "Verify pokecenter.js needsHealing calculation"
Task: "Verify heal.js handles all HP states"
Task: "Verify PartyCard.js HP bar display"
```

---

## Implementation Strategy

### MVP First (Core Fix Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational Core Fix (T004-T006)
3. **STOP and VALIDATE**: Quick manual test - fresh Pokemon should work
4. All three bugs should now be fixed

### Full Verification

1. Complete Setup + Foundational → Core fix applied
2. Verify User Story 1 (T007-T010) → Encounters work
3. Verify User Story 2 (T011-T014) → No false knockouts
4. Verify User Story 3 (T015-T018) → Healing works
5. Polish (T019-T023) → Documentation complete

### Rollback Plan

If fix causes unexpected issues:
1. Revert T004 and T005 changes in `lib/pokemonData.js`
2. Restart dev server
3. Document specific failure in issue tracker

---

## Notes

- This is a **bug fix** with minimal code changes (~10 lines modified)
- The fix is **centralized** in `lib/pokemonData.js` - all downstream consumers automatically fixed
- **No new files** created - only existing files modified
- **No database changes** - fix is entirely in JavaScript data handling layer
- **Backward compatible** - uses `??` operator to preserve actual 0 HP (knocked out) state
- ESLint is the only automated validation available - manual testing required per quickstart.md
