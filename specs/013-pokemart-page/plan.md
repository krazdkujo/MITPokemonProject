# Implementation Plan: PokeMart Item Shop Page

**Branch**: `013-pokemart-page` | **Date**: 2026-01-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-pokemart-page/spec.md`

## Summary

Implement the PokeMart page (`pages/pokemart.js`) - an item shop interface where players can browse items by category, add items to a shopping cart, and complete purchases. The implementation leverages existing API endpoints (GET/POST /api/shop) and reuses established UI components (GameLayout, CurrencyBadge).

## Technical Context

**Language/Version**: JavaScript (ES2020+) with Node.js 18+
**Primary Dependencies**: Next.js 14, React 18, @supabase/supabase-js
**Storage**: Supabase PostgreSQL (existing player_inventory, users tables)
**Testing**: Manual testing via browser
**Target Platform**: Web browser (Vercel deployment)
**Project Type**: Web application (Next.js)
**Performance Goals**: Catalog load < 2 seconds, purchase complete < 5 seconds
**Constraints**: Serverless function timeout 10s, stateless requests
**Scale/Scope**: Single page feature, reuses existing components and APIs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Two-Tier Data Model | PASS | Frontend consumes merged API responses; item data from Source via API |
| II. External JWT Authentication | PASS | Uses existing apiFetch() with Bearer tokens |
| III. Row-Level Security | N/A | Frontend only; RLS enforced at API layer |
| IV. Data Merging Pattern | PASS | APIs return pre-merged item data from Source |
| V. Serverless Architecture | PASS | Follows Next.js page pattern with GameLayout |
| VI. Pokemon 5e Compliance | N/A | No game mechanics calculations on frontend |
| VII. Educational API Design | PASS | Uses standard response envelope with detailed errors |
| VIII. Spec-Driven Development | PASS | Following spec -> plan -> tasks workflow |

**Gate Result**: PASS - All applicable principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/013-pokemart-page/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.yaml         # API contract reference
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
  pokemart.js            # Main page component (TO IMPLEMENT)
  api/
    shop.js              # Existing - GET catalog, POST purchase
    player/
      inventory.js       # Existing - GET inventory and currency

components/
  layout/
    GameLayout.js        # Existing - Page wrapper
    CurrencyBadge.js     # Existing - Currency display
  starter/
    ConfirmationModal.js # Existing - Modal pattern reference

lib/
  gameContext.js         # Existing - Currency state management
  apiFetch.js            # Existing - Authenticated API calls
  itemData.js            # Existing - Item data utilities

Source/
  items/
    items.json           # Existing - Item reference data
```

**Structure Decision**: Web application pattern - single page under `pages/` leveraging existing component library and APIs.

## Complexity Tracking

No complexity violations. Feature uses existing infrastructure.

---

## Design Decisions

### 1. Component Architecture

**Decision**: Single-file page component with inline subcomponents.

**Rationale**: The PokeMart page is self-contained with no shared components beyond existing ones. Inline components reduce file fragmentation.

**Structure**:
```
PokeMartPage (export default)
└── PokeMartContent (inner component)
    ├── ShopHeader (balance display)
    ├── CategoryTabs (tab navigation)
    ├── ItemCatalog (item grid)
    │   └── ItemCard (single item)
    ├── ShoppingCart (cart sidebar)
    │   └── CartItem (single cart entry)
    ├── PurchaseButton (action button)
    ├── PurchaseModal (success confirmation)
    └── InsufficientFundsModal (error display)
```

### 2. State Management

**Decision**: GameContext for currency + local state for cart and catalog.

**Rationale**:
- Currency from GameContext (shared across app)
- Cart state local (session-only, not persisted)
- Catalog cached locally after fetch

**State Variables**:
```javascript
// From GameContext
const { currency, refreshData } = useGame();

// Local state
const [catalog, setCatalog] = useState([]);      // All purchasable items
const [activeTab, setActiveTab] = useState('pokeball');
const [cart, setCart] = useState(new Map());     // Map<itemId, CartItem>
const [purchasing, setPurchasing] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [showErrorModal, setShowErrorModal] = useState(false);
const [purchaseResults, setPurchaseResults] = useState([]);
const [errorDetails, setErrorDetails] = useState(null);
```

### 3. Purchase Flow

**Decision**: Sequential API calls for each cart item.

**Rationale**: Existing POST /api/shop handles single-item purchases. For cart purchases:
1. Validate total cost against balance (client-side)
2. Loop through cart items, call API for each
3. Aggregate successful purchases
4. Call refreshData() once after all purchases
5. Show confirmation modal

**Error Handling**:
- Stop on first INSUFFICIENT_FUNDS error
- Show error modal with details
- Already-purchased items remain in inventory

### 4. Category Tabs

**Decision**: Static tabs matching item types.

