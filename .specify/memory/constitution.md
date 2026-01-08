# MITPokemonProject Constitution

## Core Principles

### I. Two-Tier Data Architecture

All game data follows a strict separation:
- **Static Data** (Source/): Pokemon definitions, moves, abilities, items - loaded once, cached in memory, never modified at runtime
- **Dynamic Data** (Supabase): Player state, battle state, inventory - persisted with Row-Level Security enforced

All Source data changes require explicit migration; runtime code treats Source as read-only.

### II. D&D 5e Combat System

Combat mechanics MUST follow D&D 5th Edition rules adapted for Pokemon:
- D20 attack rolls with advantage/disadvantage
- Six attributes (STR, DEX, CON, INT, WIS, CHA)
- Proficiency bonus scaling (levels 1-20)
- Saving throws for status effects
- Critical hits (natural 20) and auto-miss (natural 1)
- Type effectiveness as damage multipliers (0.25x to 4x)

Combat changes must preserve these foundational mechanics.

### II-A. Combat Subsystems

The combat engine consists of interdependent subsystems:

**Grid System** (`gridUtils.js`):
- 10x10 battlefield grid (columns A-J, rows 1-10)
- Movement measured in cells (1 cell = 5 feet)
- Range calculations use Manhattan distance
- Positions stored as `{ col: number, row: number }`

**Status Effects** (`statusEffects.js`):
- Volatile effects: Burned, Frozen, Paralyzed, Poisoned, Asleep, Confused, Flinched
- Non-volatile effects: Curse, Trapped, Seeded, Bound
- Type immunities respected (Fire immune to Burned, etc.)
- Duration tracking per effect with turn-based expiration

**Move Effects** (`moveEffectParser.js`):
- Parse damage dice from move descriptions (e.g., "1d6 + MOVE")
- Extract status triggers (on hit, on failed save, etc.)
- Parse healing, recoil, and AC modifications
- Higher-level scaling extraction

**Combat AI** (`combatAI.js`):
- Tactical mode uses weighted scoring via `AI_WEIGHTS`
- Scores consider: type effectiveness, range, PP, target HP
- AI tuning done via test harness observation
- All AI decisions must be deterministic with seeded RNG

### III. Test Harness First

All combat features MUST be testable via the test harness infrastructure:
- **CLI Tool** (`npm run test:combat`): Quick validation with reproducible seeds
- **Web Harness** (`/test-combat`): Interactive debugging with visual grid
- **Seeded RNG**: All randomness must use `seededRandom.js` for reproducibility

New combat features require test harness support before production integration.

### IV. Security by Default

All user data tables MUST have Row-Level Security (RLS) policies:
- Users can only access their own data
- API endpoints validate authentication before database access
- Admin client used only for server-side operations

No endpoint may bypass authentication for user-specific data.

### V. Simplicity Over Abstraction

Favor simple, direct implementations:
- No TypeScript (JavaScript ES2020+ only)
- No ORM (direct Supabase queries)
- No external state manager (React Context sufficient)
- No premature optimization or over-engineering

Add complexity only when current approach demonstrably fails.

### VI. Consistent Code Patterns

**API Endpoints** follow this structure:
1. Method validation
2. Authentication check
3. Input validation
4. Business logic
5. Standardized response (sendSuccess/sendError)

**Utility Modules** use named exports for all functions and constants.

**Components** use inline styled-jsx for styling consistency.

### VII. Library Module Organization

The `lib/` directory is organized by domain:

```
lib/
├── AUTHENTICATION
│   ├── authContext.js      # React Context for auth state
│   ├── authHelper.js       # Request authentication
│   └── supabase.js         # Supabase client init
│
├── COMBAT ENGINE
│   ├── battleEngine.js     # Core attack/damage calculations
│   ├── battleState.js      # State initialization & management
│   ├── combatSimulator.js  # Test harness simulation logic
│   ├── combatUtils.js      # D&D 5e utility functions
│   ├── combatLogger.js     # Detailed event logging
│   └── combatAI.js         # AI decision-making
│
├── EFFECTS & STATUS
│   ├── statusEffects.js    # Status effect system
│   ├── moveEffectParser.js # Parse move descriptions
│   ├── abilityEffects.js   # Pokemon abilities
│   └── weatherSystem.js    # Weather mechanics
│
├── GRID & MOVEMENT
│   ├── gridUtils.js        # Grid calculations
│   ├── movementUtils.js    # Movement validation
│   └── moveRanges.js       # Range parsing
│
├── DATA MANAGEMENT
│   ├── pokemonData.js      # Pokemon/move data loading
│   ├── typeEffectiveness.js # Type matchups
│   └── seededRandom.js     # Deterministic RNG
│
└── UTILITIES
    ├── apiFetch.js         # Authenticated fetch wrapper
    ├── apiResponse.js      # Standardized responses
    └── diceParser.js       # Dice notation parsing
```

