# Tasks: Environment and Test Auth Setup

**Input**: Design documents from `/specs/001-env-auth-setup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - manual verification per spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js pages router project:
- Pages and API routes: `pages/`
- Components: `components/`
- Utilities: `lib/`
- SQL migrations: `sql/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js project with TypeScript in repository root
- [x] T002 Install dependencies: @supabase/supabase-js, react, react-dom in package.json
- [x] T003 [P] Create .env.example with required environment variables template
- [x] T004 [P] Configure .gitignore to exclude .env.local and node_modules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T005 Create Supabase client with environment validation in lib/supabase.js
- [x] T006 Create SQL migration script for users table in sql/001_create_users_table.sql
- [x] T007 [P] Create authentication context provider in lib/authContext.js
- [x] T008 [P] Create API response helper for consistent JSON envelope in lib/apiResponse.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Developer Accesses Application Locally (Priority: P1)

**Goal**: Developer can clone, configure, install, and run the application locally with a visible landing page

**Independent Test**: Run `npm install && npm run dev`, navigate to http://localhost:3000, see landing page

### Implementation for User Story 1

- [x] T009 [US1] Create landing page component showing app status in pages/index.js
- [x] T010 [US1] Add environment variable validation with clear error messages in lib/supabase.js
- [x] T011 [US1] Create _app.js wrapper with AuthProvider in pages/_app.js
- [x] T012 [US1] Verify dev server starts and landing page displays correctly

**Checkpoint**: User Story 1 complete - developers can run the app locally

---

## Phase 4: User Story 2 - Developer Bypasses Auth for Testing (Priority: P2)

**Goal**: Developer can use test auth screen to create/login as any user for testing

**Independent Test**: Navigate to /test-auth, enter email/name, submit, verify session created and redirect

### Implementation for User Story 2

- [x] T013 [P] [US2] Create TestAuthForm component with email/name inputs in components/auth/TestAuthForm.js
- [x] T014 [US2] Create test auth page that renders form in pages/test-auth.js
- [x] T015 [US2] Implement POST /api/auth/test-login endpoint in pages/api/auth/test-login.js
- [x] T016 [US2] Add user lookup/create logic using Supabase service role in pages/api/auth/test-login.js
- [x] T017 [US2] Add session creation and response handling in pages/api/auth/test-login.js
- [x] T018 [US2] Add environment flag check to restrict test auth in production in pages/api/auth/test-login.js
- [x] T019 [US2] Add form validation for email format and required fields in components/auth/TestAuthForm.js
- [x] T020 [US2] Handle form submission and redirect on success in pages/test-auth.js

**Checkpoint**: User Story 2 complete - developers can authenticate for testing

---

## Phase 5: User Story 3 - Developer Verifies Database Connection (Priority: P3)

**Goal**: Developer can verify Supabase connection via health check endpoint

**Independent Test**: Call GET /api/health, verify database: connected in response

### Implementation for User Story 3

- [x] T021 [US3] Implement GET /api/health endpoint in pages/api/health.js
- [x] T022 [US3] Add database connection test query in pages/api/health.js
- [x] T023 [US3] Add clear error response for connection failures in pages/api/health.js

**Checkpoint**: User Story 3 complete - database connectivity can be verified

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [x] T024 Run SQL migration in Supabase dashboard (sql/001_create_users_table.sql) - MANUAL: User must run in Supabase SQL Editor
- [x] T025 Verify complete flow: start dev server, health check, test auth login
- [x] T026 [P] Validate quickstart.md instructions are accurate and complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase
- **User Story 2 (Phase 4)**: Depends on Foundational phase (can run parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational phase (can run parallel with US1/US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 - Uses lib/supabase.js and lib/authContext.js from foundational
- **User Story 3 (P3)**: Can start after Phase 2 - Uses lib/supabase.js from foundational

### Within Each User Story

- Earlier tasks create dependencies for later tasks (e.g., T013 creates component used by T014)
- Parallel tasks touch different files with no shared state

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003 and T004 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T007 and T008 can run in parallel (different lib files)

**Phase 4 (User Story 2)**:
- T013 can run in parallel with other US2 tasks (component file)

**Cross-Story Parallelism**:
- After Phase 2, all three user stories can theoretically proceed in parallel
- Recommended: Complete US1 first for MVP, then US2/US3

---

## Parallel Example: Phase 2 Foundational

```bash
# These foundational tasks can run in parallel:
Task: "Create authentication context provider in lib/authContext.js"
Task: "Create API response helper in lib/apiResponse.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T008)
3. Complete Phase 3: User Story 1 (T009-T012)
4. **STOP and VALIDATE**: Dev server runs, landing page visible
5. Can demo/use for basic development

### Incremental Delivery

1. Complete Setup + Foundational (T001-T008) - Foundation ready
2. Add User Story 1 (T009-T012) - MVP: App runs locally
3. Add User Story 2 (T013-T020) - Test authentication available
4. Add User Story 3 (T021-T023) - Health check available
5. Polish (T024-T026) - Complete verification

### Single Developer Strategy

Execute in order: T001 through T026
- Each task builds on previous
- Commit after each logical group (phase or story)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Manual verification per spec (no automated tests requested)
- Commit after each task or logical group
- SQL migration (T024) requires Supabase dashboard access
