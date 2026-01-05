/**
 * Battle End API Endpoint
 *
 * POST /api/battle/end - End a battle and persist results
 *
 * Updates active_battles status and persists final HP to player_pokemon.
 *
 * Feature: 019-fix-combat-bugs
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

    const { battle_id, outcome, combatants } = req.body;

    // Validate required fields
    if (!battle_id) {
      return sendError(res, 'VALIDATION_ERROR', 'battle_id is required', 400);
    }

    if (!outcome) {
      return sendError(res, 'VALIDATION_ERROR', 'outcome is required', 400);
    }

    if (!['victory', 'defeat'].includes(outcome)) {
      return sendError(res, 'INVALID_OUTCOME', "Outcome must be 'victory' or 'defeat'", 400);
    }

    if (!combatants) {
      return sendError(res, 'VALIDATION_ERROR', 'combatants is required', 400);
    }

    console.log('Calling /api/battle/end with:', { battle_id, outcome, combatants });

    const supabase = createAdminClient();

    // Get battle to verify ownership and status
    const { data: battle, error: fetchError } = await supabase
      .from('active_battles')
      .select('user_id, status, battle_state')
      .eq('id', battle_id)
      .single();

    if (fetchError || !battle) {
      return sendNotFoundError(res, 'Battle not found or does not belong to user');
    }

    if (battle.user_id !== userId) {
      return sendForbiddenError(res, 'This battle does not belong to you');
    }

    if (battle.status !== 'active') {
      return sendError(res, 'BATTLE_ALREADY_ENDED', 'Battle has already ended', 400);
    }

    // Update battle state with outcome
    const updatedState = {
      ...battle.battle_state,
      outcome: outcome,
      phase: 'ended',
      ended_at: new Date().toISOString()
    };

    // Update battle record status
    const { error: updateError } = await supabase
      .from('active_battles')
      .update({
        status: outcome,
        battle_state: updatedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', battle_id);

    if (updateError) {
      console.error('Failed to update battle status:', updateError);
      return sendInternalError(res, 'Failed to save battle result');
    }

    // Persist HP to player_pokemon for player combatants
    const hpUpdated = [];
    const playerCombatants = combatants.player || [];

    for (const combatant of playerCombatants) {
      if (combatant.pokemon_db_id && typeof combatant.current_hp === 'number') {
        const { error: hpError } = await supabase
          .from('player_pokemon')
          .update({
            current_hp: Math.max(0, combatant.current_hp)
          })
          .eq('id', combatant.pokemon_db_id)
          .eq('user_id', userId);

        if (hpError) {
          console.error('Failed to update Pokemon HP:', hpError, combatant);
        } else {
          hpUpdated.push({
            pokemon_id: combatant.pokemon_db_id,
            new_hp: combatant.current_hp
          });
        }
      }
    }

    const responseData = {
      battle_id,
      outcome,
      hp_updated: hpUpdated,
      battle_status: outcome
    };

    console.log('/api/battle/end response:', { success: true, data: responseData });

    return sendSuccess(res, responseData);

  } catch (error) {
    console.error('Battle End API error:', error);
    return sendInternalError(res, 'An error occurred while ending the battle');
  }
}
