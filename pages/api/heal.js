/**
 * Heal API Endpoint
 *
 * POST /api/heal - Restore all active party Pokemon to full health
 *
 * Heals all Pokemon in the player's active party (is_active = true) by:
 * - Restoring current_hp to max_hp
 * - Restoring all move PP to Source-defined maximums
 *
 * This is a free operation with no currency cost, designed for use
 * in N8N workflows between battles.
 *
 * Feature: 008-healing-api
 */

import { createAdminClient } from '../../lib/supabase';
import { authenticateRequest } from '../../lib/authHelper';
import {
  sendSuccess,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError,
} from '../../lib/apiResponse';
import {
  buildPlayerPokemonListResponse,
  initializeMovePP,
} from '../../lib/pokemonData';

export default async function handler(req, res) {
  // T006: POST method guard
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  try {
    // T007: JWT authentication
    const { userId, error: authError } = await authenticateRequest(req);
    if (!userId) {
      return sendUnauthorizedError(res, authError || 'Authentication required');
    }

    const supabase = createAdminClient();

    // T008: Query active Pokemon for this user
    const { data: activePokemon, error: queryError } = await supabase
      .from('player_pokemon')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('slot_number', { ascending: true, nullsFirst: false });

    if (queryError) {
      console.error('Failed to fetch active Pokemon:', queryError);
      return sendInternalError(res, 'Failed to fetch Pokemon roster');
    }

    // T012: Handle empty party
    if (!activePokemon || activePokemon.length === 0) {
      return sendSuccess(res, {
        healed: [],
        healed_count: 0,
        message: 'No active Pokemon to heal',
      });
    }

    // T009-T011: Heal each Pokemon (HP and PP restoration)
    const healedRecords = [];

    for (const pokemon of activePokemon) {
      // T010: Restore PP using initializeMovePP from Source data
      const restoredMovePP = initializeMovePP(pokemon.selected_moves || []);

      // T009 & T011: Update HP to max and PP to restored values
      const { data: updatedPokemon, error: updateError } = await supabase
        .from('player_pokemon')
        .update({
          current_hp: pokemon.max_hp,
          move_pp: restoredMovePP,
        })
        .eq('id', pokemon.id)
        .select()
        .single();

      if (updateError) {
        console.error(`Failed to heal Pokemon ${pokemon.id}:`, updateError);
        return sendInternalError(res, 'Failed to heal Pokemon');
      }

      healedRecords.push(updatedPokemon);
    }

    // T014: Merge with Source data for response
    const healedWithSourceData = buildPlayerPokemonListResponse(healedRecords);

    // T015 & T016: Structure response per contract
    return sendSuccess(res, {
      healed: healedWithSourceData,
      healed_count: healedWithSourceData.length,
      message: 'Party healed successfully',
    });

  } catch (error) {
    // T013: Error handling
    console.error('Error in POST /api/heal:', error);
    return sendInternalError(res, 'An unexpected error occurred');
  }
}
