/**
 * Battle API Endpoint
 *
 * POST /api/battle - Execute a battle turn
 *
 * Processes a battle between the player's Pokemon and a wild opponent.
 * Calculates damage using Pokemon 5e rules, updates HP/PP in database,
 * and returns detailed battle log for N8N workflow parsing.
 *
 * Feature: 006-battle-api, 007-combat-engine
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
  processPlayerTurn,
  processOpponentTurn,
  createBattle,
  buildCombatant,
  buildOpponentCombatant
} from '../../lib/battleEngine';
import { generateWildPokemon } from '../../lib/opponentGenerator';
import { calculateXpAward, calculateCurrencyAward, checkLevelUp } from '../../lib/experienceUtils';
import { canUseMove, consumePP, mustUseStruggle, getStruggleMove, applyStruggleRecoil } from '../../lib/ppTracker';

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

    // Validate request body
    const { player_pokemon_id, move_id, power_stat_choice, battle_state, opponent_pokemon_id, opponent_level } = req.body;

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

    // Validate battle_state if provided
    if (battle_state) {
      if (!battle_state.battle_id) {
        return sendValidationError(res, 'Invalid battle state', {
          battle_state: 'battle_id is required in battle_state'
        });
      }
      if (!battle_state.opponent) {
        return sendValidationError(res, 'Invalid battle state', {
          battle_state: 'opponent is required in battle_state'
        });
      }
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

    // Load opponent from battle_state or generate new one
    let opponent;
    let battleId;
    let roundNumber = 1;
    let initiativeOrder = ['player', 'opponent']; // Default order

    if (battle_state) {
      // Use existing battle state
      battleId = battle_state.battle_id;
      roundNumber = battle_state.round_number || 1;
      initiativeOrder = battle_state.initiative_order || ['player', 'opponent'];

      // Rebuild opponent from battle_state
      const opponentState = battle_state.opponent;
      try {
        opponent = buildOpponentCombatant(opponentState.pokemon_id, opponentState.level);
        // Apply current state from battle_state
        opponent.current_hp = opponentState.current_hp;
        opponent.move_pp = opponentState.move_pp || opponent.move_pp;
        opponent.status_effects = opponentState.status_effects || [];
      } catch (buildError) {
        return sendInternalError(res, 'Failed to rebuild opponent: ' + buildError.message);
      }
    } else {
      // Generate new opponent (legacy mode or initial battle)
      try {
        opponent = generateWildPokemon(
          playerPokemonRecord.level,
          opponent_pokemon_id,
          opponent_level
        );
      } catch (opponentError) {
        return sendInternalError(res, 'Failed to generate opponent: ' + opponentError.message);
      }
      battleId = uuidv4();
    }

    // Create battle instance for tracking
    const battle = {
      battle_id: battleId,
      player_pokemon: playerPokemon,
      opponent: opponent,
      turns: [],
      outcome: 'ongoing',
      started_at: new Date().toISOString()
    };

    // Determine which move to actually use
    let actualMoveId = move_id;
    let struggleUsed = false;

    if (useStruggle) {
      actualMoveId = 'struggle';
      struggleUsed = true;
    }

    // Process battle turn based on initiative order
    let turn = {
      turn_number: roundNumber,
      player_action: null,
      opponent_action: null,
      end_of_turn: {
        status_damage: [],
        status_changes: []
      }
    };

    let outcome = 'ongoing';
    let struggleRecoil = null;

    // Determine action order based on initiative
    const playerFirst = initiativeOrder[0] === 'player';

    if (playerFirst) {
      // Player attacks first
      turn.player_action = processPlayerTurn(playerPokemon, opponent, actualMoveId);

      // Apply Struggle recoil if used
      if (struggleUsed) {
        const recoilResult = applyStruggleRecoil(playerPokemon);
        struggleRecoil = recoilResult;
      }

      // Check if opponent is knocked out
      if (opponent.current_hp <= 0) {
        outcome = 'victory';
      } else {
        // Opponent attacks back
        turn.opponent_action = processOpponentTurn(opponent, playerPokemon);

        // Check if player is knocked out
        if (playerPokemon.current_hp <= 0) {
          outcome = 'defeat';
        }
      }
    } else {
      // Opponent attacks first
      turn.opponent_action = processOpponentTurn(opponent, playerPokemon);

      // Check if player is knocked out
      if (playerPokemon.current_hp <= 0) {
        outcome = 'defeat';
      } else {
        // Player attacks back
        turn.player_action = processPlayerTurn(playerPokemon, opponent, actualMoveId);

        // Apply Struggle recoil if used
        if (struggleUsed) {
          const recoilResult = applyStruggleRecoil(playerPokemon);
          struggleRecoil = recoilResult;

          // Check if recoil knocked out player
          if (playerPokemon.current_hp <= 0) {
            outcome = 'defeat';
          }
        }

        // Check if opponent is knocked out
        if (opponent.current_hp <= 0 && outcome !== 'defeat') {
          outcome = 'victory';
        }
      }
    }

    battle.turns.push(turn);

    // Deduct PP for the move used (not for Struggle)
    if (!struggleUsed && movePP[move_id] !== undefined) {
      movePP[move_id] = Math.max(0, movePP[move_id] - 1);
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

    // Build response per combat-api.md contract
    const response = {
      battle_id: battle.battle_id,
      turn: turn,
      battle_state: {
        battle_id: battle.battle_id,
        round_number: roundNumber,
        outcome: outcome,
        player_pokemon: {
          current_hp: Math.max(0, playerPokemon.current_hp),
          max_hp: playerPokemon.max_hp,
          move_pp: movePP,
          status_effects: playerPokemon.status_effects || []
        },
        opponent: {
          pokemon_id: opponent.pokemon_id,
          current_hp: Math.max(0, opponent.current_hp),
          max_hp: opponent.max_hp,
          level: opponent.level,
          move_pp: opponent.move_pp || {},
          status_effects: opponent.status_effects || []
        },
        initiative_order: initiativeOrder
      },
      outcome: outcome,
      battle_continues: outcome === 'ongoing'
    };

    // Add rewards only on victory
    if (rewards) {
      response.rewards = {
        xp_awarded: rewards.experience_gained,
        currency_awarded: rewards.currency_gained,
        xp_distributed_to: [playerPokemon.id]
      };
    }

    // Add defeat info if applicable
    if (outcome === 'defeat') {
      response.player_pokemon_fainted = true;
    }

    // Add struggle info if applicable
    if (struggleUsed && struggleRecoil) {
      response.struggle_used = true;
      response.struggle_recoil = struggleRecoil.recoilDamage;
    }

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle API error:', error);
    return sendInternalError(res, 'An error occurred during battle processing');
  }
}
