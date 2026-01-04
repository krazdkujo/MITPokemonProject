# Quickstart: Zone-Based Pokemon Encounters

**Feature**: 016-zone-encounters
**Date**: 2026-01-04

## Integration Scenarios

### Scenario 1: Browse and Select a Zone

A player opens the zones page, browses available zones by terrain type, and selects one to start an encounter.

```javascript
// 1. Fetch all zones
const zonesResponse = await apiFetch('/api/zones');
const { zones, terrainGroups } = zonesResponse.data;

// 2. Display zones grouped by terrain
// Example: Show Water zones
const waterZoneIds = terrainGroups.water;
const waterZones = zones.filter(z => waterZoneIds.includes(z.id));

// 3. User selects "Tranquil Pond" (easy water zone)
const selectedZone = zones.find(z => z.id === 'water-pond');

// 4. Start encounter with player's party
const encounterResponse = await apiFetch('/api/zones/encounter', {
  method: 'POST',
  body: JSON.stringify({
    zone_id: 'water-pond',
    player_pokemon_ids: party.map(p => p.id)
  })
});

// 5. Navigate to combat with battle_id
router.push(`/combat?battle_id=${encounterResponse.data.battle_id}`);
```

### Scenario 2: Resume Active Battle on Page Load

A player returns to the combat page and their active battle auto-loads.

```javascript
// In combat.js useEffect
useEffect(() => {
  const checkActiveBattle = async () => {
    const response = await apiFetch('/api/battle/active');

    if (response.data.has_active_battle) {
      // Load full state
      const stateResponse = await apiFetch(
        `/api/battle/state/${response.data.battle.battle_id}`
      );
      setBattleState(stateResponse.data);
    } else if (!router.query.battle_id) {
      // No active battle and no new battle - redirect to zones
      router.push('/zones');
    }
  };

  checkActiveBattle();
}, []);
```

### Scenario 3: Abandon Battle

A player wants to quit their current battle without completing it.

```javascript
// In combat.js
const handleAbandon = async () => {
  if (!confirm('Abandon battle? This counts as fleeing.')) return;

  const response = await apiFetch('/api/battle/abandon', {
    method: 'POST',
    body: JSON.stringify({ battle_id: battleState.battle_id })
  });

  if (response.data.outcome === 'abandoned') {
    // Clear local state
    setBattleState(null);
    // Redirect to zones
    router.push('/zones');
  }
};
```

### Scenario 4: Block New Encounter When Battle Active

When player tries to start a new encounter but has one in progress.

```javascript
// In zones page
const handleStartEncounter = async (zoneId) => {
  try {
    const response = await apiFetch('/api/zones/encounter', {
      method: 'POST',
      body: JSON.stringify({
        zone_id: zoneId,
        player_pokemon_ids: selectedPokemonIds
      })
    });

    router.push(`/combat?battle_id=${response.data.battle_id}`);
  } catch (error) {
    if (error.code === 'ACTIVE_BATTLE_EXISTS') {
      // Show message and option to resume
      setError('You have an active battle. Resume or abandon it first.');
      setActiveBattle(error.details);
    }
  }
};
```

## N8N Workflow Integration

### Workflow: Start Zone Encounter

```json
{
  "name": "Start Zone Encounter",
  "nodes": [
    {
      "name": "Get Zones",
      "type": "HTTP Request",
      "parameters": {
        "method": "GET",
        "url": "={{$env.API_URL}}/api/zones",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth"
      }
    },
    {
      "name": "Select Random Easy Zone",
      "type": "Code",
      "parameters": {
        "code": "const zones = $input.item.json.data.zones;\nconst easyZones = zones.filter(z => z.difficulty === 'easy');\nconst selected = easyZones[Math.floor(Math.random() * easyZones.length)];\nreturn { zone_id: selected.id };"
      }
    },
    {
      "name": "Start Encounter",
      "type": "HTTP Request",
      "parameters": {
        "method": "POST",
        "url": "={{$env.API_URL}}/api/zones/encounter",
        "body": {
          "zone_id": "={{$json.zone_id}}",
          "player_pokemon_ids": "={{$env.PARTY_IDS}}"
        }
      }
    }
  ]
}
```

### Workflow: Check and Resume Battle

```json
{
  "name": "Check Active Battle",
  "nodes": [
    {
      "name": "Check Active",
      "type": "HTTP Request",
      "parameters": {
        "method": "GET",
        "url": "={{$env.API_URL}}/api/battle/active"
      }
    },
    {
      "name": "Branch",
      "type": "IF",
      "parameters": {
        "conditions": {
          "boolean": [{ "value1": "={{$json.data.has_active_battle}}", "value2": true }]
        }
      }
    },
    {
      "name": "Get Full State",
      "type": "HTTP Request",
      "parameters": {
        "method": "GET",
        "url": "={{$env.API_URL}}/api/battle/state/{{$json.data.battle.battle_id}}"
      }
    }
  ]
}
```

## Test Scenarios

### Unit Tests

