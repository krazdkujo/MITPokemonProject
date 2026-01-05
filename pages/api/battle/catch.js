/**
 * Battle Catch API Endpoint
 *
 * POST /api/battle/catch - Attempt to catch a wild Pokemon
 *
 * Processes a catch attempt using Pokemon 5e catching mechanics.
 * T073-T074: Full catch implementation
 *
 * Feature: 017-5e-combat-research
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
import {
  attemptCatch,
  calculateCatchDC,
  POKEBALL_MODIFIERS
} from '../../../lib/catchingMechanics';

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
      pokeball_type = 'poke-ball',
      battle_state,
      player_pokemon_id,
      trainer_animal_handling = 0
    } = req.body;

    if (!battle_id) {
      return sendValidationError(res, 'Missing required field', {
        battle_id: 'battle_id is required'
      });
    }

    if (!battle_state) {
      return sendValidationError(res, 'Missing required field', {
        battle_state: 'battle_state is required'
      });
    }

    // Get opponent/target from battle state
    const opponent = battle_state.opponent ||
                     (battle_state.combatants?.opponent || battle_state.opponent_pokemon || [])[0];

    if (!opponent) {
      return sendValidationError(res, 'No target Pokemon', {
        opponent: 'No opponent Pokemon found in battle state'
      });
    }

    // Validate pokeball type
    if (!POKEBALL_MODIFIERS[pokeball_type]) {
      return sendValidationError(res, 'Invalid pokeball type', {
        pokeball_type: `Must be one of: ${Object.keys(POKEBALL_MODIFIERS).join(', ')}`
      });
    }

    const supabase = createAdminClient();

    // Get opponent source data
    const opponentSource = getPokemonById(opponent.pokemon_id);
    if (!opponentSource) {
      return sendValidationError(res, 'Invalid opponent Pokemon', {
        opponent_pokemon_id: 'Pokemon not found in Source data'
      });
    }

    // Build target combatant object with all needed data
    const target = {
      ...opponent,
      sr: opponent.sr || opponentSource.sr || 0.5,
      level: opponent.level || opponentSource.min_level || 1,
      current_hp: opponent.current_hp,
      max_hp: opponent.max_hp || opponentSource.hp || 20,
      type: opponent.type || opponentSource.type || [],
      types: opponent.types || opponentSource.type || [],
      status_effects: opponent.status_effects || []
    };

    // Build catch context
    const catchContext = {
      turnNumber: battle_state.round_number || 1,
      isNight: battle_state.is_night || false,
      isCave: battle_state.is_cave || false,
      isUnderwater: battle_state.is_underwater || false,
      previouslyCaught: false, // Would need to check player's pokedex
      targetTypes: target.types
    };

    // Attempt the catch using 5e mechanics
    const catchResult = attemptCatch({
      target,
      pokeballId: pokeball_type,
      trainerAnimalHandling: trainer_animal_handling,
      context: catchContext
    });

    if (catchResult.success) {
      // Calculate catch rewards (1/5 XP per 5e rules)
      const rewards = calculateBattleRewards(
        { level: target.level, sr: target.sr },
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

      // Add caught Pokemon to player's collection
      const { data: caughtPokemon, error: insertError } = await supabase
        .from('player_pokemon')
        .insert({
          user_id: userId,
          pokemon_id: opponent.pokemon_id,
          level: target.level,
          nickname: null,
          current_hp: target.max_hp, // Full HP on catch (Heal Ball would already be at max)
          experience: 0,
          ability_id: opponent.ability_id || opponentSource.abilities?.[0],
          nature: opponent.nature || 'hardy',
          caught_at: new Date().toISOString(),
          caught_with: pokeball_type
        })
        .select()
        .single();

      return sendSuccess(res, {
        caught: true,
        battle_id: battle_id,
        outcome: 'caught',
        pokemon_caught: {
          pokemon_id: opponent.pokemon_id,
          name: opponentSource.name,
          level: target.level,
          player_pokemon_id: caughtPokemon?.id
        },
        catch_details: {
          pokeball_used: pokeball_type,
          pokeball_description: catchResult.dcBreakdown?.pokeballDescription,
          auto_success: catchResult.autoSuccess,
          roll: catchResult.roll,
          modifier: catchResult.modifier,
          total: catchResult.total,
          dc: catchResult.finalDC,
          had_advantage: catchResult.hasAdvantage,
          rolls: catchResult.rolls,
          dc_breakdown: {
            base_dc: catchResult.dcBreakdown?.baseDC,
            hp_modifier: catchResult.dcBreakdown?.hpModifier,
            status_modifier: catchResult.dcBreakdown?.statusModifier,
            pokeball_modifier: catchResult.dcBreakdown?.pokeballModifier,
            final_dc: catchResult.dcBreakdown?.finalDC
          }
        },
        rewards: {
          xp_awarded: rewards.xp_awarded,
          currency_awarded: rewards.currency_awarded,
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
          pokeball_description: catchResult.dcBreakdown?.pokeballDescription,
          roll: catchResult.roll,
          modifier: catchResult.modifier,
          total: catchResult.total,
          dc: catchResult.finalDC,
          had_advantage: catchResult.hasAdvantage,
          rolls: catchResult.rolls,
          dc_breakdown: {
            base_dc: catchResult.dcBreakdown?.baseDC,
            hp_modifier: catchResult.dcBreakdown?.hpModifier,
            status_modifier: catchResult.dcBreakdown?.statusModifier,
            pokeball_modifier: catchResult.dcBreakdown?.pokeballModifier,
            final_dc: catchResult.dcBreakdown?.finalDC
          }
        },
        message: `${opponentSource.name} broke free! (Rolled ${catchResult.total} vs DC ${catchResult.finalDC})`
      });
    }

  } catch (error) {
    console.error('Battle Catch API error:', error);
    return sendInternalError(res, 'An error occurred during catch attempt');
  }
}
