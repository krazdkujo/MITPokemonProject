/**
 * GET /api/pokemon
 * Returns all Pokemon from Source data for dropdown selection
 *
 * Feature: 021-combat-test-harness
 */

import { getAllPokemon } from '../../lib/pokemonData';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const allPokemon = getAllPokemon();

    // Return simplified list for dropdowns
    const pokemon = allPokemon.map(p => ({
      id: p.id,
      name: p.name,
      number: p.number,
      type: p.type
    }));

    return res.status(200).json({ pokemon });
  } catch (error) {
    console.error('Error loading Pokemon:', error);
    return res.status(500).json({ error: 'Failed to load Pokemon data' });
  }
}
