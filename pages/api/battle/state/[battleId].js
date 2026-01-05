/**
 * Battle State API Endpoint
 *
 * GET /api/battle/state/:battleId - Get full battle state for resume
 * PATCH /api/battle/state/:battleId - Update battle state after action
 *
 * Feature: 016-zone-encounters
 * Updated: 018-combat-enhancements (added state hash verification)
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
import { getMoveById, getMovesForPokemonAtLevel } from '../../../../lib/pokemonData';
import { verifyStateHash } from '../../../../lib/battleState';

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

/**
 * Hydrate combatant moves - ensure known_moves contains full move objects
 * @param {Object} combatant - Combatant to hydrate
 * @returns {Object} Combatant with hydrated moves
 */
function hydrateCombatantMoves(combatant) {
  if (!combatant) return combatant;

  // Check if known_moves needs hydration (array of strings vs objects)
  const knownMoves = combatant.known_moves || [];

  if (knownMoves.length === 0) {
    // No moves stored - get from pokemon data
    const moves = getMovesForPokemonAtLevel(combatant.pokemon_id, combatant.level || 1);
    return {
      ...combatant,
      known_moves: moves.slice(0, 4)
    };
  }

  // Check if first item is a string (needs hydration) or object (already hydrated)
  if (typeof knownMoves[0] === 'string') {
    // Hydrate move IDs to full objects
    const hydratedMoves = knownMoves
      .map(moveId => getMoveById(moveId))
      .filter(Boolean);

    return {
      ...combatant,
      known_moves: hydratedMoves
    };
  }

  // Already hydrated
  return combatant;
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

    // Verify state hash if present (T024 - Feature 018)
    let stateIntegrity = 'unknown';
    if (battleState.state_hash) {
      const hashValid = verifyStateHash(battleState);
      stateIntegrity = hashValid ? 'verified' : 'mismatch';
      if (!hashValid) {
        console.warn(`State hash mismatch for battle ${battleId}. Expected: ${battleState.state_hash}`);
      }
    }

    // Hydrate combatant moves (ensure full move objects for UI)
    const combatants = battleState.combatants || { player: [], opponent: [] };
    const hydratedCombatants = {
      player: (combatants.player || []).map(hydrateCombatantMoves),
      opponent: (combatants.opponent || []).map(hydrateCombatantMoves)
    };

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
      combatants: hydratedCombatants,
      trainers: battleState.trainers || {
        player: { position: { col: 0, row: 4 } },
        opponent: { position: { col: 9, row: 4 } }
      },
      initiative_order: battleState.initiative_order || [],
      current_turn_index: battleState.current_turn_index || 0,
      round_number: battleState.round_number || 0,
      battle_log: battleState.battle_log || [],
      outcome: battleState.outcome || 'ongoing',
      started_at: battle.created_at,
      state_integrity: stateIntegrity,
      last_saved_at: battleState.last_saved_at || null
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