**Categories**:
- Poke Balls (`pokeball`)
- Medicine (`medicine`)
- Hold Items (`holditem`)
- TMs (`tm`)

**Implementation**: Filter catalog by `item.type === activeTab`

---

## UI Layout Specification

### Page Layout

```
+------------------------------------------+
|              GAME LAYOUT                  |
|  +------------------------------------+  |
|  |  POKEMART        Balance: 3,750   |  |
|  +------------------------------------+  |
|                                          |
|  [Poke Balls] [Medicine] [Hold] [TMs]   |
|  ----------------------------------------|
|  |                      |  Shopping     |
|  |  Item Grid           |  Cart         |
|  |  +-----+ +-----+     |  +----------+ |
|  |  |Item | |Item |     |  | Item x5  | |
|  |  +-----+ +-----+     |  | $1,250   | |
|  |  +-----+ +-----+     |  +----------+ |
|  |  |Item | |Item |     |  | Item x2  | |
|  |  +-----+ +-----+     |  | $500     | |
|  |                      |  +----------+ |
|  |                      |  Total: $1,750|
|  |                      |  [Purchase]   |
|  +----------------------+---------------+
+------------------------------------------+
```

### Responsive Behavior

- **Desktop**: 2-column layout (catalog + cart sidebar)
- **Tablet**: Stacked layout (catalog above, cart below)
- **Mobile**: Single column with cart as expandable section

### Color Scheme

Following existing theme:
- Background: `#1a1a2e`
- Card background: `#16213e`
- Tab active: `#fbbf24` (gold)
- Tab inactive: `rgba(255,255,255,0.5)`
- Purchase button: `#4ade80` (green)
- Error: `#f87171` (red)
- Currency: `#fbbf24` (gold)

---

## API Integration

### Fetch Catalog (no auth)

```javascript
useEffect(() => {
  const fetchCatalog = async () => {
    const response = await fetch('/api/shop');
    const data = await response.json();
    if (data.success) {
      setCatalog(data.data.items);
    }
  };
  fetchCatalog();
}, []);
```

### Purchase Items

```javascript
const handlePurchase = async () => {
  setPurchasing(true);
  const results = [];

  try {
    for (const [itemId, cartItem] of cart) {
      const response = await apiFetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          quantity: cartItem.quantity
        })
      });
      const data = await response.json();

      if (!data.success) {
        if (data.error?.code === 'INSUFFICIENT_FUNDS') {
          setErrorDetails(data.error.details);
          setShowErrorModal(true);
          break;
        }
        throw new Error(data.error?.message || 'Purchase failed');
      }
      results.push(data.data.purchased);
    }

    if (results.length > 0) {
      setPurchaseResults(results);
      await refreshData();
      setCart(new Map());
      setShowSuccessModal(true);
    }
  } catch (err) {
    setErrorDetails({ message: err.message });
    setShowErrorModal(true);
  } finally {
    setPurchasing(false);
  }
};
```

---

## Edge Case Handling

| Case | Detection | UI Response |
|------|-----------|-------------|
| Empty catalog | `catalog.length === 0` | Show "No items available" message |
| Zero currency | `currency === 0` | Show currency, can browse but not purchase |
| Empty cart | `cart.size === 0` | Disable Purchase button |
| Cart > balance | `totalCost > currency` | Client-side warning, but allow attempt |
| Insufficient funds | API returns INSUFFICIENT_FUNDS | Show modal with required vs available |
| Network error | API throws | Show error with retry option |
| Rapid clicks | `purchasing === true` | Disable Purchase button during processing |

---

## Files to Create

| File | Description |
|------|-------------|
| `pages/pokemart.js` | Main PokeMart page (stub exists, needs implementation) |

## Files to Modify

None required - reusing existing components as-is.

## Existing Files to Leverage

| File | Usage |
|------|-------|
| `components/layout/GameLayout.js` | Page wrapper with auth and navigation |
| `components/layout/CurrencyBadge.js` | Currency display |
| `lib/gameContext.js` | Currency state and refreshData() |
| `lib/apiFetch.js` | Authenticated API calls |
| `pages/api/shop.js` | Shop catalog and purchase API |
| `components/starter/ConfirmationModal.js` | Modal pattern reference |

---

## Post-Design Constitution Re-Check

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. Two-Tier Data Model | PASS | No Source file access from frontend |
| II. External JWT Authentication | PASS | apiFetch() handles tokens |
| IV. Data Merging Pattern | PASS | Using pre-merged API responses |
| V. Serverless Architecture | PASS | Standard Next.js page pattern |
| VII. Educational API Design | PASS | Detailed error codes and messages |
| VIII. Spec-Driven Development | PASS | Plan complete, ready for tasks |

**Final Gate Result**: PASS - Ready for task generation via `/speckit.tasks`.
