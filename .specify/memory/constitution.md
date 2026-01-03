<!--
  ============================================================================
  Sync Impact Report
  ============================================================================
  Version Change: 0.0.0 -> 1.0.0

  Modified Principles: N/A (initial creation)

  Added Sections:
  - Core Principles (8 principles)
    - I. Two-Tier Data Model
    - II. External JWT Authentication
    - III. Row-Level Security
    - IV. Data Merging Pattern
    - V. Serverless Architecture
    - VI. Pokemon 5e Compliance
    - VII. Educational API Design
    - VIII. Spec-Driven Development
  - Technical Architecture section
  - Development Workflow section
  - Governance section

  Removed Sections: N/A (initial creation)

  Templates Requiring Updates:
  - plan-template.md: No updates needed (generic template)
  - spec-template.md: No updates needed (generic template)
  - tasks-template.md: No updates needed (generic template)
  - checklist-template.md: No updates needed (generic template)
  - agent-file-template.md: No updates needed (generic template)

  Follow-up TODOs: None
  ============================================================================
-->

# Pokemon Educational Platform Constitution

## Core Principles

### I. Two-Tier Data Model

All Pokemon reference data (species stats, moves, abilities, type charts, evolution chains,
items, natures, classes, feats, TMs, and game rules) MUST be stored as read-only JSON files
in the `Source/` folder. The database MUST only store user-specific state: which Pokemon a
user owns, their selected moves, current HP, level, inventory, and progression.

**Rationale**: This pattern prevents data duplication, ensures consistency with Pokemon 5e
source material, reduces database size, and makes updates to game data trivial without
migrations. Version 1 established this as the correct architecture after initially making
the mistake of duplicating reference data in the database.

**Requirements**:
- Source files are authoritative and read-only at runtime
- Database tables store only foreign key references to Source IDs (e.g., `pokemon_id` TEXT)
- Never store names, types, base stats, descriptions, or any data that exists in Source
- API responses MUST merge database records with Source data before returning

### II. External JWT Authentication

Authentication uses external JWT tokens containing `email` and `name` claims. The system
MUST auto-create a user record on first valid JWT if the user does not exist. All database
tables MUST use `user_id` as a foreign key for user ownership.

**Rationale**: Version 2 migrates from Supabase email/password auth to external JWT
providers, enabling integration with institutional identity systems while maintaining the
same data isolation patterns.

**Requirements**:
- API routes MUST validate Bearer tokens on every request
- Extract `email` and `name` from JWT claims
- Create user record automatically if email not found
- All subsequent operations use `user_id` from the user record
- Never trust client-provided user identity; always derive from JWT

### III. Row-Level Security

Every database table MUST have Row-Level Security (RLS) enabled. All RLS policies MUST
filter data using `user_id = auth.uid()` to ensure users can only access their own data.

**Rationale**: Defense in depth. Even if application code has bugs, the database layer
prevents cross-user data access. This is non-negotiable for any educational platform
handling student data.

**Requirements**:
- Enable RLS on every table at creation time
- Write policies for SELECT, INSERT, UPDATE, DELETE operations
- Policies MUST check `user_id = auth.uid()`
- No service-role bypasses in application code unless explicitly justified
- Test RLS policies with multiple user contexts

### IV. Data Merging Pattern

The `lib/pokemonData.js` module provides utility functions that combine database records
with Source JSON files to produce complete API responses. This is the ONLY sanctioned
pattern for building responses that include both user state and Pokemon details.

**Rationale**: Centralizing the merge logic ensures consistency, prevents bugs where some
endpoints return full data and others return partial data, and makes it easy to update
the merge logic when Source data structure changes.

**Required Functions** (maintain in lib/pokemonData.js):
- `getAllPokemon()` - Load all Pokemon from Source
- `getPokemonById(id)` - Get single Pokemon from Source
- `getMoveById(id)` - Get move details from Source
- `getAbilityById(id)` - Get ability details from Source
- `getAvailableMovesForLevel(pokemonId, level)` - Filter moves by level requirement
- `buildPlayerPokemonResponse(dbRecord)` - Merge database record with Source data
- Type effectiveness calculations referencing Source type charts

### V. Serverless Architecture

The application runs on Vercel using Next.js API routes as serverless functions. The
database is Supabase PostgreSQL accessed via the Supabase client library.

**Rationale**: Vercel provides automatic scaling, global edge deployment, and zero
infrastructure management. Supabase provides managed PostgreSQL with built-in RLS support.

**Constraints**:
- API route execution timeout: 10 seconds maximum
- No persistent connections between requests
- Stateless request handling; all state in database
- Use Supabase client for database connections (handles pooling)
- No background jobs or long-running processes in API routes

**File Structure**:
```
pages/
  api/           # Serverless API routes
components/      # React components by feature area
lib/
  supabase.js    # Supabase client initialization
  authContext.js # Authentication state management
  pokemonData.js # Source data loading and merging utilities
Source/          # Read-only Pokemon 5e JSON files
  pokemon/pokemon.json
  moves/moves.json
  abilities/abilities.json
  evolution/evolution.json
  items/items.json
  natures/natures.json
  classes/classes.json
  feats/feats.json
  tms/tms.json
  rules/rules.json
  metadata.json
sql/             # Numbered migrations (001_, 002_, etc.)
specs/           # Spec-driven development artifacts
```

