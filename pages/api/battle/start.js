/**
 * Battle Start API Endpoint
 *
 * POST /api/battle/start - Initialize a new battle with initiative rolls
 *
 * Creates a new battle instance between the player's Pokemon and an opponent.
 * Rolls initiative for both combatants and returns full battle state.
 *
 * Feature: 007-combat-engine
 */

import { createAdminClient } from '../../../lib/supabase';
import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorizedError,
  sendForbiddenError,
  sendMethodNotAllowed,
  sendInternalError
} from '../../../lib/apiResponse';
import { getPokemonById, getMovesForPokemonAtLevel } from '../../../lib/pokemonData';
import { buildCombatant, buildOpponentCombatant, createBattle } from '../../../lib/battleEngine';
import { determineFirstActor } from '../../../lib/initiativeUtils';
import { initializePP } from '../../../lib/ppTracker';

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

    // Validate request body
    const {
      player_pokemon_id,
      opponent_pokemon_id,
      opponent_level,
      battle_type = 'wild'
    } = req.body;

    if (!player_pokemon_id) {
      return sendValidationError(res, 'Missing required field', {
        player_pokemon_id: 'player_pokemon_id is required'
      });
    }

    if (!opponent_pokemon_id) {
      return sendValidationError(res, 'Missing required field', {
        opponent_pokemon_id: 'opponent_pokemon_id is required'
      });
    }

    if (!opponent_level || typeof opponent_level !== 'number' || opponent_level < 1 || opponent_level > 20) {
      return sendValidationError(res, 'Invalid opponent level', {
        opponent_level: 'opponent_level must be a number between 1 and 20'
      });
    }

    const validBattleTypes = ['wild', 'gym', 'pvp', 'trainer'];
    if (!validBattleTypes.includes(battle_type)) {
      return sendValidationError(res, 'Invalid battle type', {
        battle_type: `battle_type must be one of: ${validBattleTypes.join(', ')}`
      });
    }

    const supabase = createAdminClient();

    // Verify player owns this Pokemon
    const { data: playerPokemonRecord, error: pokemonError } = await supabase
      .from('player_pokemon')
      .select('*')
      .eq('id', player_pokemon_id)
      .single();

    if (pokemonError || !playerPokemonRecord) {
      return sendForbiddenError(res, 'You do not own this Pokemon');
    }

    if (playerPokemonRecord.user_id !== userId) {
      return sendForbiddenError(res, 'You do not own this Pokemon');
    }

    // Check if Pokemon is fainted
    if (playerPokemonRecord.current_hp <= 0) {
      return sendError(
        res,
        'POKEMON_FAINTED',
        'This Pokemon has fainted and cannot battle',
        422,
        { hint: 'Heal your Pokemon at a Pokemon Center first' }
      );
    }

    // Validate opponent Pokemon exists in Source
    const opponentSource = getPokemonById(opponent_pokemon_id);
    if (!opponentSource) {
      return sendValidationError(res, 'Invalid opponent Pokemon', {
        opponent_pokemon_id: 'Pokemon not found in Source data'
      });
    }

    // Build player combatant from database record
    let playerCombatant;
    try {
      playerCombatant = buildCombatant(playerPokemonRecord, 'player');
    } catch (buildError) {
      return sendInternalError(res, 'Failed to build player combatant: ' + buildError.message);
    }

    // Build opponent combatant
    let opponentCombatant;
    try {
      opponentCombatant = buildOpponentCombatant(opponent_pokemon_id, opponent_level);
    } catch (buildError) {
      return sendInternalError(res, 'Failed to build opponent combatant: ' + buildError.message);
    }

    // Roll initiative and determine turn order
    const initiativeResult = determineFirstActor(playerCombatant, opponentCombatant);

    // Create battle instance
    const battle = createBattle(playerCombatant, opponentCombatant);

    // Build response per contract
    const response = {
      battle_id: battle.battle_id,
      battle_type: battle_type,
      player_pokemon: {
        id: playerCombatant.combatant_id,
        pokemon_id: playerCombatant.pokemon_id,
        name: playerCombatant.name,
        level: playerCombatant.level,
        current_hp: playerCombatant.current_hp,
        max_hp: playerCombatant.max_hp,
        ac: playerCombatant.ac,
        type: playerCombatant.type,
        attributes: playerCombatant.attributes,
        known_moves: playerCombatant.known_moves,
        move_pp: playerCombatant.move_pp,
        abilities: playerCombatant.abilities,
        initiative: playerCombatant.initiative_roll
      },
      opponent: {
        pokemon_id: opponentCombatant.pokemon_id,
        name: opponentCombatant.name,
        level: opponentCombatant.level,
        current_hp: opponentCombatant.current_hp,
        max_hp: opponentCombatant.max_hp,
        ac: opponentCombatant.ac,
        type: opponentCombatant.type,
        attributes: opponentCombatant.attributes,
        known_moves: opponentCombatant.known_moves,
        move_pp: opponentCombatant.move_pp,
        abilities: opponentCombatant.abilities,
        initiative: opponentCombatant.initiative_roll
      },
      initiative_order: initiativeResult.initiative_order,
      first_to_act: initiativeResult.first_to_act,
      round_number: 1
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle Start API error:', error);
    return sendInternalError(res, 'An error occurred while starting the battle');
  }
}
