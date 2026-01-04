/**
 * Battle Abandon API Endpoint
 *
 * POST /api/battle/abandon - Abandon the current active battle
 *
 * Marks the battle as abandoned (same consequences as flee).
 *
 * Feature: 016-zone-encounters
 */

import { createAdminClient } from '../../../lib/supabase';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendMethodNotAllowed,
  sendUnauthorizedError,
  sendNotFoundError,
  sendForbiddenError,
  sendInternalError
} from '../../../lib/apiResponse';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    const { battle_id } = req.body;

    if (!battle_id) {
      return sendError(res, 'VALIDATION_ERROR', 'battle_id is required', 400);
    }

    const supabase = createAdminClient();

    // Get battle to verify ownership and status
    const { data: battle, error: fetchError } = await supabase
      .from('active_battles')
      .select('user_id, status, battle_state')
      .eq('id', battle_id)
      .single();

    if (fetchError || !battle) {
      return sendNotFoundError(res, 'Battle not found');
    }

    if (battle.user_id !== userId) {
      return sendForbiddenError(res, 'This battle does not belong to you');
    }

    if (battle.status !== 'active') {
      return sendError(res, 'NO_ACTIVE_BATTLE', 'No active battle to abandon', 400);
    }

    // Update battle state with abandoned outcome
    const updatedState = {
      ...battle.battle_state,
      outcome: 'abandoned',
      phase: 'ended'
    };

    // Update battle record
    const { error: updateError } = await supabase
      .from('active_battles')
      .update({
        status: 'abandoned',
        battle_state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', battle_id);

    if (updateError) {
      console.error('Failed to abandon battle:', updateError);
      return sendInternalError(res, 'Failed to abandon battle');
    }

    return sendSuccess(res, {
      battle_id,
      outcome: 'abandoned',
      message: 'Battle abandoned. This counts as fleeing from combat.'
    });

  } catch (error) {
    console.error('Battle Abandon API error:', error);
    return sendInternalError(res, 'An error occurred while abandoning the battle');
  }
}
