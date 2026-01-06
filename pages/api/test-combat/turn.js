/**
 * POST /api/test-combat/turn
 * Execute a single turn in the combat simulation
 *
 * Feature: 021-combat-test-harness
 */

import { runNextTurn } from '../../../lib/combatSimulator';
import { getSimulation, setSimulation } from './start';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationId } = req.body;

    if (!simulationId) {
      return res.status(400).json({ error: 'simulationId is required' });
    }

    const simulation = getSimulation(simulationId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    if (simulation.state === 'completed') {
      return res.status(400).json({ error: 'Simulation already completed' });
    }

    // Run next turn
    const turnResult = runNextTurn(simulation);

    // Update stored simulation
    setSimulation(simulationId, simulation);

    return res.status(200).json({
      turnNumber: turnResult.turnNumber,
      log: turnResult.log,
      battleEnded: turnResult.battleEnded,
      winner: turnResult.winner,
      combatant1: turnResult.combatant1,
      combatant2: turnResult.combatant2
    });
  } catch (error) {
    console.error('Error running turn:', error);
    return res.status(500).json({ error: error.message || 'Failed to run turn' });
  }
}
