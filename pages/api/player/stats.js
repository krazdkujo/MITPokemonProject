import { createAdminClient } from '../../../lib/supabase';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendInternalError,
  sendMethodNotAllowed,
} from '../../../lib/apiResponse';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  buildPlayerPokemonListResponse,
} from '../../../lib/pokemonData';

/**
 * /api/player/stats
 *
 * GET: Retrieve comprehensive statistics for the authenticated player
 *
 * Returns:
 * - collection: totalPokemon, uniqueSpecies, typeDistribution
 * - levels: topPokemon (top 5), distribution (1-5, 6-10, 11-15, 16-20)
 * - battles: null (placeholder for future implementation)
 * - badges: null (placeholder for future implementation)
 */
export default async function handler(req, res) {
  // Authenticate request
  const { userId, error: authError } = await authenticateRequest(req);
  if (!userId) {
    return sendUnauthorizedError(res, authError || 'Authentication required');
  }

  if (req.method === 'GET') {
    return handleGet(req, res, userId);
  } else {
    return sendMethodNotAllowed(res, ['GET']);
  }
}

/**
 * GET /api/player/stats
 *
 * Returns comprehensive player statistics
 */
async function handleGet(req, res, userId) {
  try {
    const supabase = createAdminClient();

    // Fetch all player Pokemon
    const { data: playerPokemon, error } = await supabase
      .from('player_pokemon')
      .select('*')
      .eq('user_id', userId)
      .order('level', { ascending: false });

    if (error) {
      console.error('Failed to fetch player Pokemon:', error);
      return sendInternalError(res, 'Failed to fetch Pokemon data');
    }

    // Merge with Source data
    const pokemon = buildPlayerPokemonListResponse(playerPokemon || []);

    // Calculate collection statistics
    const collection = calculateCollectionStats(pokemon);

    // Calculate level statistics
    const levels = calculateLevelStats(pokemon);

    return sendSuccess(res, {
      collection,
      levels,
      battles: null,  // Placeholder for future battle system
      badges: null,   // Placeholder for future badge system
    });
  } catch (error) {
    console.error('Error in GET /api/player/stats:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}

/**
 * Calculate collection statistics from Pokemon list
 * @param {Array} pokemon - Array of merged Pokemon objects
 * @returns {Object} Collection stats with totalPokemon, uniqueSpecies, typeDistribution
 */
function calculateCollectionStats(pokemon) {
  const totalPokemon = pokemon.length;

  // Count unique species
  const uniqueSpeciesSet = new Set(pokemon.map(p => p.pokemon_id));
  const uniqueSpecies = uniqueSpeciesSet.size;

  // Count types (dual-types count toward both)
  const typeCounts = {};
  pokemon.forEach(p => {
    if (p.type && Array.isArray(p.type)) {
      p.type.forEach(type => {
        const typeLower = type.toLowerCase();
        typeCounts[typeLower] = (typeCounts[typeLower] || 0) + 1;
      });
    }
  });

  // Convert to array with percentages, sorted by count descending
  const typeDistribution = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalPokemon > 0
        ? Math.round((count / totalPokemon) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPokemon,
    uniqueSpecies,
    typeDistribution,
  };
}

/**
 * Calculate level statistics from Pokemon list
 * @param {Array} pokemon - Array of merged Pokemon objects (already sorted by level desc)
 * @returns {Object} Level stats with topPokemon and distribution
 */
function calculateLevelStats(pokemon) {
  // Top 5 Pokemon by level (already sorted)
  const topPokemon = pokemon.slice(0, 5).map(p => ({
    id: p.id,
    pokemon_id: p.pokemon_id,
    name: p.name,
    level: p.level,
    sprite: p.sprite,
    type: p.type,
  }));

  // Level distribution in ranges
  const distribution = {
    '1-5': 0,
    '6-10': 0,
    '11-15': 0,
    '16-20': 0,
  };

  pokemon.forEach(p => {
    const level = p.level;
    if (level >= 1 && level <= 5) {
      distribution['1-5']++;
    } else if (level >= 6 && level <= 10) {
      distribution['6-10']++;
    } else if (level >= 11 && level <= 15) {
      distribution['11-15']++;
    } else if (level >= 16 && level <= 20) {
      distribution['16-20']++;
    }
  });

  return {
    topPokemon,
    distribution,
  };
}
