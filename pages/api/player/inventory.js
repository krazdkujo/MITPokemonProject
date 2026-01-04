/**
 * Player Inventory API Endpoint
 *
 * GET /api/player/inventory - Get player's owned items
 *
 * Returns inventory items merged with Source item data,
 * along with current currency balance.
 *
 * Feature: 009-shop-api
 */

import { createAdminClient } from '../../../lib/supabase';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../../lib/apiResponse';
import { buildPlayerInventoryResponse } from '../../../lib/itemData';

export default async function handler(req, res) {
  // T018: GET method guard
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  try {
    // T019: JWT authentication
    const { userId, error: authError } = await authenticateRequest(req);
    if (!userId) {
      return sendUnauthorizedError(res, authError || 'Authentication required');
    }

    const supabase = createAdminClient();

    // T020: Query player_inventory table for user's items
    const { data: inventoryRecords, error: inventoryError } = await supabase
      .from('player_inventory')
      .select('item_id, quantity')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (inventoryError) {
      console.error('Failed to fetch inventory:', inventoryError);
      return sendInternalError(res, 'Failed to fetch inventory');
    }

    // T021: Query user currency balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('currency')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Failed to fetch user currency:', userError);
      return sendInternalError(res, 'Failed to fetch user data');
    }

    // T022: Merge inventory records with Source item data
    // T024: Handle empty inventory case (returns empty array)
    const inventory = buildPlayerInventoryResponse(inventoryRecords || []);

    // T023: Return success response
    return sendSuccess(res, {
      inventory,
      count: inventory.length,
      currency: user.currency,
    });

  } catch (error) {
    console.error('Error in GET /api/player/inventory:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}
