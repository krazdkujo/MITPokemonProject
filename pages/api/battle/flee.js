/**
 * Battle Flee API Endpoint
 *
 * POST /api/battle/flee - Attempt to flee from battle
 *
 * Success chance based on relative speed (DEX) of player vs fastest opponent.
 * Only available during player's turn in wild battles.
 *
 * Feature: 015-combat-arena
 */

import { authenticateRequest } from '../../../lib/authHelper';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorizedError,
  sendMethodNotAllowed,
  sendInternalError
} from '../../../lib/apiResponse';
import { rollD20 } from '../../../lib/diceRoller';
import { getAttributeModifier } from '../../../lib/combatUtils';

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
      battle_state,
      actor_id
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

    if (!actor_id) {
      return sendValidationError(res, 'Missing required field', {
        actor_id: 'actor_id is required'
      });
    }

    // Check battle type - cannot flee trainer battles
    const battleType = battle_state.battle_type;
    if (battleType === 'trainer' || battleType === 'gym') {
      return sendError(
        res,
        'CANNOT_FLEE',
        'Cannot flee from trainer battles',
        422,
        { battle_type: battleType, hint: 'Defeat or be defeated - there is no escape!' }
      );
    }

    // Check if battle already ended
    if (battle_state.phase === 'ended' || battle_state.outcome !== 'ongoing') {
      return sendError(
        res,
        'BATTLE_ENDED',
        'This battle has already concluded',
        422,
        { outcome: battle_state.outcome }
      );
    }

    // Find the actor combatant
    const playerPokemon = battle_state.combatants?.player || battle_state.player_pokemon || [];
    const opponentPokemon = battle_state.combatants?.opponent || battle_state.opponent_pokemon || [];
    const allCombatants = [...playerPokemon, ...opponentPokemon];

    const actor = allCombatants.find(c => c.combatant_id === actor_id);

    if (!actor) {
      return sendValidationError(res, 'Invalid actor', {
        actor_id: 'Combatant not found'
      });
    }

    // Verify actor is a player Pokemon
    if (actor.owner !== 'player') {
      return sendError(
        res,
        'INVALID_ACTOR',
        'Only player Pokemon can attempt to flee',
        422
      );
    }

    // Verify it's the player's turn
    const currentTurnIndex = battle_state.current_turn_index || 0;
    const initiativeOrder = battle_state.initiative_order || [];
    const currentTurnId = initiativeOrder[currentTurnIndex];

    if (currentTurnId !== actor_id) {
      return sendError(
        res,
        'NOT_YOUR_TURN',
        'Cannot flee - it is not your turn',
        403
      );
    }

    // Calculate flee check
    // Flee Roll = d20 + Player DEX Modifier
    // Flee Threshold = 10 + Opponent DEX Modifier (highest among active opponents)
    const playerDex = actor.attributes?.dex || 10;
    const playerDexMod = getAttributeModifier(playerDex);

    // Find highest opponent DEX
    const activeOpponents = opponentPokemon.filter(p => p.current_hp > 0);
    let highestOpponentDexMod = 0;
    for (const opp of activeOpponents) {
      const oppDex = opp.attributes?.dex || 10;
      const oppDexMod = getAttributeModifier(oppDex);
      if (oppDexMod > highestOpponentDexMod) {
        highestOpponentDexMod = oppDexMod;
      }
    }

    const fleeRoll = rollD20();
    const fleeTotal = fleeRoll + playerDexMod;
    const fleeThreshold = 10 + highestOpponentDexMod;

    // Natural 20 always succeeds, natural 1 always fails
    let fled = false;
    if (fleeRoll === 20) {
      fled = true;
    } else if (fleeRoll === 1) {
      fled = false;
    } else {
      fled = fleeTotal >= fleeThreshold;
    }

    // Build response
    if (fled) {
      return sendSuccess(res, {
        fled: true,
        battle_id,
        flee_details: {
          roll: fleeRoll,
          threshold: fleeThreshold,
          player_speed_mod: playerDexMod,
          opponent_speed_mod: highestOpponentDexMod
        },
        message: 'Got away safely!',
        battle_continues: false,
        outcome: 'fled'
      });
    } else {
      // Flee failed - turn is consumed
      // Find next combatant
      let nextTurnIndex = currentTurnIndex;
      let nextTurn = null;
      let attempts = 0;

      do {
        nextTurnIndex = (nextTurnIndex + 1) % initiativeOrder.length;
        const nextId = initiativeOrder[nextTurnIndex];
        const nextCombatant = allCombatants.find(c => c.combatant_id === nextId);
        if (nextCombatant && nextCombatant.current_hp > 0) {
          nextTurn = {
            combatant_id: nextCombatant.combatant_id,
            name: nextCombatant.name,
            owner: nextCombatant.owner
          };
          break;
        }
        attempts++;
      } while (attempts < initiativeOrder.length);

      return sendSuccess(res, {
        fled: false,
        battle_id,
        flee_details: {
          roll: fleeRoll,
          threshold: fleeThreshold,
          player_speed_mod: playerDexMod,
          opponent_speed_mod: highestOpponentDexMod
        },
        message: "Can't escape!",
        battle_continues: true,
        outcome: 'ongoing',
        turn_consumed: true,
        next_turn: nextTurn,
        next_turn_index: nextTurnIndex
      });
    }

  } catch (error) {
    console.error('Battle Flee API error:', error);
    return sendInternalError(res, 'An error occurred during flee attempt');
  }
}
