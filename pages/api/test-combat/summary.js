/**
 * GET /api/test-combat/summary
 * Get the battle summary after completion
 *
 * Feature: 021-combat-test-harness
 */

import { formatBattleSummary, runToCompletion } from '../../../lib/combatSimulator';
import { getSimulation } from './start';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { simulationId } = req.query;

    if (!simulationId) {
      return res.status(400).json({ error: 'simulationId is required' });
    }

    const simulation = getSimulation(simulationId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    // Build summary from current state
    const endTime = Date.now();
    const summary = {
      winner: simulation.combatant1.current_hp <= 0 ? 'opponent' :
              simulation.combatant2.current_hp <= 0 ? 'player' : 'draw',
      totalTurns: simulation.currentTurn,
      seedUsed: simulation.seed,
      combatant1Summary: {
        name: simulation.combatant1.name,
        finalHp: simulation.combatant1.current_hp,
        maxHp: simulation.combatant1.max_hp,
        totalDamageDealt: simulation.stats.combatant1.damageDealt,
        attacksMade: simulation.stats.combatant1.attacksMade,
        attacksHit: simulation.stats.combatant1.attacksHit,
        criticalHits: simulation.stats.combatant1.criticalHits
      },
      combatant2Summary: {
        name: simulation.combatant2.name,
        finalHp: simulation.combatant2.current_hp,
        maxHp: simulation.combatant2.max_hp,
        totalDamageDealt: simulation.stats.combatant2.damageDealt,
        attacksMade: simulation.stats.combatant2.attacksMade,
        attacksHit: simulation.stats.combatant2.attacksHit,
        criticalHits: simulation.stats.combatant2.criticalHits
      },
      durationMs: endTime - (simulation.startTime || endTime),
      seed: simulation.seed
    };

    // Format for display
    const formatted = formatBattleSummary(summary);

    return res.status(200).json({
      ...summary,
      formatted
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    return res.status(500).json({ error: error.message || 'Failed to get summary' });
  }
}