### VI. Pokemon 5e Compliance

All game mechanics MUST reference the Source JSON files as the authoritative source.
Never hardcode Pokemon stats, move effects, type matchups, damage formulas, HP
calculations, or level-up rules.

**Rationale**: The Pokemon 5e project has carefully balanced game mechanics. Hardcoding
values leads to inconsistencies, makes updates difficult, and creates bugs when Source
data is updated.

**Requirements**:
- HP calculations MUST use Hit Dice from Source data
- Move availability MUST check level requirements from Source
- Type effectiveness MUST use the type chart from Source
- Damage formulas MUST follow Pokemon 5e rules from Source
- Evolution requirements MUST reference evolution.json
- Ability effects MUST reference abilities.json

### VII. Educational API Design

Students learn AI and automation by building N8N workflows that interact with our API
endpoints. API design MUST prioritize clarity, debuggability, and transparency.

**Rationale**: When a student's workflow fails, they need to understand why. Opaque
errors or unclear state make debugging impossible and impede learning.

**Requirements**:
- All API responses MUST return well-structured JSON
- Error responses MUST include: error code, human-readable message, and field-level
  details when applicable
- Success responses MUST include the complete current game state affected by the action
- Use consistent response envelope: `{ success: boolean, data?: object, error?: object }`
- Document all endpoints with request/response examples
- Include relevant game state in responses (e.g., after battle, show updated HP)

### VIII. Spec-Driven Development

All features follow the spec-driven workflow: constitution -> specify -> plan -> tasks ->
implement. Each feature creates a numbered folder in `specs/` containing the design
artifacts.

**Rationale**: Structured development ensures features are thought through before
implementation, creates documentation as a byproduct, and enables review at each stage.

**Workflow**:
1. `constitution` - Establish project principles (this document)
2. `specify` - Create feature specification with user stories and requirements
3. `plan` - Technical design, architecture decisions, data models
4. `tasks` - Break down into actionable implementation tasks
5. `implement` - Execute tasks following the plan

**Artifact Structure**:
```
specs/
  001-feature-name/
    spec.md      # User stories, requirements, acceptance criteria
    plan.md      # Technical design, data models, contracts
    tasks.md     # Ordered implementation tasks
```

## Technical Architecture

**Stack**:
- Runtime: Next.js on Vercel (serverless functions)
- Database: Supabase PostgreSQL with RLS
- Authentication: External JWT (email + name claims)
- Reference Data: Static JSON files (Pokemon 5e)

**Database Schema Pattern**:
Tables store minimal user-specific data with references to Source:
- `pokemon_id` as TEXT referencing Source pokemon IDs
- `selected_moves` as TEXT[] array of move IDs from Source
- `current_hp` and `max_hp` as INTEGER
- `level` as INTEGER
- `user_id` as UUID foreign key to users table

**Never store in database**: name, type, base stats, move descriptions, ability text,
or any data that exists in Source files.

**API Response Pattern**:
```javascript
// Database record (minimal)
{ pokemon_id: "bulbasaur", level: 5, current_hp: 18, selected_moves: ["tackle", "growl"] }

// API response (merged with Source)
{
  id: "bulbasaur",
  name: "Bulbasaur",
  type: ["Grass", "Poison"],
  level: 5,
  current_hp: 18,
  max_hp: 22,
  base_stats: { ... },  // from Source
  selected_moves: [
    { id: "tackle", name: "Tackle", power: 40, ... },  // from Source
    { id: "growl", name: "Growl", ... }  // from Source
  ]
}
```

## Development Workflow

**Database Migrations**:
- Store in `sql/` folder with numbered prefixes (001_, 002_, etc.)
- Include RLS policy creation in migration files
- Test migrations in development before applying to production
- Document migration purpose in file header comments

**Testing Strategy**:
- Test API endpoints with multiple user contexts to verify RLS
- Test data merging functions with mock database records
- Verify Pokemon 5e compliance by checking calculations against Source
- Integration test N8N workflow patterns

**Code Organization**:
- API routes handle auth validation, call service functions, format responses
- Service functions contain business logic, call data utilities
- Data utilities handle Source loading and database merging
- Keep components small and feature-focused

## Governance

This constitution establishes the foundational patterns for the Pokemon Educational
Platform. All development decisions MUST align with these principles.

**Amendment Process**:
1. Propose amendment with rationale
2. Document impact on existing code
3. Update constitution version per semantic versioning
4. Propagate changes to affected templates and documentation

**Versioning Policy**:
- MAJOR: Breaking changes to principles or removal of core patterns
- MINOR: New principles added or significant guidance expansion
- PATCH: Clarifications, typo fixes, non-semantic refinements

**Compliance**:
- All code reviews MUST verify adherence to these principles
- Violations require documented justification and constitution amendment
- New features MUST follow spec-driven workflow

**What This Constitution Dictates**:
- Architecture patterns (two-tier data model, serverless, RLS)
- Authentication approach (external JWT, auto-create users)
- Data handling (Source files authoritative, merge pattern required)
- API design principles (educational clarity, error detail)
- Development workflow (spec-driven process)

**What Comes Later (in specs)**:
- Specific database schema designs for individual features
- Individual API endpoint contracts and routes
- UI/UX designs and component architecture
- Feature-specific business logic and game mechanics

**Version**: 1.0.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
