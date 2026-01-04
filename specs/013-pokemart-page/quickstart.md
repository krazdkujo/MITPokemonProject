# Quickstart: PokeMart Item Shop Page

**Feature**: 013-pokemart-page
**Date**: 2026-01-04

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Supabase local or remote instance running
- Test user account with currency balance

## Development Setup

### 1. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Navigate to PokeMart

Visit: `http://localhost:3000/pokemart`

### 3. Test Authentication

Ensure you have a valid test auth token:
```javascript
// Browser console
localStorage.getItem('pokemon_test_auth')
```

If missing, log in via the main application first.

---

## Key Files

| File | Purpose |
|------|---------|
| `pages/pokemart.js` | Main page component (stub exists, needs implementation) |
| `pages/api/shop.js` | Shop API (GET catalog, POST purchase) |
| `pages/api/player/inventory.js` | Player inventory and currency |
| `lib/gameContext.js` | Currency state management |
| `lib/apiFetch.js` | Authenticated API calls |
| `components/layout/CurrencyBadge.js` | Currency display component |
| `components/layout/GameLayout.js` | Page wrapper |

---

## Testing Scenarios

### Browse Catalog

1. Visit /pokemart
2. Verify category tabs display: Poke Balls, Medicine, Hold Items, TMs
3. Click each tab - verify items change
4. Verify items show: name, price, description

### Add to Cart

1. Select an item
2. Adjust quantity (1-99)
3. Click "Add to Cart"
4. Verify cart summary updates
5. Verify total cost displays

### Successful Purchase

1. Add items to cart
2. Ensure sufficient currency balance
3. Click "Purchase"
4. Verify success modal shows items bought
5. Verify currency balance updates
6. Verify cart clears

### Insufficient Funds

1. Add expensive items to cart (exceed balance)
2. Click "Purchase"
3. Verify error modal shows:
   - Required amount
   - Available balance
   - Shortfall amount
4. Verify cart remains intact

### Network Error

1. Simulate offline (DevTools Network tab)
2. Attempt purchase
3. Verify error message with retry option

---

## API Testing (curl)

### Get Catalog

```bash
curl http://localhost:3000/api/shop
```

### Purchase Item

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": "poke-ball", "quantity": 5}' \
  http://localhost:3000/api/shop
```

### Check Inventory/Currency

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/player/inventory
```

---

## Component Usage Examples

### Using GameContext

```javascript
import { useGame } from '../lib/gameContext';

function PokeMartContent() {
  const { currency, refreshData } = useGame();

  const handlePurchase = async () => {
    // ... make purchase API calls
    await refreshData(); // Update currency display
  };

  return (/* ... */);
}
```

### Using CurrencyBadge

```javascript
import CurrencyBadge from '../components/layout/CurrencyBadge';

<CurrencyBadge amount={currency} />
```

### Using apiFetch

```javascript
import { apiFetch } from '../lib/apiFetch';

// GET catalog (no auth needed)
const catalogRes = await fetch('/api/shop');
const catalog = await catalogRes.json();

// POST purchase (auth required)
const purchaseRes = await apiFetch('/api/shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ item_id: 'poke-ball', quantity: 5 })
});
const result = await purchaseRes.json();
```

---

## Cart State Management

```javascript
// Cart state structure
const [cart, setCart] = useState(new Map());

// Add/update item
const addToCart = (item, quantity) => {
  setCart(prev => {
    const newCart = new Map(prev);
    newCart.set(item.id, {
      item,
      quantity,
      lineTotal: item.cost * quantity
    });
    return newCart;
  });
};

// Remove item
const removeFromCart = (itemId) => {
  setCart(prev => {
    const newCart = new Map(prev);
    newCart.delete(itemId);
    return newCart;
  });
};

// Calculate total
const totalCost = Array.from(cart.values())
  .reduce((sum, ci) => sum + ci.lineTotal, 0);
```

---

## Edge Cases to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty catalog | Show "No items available" message |
| Zero currency | Disable Purchase button |
| Max quantity (99) | Prevent exceeding 99 |
| Network offline | Show error with retry option |
| Rapid clicks | Purchase button disabled during processing |
| Empty cart | Disable Purchase button |

---

## Common Issues

### Currency Not Updating After Purchase
Ensure `refreshData()` is called after successful purchase.

### Items Not Loading
Check browser console for API errors. Verify Supabase connection.

### Purchase Failing
Check if sufficient currency. View network tab for API response.
