# Contract: Locations Data (Client-Side)

**File**: `Source/locations.json`
**Type**: Static JSON Data
**Status**: New

## Purpose

Define available wild encounter locations with their Pokemon pools and level ranges. Loaded client-side via utility functions in `lib/locationData.js`.

## Schema

```json
{
  "locations": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "levelRange": {
        "min": "integer (1-20)",
        "max": "integer (1-20)"
      },
      "pokemon": [
        {
          "id": "string (pokemon ID)",
          "weight": "integer (positive)"
        }
      ],
      "terrain": "string (grass|cave|water|forest)",
      "unlockRequirement": "string|null"
    }
  ]
}
```

## Field Definitions

### Location Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique lowercase identifier with hyphens |
| name | string | Yes | Display name for UI |
| description | string | Yes | Flavor text describing the area |
| levelRange | object | Yes | Min/max levels for encounters |
| levelRange.min | integer | Yes | Minimum level (1-20, <= max) |
| levelRange.max | integer | Yes | Maximum level (1-20, >= min) |
| pokemon | array | Yes | Non-empty array of encounter entries |
| terrain | string | Yes | Visual theme for the location |
| unlockRequirement | string/null | Yes | Future unlock condition, null for MVP |

### Pokemon Encounter Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Pokemon ID matching Source/pokemon/pokemon.json |
| weight | integer | Yes | Relative probability weight (higher = more common) |

## Terrain Types

| Value | Description | Suggested Visual |
|-------|-------------|------------------|
| grass | Open grassy areas | Green background, tall grass |
| forest | Dense woodland | Dark green, trees |
| cave | Underground areas | Dark, rocky |
| water | Lakes, rivers, ocean | Blue, waves |

## Weight System

Weights are relative probabilities. Example calculation:

```javascript
// Location with: rattata(50), pidgey(30), pikachu(5)
// Total weight = 85

// Probability of each:
// rattata: 50/85 = 58.8%
// pidgey: 30/85 = 35.3%
// pikachu: 5/85 = 5.9%
```

## MVP Data

```json
{
  "locations": [
    {
      "id": "route-1",
      "name": "Route 1",
      "description": "A peaceful path connecting Pallet Town to Viridian City. New trainers often begin their journey here.",
      "levelRange": { "min": 2, "max": 4 },
      "pokemon": [
        { "id": "rattata", "weight": 50 },
        { "id": "pidgey", "weight": 50 }
      ],
      "terrain": "grass",
      "unlockRequirement": null
    },
    {
      "id": "viridian-forest",
      "name": "Viridian Forest",
      "description": "A dense forest maze filled with bug Pokemon. Trainers often get lost in its winding paths.",
      "levelRange": { "min": 3, "max": 6 },
      "pokemon": [
        { "id": "caterpie", "weight": 40 },
        { "id": "weedle", "weight": 40 },
        { "id": "pikachu", "weight": 5 },
        { "id": "metapod", "weight": 10 },
        { "id": "kakuna", "weight": 5 }
      ],
      "terrain": "forest",
      "unlockRequirement": null
    },
    {
      "id": "route-22",
      "name": "Route 22",
      "description": "A rugged path west of Viridian City, known for its diverse Pokemon population.",
      "levelRange": { "min": 3, "max": 5 },
      "pokemon": [
        { "id": "rattata", "weight": 30 },
        { "id": "spearow", "weight": 30 },
        { "id": "nidoran-m", "weight": 20 },
        { "id": "nidoran-f", "weight": 20 }
      ],
      "terrain": "grass",
      "unlockRequirement": null
    },
    {
      "id": "mt-moon",
      "name": "Mt. Moon",
      "description": "A mountain cave system filled with mysterious Pokemon. Rare fossils are said to be found here.",
      "levelRange": { "min": 6, "max": 10 },
      "pokemon": [
        { "id": "zubat", "weight": 50 },
        { "id": "geodude", "weight": 30 },
        { "id": "clefairy", "weight": 10 },
        { "id": "paras", "weight": 10 }
      ],
      "terrain": "cave",
      "unlockRequirement": null
    }
  ]
}
```

## Client-Side API

### lib/locationData.js

```javascript
/**
 * Load all locations
 * @returns {Promise<Location[]>}
 */
export async function getAllLocations() {
  const response = await fetch('/api/locations');
  const data = await response.json();
  return data.locations;
}

/**
 * Get location by ID
 * @param {string} id
 * @returns {Promise<Location|null>}
 */
export async function getLocationById(id) {
  const locations = await getAllLocations();
  return locations.find(loc => loc.id === id) || null;
}

/**
 * Select random Pokemon from location pool
 * @param {Location} location
 * @returns {string} Pokemon ID
 */
export function selectRandomPokemon(location) {
  const totalWeight = location.pokemon.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const entry of location.pokemon) {
    random -= entry.weight;
    if (random <= 0) return entry.id;
  }
  return location.pokemon[0].id;
}

/**
 * Generate random level in range
 * @param {Location} location
 * @returns {number}
 */
export function generateEncounterLevel(location) {
  const { min, max } = location.levelRange;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

## Server-Side Endpoint (for data loading)

### GET /api/locations

Simple endpoint to serve the locations data:

```javascript
// pages/api/locations.js
import fs from 'fs';
import path from 'path';
import { sendSuccess } from '../../lib/apiResponse';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'Source', 'locations.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return sendSuccess(res, data);
}
```

## Validation

### Pokemon ID Validation

All Pokemon IDs in locations.json must exist in Source/pokemon/pokemon.json. Validate during build or on first load:

```javascript
function validateLocations(locations, allPokemon) {
  const pokemonIds = new Set(allPokemon.map(p => p.id));

  for (const location of locations) {
    for (const entry of location.pokemon) {
      if (!pokemonIds.has(entry.id)) {
        throw new Error(`Invalid Pokemon ID "${entry.id}" in location "${location.id}"`);
      }
    }
  }
}
```
