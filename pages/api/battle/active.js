/**
 * Active Battle API Endpoint
 *
 * GET /api/battle/active - Check if user has an active battle
 *
 * Returns active battle summary for resume functionality.
 *
 * Feature: 016-zone-encounters
 */

import { createAdminClient } from '../../../lib/supabase';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendMethodNotAllowed,
  sendUnauthorizedError,
  sendInternalError
} from '../../../lib/apiResponse';
import { getZoneById } from '../../../lib/zoneData';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  try {
    // Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    const supabase = createAdminClient();

    // Check for active battle
    const { data: activeBattle, error: activeError } = await supabase
      .from('active_battles')
      .select('id, zone_id, battle_state, created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (activeError && activeError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      console.error('Failed to check active battle:', activeError);
      return sendInternalError(res, 'Failed to check for active battle');
    }

    if (!activeBattle) {
      return sendSuccess(res, {
        has_active_battle: false,
        battle: null
      });
    }

    // Get zone info
    const zone = getZoneById(activeBattle.zone_id);
    const battleState = activeBattle.battle_state || {};

    // Build summary response
    const response = {
      has_active_battle: true,
      battle: {
        battle_id: activeBattle.id,
        zone_id: activeBattle.zone_id,
        zone_name: zone?.name || 'Unknown Zone',
        phase: battleState.phase || 'setup',
        round_number: battleState.round_number || 0,
        started_at: activeBattle.created_at,
        updated_at: activeBattle.updated_at,
        player_pokemon: (battleState.combatants?.player || []).map(p => ({
          combatant_id: p.combatant_id,
          name: p.name,
          number: p.number,
          current_hp: p.current_hp,
          max_hp: p.max_hp,
          position: p.position,
          is_fainted: p.is_fainted || p.current_hp <= 0
        })),
        opponent_pokemon: (battleState.combatants?.opponent || []).map(p => ({
          combatant_id: p.combatant_id,
          name: p.name,
          number: p.number,
          current_hp: p.current_hp,
          max_hp: p.max_hp,
          position: p.position,
          is_fainted: p.is_fainted || p.current_hp <= 0
        }))
      }
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Active Battle API error:', error);
    return sendInternalError(res, 'An error occurred while checking for active battle');
  }
}
