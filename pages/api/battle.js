/**
 * Battle API Endpoint
 *
 * POST /api/battle - Execute a battle turn
 *
 * Processes a battle between the player's Pokemon and a wild opponent.
 * Calculates damage using Pokemon 5e rules, updates HP/PP in database,
 * and returns detailed battle log for N8N workflow parsing.
 *
 * Feature: 006-battle-api
 */

import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '../../lib/supabase';
import { authenticateRequest } from '../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorizedError,
  sendForbiddenError,
  sendMethodNotAllowed,
  sendInternalError
} from '../../lib/apiResponse';
import {
  getPokemonById,
  getMoveById,
  getMovesForPokemonAtLevel,
  getMoveIdsForPokemonAtLevel,
  initializeMovePP
} from '../../lib/pokemonData';
import {
  processBattleTurn,
  createBattle,
  applyStruggleRecoil
} from '../../lib/battleEngine';
import { generateWildPokemon } from '../../lib/opponentGenerator';
import { calculateXpAward, calculateCurrencyAward, checkLevelUp } from '../../lib/experienceUtils';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  try {
    // T016: Authenticate request
    const { userId, error: authError } = await authenticateRequest(req);
    if (authError) {
      return sendUnauthorizedError(res, authError);
    }

    // T016: Validate request body
    const { player_pokemon_id, move_id, opponent_pokemon_id, opponent_level } = req.body;

    if (!player_pokemon_id) {
      return sendValidationError(res, 'Missing required field', {
        player_pokemon_id: 'player_pokemon_id is required'
      });
    }

    if (!move_id) {
      return sendValidationError(res, 'Missing required field', {
        move_id: 'move_id is required'
      });
    }

    const supabase = createAdminClient();

    // T017: Verify player owns this Pokemon
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

    // T018: Check if Pokemon is fainted
    if (playerPokemonRecord.current_hp <= 0) {
      return sendError(
        res,
        'POKEMON_FAINTED',
        'This Pokemon has fainted and cannot battle',
        422,
        { hint: 'Heal your Pokemon at a Pokemon Center first' }
      );
    }

    // Get Source data for player's Pokemon
    const sourcePokemon = getPokemonById(playerPokemonRecord.pokemon_id);
    if (!sourcePokemon) {
      return sendInternalError(res, 'Pokemon data not found in Source');
    }

    // T019: Validate move is available to this Pokemon
    const availableMoveIds = getMoveIdsForPokemonAtLevel(
      playerPokemonRecord.pokemon_id,
      playerPokemonRecord.level
    );

    // Get selected moves from database or use start moves
    let selectedMoves = playerPokemonRecord.selected_moves || [];
    if (selectedMoves.length === 0) {
      // Initialize with start moves (first 4 available moves)
      selectedMoves = availableMoveIds.slice(0, 4);
    }

    // Check if the requested move is in the Pokemon's selected moves
    if (!selectedMoves.includes(move_id)) {
      // Check if move is at least available at this level
      if (!availableMoveIds.includes(move_id)) {
        return sendValidationError(res, 'Move not available', {
          move_id: 'This Pokemon does not know this move',
          available_moves: selectedMoves
        });
      }
    }

    // Get move data
    const move = getMoveById(move_id);
    if (!move) {
      return sendValidationError(res, 'Invalid move', {
        move_id: 'Move not found in Source data'
      });
    }

    // Initialize or get current PP
    let movePP = playerPokemonRecord.move_pp || {};
    if (Object.keys(movePP).length === 0) {
      movePP = initializeMovePP(selectedMoves);
    }

    // T038: Check PP for the selected move
    const currentPP = movePP[move_id];
    let useStruggle = false;

    if (currentPP !== undefined && currentPP <= 0) {
      // Check if all moves have 0 PP
      const allMovesExhausted = selectedMoves.every(m => (movePP[m] || 0) <= 0);

      if (allMovesExhausted) {
        // T041: Use Struggle
        useStruggle = true;
      } else {
        return sendValidationError(res, 'No PP remaining for this move', {
          move_id: move_id,
          pp_remaining: 0,
          available_moves: selectedMoves.filter(m => (movePP[m] || 0) > 0)
        });
      }
    }

    // Build player Pokemon object for battle
    const playerPokemon = {
      id: playerPokemonRecord.id,
      pokemon_id: playerPokemonRecord.pokemon_id,
      name: sourcePokemon.name,
      type: sourcePokemon.type,
      level: playerPokemonRecord.level,
      current_hp: playerPokemonRecord.current_hp,
      max_hp: playerPokemonRecord.max_hp,
      ac: sourcePokemon.ac,
      attributes: sourcePokemon.attributes,
      moves: getMovesForPokemonAtLevel(playerPokemonRecord.pokemon_id, playerPokemonRecord.level)
    };

    // T050: Generate or load opponent
    let opponent;
    try {
      opponent = generateWildPokemon(
        playerPokemonRecord.level,
        opponent_pokemon_id,
        opponent_level
      );
    } catch (opponentError) {
      return sendInternalError(res, 'Failed to generate opponent: ' + opponentError.message);
    }

    // Create battle instance
    const battle = createBattle(playerPokemon, opponent);

    // Determine which move to actually use
    let actualMoveId = move_id;
    let struggleUsed = false;

    if (useStruggle) {
      actualMoveId = 'struggle';
      struggleUsed = true;
    }

    // Process battle turn
    const turnResult = processBattleTurn(playerPokemon, opponent, actualMoveId, 1);
    battle.turns.push(turnResult.turn);

    // Apply Struggle recoil if used
    let struggleRecoil = 0;
    if (struggleUsed) {
      struggleRecoil = applyStruggleRecoil(playerPokemon);
    }

    // T039: Deduct PP for the move used (not for Struggle)
    if (!struggleUsed && movePP[move_id] !== undefined) {
      movePP[move_id] = Math.max(0, movePP[move_id] - 1);
    }

    // Determine final outcome
    let outcome = turnResult.outcome;
    if (playerPokemon.current_hp <= 0 && outcome !== 'defeat') {
      outcome = 'defeat';
    }

    // Prepare rewards (only on victory)
    let rewards = null;
    let newExperience = playerPokemonRecord.experience || 0;
    let pendingLevelup = playerPokemonRecord.pending_levelup || false;

    // Fetch current user for currency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('currency')
      .eq('id', userId)
      .single();

    let currentCurrency = user?.currency || 0;

    if (outcome === 'victory') {
      // T023-T031: Award experience and currency
      const xpGained = calculateXpAward(opponent.level, opponent.sr);
      const currencyGained = calculateCurrencyAward(opponent.level);

      newExperience += xpGained;
      currentCurrency += currencyGained;

      // Check for level up
      if (checkLevelUp(playerPokemonRecord.experience || 0, newExperience, playerPokemonRecord.level)) {
        pendingLevelup = true;
      }

      rewards = {
        experience_gained: xpGained,
        total_experience: newExperience,
        currency_gained: currencyGained,
        total_currency: currentCurrency,
        level_up_pending: pendingLevelup
      };

      // Update user currency
      await supabase
        .from('users')
        .update({ currency: currentCurrency })
        .eq('id', userId);
    }

    // T020: Update player Pokemon in database
    const updateData = {
      current_hp: Math.max(0, playerPokemon.current_hp),
      move_pp: movePP,
      selected_moves: selectedMoves,
      experience: newExperience,
      pending_levelup: pendingLevelup
    };

    await supabase
      .from('player_pokemon')
      .update(updateData)
      .eq('id', player_pokemon_id);

    // T021: Build response
    const response = {
      battle_id: battle.battle_id,
      outcome: outcome,
      turns: battle.turns,
      final_state: {
        player_pokemon: {
          id: playerPokemon.id,
          pokemon_id: playerPokemon.pokemon_id,
          name: playerPokemon.name,
          level: playerPokemon.level,
          current_hp: Math.max(0, playerPokemon.current_hp),
          max_hp: playerPokemon.max_hp,
          is_fainted: playerPokemon.current_hp <= 0,
          pp_remaining: movePP
        },
        opponent: {
          pokemon_id: opponent.pokemon_id,
          name: opponent.name,
          level: opponent.level,
          current_hp: Math.max(0, opponent.current_hp),
          max_hp: opponent.max_hp,
          is_fainted: opponent.current_hp <= 0
        }
      }
    };

    // Add rewards only on victory
    if (rewards) {
      response.rewards = rewards;
    }

    // Add struggle info if applicable
    if (struggleUsed) {
      response.struggle_used = true;
      response.struggle_recoil = struggleRecoil;
    }

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle API error:', error);
    return sendInternalError(res, 'An error occurred during battle processing');
  }
}
