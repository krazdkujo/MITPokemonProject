/**
 * Battle Catch API Endpoint
 *
 * POST /api/battle/catch - Attempt to catch a wild Pokemon
 *
 * Processes a catch attempt and awards reduced XP on success.
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
import { getPokemonById } from '../../../lib/pokemonData';
import { calculateBattleRewards } from '../../../lib/experienceUtils';
import { rollD20 } from '../../../lib/diceRoller';

// Pokeball catch rate modifiers
const POKEBALL_MODIFIERS = {
  pokeball: 1,
  greatball: 1.5,
  ultraball: 2,
  masterball: 255 // Auto-catch
};

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
      battle_id,
      pokeball_type = 'pokeball',
      battle_state,
      player_pokemon_id
    } = req.body;

    if (!battle_id) {
      return sendValidationError(res, 'Missing required field', {
        battle_id: 'battle_id is required'
      });
    }

    if (!battle_state || !battle_state.opponent) {
      return sendValidationError(res, 'Missing required field', {
        battle_state: 'battle_state with opponent data is required'
      });
    }

    // Validate pokeball type
    if (!POKEBALL_MODIFIERS[pokeball_type]) {
      return sendValidationError(res, 'Invalid pokeball type', {
        pokeball_type: `Must be one of: ${Object.keys(POKEBALL_MODIFIERS).join(', ')}`
      });
    }

    const supabase = createAdminClient();

    // Get opponent data
    const opponent = battle_state.opponent;
    const opponentSource = getPokemonById(opponent.pokemon_id);
    if (!opponentSource) {
      return sendValidationError(res, 'Invalid opponent Pokemon', {
        opponent_pokemon_id: 'Pokemon not found in Source data'
      });
    }

    // Calculate catch rate
    // Simplified formula: Higher HP = harder to catch
    // Base catch rate = (3 * max_hp - 2 * current_hp) / (3 * max_hp) * catch_rate * ball_modifier
    const maxHp = opponent.max_hp || opponentSource.hp || 20;
    const currentHp = opponent.current_hp || maxHp;
    const baseCatchRate = opponentSource.catchRate || 45; // Default catch rate

    const hpFactor = (3 * maxHp - 2 * currentHp) / (3 * maxHp);
    const ballModifier = POKEBALL_MODIFIERS[pokeball_type];

    let caught = false;
    let catchRoll = null;
    let catchThreshold = null;

    if (ballModifier === 255) {
      // Master Ball always catches
      caught = true;
    } else {
      // Roll d20 against modified catch rate
      catchRoll = rollD20();
      catchThreshold = Math.floor(10 + (10 - baseCatchRate / 25.5) - (hpFactor * 5) - (ballModifier * 2));
      catchThreshold = Math.max(2, Math.min(19, catchThreshold)); // Clamp between 2-19

      caught = catchRoll >= catchThreshold;
    }

    if (caught) {
      // Calculate catch rewards (1/5 XP)
      const rewards = calculateBattleRewards(
        { level: opponent.level, sr: opponentSource.sr || 0.5 },
        true, // wasCaught = true
        player_pokemon_id ? [player_pokemon_id] : []
      );

      // Update player's experience if player_pokemon_id provided
      if (player_pokemon_id) {
        const { data: playerPokemon, error: pokemonError } = await supabase
          .from('player_pokemon')
          .select('experience, user_id')
          .eq('id', player_pokemon_id)
          .single();

        if (!pokemonError && playerPokemon && playerPokemon.user_id === userId) {
          const newExperience = (playerPokemon.experience || 0) + rewards.xp_awarded;
          await supabase
            .from('player_pokemon')
            .update({ experience: newExperience })
            .eq('id', player_pokemon_id);
        }
      }

      return sendSuccess(res, {
        caught: true,
        battle_id: battle_id,
        outcome: 'caught',
        pokemon_caught: {
          pokemon_id: opponent.pokemon_id,
          name: opponentSource.name,
          level: opponent.level
        },
        catch_details: {
          pokeball_used: pokeball_type,
          roll: catchRoll,
          threshold: catchThreshold
        },
        rewards: {
          xp_awarded: rewards.xp_awarded,
          xp_is_catch_bonus: true
        }
      });
    } else {
      // Catch failed
      return sendSuccess(res, {
        caught: false,
        battle_id: battle_id,
        outcome: 'escaped',
        catch_details: {
          pokeball_used: pokeball_type,
          roll: catchRoll,
          threshold: catchThreshold
        },
        message: `${opponentSource.name} broke free!`
      });
    }

  } catch (error) {
    console.error('Battle Catch API error:', error);
    return sendInternalError(res, 'An error occurred during catch attempt');
  }
}
