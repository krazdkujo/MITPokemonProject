# Feature Specification: Environment and Test Auth Setup

**Feature Branch**: `001-env-auth-setup`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Set up our environment and a generic auth screen with no login for testing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Accesses Application Locally (Priority: P1)

A developer clones the repository and wants to run the application locally. They need
environment configuration in place, dependencies installed, and the ability to start
a development server that connects to Supabase.

**Why this priority**: Without a working development environment, no other features
can be built or tested. This is the foundational setup that everything else depends on.

**Independent Test**: Can be tested by cloning the repository, following setup
instructions, and verifying the development server starts without errors and displays
a page in the browser.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the developer runs the install
   command, **Then** all dependencies are installed without errors.

2. **Given** environment variables are configured from a template, **When** the
   developer starts the development server, **Then** the application launches and
   is accessible in a browser.

3. **Given** the application is running, **When** the developer views the home page,
   **Then** they see a landing screen confirming the app is operational.

---

### User Story 2 - Developer Bypasses Auth for Testing (Priority: P2)

A developer wants to test features without setting up real JWT authentication. They
access a test auth screen that lets them enter any email/name and proceed as if they
had a valid JWT token, creating a user session for development purposes.

**Why this priority**: Real JWT integration depends on external providers. Developers
need a way to test user-specific features immediately without waiting for auth
infrastructure.

**Independent Test**: Can be tested by navigating to the test auth screen, entering
test credentials, and verifying the application creates a user session and allows
access to authenticated areas.

**Acceptance Scenarios**:

1. **Given** the application is running in development mode, **When** a developer
   navigates to the auth screen, **Then** they see fields to enter email and name
   for testing.

2. **Given** a developer is on the test auth screen, **When** they enter an email
   and name and submit, **Then** a user session is created (or retrieved if exists)
   and they are redirected to the main application.

3. **Given** a developer enters an email that already exists in the database, **When**
   they submit the test auth form, **Then** they are logged in as that existing user
   without creating a duplicate.

4. **Given** a developer enters a new email, **When** they submit the test auth form,
   **Then** a new user record is created with the provided email and name.

---

### User Story 3 - Developer Verifies Database Connection (Priority: P3)

A developer wants to confirm that the application can connect to Supabase and perform
basic database operations. This validates that environment configuration is correct
and the database is accessible.

**Why this priority**: Database connectivity is essential for all features but is
secondary to having a running application. It can be verified after the basic setup
is confirmed working.

**Independent Test**: Can be tested by triggering a database health check (via API
or console) and verifying a successful response indicating the connection works.

**Acceptance Scenarios**:

1. **Given** environment variables include valid Supabase credentials, **When** the
   application attempts a database connection, **Then** the connection succeeds.

2. **Given** invalid or missing Supabase credentials, **When** the application
   attempts a database connection, **Then** a clear error message indicates the
   configuration problem.

---

### Edge Cases

- What happens when environment variables are missing or malformed?
  - The application displays clear error messages identifying which variables are
    missing or invalid.

- What happens when Supabase is unreachable?
  - The application shows a connection error rather than crashing, allowing
    developers to troubleshoot.

- What happens when the test auth screen is accessed in production?
  - The test auth screen is only available when a development/test flag is enabled.
    In production mode, it is not accessible.

- What happens when a developer enters invalid email format in test auth?
  - Basic validation ensures email follows standard format before creating a user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an environment variable template file listing all
  required configuration values with descriptions.

- **FR-002**: System MUST validate that required environment variables are present
  at startup and display actionable error messages for any missing values.

- **FR-003**: System MUST establish a Supabase client connection using environment
  credentials.

- **FR-004**: System MUST provide a test authentication screen that accepts email
  and name input.

- **FR-005**: System MUST create a new user record when a test auth submission
  contains an email not already in the database.

- **FR-006**: System MUST retrieve and use the existing user record when a test auth
  submission contains an email already in the database.

- **FR-007**: System MUST store user session state using Supabase's built-in auth
  session handling (browser storage) so authenticated users remain logged in across
  page navigation.

- **FR-008**: System MUST restrict access to the test auth screen based on an
  environment flag (only available in development/testing modes).

- **FR-009**: System MUST provide a visual indicator or landing page confirming the
  application is running correctly.

- **FR-010**: All database schema changes MUST be provided as SQL migration scripts
  stored in the `sql/` folder with numbered prefixes (e.g., 001_, 002_).

### Key Entities

- **User**: Represents a platform user. Key attributes:
  - `id`: Unique identifier (primary key)
  - `email`: User's email address (unique, used for identification)
  - `name`: Display name
  - `created_at`: Timestamp when the user record was created
  - `updated_at`: Timestamp when the user record was last modified

  This is the foundation for all user-specific data in the platform.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can complete initial project setup (clone, configure, run)
  in under 10 minutes following documentation.

- **SC-002**: Test authentication flow completes in under 5 seconds from form
  submission to authenticated state.

- **SC-003**: 100% of missing environment variables are reported with specific
  error messages at startup.

- **SC-004**: User creation via test auth correctly persists to database and
  survives application restart.

- **SC-005**: Existing users are correctly identified by email, preventing
  duplicate user records.

## Clarifications

### Session 2026-01-03

- Q: How should session state be persisted? → A: Browser storage via Supabase auth (cookies/localStorage managed by Supabase client)
- Q: Where should SQL migration scripts be stored? → A: In the `sql/` folder with numbered prefixes (per constitution)
- Q: Which additional fields should the users table include? → A: Standard: id, email, name, created_at, updated_at

## Assumptions

- Supabase project already exists and is configured (database, API keys available).
- Developers have Node.js and npm/yarn installed locally.
- The test auth feature is explicitly for development/testing and will be disabled
  or removed before production deployment.
- Email is the unique identifier for users across the system.
- Session management uses Supabase's built-in auth session handling (browser storage).
