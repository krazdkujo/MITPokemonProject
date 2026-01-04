/**
 * Battle Start API Endpoint
 *
 * POST /api/battle/start - Initialize a new battle with initiative rolls
 *
 * Creates a new battle instance between the player's Pokemon and an opponent.
 * Rolls initiative for both combatants and returns full battle state.
 * Supports grid_mode for 10x10 Combat Arena battles.
 *
 * Feature: 007-combat-engine, 015-combat-arena
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
import { determineFirstActor, rollInitiative } from '../../../lib/initiativeUtils';
import { initializePP } from '../../../lib/ppTracker';
import { toGridNotation } from '../../../lib/gridUtils';

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
      player_pokemon_ids,
      opponent_pokemon_id,
      opponent_level,
      battle_type = 'wild',
      grid_mode = false
    } = req.body;

    // Support both single ID and array of IDs
    const pokemonIds = player_pokemon_ids || (player_pokemon_id ? [player_pokemon_id] : []);

    if (pokemonIds.length === 0) {
      return sendValidationError(res, 'Missing required field', {
        player_pokemon_ids: 'At least one player Pokemon is required'
      });
    }

    if (pokemonIds.length > 6) {
      return sendValidationError(res, 'Too many Pokemon selected', {
        player_pokemon_ids: 'Maximum 6 Pokemon allowed in battle party'
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

    // Verify player owns all Pokemon and fetch their data
    const { data: playerPokemonRecords, error: pokemonError } = await supabase
      .from('player_pokemon')
      .select('*')
      .in('id', pokemonIds);

    if (pokemonError || !playerPokemonRecords || playerPokemonRecords.length === 0) {
      return sendForbiddenError(res, 'You do not own these Pokemon');
    }

    // Verify all Pokemon belong to the user
    for (const record of playerPokemonRecords) {
      if (record.user_id !== userId) {
        return sendForbiddenError(res, 'You do not own one or more of these Pokemon');
      }
    }

    // Check if all Pokemon are fainted
    const activePokemon = playerPokemonRecords.filter(p => p.current_hp > 0);
    if (activePokemon.length === 0) {
      return sendError(
        res,
        'ALL_POKEMON_FAINTED',
        'All selected Pokemon have fainted',
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

    // Build player combatants from database records
    const playerCombatants = [];
    for (const record of playerPokemonRecords) {
      try {
        const combatant = buildCombatant(record, 'player');
        // Roll initiative for each combatant
        combatant.initiative_roll = rollInitiative(combatant);
        playerCombatants.push(combatant);
      } catch (buildError) {
        return sendInternalError(res, 'Failed to build player combatant: ' + buildError.message);
      }
    }

    // Build opponent combatant
    let opponentCombatant;
    try {
      opponentCombatant = buildOpponentCombatant(opponent_pokemon_id, opponent_level);
      opponentCombatant.initiative_roll = rollInitiative(opponentCombatant);
    } catch (buildError) {
      return sendInternalError(res, 'Failed to build opponent combatant: ' + buildError.message);
    }

    // Build initiative order (all combatants sorted by initiative)
    const allCombatants = [...playerCombatants, opponentCombatant];
    allCombatants.sort((a, b) => {
      // Higher initiative goes first
      if (b.initiative_roll !== a.initiative_roll) {
        return b.initiative_roll - a.initiative_roll;
      }
      // Tiebreaker: higher DEX
      const aDex = a.attributes?.dex || 10;
      const bDex = b.attributes?.dex || 10;
      return bDex - aDex;
    });
    const initiative_order = allCombatants.map(c => c.combatant_id);
    const first_to_act = allCombatants[0].owner;

    // Create battle instance
    const battle = createBattle(playerCombatants[0], opponentCombatant);

    // Handle grid mode response
    if (grid_mode) {
      // Auto-place opponent in rows 9-10
      const opponentPosition = { col: 5, row: 9 };
      opponentCombatant.position = opponentPosition;

      const response = {
        battle_id: battle.battle_id,
        battle_type: battle_type,
        phase: 'setup',
        grid_mode: true,
        grid: {
          width: 10,
          height: 10,
          deployment_zone: {
            player: { rows: [0, 1] },
            opponent: { rows: [8, 9] }
          },
          trainers: {
            player: { col: 0, row: 4, notation: 'A5' },
            opponent: { col: 9, row: 4, notation: 'J5' }
          }
        },
        player_pokemon: playerCombatants.map(c => ({
          combatant_id: c.combatant_id,
          pokemon_id: c.pokemon_id,
          number: c.number,
          name: c.name,
          level: c.level,
          current_hp: c.current_hp,
          max_hp: c.max_hp,
          ac: c.ac,
          type: c.type,
          attributes: c.attributes,
          known_moves: c.known_moves,
          move_pp: c.move_pp,
          abilities: c.abilities,
          initiative: c.initiative_roll,
          position: null,
          placed: false,
          status_effects: []
        })),
        opponent_pokemon: [{
          combatant_id: opponentCombatant.combatant_id,
          pokemon_id: opponentCombatant.pokemon_id,
          number: opponentCombatant.number,
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
          initiative: opponentCombatant.initiative_roll,
          position: opponentPosition,
          placed: true,
          status_effects: [],
          moves: opponentCombatant.moves || []
        }],
        initiative_order,
        first_to_act,
        round_number: 0,
        awaiting_placement: true
      };

      return sendSuccess(res, response);
    }

    // Legacy non-grid mode response (single Pokemon)
    const playerCombatant = playerCombatants[0];
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
      initiative_order,
      first_to_act,
      round_number: 1
    };

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle Start API error:', error);
    return sendInternalError(res, 'An error occurred while starting the battle');
  }
}
