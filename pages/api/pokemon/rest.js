/**
 * POST /api/pokemon/rest
 * Rest Pokemon to restore HP and PP
 * T041-T044: Implements short rest and long rest mechanics per Pokemon 5e rules
 *
 * Feature: 017-5e-combat-research
 */

import { createClient } from '@supabase/supabase-js';
import { getAuthToken, getAuthUser } from '../../../lib/authHelper.js';
import { successResponse, errorResponse } from '../../../lib/apiResponse.js';
import { restoreAllPP, initializePP } from '../../../lib/ppTracker.js';
import { getBondPoints } from '../../../lib/bondSystem.js';
import { rollDice } from '../../../lib/diceRoller.js';
import { getPokemonById, getMoveIdsForPokemonAtLevel } from '../../../lib/pokemonData.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * T041: Process short rest for a Pokemon
 * - HP restoration via hit dice only (no auto HP)
 * - NO PP restoration on short rest
 *
 * @param {Object} pokemon - Pokemon database record
 * @param {number} hitDiceToSpend - Number of hit dice to spend
 * @returns {Object} Rest result
 */
function processShortRest(pokemon, hitDiceToSpend = 0) {
  const sourcePokemon = getPokemonById(pokemon.pokemon_id);
  if (!sourcePokemon) {
    return { success: false, error: 'Pokemon not found' };
  }

  let hpRestored = 0;
  const hitDiceUsed = Math.min(hitDiceToSpend, pokemon.hit_dice_remaining || pokemon.level);

  // Roll hit dice for HP recovery (using CON modifier)
  if (hitDiceUsed > 0) {
    const hitDie = sourcePokemon.hitDie || 'd8'; // Default to d8
    const conMod = Math.floor(((sourcePokemon.attributes?.con || 10) - 10) / 2);

    for (let i = 0; i < hitDiceUsed; i++) {
      const roll = rollDice(`1${hitDie}`);
      hpRestored += Math.max(1, roll + conMod); // Minimum 1 HP per die
    }
  }

  const hpBefore = pokemon.current_hp;
  const newHp = Math.min(pokemon.max_hp, pokemon.current_hp + hpRestored);
  const hitDiceRemaining = (pokemon.hit_dice_remaining || pokemon.level) - hitDiceUsed;

  return {
    success: true,
    rest_type: 'short',
    hp_before: hpBefore,
    hp_after: newHp,
    hp_restored: newHp - hpBefore,
    hit_dice_used: hitDiceUsed,
    hit_dice_remaining: hitDiceRemaining,
    pp_restored: false // T043: No PP restoration on short rest
  };
}

/**
 * T042/T044: Process long rest for a Pokemon
 * - Full HP restoration
 * - Full PP restoration
 * - Clear all status effects
 * - Restore Bond Points
 *
 * @param {Object} pokemon - Pokemon database record
 * @returns {Object} Rest result
 */
function processLongRest(pokemon) {
  const sourcePokemon = getPokemonById(pokemon.pokemon_id);
  if (!sourcePokemon) {
    return { success: false, error: 'Pokemon not found' };
  }

  const hpBefore = pokemon.current_hp;
  const newHp = pokemon.max_hp;

  // Get all known moves for full PP restoration
  const knownMoveIds = getMoveIdsForPokemonAtLevel(pokemon.pokemon_id, pokemon.level);
  const fullPP = initializePP(knownMoveIds);

  // Restore bond points based on bond level
  const bondLevel = pokemon.bond_level || 0;
  const bondPoints = getBondPoints(bondLevel);

  // Restore half of max hit dice (minimum 1)
  const maxHitDice = pokemon.level;
  const hitDiceRestored = Math.max(1, Math.floor(maxHitDice / 2));
  const hitDiceRemaining = Math.min(maxHitDice, (pokemon.hit_dice_remaining || 0) + hitDiceRestored);

  return {
    success: true,
    rest_type: 'long',
    hp_before: hpBefore,
    hp_after: newHp,
    hp_restored: newHp - hpBefore,
    pp_restored: true,
    new_pp: fullPP,
    statuses_cleared: true,
    bond_points_restored: bondPoints,
    hit_dice_restored: hitDiceRestored,
    hit_dice_remaining: hitDiceRemaining
  };
}

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

    const { rest_type, pokemon_ids, hit_dice_to_spend } = req.body;

    // Validate rest type
    if (!rest_type || !['short', 'long'].includes(rest_type)) {
      return res.status(400).json(errorResponse('rest_type must be "short" or "long"', 'INVALID_REST_TYPE'));
    }

    // Get Pokemon to rest (all party Pokemon if not specified)
    let pokemonQuery = supabase
      .from('player_pokemon')
      .select('*')
      .eq('user_id', user.id);

    if (pokemon_ids && pokemon_ids.length > 0) {
      pokemonQuery = pokemonQuery.in('id', pokemon_ids);
    }

    const { data: pokemonRecords, error: fetchError } = await pokemonQuery;

    if (fetchError) {
      console.error('Error fetching Pokemon:', fetchError);
      return res.status(500).json(errorResponse('Failed to fetch Pokemon', 'FETCH_ERROR'));
    }

    if (!pokemonRecords || pokemonRecords.length === 0) {
      return res.status(404).json(errorResponse('No Pokemon found', 'NOT_FOUND'));
    }

    const results = [];
    const updates = [];

    for (const pokemon of pokemonRecords) {
      let restResult;

      if (rest_type === 'short') {
        const hitDice = hit_dice_to_spend?.[pokemon.id] || 0;
        restResult = processShortRest(pokemon, hitDice);

        if (restResult.success) {
          updates.push({
            id: pokemon.id,
            current_hp: restResult.hp_after,
            hit_dice_remaining: restResult.hit_dice_remaining
          });
        }
      } else {
        restResult = processLongRest(pokemon);

        if (restResult.success) {
          updates.push({
            id: pokemon.id,
            current_hp: restResult.hp_after,
            move_pp: restResult.new_pp,
            hit_dice_remaining: restResult.hit_dice_remaining
            // Note: status effects are cleared in battle state, not DB
          });
        }
      }

      results.push({
        pokemon_id: pokemon.id,
        pokemon_name: getPokemonById(pokemon.pokemon_id)?.name || 'Unknown',
        ...restResult
      });
    }

    // Apply database updates
    for (const update of updates) {
      const { id, ...updateData } = update;
      const { error: updateError } = await supabase
        .from('player_pokemon')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating Pokemon:', updateError);
      }
    }

    return res.status(200).json(successResponse({
      rest_type,
      pokemon_rested: results.length,
      results
    }));

  } catch (error) {
    console.error('Rest error:', error);
    return res.status(500).json(errorResponse('Internal server error', 'INTERNAL_ERROR'));
  }
}
