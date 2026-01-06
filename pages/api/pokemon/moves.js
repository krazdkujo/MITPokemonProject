/**
 * GET /api/pokemon/moves
 * Returns available moves for a Pokemon at a given level
 *
 * Feature: 021-combat-test-harness
 * Task: T016
 */

import { getMovesForPokemonAtLevel } from '../../../lib/pokemonData';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pokemonId, level } = req.query;

    if (!pokemonId) {
      return res.status(400).json({ error: 'pokemonId is required' });
    }

    const levelNum = parseInt(level, 10) || 5;

    if (levelNum < 1 || levelNum > 20) {
      return res.status(400).json({ error: 'level must be between 1 and 20' });
    }

    const moves = getMovesForPokemonAtLevel(pokemonId, levelNum);

    // Return simplified move list for UI
    const movesForUI = moves.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      pp: m.pp,
      power: m.power,
      description: m.description?.substring(0, 100) // Truncate for UI
    }));

    return res.status(200).json({ moves: movesForUI });
  } catch (error) {
    console.error('Error loading moves:', error);
    return res.status(500).json({ error: 'Failed to load moves data' });
  }
}
