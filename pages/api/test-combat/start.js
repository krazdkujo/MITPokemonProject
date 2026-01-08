/**
 * POST /api/test-combat/start
 * Initialize a new combat simulation
 *
 * Feature: 021-combat-test-harness
 */

import { createSimulation } from '../../../lib/combatSimulator';
import { createLogger } from '../../../lib/combatLogger';

// In-memory simulation storage (for test harness only)
// Use global to persist across hot reloads in development
// In production, this would use a proper session/cache
if (!global.__testCombatSimulations) {
  global.__testCombatSimulations = new Map();
}
const simulations = global.__testCombatSimulations;

export function getSimulation(id) {
  return simulations.get(id);
}

export function setSimulation(id, sim) {
  simulations.set(id, sim);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pokemon1, pokemon2, seed } = req.body;

    if (!pokemon1?.id || !pokemon2?.id) {
      return res.status(400).json({ error: 'pokemon1 and pokemon2 with id are required' });
    }

    // Create simulation (always uses tactical AI mode)
    const simulation = createSimulation({
      pokemon1: {
        id: pokemon1.id,
        level: pokemon1.level || 5,
        moves: pokemon1.moves || null
      },
      pokemon2: {
        id: pokemon2.id,
        level: pokemon2.level || 5,
        moves: pokemon2.moves || null
      },
      seed: seed || null
    });

    // Store simulation
    setSimulation(simulation.id, simulation);

    // Generate initial log (battle header)
    const logger = createLogger({ colorize: false, verbose: true });
    const headerLog = logger.logBattleHeader(
      simulation.combatant1,
      simulation.combatant2,
      simulation.seed
    );

    return res.status(200).json({
      simulation: {
        id: simulation.id,
        seed: simulation.seed,
        combatant1: simulation.combatant1,
        combatant2: simulation.combatant2,
        currentTurn: 0,
        state: 'ready'
      },
      initialLog: [headerLog]
    });
  } catch (error) {
    console.error('Error starting simulation:', error);
    return res.status(500).json({ error: error.message || 'Failed to start simulation' });
  }
}