```javascript
// lib/zoneData.test.js
describe('zoneData', () => {
  test('getZoneById returns correct zone', () => {
    const zone = getZoneById('water-pond');
    expect(zone.terrain).toBe('water');
    expect(zone.difficulty).toBe('easy');
  });

  test('getEncounterPool filters by type and SR', () => {
    const pool = getEncounterPool('water-pond');
    pool.forEach(pokemon => {
      expect(pokemon.type.some(t => ['water', 'ice'].includes(t))).toBe(true);
      expect(pokemon.sr).toBeGreaterThanOrEqual(0);
      expect(pokemon.sr).toBeLessThanOrEqual(0.5);
    });
  });

  test('getEncounterPool includes gen 2+ Pokemon', () => {
    const pool = getEncounterPool('water-lake');
    const gen2Plus = pool.filter(p => p.number > 151);
    expect(gen2Plus.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```javascript
// pages/api/zones/encounter.test.js
describe('POST /api/zones/encounter', () => {
  test('creates battle record in database', async () => {
    const response = await request(app)
      .post('/api/zones/encounter')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        zone_id: 'water-pond',
        player_pokemon_ids: [testPokemonId]
      });

    expect(response.status).toBe(201);
    expect(response.body.data.battle_id).toBeDefined();

    // Verify database record
    const { data } = await supabase
      .from('active_battles')
      .select()
      .eq('id', response.body.data.battle_id)
      .single();

    expect(data.status).toBe('active');
    expect(data.zone_id).toBe('water-pond');
  });

  test('blocks encounter when active battle exists', async () => {
    // Create first battle
    await request(app)
      .post('/api/zones/encounter')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ zone_id: 'water-pond', player_pokemon_ids: [testPokemonId] });

    // Attempt second battle
    const response = await request(app)
      .post('/api/zones/encounter')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ zone_id: 'fire-campfire', player_pokemon_ids: [testPokemonId] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ACTIVE_BATTLE_EXISTS');
  });
});
```

### E2E Tests

```javascript
// cypress/e2e/zone-encounters.cy.js
describe('Zone Encounters', () => {
  beforeEach(() => {
    cy.login();
    cy.ensureParty();
  });

  it('browses zones and starts encounter', () => {
    cy.visit('/zones');

    // Verify zones display
    cy.get('[data-terrain="water"]').should('exist');
    cy.contains('Tranquil Pond').should('be.visible');
    cy.contains('Easy').should('be.visible');

    // Start encounter
    cy.contains('Tranquil Pond').click();
    cy.get('[data-testid="start-encounter"]').click();

    // Verify redirect to combat
    cy.url().should('include', '/combat');
    cy.get('[data-testid="battle-grid"]').should('be.visible');
  });

  it('resumes battle after navigation', () => {
    // Start battle
    cy.visit('/zones');
    cy.contains('Tranquil Pond').click();
    cy.get('[data-testid="start-encounter"]').click();

    // Navigate away
    cy.visit('/dashboard');

    // Return to combat
    cy.visit('/combat');

    // Verify battle resumed
    cy.get('[data-testid="battle-grid"]').should('be.visible');
    cy.contains('Tranquil Pond').should('be.visible');
  });

  it('abandons battle and allows new encounter', () => {
    // Start battle
    cy.startEncounter('water-pond');

    // Abandon
    cy.get('[data-testid="abandon-btn"]').click();
    cy.get('[data-testid="confirm-abandon"]').click();

    // Verify redirect
    cy.url().should('include', '/zones');

    // Start new encounter
    cy.contains('Fire Campfire').click();
    cy.get('[data-testid="start-encounter"]').click();

    // Verify new battle started
    cy.url().should('include', '/combat');
  });
});
```

## File Checklist

### New Files

- [ ] `Source/zones.json` - Zone definitions
- [ ] `lib/zoneData.js` - Zone loading utilities
- [ ] `sql/006_active_battles.sql` - Database migration
- [ ] `pages/api/zones/index.js` - GET all zones
- [ ] `pages/api/zones/[zoneId].js` - GET zone by ID
- [ ] `pages/api/zones/encounter.js` - POST start encounter
- [ ] `pages/api/battle/active.js` - GET active battle
- [ ] `pages/api/battle/state/[battleId].js` - GET/PATCH battle state
- [ ] `pages/api/battle/abandon.js` - POST abandon battle
- [ ] `pages/zones.js` - Zone selection page
- [ ] `components/Zones/ZoneCard.js` - Zone display card
- [ ] `components/Zones/TerrainGroup.js` - Terrain grouping component
- [ ] `components/Zones/DifficultyBadge.js` - Difficulty indicator

### Modified Files

- [ ] `pages/combat.js` - Add active battle check on load
- [ ] `pages/api/battle/action.js` - Add state persistence
- [ ] `pages/api/battle/flee.js` - Add state persistence
- [ ] `lib/battleState.js` - Add serialization helpers
- [ ] `components/layout/GameLayout.js` - Add zones nav link
