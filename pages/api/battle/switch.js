/**
 * POST /api/battle/switch
 * Switch Pokemon in battle
 * T039-T041: Full switching implementation per Pokemon 5e rules
 *
 * Feature: 017-5e-combat-research
 */

import { createClient } from '@supabase/supabase-js';
import { getAuthToken, getAuthUser } from '../../../lib/authHelper.js';
import { successResponse, errorResponse } from '../../../lib/apiResponse.js';
import { recallPokemon, sendOutPokemon, checkAoOTrigger, executeAoO } from '../../../lib/battleEngine.js';
import { canSwitchOut } from '../../../lib/transformations.js';
import { getManhattanDistance, cellsToFeet } from '../../../lib/gridUtils.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED'));
  }

  try {
    // Authenticate user
    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json(errorResponse('No authentication token provided', 'UNAUTHORIZED'));
    }

    const user = await getAuthUser(token);
    if (!user) {
      return res.status(401).json(errorResponse('Invalid authentication token', 'UNAUTHORIZED'));
    }

    const {
      battle_id,
      battle_state,
      current_combatant_id,
      new_pokemon_id,
      target_position
    } = req.body;

    // Validate required fields
    if (!battle_id) {
      return res.status(400).json(errorResponse('battle_id is required', 'MISSING_FIELD'));
    }
    if (!battle_state) {
      return res.status(400).json(errorResponse('battle_state is required', 'MISSING_FIELD'));
    }
    if (!current_combatant_id) {
      return res.status(400).json(errorResponse('current_combatant_id is required', 'MISSING_FIELD'));
    }
    if (!new_pokemon_id) {
      return res.status(400).json(errorResponse('new_pokemon_id is required', 'MISSING_FIELD'));
    }

    // Get combatants
    const allCombatants = [
      ...(battle_state.combatants?.player || battle_state.player_pokemon || []),
      ...(battle_state.combatants?.opponent || battle_state.opponent_pokemon || [])
    ];

    // Find current combatant
    const currentCombatant = allCombatants.find(c => c.combatant_id === current_combatant_id);
    if (!currentCombatant) {
      return res.status(400).json(errorResponse('Current combatant not found', 'INVALID_COMBATANT'));
    }

    // Check if current combatant can be switched out (Dynamax blocks switching)
    const switchCheck = canSwitchOut(currentCombatant);
    if (!switchCheck.canSwitch) {
      return res.status(400).json(errorResponse(
        `Cannot switch: ${switchCheck.reason}`,
        'SWITCH_BLOCKED'
      ));
    }

    // Find new Pokemon (from player's party, not currently in battle)
    const playerPokemon = battle_state.combatants?.player || battle_state.player_pokemon || [];
    const newPokemon = playerPokemon.find(p => p.pokemon_id === new_pokemon_id || p.combatant_id === new_pokemon_id);

    // If not in active combatants, check party reserve
    let incomingPokemon = newPokemon;
    if (!incomingPokemon && battle_state.player_party) {
      incomingPokemon = battle_state.player_party.find(p => p.pokemon_id === new_pokemon_id);
    }

    if (!incomingPokemon) {
      return res.status(400).json(errorResponse('New Pokemon not found in party', 'INVALID_POKEMON'));
    }

    if (incomingPokemon.current_hp <= 0) {
      return res.status(400).json(errorResponse('Cannot send out a fainted Pokemon', 'POKEMON_FAINTED'));
    }

    // Calculate target position (use provided or current combatant's position)
    const switchPosition = target_position || currentCombatant.position;

    // Check for Attack of Opportunity
    const opponentPokemon = battle_state.combatants?.opponent || battle_state.opponent_pokemon || [];
    const aooResults = [];

    for (const opponent of opponentPokemon) {
      if (opponent.current_hp <= 0) continue;
      if (!opponent.position || !currentCombatant.position) continue;

      const aooTrigger = checkAoOTrigger(currentCombatant, opponent, battle_state);

      if (aooTrigger.triggered) {
        // Execute AoO
        const aooResult = executeAoO(opponent, currentCombatant);

        if (aooResult) {
          aooResults.push({
            attacker: {
              combatant_id: opponent.combatant_id,
              name: opponent.name
            },
            target: {
              combatant_id: currentCombatant.combatant_id,
              name: currentCombatant.name
            },
            hit: aooResult.hit,
            damage: aooResult.damage,
            move_used: aooResult.move?.name
          });

          // Apply AoO damage to current combatant
          if (aooResult.hit && aooResult.damage > 0) {
            currentCombatant.current_hp = Math.max(0, currentCombatant.current_hp - aooResult.damage);
          }
        }
      }
    }

    // Perform the switch
    // Step 1: Recall current Pokemon (uses Action, does not provoke additional AoO)
    const recallResult = recallPokemon(currentCombatant, battle_state);

    // Step 2: Send out new Pokemon (uses Bonus Action, can_act = false)
    const sendOutResult = sendOutPokemon(incomingPokemon, switchPosition, battle_state);

    // Update battle state
    const updatedState = { ...battle_state };

    // Update player combatants list
    const updatedPlayerPokemon = (updatedState.combatants?.player || updatedState.player_pokemon || [])
      .map(p => {
        if (p.combatant_id === current_combatant_id) {
          // Mark recalled Pokemon as inactive
          return {
            ...p,
            ...recallResult.combatant,
            is_active: false,
            position: null
          };
        }
        return p;
      });

    // Add or update incoming Pokemon
    const existingIncoming = updatedPlayerPokemon.find(
      p => p.combatant_id === sendOutResult.combatant?.combatant_id ||
           p.pokemon_id === new_pokemon_id
    );

    if (existingIncoming) {
      const idx = updatedPlayerPokemon.findIndex(
        p => p.combatant_id === existingIncoming.combatant_id ||
             p.pokemon_id === new_pokemon_id
      );
      updatedPlayerPokemon[idx] = {
        ...existingIncoming,
        ...sendOutResult.combatant,
        is_active: true,
        position: switchPosition,
        can_act: false // Just entered battle, cannot act this turn
      };
    } else {
      // Add new combatant
      updatedPlayerPokemon.push({
        ...sendOutResult.combatant,
        is_active: true,
        position: switchPosition,
        can_act: false
      });
    }

    // Update state
    if (updatedState.combatants) {
      updatedState.combatants.player = updatedPlayerPokemon;
    } else {
      updatedState.player_pokemon = updatedPlayerPokemon;
    }

    // Build response
    const response = {
      success: true,
      switch_result: {
        recalled: {
          combatant_id: currentCombatant.combatant_id,
          name: currentCombatant.name,
          hp_remaining: currentCombatant.current_hp
        },
        sent_out: {
          combatant_id: sendOutResult.combatant?.combatant_id || new_pokemon_id,
          name: sendOutResult.combatant?.name || incomingPokemon.name,
          current_hp: sendOutResult.combatant?.current_hp || incomingPokemon.current_hp,
          max_hp: sendOutResult.combatant?.max_hp || incomingPokemon.max_hp,
          position: switchPosition,
          can_act: false
        },
        action_cost: 'action', // Recall uses Action
        bonus_action_cost: 'bonus_action' // Send out uses Bonus Action
      },
      provoked_aoo: aooResults.length > 0,
      aoo_results: aooResults,
      updated_state: {
        combatants: updatedState.combatants || {
          player: updatedState.player_pokemon,
          opponent: updatedState.opponent_pokemon
        },
        current_turn_index: updatedState.current_turn_index,
        round_number: updatedState.round_number,
        weather: updatedState.weather,
        terrain: updatedState.terrain
      }
    };

    return res.status(200).json(successResponse(response));

  } catch (error) {
    console.error('Switch error:', error);
    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
}
