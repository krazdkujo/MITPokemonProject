import { createAdminClient } from '../../../../lib/supabase';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../../../lib/apiResponse';
import { authenticateRequest } from '../../../../lib/authHelper';

/**
 * GET /api/player/pokemon/check
 *
 * Quick check if user has any Pokemon.
 * Used for redirect logic and route protection.
 *
 * Response:
 *   - has_pokemon: Boolean indicating if user has any Pokemon
 *   - count: Number of Pokemon owned
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
    const supabase = createAdminClient();

    // Count user's Pokemon
    const { count, error } = await supabase
      .from('player_pokemon')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to check Pokemon:', error);
      return sendInternalError(res, 'Failed to check Pokemon status');
    }

    return sendSuccess(res, {
      has_pokemon: count > 0,
      count: count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/player/pokemon/check:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}
