import {
  sendSuccess,
  sendError,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../../lib/apiResponse';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  getStarterPokemon,
  getStarterTypes,
  filterStartersByType,
} from '../../../lib/pokemonData';

/**
 * GET /api/pokemon/starters
 *
 * Retrieve all starter-eligible Pokemon (SR <= 0.5) from Source data.
 * Optionally filter by type(s).
 *
 * Query Parameters:
 *   - types: comma-separated type filter (e.g., "fire,water"). Max 2 types.
 *
 * Response:
 *   - pokemon: Array of starter Pokemon with id, name, type, sprite, etc.
 *   - available_types: Array of all types available for filtering
 *   - total: Count of Pokemon returned
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  // Authenticate request
  const { userId, error: authError } = await authenticateRequest(req);
  if (!userId) {
    return sendUnauthorizedError(res, authError || 'Authentication required');
  }

  try {
    // Parse types query parameter
    const typesParam = req.query.types;
    let selectedTypes = [];

    if (typesParam) {
      selectedTypes = typesParam
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0)
        .slice(0, 2); // Max 2 types
    }

    // Get Pokemon (filtered or all starters)
    const pokemon = selectedTypes.length > 0
      ? filterStartersByType(selectedTypes)
      : getStarterPokemon();

    // Get all available types for filter UI
    const availableTypes = getStarterTypes();

    return sendSuccess(res, {
      pokemon,
      available_types: availableTypes,
      total: pokemon.length,
    });
  } catch (error) {
    console.error('Failed to load starter Pokemon:', error);
    return sendInternalError(res, 'Failed to load Pokemon data');
  }
}
