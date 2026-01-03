# Research: Environment and Test Auth Setup

**Feature**: 001-env-auth-setup
**Date**: 2026-01-03

## Technology Decisions

### Next.js Version and Router

**Decision**: Next.js 14 with Pages Router

**Rationale**: The constitution specifies the pages router structure (`pages/api/` for
serverless routes). Pages Router is stable, well-documented, and matches the V1
architecture patterns. App Router could be considered for future features but is not
needed for this foundational setup.

**Alternatives Considered**:
- App Router: More modern but would require restructuring the constitution's file layout
- Express.js: Would lose Vercel's optimized serverless deployment

### Supabase Client Configuration

**Decision**: Use `@supabase/supabase-js` v2 with browser client for frontend and
service role client for API routes when needed.

**Rationale**: Supabase JS v2 provides built-in session management, RLS support, and
TypeScript types. The browser client automatically handles session refresh and storage.

**Key Configuration**:
- Browser client: Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- API routes: Can use service role key for admin operations if needed
- Session storage: Handled automatically by Supabase client (localStorage + cookies)

### Test Auth Implementation

**Decision**: Create a development-only page that directly creates/retrieves users
and sets a Supabase session using custom tokens.

**Rationale**: For development testing, we need a way to simulate authenticated users
without real JWT infrastructure. Supabase allows creating sessions with custom access
tokens using the service role.

**Security Considerations**:
- Test auth page protected by `NEXT_PUBLIC_ENABLE_TEST_AUTH` environment flag
- Only accessible when flag is explicitly set to "true"
- Production deployments must not set this flag

### Environment Variable Management

**Decision**: Use `.env.example` as template, `.env.local` for actual values (gitignored).

**Required Variables**:
```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_KEY=           # Supabase service role key (server-side only)
NEXT_PUBLIC_ENABLE_TEST_AUTH=   # Enable test auth screen (dev only)
```

**Rationale**: Next.js automatically loads `.env.local` and exposes `NEXT_PUBLIC_*`
variables to the browser. Service keys remain server-side only.

### RLS Policy for Users Table

**Decision**: Enable RLS with policies allowing users to read/update only their own record.

**Rationale**: Per constitution Principle III, all tables must have RLS. For the users
table, each user should only be able to see and modify their own record. The service
role is used for initial user creation during test auth flow.

**Policy Design**:
- SELECT: `auth.uid() = id`
- UPDATE: `auth.uid() = id`
- INSERT: Via service role during user creation
- DELETE: Not allowed (users cannot delete themselves)

## Integration Patterns

### Supabase Auth Flow for Test Auth

1. User submits email/name on test auth form
2. API route receives request, uses service role to:
   a. Check if user exists by email
   b. Create user if not exists
   c. Generate a custom access token for the user
3. Return session data to client
4. Client stores session using Supabase client
5. Subsequent requests include auth header

### Environment Validation at Startup

Next.js allows runtime environment checks. We'll validate required variables in:
- `lib/supabase.js`: Check Supabase credentials before creating client
- Console warnings for missing variables with specific remediation steps

## No Outstanding Research Items

All technical decisions have been made. Ready for Phase 1 design.
