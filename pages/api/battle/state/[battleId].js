/**
 * Battle State API Endpoint
 *
 * GET /api/battle/state/:battleId - Get full battle state for resume
 * PATCH /api/battle/state/:battleId - Update battle state after action
 *
 * Feature: 016-zone-encounters
 */

import { createAdminClient } from '../../../../lib/supabase';
import { authenticateRequest } from '../../../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendMethodNotAllowed,
  sendUnauthorizedError,
  sendNotFoundError,
  sendForbiddenError,
  sendInternalError
} from '../../../../lib/apiResponse';
import { getZoneById } from '../../../../lib/zoneData';

export default async function handler(req, res) {
  const { battleId } = req.query;

  if (req.method === 'GET') {
    return handleGet(req, res, battleId);
  } else if (req.method === 'PATCH') {
    return handlePatch(req, res, battleId);
  } else {
    return sendMethodNotAllowed(res, ['GET', 'PATCH']);
  }
}

async function handleGet(req, res, battleId) {
  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    const supabase = createAdminClient();

    // Get battle by ID
    const { data: battle, error: battleError } = await supabase
      .from('active_battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError || !battle) {
      return sendNotFoundError(res, 'Battle not found');
    }

    // Verify ownership
    if (battle.user_id !== userId) {
      return sendForbiddenError(res, 'This battle does not belong to you');
    }

    // Get zone info
    const zone = getZoneById(battle.zone_id);
    const battleState = battle.battle_state || {};

    // Merge zone info into response
    const response = {
      battle_id: battle.id,
      battle_type: battleState.battle_type || 'wild',
      zone: {
        id: battle.zone_id,
        name: zone?.name || 'Unknown Zone',
        terrain: zone?.terrain || 'unknown'
      },
      phase: battleState.phase || 'setup',
      grid: battleState.grid || { width: 10, height: 10 },
      combatants: battleState.combatants || { player: [], opponent: [] },
      trainers: battleState.trainers || {
        player: { position: { col: 0, row: 4 } },
        opponent: { position: { col: 9, row: 4 } }
      },
      initiative_order: battleState.initiative_order || [],
      current_turn_index: battleState.current_turn_index || 0,
      round_number: battleState.round_number || 0,
      battle_log: battleState.battle_log || [],
      outcome: battleState.outcome || 'ongoing',
      started_at: battle.created_at
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle State GET error:', error);
    return sendInternalError(res, 'An error occurred while fetching battle state');
  }
}

async function handlePatch(req, res, battleId) {
  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    const { battle_state, status } = req.body;

    if (!battle_state) {
      return sendError(res, 'VALIDATION_ERROR', 'battle_state is required', 400);
    }

    const supabase = createAdminClient();

    // Get battle to verify ownership
    const { data: existingBattle, error: fetchError } = await supabase
      .from('active_battles')
      .select('user_id, status')
      .eq('id', battleId)
      .single();

    if (fetchError || !existingBattle) {
      return sendNotFoundError(res, 'Battle not found');
    }

    if (existingBattle.user_id !== userId) {
      return sendForbiddenError(res, 'This battle does not belong to you');
    }

    // Update battle state
    const updateData = {
      battle_state,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    const { error: updateError } = await supabase
      .from('active_battles')
      .update(updateData)
      .eq('id', battleId);

    if (updateError) {
      console.error('Failed to update battle state:', updateError);
      return sendInternalError(res, 'Failed to update battle state');
    }

    return sendSuccess(res, {
      battle_id: battleId,
      updated_at: updateData.updated_at
    });

  } catch (error) {
    console.error('Battle State PATCH error:', error);
    return sendInternalError(res, 'An error occurred while updating battle state');
  }
}