New modules MUST fit within an existing domain or justify a new domain.

### VIII. API Response Standards

All API endpoints use standardized response helpers from `apiResponse.js`:

```javascript
// Success responses
sendSuccess(res, data, statusCode = 200)
sendCreated(res, data)

// Error responses
sendValidationError(res, message, details)
sendUnauthorizedError(res, message)
sendNotFoundError(res, resourceType)
sendMethodNotAllowed(res, allowedMethods)
sendServerError(res, error)
```

Response format:
```javascript
// Success: { success: true, data: {...} }
// Error: { success: false, error: { message, code, details? } }
```

### IX. Feature Branch Convention

Feature branches follow the pattern: `###-short-name`

- `###`: Three-digit sequential number (001, 002, ... 027)
- `short-name`: 2-4 word kebab-case description

Examples:
- `001-env-auth-setup`
- `021-combat-test-harness`
- `027-combat-ai-harness`

Each feature has a corresponding `specs/###-short-name/` directory containing:
- `spec.md` - Feature specification
- `plan.md` - Implementation plan
- `tasks.md` - Task breakdown
- `research.md` - Technical research (if needed)
- `checklists/` - Validation checklists

## Technical Standards

### Stack Requirements
- **Frontend**: Next.js 14 (Pages Router), React 18
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL with RLS
- **Language**: JavaScript ES2020+ (no TypeScript)
- **Testing**: Custom test harnesses with seeded RNG

### Project Structure
```
pages/           # Next.js pages and API routes
components/      # React components by feature domain
lib/             # Core logic modules (combat, data, utils)
Source/          # Static game data (read-only JSON)
sql/             # Database migrations
scripts/         # Utility scripts (migrations, testing)
specs/           # Feature specifications
```

### Code Quality
- ESLint with Next.js configuration
- No unused exports or dead code
- Descriptive function names over comments
- Consistent error handling patterns

### Component Organization

Components are grouped by feature domain in `components/`:

```
components/
├── layout/          # GameLayout, NavBar, Footer
├── Combat/          # BattleGrid, PokemonToken, ActionPanel
├── TestCombat/      # Test harness UI (PokemonSelector, BattleLog, etc.)
├── Dashboard/       # PartyDisplay, BoxStats
├── Wild/            # EncounterUI, CatchPanel
├── Zones/           # ZoneSelector, DifficultyBadge
├── Stats/           # Charts and statistics displays
├── auth/            # LoginForm, RegisterForm
└── [shared]/        # PokemonSprite, TypeBadge (root level)
```

Component patterns:
- Inline styled-jsx for styling (no CSS modules)
- Props destructuring with sensible defaults
- Event handlers prefixed with `handle` or `on`
- State hooks at top of component

### Source Data Structure

Pokemon data in `Source/` follows strict schemas:

**Pokemon** (`Source/pokemon/pokemon.json`):
```javascript
{
  id: "bulbasaur",       // Unique string ID
  name: "Bulbasaur",     // Display name
  number: 1,             // Pokedex number (1-151)
  type: ["grass", "poison"],
  size: "tiny",          // D&D size category
  sr: 0.5,               // Starter Rating
  minLevel: 1,
  ac: 13,                // Armor Class
  hp: 17,                // Base HP
  hitDice: "d6",
  attributes: { str, dex, con, int, wis, cha }
}
```

**Moves** (`Source/moves/moves.json`):
```javascript
{
  id: "vine-whip",
  name: "Vine Whip",
  type: "grass",
  power: ["str", "dex"],  // MOVE modifier options
  pp: 15,
  range: "15",            // feet or "melee"
  description: "...",     // Contains damage dice, effects
  higherLevels: "..."     // Level scaling
}
```

Source data is immutable at runtime. Changes require updating JSON files directly.

### Database Table Patterns

All tables follow these conventions:

```sql
-- Standard columns
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- User-owned tables include
user_id UUID REFERENCES users(id) ON DELETE CASCADE

-- RLS policy pattern
CREATE POLICY "Users can only access own data"
  ON table_name FOR ALL
  USING (auth.uid() = user_id);
```

JSONB columns used for:
- `battle_state` - Serialized combat state
- `move_pp` - Per-move PP tracking `{ "move-id": pp_remaining }`
- Complex nested data that varies by context

