# Implementation Plan: Environment and Test Auth Setup

**Branch**: `001-env-auth-setup` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-env-auth-setup/spec.md`

## Summary

Set up the development environment with Supabase integration and implement a test authentication screen that allows developers to bypass real JWT authentication for testing purposes. The test auth screen creates or retrieves user records based on email input, storing session state via Supabase's built-in auth session handling.

## Technical Context

**Language/Version**: JavaScript ES2020+ with Node.js 18+
**Primary Dependencies**: Next.js 14.0.0 (Pages Router), React 18.2.0, @supabase/supabase-js 2.39.0
**Storage**: Supabase PostgreSQL with Row-Level Security (RLS)
**Testing**: Manual testing via development server (no automated test framework for this feature)
**Target Platform**: Web browser (development environment)
**Project Type**: Web application (Next.js with API routes)
**Performance Goals**: Page load under 3 seconds, auth flow under 5 seconds
**Constraints**: Test auth only available in development mode (controlled by environment flag)
**Scale/Scope**: Single developer setup, foundation for all future features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Two-Tier Data Architecture** | ✅ PASS | User data is dynamic (Supabase), no static Source data for this feature |
| **II. D&D 5e Combat System** | N/A | Not applicable - no combat in this feature |
| **III. Test Harness First** | N/A | Auth setup doesn't require combat test harness |
| **IV. Security by Default** | ✅ PASS | RLS policies will be applied to users table; test auth restricted by env flag |
| **V. Simplicity Over Abstraction** | ✅ PASS | JavaScript only, direct Supabase queries, React Context for session state |
| **VI. Consistent Code Patterns** | ✅ PASS | Will follow API endpoint structure with standardized responses |
| **VII. Library Module Organization** | ✅ PASS | Auth modules go in lib/AUTHENTICATION domain |
| **VIII. API Response Standards** | ✅ PASS | Will use sendSuccess/sendError from apiResponse.js |
| **IX. Feature Branch Convention** | ✅ PASS | Branch is `001-env-auth-setup` with specs in `specs/001-env-auth-setup/` |

**Gate Result**: ✅ PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/001-env-auth-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# Next.js Web Application Structure
pages/
├── index.js             # Landing page (confirms app operational)
├── test-auth.js         # Test authentication screen
├── _app.js              # App wrapper with auth context
└── api/
    ├── health.js        # Database health check endpoint
    └── auth/
        └── test-login.js  # Test login API endpoint

lib/
├── supabase.js          # Supabase client initialization
├── authContext.js       # React Context for auth state
└── authHelper.js        # Request authentication utilities

sql/
└── 001_users.sql        # Users table migration with RLS

# Environment configuration
.env.example             # Template for environment variables
.env.local               # Local environment (gitignored)
```

**Structure Decision**: Next.js Pages Router structure with API routes. Auth modules placed in `lib/` following the AUTHENTICATION domain organization from constitution.

## Complexity Tracking

> No violations requiring justification - all patterns follow constitution.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Post-Design Constitution Re-Check

*Gate re-evaluation after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Two-Tier Data Architecture** | ✅ PASS | Users table in Supabase (dynamic), no Source files needed |
| **IV. Security by Default** | ✅ PASS | RLS policies defined in data-model.md, env flag gates access |
| **V. Simplicity Over Abstraction** | ✅ PASS | Direct Supabase queries, React Context, no ORM |
| **VI. Consistent Code Patterns** | ✅ PASS | API contracts follow standardized response format |
| **VII. Library Module Organization** | ✅ PASS | supabase.js, authContext.js, authHelper.js in lib/ |
| **VIII. API Response Standards** | ✅ PASS | Contracts use sendSuccess/sendValidationError/sendError |

**Post-Design Gate Result**: ✅ PASSED - Design adheres to constitution

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/001-env-auth-setup/plan.md` | ✅ Complete |
| Research | `specs/001-env-auth-setup/research.md` | ✅ Complete |
| Data Model | `specs/001-env-auth-setup/data-model.md` | ✅ Complete |
| API Contracts | `specs/001-env-auth-setup/contracts/api.md` | ✅ Complete |
| Quickstart Guide | `specs/001-env-auth-setup/quickstart.md` | ✅ Complete |
| Agent Context | `CLAUDE.md` | ✅ Updated |
