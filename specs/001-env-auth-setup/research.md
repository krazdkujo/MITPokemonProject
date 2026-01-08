# Research: Environment and Test Auth Setup

**Feature**: 001-env-auth-setup
**Date**: 2026-01-03 (Updated: 2026-01-07)

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

**Decision**: Dual-client pattern with separate browser and admin clients

**Rationale**:
- Browser client uses anon key with session persistence for client-side operations
- Admin client uses service role key to bypass RLS for server-side operations only
- Session auto-refresh enabled for better UX

**Key Configuration**:
```javascript
// Browser client (safe for client-side)
export const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

// Admin client (server-side only, bypasses RLS)
export function createAdminClient() {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
```

**Alternatives Considered**:
- Single client with conditional auth - Rejected: security risk of exposing service key
- Server-only access - Rejected: would require API calls for all data fetches

### Test Auth Implementation

**Decision**: Create a development-only page that directly creates/retrieves users
and sets a custom session using localStorage.

**Rationale**: For development testing, we need a way to simulate authenticated users
without real JWT infrastructure. We use a separate localStorage key (`pokemon_test_auth`)
that the AuthContext checks before falling back to Supabase auth.

**Security Considerations**:
- Test auth page protected by `NEXT_PUBLIC_ENABLE_TEST_AUTH` environment flag
- Only accessible when flag is explicitly set to "true"
- Production deployments must not set this flag
- API endpoint also validates the flag before processing

### Test Auth Session Storage

**Decision**: localStorage with JSON serialization

**Rationale**:
- localStorage persists across page refreshes (better DX than sessionStorage)
- Separate key (`pokemon_test_auth`) from Supabase's internal storage
- Session includes expiration timestamp for automatic cleanup (1-hour default)
- AuthContext checks localStorage first, falls back to Supabase auth

**Alternatives Considered**:
- Cookie-based sessions - Rejected: more complex, unnecessary for dev-only feature
- Server-side sessions - Rejected: adds state management complexity
- Only in React state - Rejected: lost on page refresh

### Environment Variable Management

**Decision**: Use `.env.example` as template, `.env.local` for actual values (gitignored).

**Required Variables**:
```
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_KEY=           # Supabase service role key (server-side only)
SUPABASE=                       # Database password (for migrations)

# Development (Optional)
NEXT_PUBLIC_ENABLE_TEST_AUTH=   # Enable test auth screen (dev only)
```

**Rationale**: Next.js automatically loads `.env.local` and exposes `NEXT_PUBLIC_*`
variables to the browser. Service keys remain server-side only.

### Environment Validation Strategy

**Decision**: Fail fast on server, warn on client

**Rationale**:
- Server startup should fail immediately with clear error messages for missing config
- Browser should log errors but not crash to allow partial debugging
- Error messages should be actionable (tell user what to do)

**Implementation**: Validation at module load time in `lib/supabase.js`
```javascript
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  if (typeof window !== 'undefined') {
    console.error(errorMessage);  // Browser: warn
  } else {
    throw new Error(errorMessage);  // Server: fail
  }
}
```

### RLS Policy for Users Table

**Decision**: Enable RLS with self-access only pattern

**Rationale**: Per constitution Principle IV, all tables must have RLS. For the users
table, each user should only be able to see and modify their own record.

**Policy Design**:
- SELECT: `auth.uid() = id`
- UPDATE: `auth.uid() = id`
- INSERT: Via service role during user creation (admin client)
- DELETE: Not allowed (users cannot delete themselves)

**Note**: Test auth uses admin client which bypasses RLS, so policies don't affect development login.

## Integration Patterns

### Supabase Auth Flow for Test Auth

1. User submits email/name on test auth form (`/test-auth`)
2. API route (`/api/auth/test-login`) receives request, validates env flag
3. Uses admin client (bypasses RLS) to:
   a. Check if user exists by email
   b. Create user if not exists
   c. Generate a base64-encoded session token
4. Return user data and session to client
5. Client stores in localStorage via `setTestAuth()` from AuthContext
6. AuthContext detects test auth session on subsequent page loads

### Session Token Strategy

**Decision**: Base64-encoded JSON payload with 1-hour expiration

**Rationale**:
- Simple format sufficient for development purposes
- Contains minimal claims (user_id, email, created_at)
- Short expiration encourages re-authentication
- Not cryptographically secure (acceptable for dev-only feature)

**Production Note**: Real auth would use Supabase JWT tokens with proper signing.

### API Response Standards

**Decision**: Use standardized `apiResponse.js` helpers

**Functions Used**:
- `sendSuccess(res, data)` - Successful login
- `sendValidationError(res, message, details)` - Invalid input
- `sendMethodNotAllowed(res, ['POST'])` - Wrong HTTP method
- `sendError(res, code, message, status, details)` - Test auth disabled

**Response Format**:
```javascript
// Success
{ success: true, data: { user, session, is_new_user } }

// Error
{ success: false, error: { code, message, details? } }
```

## Summary of Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| Session storage mechanism | localStorage with JSON serialization |
| Client vs server Supabase access | Dual-client pattern (anon + admin) |
| Test auth access control | Environment flag (NEXT_PUBLIC_ENABLE_TEST_AUTH) |
| User schema fields | id, email, name, created_at, updated_at |
| RLS policy approach | Self-access only (auth.uid() = id) |
| API response format | Standardized helpers from apiResponse.js |
| Environment validation | Fail fast on server, warn on client |

## No Outstanding Research Items

All technical decisions have been made. Ready for Phase 1 design.