## Development Workflow

### Feature Development
1. Create spec via `/speckit.specify`
2. Plan implementation via `/speckit.plan`
3. Generate tasks via `/speckit.tasks`
4. Implement with test harness validation
5. Document in spec artifacts

### Database Changes
- All schema changes via numbered SQL migrations in `sql/`
- Run migrations via `npm run db:migrate`
- Reset capability via `npm run db:reset`

### Combat Changes
- Validate via CLI test harness first
- Verify visual behavior in web test harness
- Ensure seeded reproducibility maintained

### Testing Standards

**Test Harness Usage**:
```bash
# CLI quick test with specific Pokemon
npm run test:combat -- --pokemon1 pikachu --pokemon2 bulbasaur --level1 5 --level2 5

# Reproducible test with seed
npm run test:combat -- --pokemon1 charmander --pokemon2 squirtle --seed 12345
```

**Reproducibility Requirements**:
- All RNG calls use `seededRandom.js`
- Same seed + same config = identical battle outcome
- Test harness displays seed for reproduction
- Combat logs include all roll details

**Manual Testing Checklist** (for combat features):
1. Run CLI test with 3+ different Pokemon matchups
2. Verify in web harness with step-through mode
3. Test edge cases (0 PP, status effects, type immunities)
4. Confirm AI reasoning logs are accurate

### Error Handling Patterns

**API Endpoints**:
```javascript
try {
  // Business logic
} catch (error) {
  console.error('Context:', error);
  return sendServerError(res, error);
}
```

**Client-Side**:
```javascript
const res = await apiFetch('/api/endpoint');
if (!res.ok) {
  const { error } = await res.json();
  // Handle error.message, error.code
}
```

**Combat Engine**:
- Throw descriptive errors for invalid states
- Log warnings for recoverable issues
- Never silently fail - always log or throw

### Logging Standards

**Combat Logger** (`combatLogger.js`) categories:
- `ATTACK` - Attack rolls, damage, hits/misses
- `STATUS` - Status effect application/removal
- `MOVE` - Movement on grid
- `AI` - AI decision reasoning
- `TURN` - Turn start/end markers

Log format includes timestamps, actor names, and full roll details for debugging.

**Console Logging**:
- `console.error()` - Unexpected errors only
- `console.warn()` - Recoverable issues
- `console.log()` - Development debugging (remove before merge)

## Constraints

### Gen-1 Only
Pokemon data is restricted to Gen-1 (IDs 1-151). This constraint exists for:
- Focused learning scope
- Reduced complexity
- Consistent asset availability

### Educational Focus
This is an educational platform. Prioritize:
- Clear, readable code over clever optimizations
- Detailed logging for debugging visibility
- Test harness accessibility for experimentation

### Combat AI Tuning

The combat AI is a core learning component:

**AI Weights** (`AI_WEIGHTS` in `combatAI.js`):
```javascript
{
  TYPE_ADVANTAGE_2X: 50,    // Super effective bonus
  TYPE_ADVANTAGE_4X: 100,   // 4x effective bonus
  TYPE_DISADVANTAGE_HALF: -30,
  TYPE_DISADVANTAGE_QUARTER: -60,
  IN_RANGE: 100,            // Can hit target
  OUT_OF_RANGE: -1000,      // Cannot reach
  TARGET_LOW_HP: 15,        // Finish off weak targets
  STATUS_ON_HEALTHY: 20,    // Apply status to fresh targets
  STATUS_ON_STATUSED: -50,  // Don't stack status
  LOW_PP_WARNING: -10       // Conserve limited moves
}
```

**Tuning Process**:
1. Adjust weights in `combatAI.js`
2. Run multiple test harness battles
3. Observe AI reasoning in logs
4. Iterate until behavior matches expectations

**AI Modes**:
- `tactical` - Uses weighted scoring (preferred for tuning)
- Test harness should default to tactical mode for consistent observation

### Performance Guidelines

Not a high-performance application, but maintain reasonable standards:

- **Page Load**: Under 3 seconds on standard connection
- **API Response**: Under 500ms for simple operations
- **Combat Turn**: Under 100ms calculation time
- **Source Data**: Cached in memory after first load

Avoid premature optimization. Profile before optimizing.

## Governance

This constitution supersedes ad-hoc decisions. Amendments require:
1. Documentation of the change rationale
2. Update to this file
3. Migration plan for existing code (if breaking)

All PRs must maintain constitutional compliance. Complexity additions require explicit justification.

**Version**: 1.0.0 | **Ratified**: 2026-01-07 | **Last Amended**: 2026-01-07
