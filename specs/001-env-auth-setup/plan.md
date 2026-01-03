# Implementation Plan: Environment and Test Auth Setup

**Branch**: `001-env-auth-setup` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-env-auth-setup/spec.md`

## Summary

Set up the foundational development environment for the Pokemon Educational Platform v2.
This includes Next.js project initialization, Supabase connection configuration, environment
variable management, and a test authentication screen that allows developers to bypass real
JWT auth during development by entering email/name directly.

## Technical Context

**Language/Version**: JavaScript/TypeScript with Node.js 18+
**Primary Dependencies**: Next.js 14, @supabase/supabase-js, React 18
**Storage**: Supabase PostgreSQL with Row-Level Security
**Testing**: Manual verification (foundational setup feature)
**Target Platform**: Web (Vercel serverless deployment)
**Project Type**: Web application (Next.js pages router)
**Performance Goals**: Dev server starts in <30s, auth flow <5s
**Constraints**: 10-second API route timeout (Vercel), stateless requests
**Scale/Scope**: Single developer setup, foundation for future features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | N/A | No Pokemon data in this feature |
| II. External JWT Authentication | Partial | Test auth bypasses JWT for dev; production will use real JWT |
| III. Row-Level Security | Pass | Users table will have RLS enabled |
| IV. Data Merging Pattern | N/A | No Pokemon data merging in this feature |
| V. Serverless Architecture | Pass | Using Next.js API routes on Vercel |
| VI. Pokemon 5e Compliance | N/A | No game mechanics in this feature |
| VII. Educational API Design | Pass | Clear JSON responses with error details |
| VIII. Spec-Driven Development | Pass | Following spec-driven workflow |

**Gate Status**: PASS - All applicable principles satisfied or justified.

## Project Structure

### Documentation (this feature)

```text
specs/001-env-auth-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md           # API endpoint documentation
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── index.js             # Landing page
├── test-auth.js         # Test authentication screen (dev only)
└── api/
    ├── health.js        # Health check endpoint
    └── auth/
        └── test-login.js # Test auth API endpoint

components/
└── auth/
    └── TestAuthForm.js  # Test auth form component

lib/
├── supabase.js          # Supabase client initialization
└── authContext.js       # Authentication context provider

sql/
└── 001_create_users_table.sql  # Users table with RLS

.env.example             # Environment variable template
.env.local               # Local environment (gitignored)
```

**Structure Decision**: Using Next.js pages router structure per constitution. The `pages/`
directory contains both pages and API routes. The `lib/` directory contains shared utilities.
SQL migrations are stored in `sql/` with numbered prefixes.

## Complexity Tracking

No violations requiring justification. This feature follows all applicable constitution
principles.
