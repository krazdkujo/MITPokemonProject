# Research: Starter Pokemon Selection

**Feature**: 002-starter-selection
**Date**: 2026-01-03

## Research Tasks

### 1. Pokemon Source Data Structure

**Question**: What fields are available in Source/pokemon/pokemon.json for starter filtering and display?

**Finding**: Each Pokemon object contains:
- `id` (string): Unique identifier (e.g., "bulbasaur")
- `name` (string): Display name (e.g., "Bulbasaur")
- `number` (integer): Pokedex number
- `type` (string[]): Array of type strings (e.g., ["grass", "poison"])
- `sr` (number): Species Rating for starter eligibility filtering
- `media.sprite` (string): URL to sprite image
- `media.main` (string): URL to full artwork

**Decision**: Filter by `sr <= 0.5` for starter eligibility. Display `name`, `type`, and `media.sprite` in the selection UI.

**Rationale**: SR field directly maps to the spec requirement. The media object provides both sprite and full artwork options.

---

### 2. Available Pokemon Types

**Question**: What types exist in the Pokemon data for the type filter bar?

**Finding**: Standard Pokemon types from the data:
- bug, dark, dragon, electric, fairy, fighting, fire, flying
- ghost, grass, ground, ice, normal, poison, psychic, rock
- steel, water

**Decision**: Extract unique types dynamically from the filtered starter Pokemon list rather than hardcoding.

**Rationale**: This ensures the filter only shows types that have at least one eligible starter Pokemon.

---

### 3. Authentication Session Handling

**Question**: How does the current test-login system provide user identity for API requests?

**Finding**: The test-login endpoint returns a session token containing user_id. Currently returns:
```javascript
{
  user: { id, email, name, created_at, updated_at },
  session: { access_token, expires_at },
  is_new_user: boolean
}
```

The `is_new_user` flag indicates first-time users who need starter selection.

**Decision**: Use the existing session token pattern. Add a helper to validate tokens and extract user_id. Check for existing Pokemon in player_pokemon table to determine starter requirement.

**Rationale**: Builds on existing auth infrastructure. The `is_new_user` flag is insufficient alone since users might log in multiple times before selecting a starter.

---

### 4. Route Protection Pattern

**Question**: How should we protect routes and enforce starter selection for new users?

**Finding**: Next.js supports:
1. Client-side checks in _app.js or individual pages
2. Middleware (but requires edge runtime)
3. Higher-order component (HOC) wrapper

**Decision**: Create an AuthGuard component that wraps protected pages. It checks:
1. Is user authenticated? If not, redirect to login.
2. Does user have Pokemon? If not, redirect to starter selection.

**Rationale**: Component-based approach is simpler than middleware and works with the existing Next.js pages structure.

---

### 5. Player Pokemon Table Design

**Question**: What fields are needed in player_pokemon for starter selection and future features?

**Finding**: Constitution requires minimal database storage. Spec defines:
- user_id (from users table)
- pokemon_id (reference to Source data)
- is_active (active roster flag)
- slot_number (roster position 1-6)
- level (starts at 1)

**Decision**: Create player_pokemon table with:
```
id (UUID, primary key)
user_id (UUID, foreign key to users.id)
pokemon_id (TEXT, references Source pokemon ID)
is_active (BOOLEAN, default false)
slot_number (INTEGER, nullable, 1-6 constraint)
level (INTEGER, default 1, check >= 1)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

**Rationale**: Follows Two-Tier Data Model. Only stores user-specific state. Supports future roster management with is_active and slot_number.

---

### 6. Preventing Duplicate Starters

**Question**: How do we prevent a user from selecting multiple starters?

**Finding**: Options:
1. Check for existing Pokemon before insert
2. Use database constraint (unique user_id with is_active=true where slot_number=1)
3. Transaction with existence check

**Decision**: Check for existing Pokemon count before allowing starter selection. If count > 0, redirect to dashboard. Also add application-level validation in the API endpoint.

**Rationale**: Simple check is sufficient for this use case. Database constraints can be added later for additional safety.

---

### 7. Confirmation UX Pattern

**Question**: How should the confirmation flow work to prevent accidental selection?

**Finding**: Common patterns:
1. Modal dialog with confirm/cancel
2. Two-step selection (select -> review -> confirm)
3. Click and hold

**Decision**: Use a modal dialog that shows:
- Selected Pokemon sprite (larger view)
- Pokemon name and types
- "This choice is permanent" warning
- Confirm and Cancel buttons

**Rationale**: Modal is familiar UX, provides clear confirmation step, and matches the "permanent choice" requirement.

---

## Summary

All research questions resolved. Key decisions:

1. **Data source**: Use `sr <= 0.5` filter on Source/pokemon/pokemon.json
2. **Types**: Extract dynamically from filtered Pokemon
3. **Auth**: Extend existing session pattern, check player_pokemon count
4. **Routing**: AuthGuard component for protection
5. **Database**: Minimal player_pokemon table following Two-Tier pattern
6. **Duplicate prevention**: Application-level check before selection
7. **UX**: Modal confirmation dialog

Ready for Phase 1: Design & Contracts.
