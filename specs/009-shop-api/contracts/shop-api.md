# API Contract: Shop Endpoints

**Feature**: 009-shop-api
**Date**: 2026-01-04
**Base URL**: `/api`

---

## Endpoints Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /shop | No | Get purchasable item catalog |
| POST | /shop | Yes | Purchase items |
| GET | /player/inventory | Yes | Get player's inventory |

---

## GET /api/shop

Retrieves the catalog of purchasable items. Items with null cost are excluded.

### Request

```http
GET /api/shop HTTP/1.1
Host: localhost:3000
```

No authentication required. No request body.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "poke-ball",
        "name": "Poke Ball",
        "type": "pokeball",
        "cost": 250,
        "description": "Lets a trainer attempt a Capture Roll to catch a Pokemon."
      },
      {
        "id": "great-ball",
        "name": "Great Ball",
        "type": "pokeball",
        "cost": 500,
        "description": "Lets a trainer attempt a Capture Roll to catch a Pokemon. Reduce the capture DC by 5."
      },
      {
        "id": "potion",
        "name": "Potion",
        "type": "medicine",
        "cost": 200,
        "description": "A trainer may use an action to restore 2d4 + 2 HP to an adjacent Pokemon. Consumed on use."
      }
    ],
    "count": 3
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| items | array | List of purchasable items |
| items[].id | string | Unique item identifier |
| items[].name | string | Display name |
| items[].type | string | Category (pokeball, medicine, tm, holditem) |
| items[].cost | number | Price in currency |
| items[].description | string | Item effect description |
| count | number | Total number of purchasable items |

---

## POST /api/shop

Purchase items from the shop. Requires authentication.

### Request

```http
POST /api/shop HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer <token>

{
  "item_id": "poke-ball",
  "quantity": 5
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| item_id | string | Yes | Item identifier from catalog |
| quantity | number | Yes | Number to purchase (positive integer) |

### Response (200 OK) - Success

```json
{
  "success": true,
  "data": {
    "purchased": {
      "item_id": "poke-ball",
      "name": "Poke Ball",
      "quantity": 5,
      "total_cost": 1250
    },
    "inventory": {
      "item_id": "poke-ball",
      "name": "Poke Ball",
      "quantity": 8
    },
    "balance": {
      "previous": 2000,
      "spent": 1250,
      "remaining": 750
    }
  }
}
```

### Response Fields (Success)

| Field | Type | Description |
|-------|------|-------------|
| purchased.item_id | string | Item that was purchased |
| purchased.name | string | Item display name |
| purchased.quantity | number | Quantity purchased |
| purchased.total_cost | number | Total currency spent |
| inventory.item_id | string | Item in inventory |
| inventory.name | string | Item display name |
| inventory.quantity | number | New total quantity owned |
| balance.previous | number | Currency before purchase |
| balance.spent | number | Currency deducted |
| balance.remaining | number | Currency after purchase |

### Error Responses

#### 400 - Validation Error (Invalid Quantity)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be a positive integer",
    "details": {
      "field": "quantity",
      "received": -1
    }
  }
}
```

#### 400 - Item Not Found

```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item not found in catalog",
    "details": {
      "item_id": "invalid-item"
    }
  }
}
```

#### 400 - Item Not Purchasable

```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_PURCHASABLE",
    "message": "This item cannot be purchased",
    "details": {
      "item_id": "master-ball",
      "item_name": "Master Ball"
    }
  }
}
```

#### 400 - Insufficient Funds

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Not enough currency to complete purchase",
    "details": {
      "required": 1250,
      "available": 500,
      "item_id": "poke-ball",
      "item_name": "Poke Ball",
      "quantity": 5
    }
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 405 - Method Not Allowed

```json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_ALLOWED",
    "message": "Method not allowed. Allowed methods: GET, POST"
  }
}
```

---

## GET /api/player/inventory

Retrieves the authenticated player's item inventory.

### Request

```http
GET /api/player/inventory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <token>
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "inventory": [
      {
        "item_id": "poke-ball",
        "name": "Poke Ball",
        "type": "pokeball",
        "quantity": 8,
        "cost": 250,
        "description": "Lets a trainer attempt a Capture Roll to catch a Pokemon."
      },
      {
        "item_id": "potion",
        "name": "Potion",
        "type": "medicine",
        "quantity": 3,
        "cost": 200,
        "description": "A trainer may use an action to restore 2d4 + 2 HP to an adjacent Pokemon. Consumed on use."
      }
    ],
    "count": 2,
    "currency": 750
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| inventory | array | List of owned items |
| inventory[].item_id | string | Item identifier |
| inventory[].name | string | Item display name |
| inventory[].type | string | Item category |
| inventory[].quantity | number | Amount owned |
| inventory[].cost | number | Shop price (for reference) |
| inventory[].description | string | Item effect |
| count | number | Number of distinct items owned |
| currency | number | Player's current currency balance |

### Response (200 OK) - Empty Inventory

```json
{
  "success": true,
  "data": {
    "inventory": [],
    "count": 0,
    "currency": 500
  }
}
```

### Error Responses

#### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## Error Code Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request format or field values |
| ITEM_NOT_FOUND | 400 | Requested item_id does not exist |
| ITEM_NOT_PURCHASABLE | 400 | Item exists but has null cost |
| INSUFFICIENT_FUNDS | 400 | Player lacks currency for purchase |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| METHOD_NOT_ALLOWED | 405 | HTTP method not supported |
| INTERNAL_ERROR | 500 | Server error |

---

## N8N Integration Notes

### Parsing Insufficient Funds

The `INSUFFICIENT_FUNDS` error includes all details needed for N8N workflows:

```javascript
// N8N expression to check if affordable
const required = $json.error.details.required;
const available = $json.error.details.available;
const shortfall = required - available;
```

### Checking Purchase Success

```javascript
// N8N expression to get remaining balance
if ($json.success) {
  return $json.data.balance.remaining;
}
```

### Inventory Check Before Purchase

```javascript
// N8N: Get current quantity of an item
const inventory = $json.data.inventory;
const pokeballs = inventory.find(i => i.item_id === 'poke-ball');
const quantity = pokeballs ? pokeballs.quantity : 0;
```
