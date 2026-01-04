/**
 * Battle Action API Endpoint
 *
 * POST /api/battle/action - Execute a battle action (attack, move, or item)
 *
 * Validates the action against battle rules and returns updated battle state.
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
import { getMoveById } from '../../../lib/pokemonData';
import { processPlayerTurn, processOpponentTurn, calculateAttackRoll, calculateDamage } from '../../../lib/battleEngine';
import { getManhattanDistance, toGridNotation, isValidPosition } from '../../../lib/gridUtils';
import { processEndOfTurnStatus, processStartOfTurnStatus } from '../../../lib/statusEffects';
import { calculateBattleRewards } from '../../../lib/experienceUtils';

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
      action_type,
      actor_id,
      move_id,
      target_id,
      target_position,
      item_id
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

    if (!action_type) {
      return sendValidationError(res, 'Missing required field', {
        action_type: 'action_type is required'
      });
    }

    const validActionTypes = ['attack', 'move', 'item'];
    if (!validActionTypes.includes(action_type)) {
      return sendValidationError(res, 'Invalid action type', {
        action_type: `action_type must be one of: ${validActionTypes.join(', ')}`
      });
    }

    if (!actor_id) {
      return sendValidationError(res, 'Missing required field', {
        actor_id: 'actor_id is required'
      });
    }

    // Find the actor combatant
    const allCombatants = [
      ...(battle_state.combatants?.player || battle_state.player_pokemon || []),
      ...(battle_state.combatants?.opponent || battle_state.opponent_pokemon || [])
    ];
    const actor = allCombatants.find(c => c.combatant_id === actor_id);

    if (!actor) {
      return sendValidationError(res, 'Invalid actor', {
        actor_id: 'Combatant not found'
      });
    }

    // Check if actor is fainted
    if (actor.current_hp <= 0) {
      return sendError(
        res,
        'POKEMON_FAINTED',
        'This Pokemon has fainted and cannot act',
        422,
        { hint: 'Select a different Pokemon or end the battle' }
      );
    }

    // Verify it's the actor's turn
    const currentTurnIndex = battle_state.current_turn_index || 0;
    const initiativeOrder = battle_state.initiative_order || [];
    const currentTurnId = initiativeOrder[currentTurnIndex];

    if (currentTurnId !== actor_id && actor.owner === 'player') {
      return sendError(
        res,
        'NOT_YOUR_TURN',
        'It is not this combatant\'s turn to act',
        403
      );
    }

    let actionResult = null;
    let updatedState = { ...battle_state };

    // Process action based on type
    if (action_type === 'attack') {
      // Validate attack-specific fields
      if (!move_id) {
        return sendValidationError(res, 'Missing required field', {
          move_id: 'move_id is required for attack actions'
        });
      }

      if (!target_id) {
        return sendValidationError(res, 'Missing required field', {
          target_id: 'target_id is required for attack actions'
        });
      }

      // Validate move exists
      const move = getMoveById(move_id);
      if (!move) {
        return sendError(
          res,
          'MOVE_NOT_FOUND',
          'Move not found',
          422,
          { move_id }
        );
      }

      // Check PP
      const movePp = actor.move_pp?.[move_id] ?? 0;
      if (movePp <= 0) {
        return sendError(
          res,
          'NO_PP_REMAINING',
          'This move has no PP remaining',
          422,
          { move_id, pp_remaining: 0 }
        );
      }

      // Find target
      const target = allCombatants.find(c => c.combatant_id === target_id);
      if (!target) {
        return sendValidationError(res, 'Invalid target', {
          target_id: 'Target combatant not found'
        });
      }

      if (target.current_hp <= 0) {
        return sendValidationError(res, 'Invalid target', {
          target_id: 'Target has already fainted'
        });
      }

      // Execute attack
      const attackRoll = calculateAttackRoll(actor, move);
      const hit = attackRoll.isMiss ? false :
                  attackRoll.isCrit ? true :
                  attackRoll.total >= target.ac;

      let damage = 0;
      let damageResult = null;

      if (hit) {
        damageResult = calculateDamage(actor, target, move, attackRoll);
        damage = damageResult.totalDamage;
      }

      const hpBefore = target.current_hp;
      const hpAfter = Math.max(0, hpBefore - damage);
      const fainted = hpAfter <= 0;

      // Update target HP in state
      const targetOwner = target.owner === 'player' ? 'player' : 'opponent';
      const targetList = updatedState.combatants?.[targetOwner] ||
                        (targetOwner === 'player' ? updatedState.player_pokemon : updatedState.opponent_pokemon);
      const targetIndex = targetList.findIndex(c => c.combatant_id === target_id);
      if (targetIndex !== -1) {
        targetList[targetIndex] = {
          ...targetList[targetIndex],
          current_hp: hpAfter,
          is_fainted: fainted
        };
      }

      // Reduce PP
      const actorOwner = actor.owner === 'player' ? 'player' : 'opponent';
      const actorList = updatedState.combatants?.[actorOwner] ||
                       (actorOwner === 'player' ? updatedState.player_pokemon : updatedState.opponent_pokemon);
      const actorIndex = actorList.findIndex(c => c.combatant_id === actor_id);
      if (actorIndex !== -1) {
        actorList[actorIndex] = {
          ...actorList[actorIndex],
          move_pp: {
            ...actorList[actorIndex].move_pp,
            [move_id]: movePp - 1
          }
        };
      }

      actionResult = {
        action_type: 'attack',
        actor: {
          combatant_id: actor.combatant_id,
          name: actor.name,
          current_hp: actor.current_hp,
          max_hp: actor.max_hp
        },
        target: {
          combatant_id: target.combatant_id,
          name: target.name,
          hp_before: hpBefore,
          hp_after: hpAfter,
          fainted
        },
        attack_result: {
          move_id,
          move_name: move.name,
          attack_roll: {
            natural_roll: attackRoll.natural_roll,
            modifier: attackRoll.modifier,
            total: attackRoll.total,
            crit_threshold: attackRoll.crit_threshold
          },
          target_ac: target.ac,
          hit,
          damage: hit ? {
            dice_expression: damageResult?.diceExpression,
            base_dice_total: damageResult?.baseDamage,
            power_modifier: damageResult?.totalDamage - damageResult?.baseDamage,
            stab_bonus: damageResult?.stabApplied ? 2 : 0,
            type_multiplier: damageResult?.effectiveness?.multiplier || 1,
            type_effectiveness: damageResult?.effectiveness?.effectiveness || 'normal',
            is_critical: damageResult?.is_critical || false,
            final_damage: damage
          } : null,
          pp_consumed: 1,
          pp_remaining: movePp - 1
        },
        status_applied: null
      };

    } else if (action_type === 'move') {
      // Validate move-specific fields
      if (!target_position) {
        return sendValidationError(res, 'Missing required field', {
          target_position: 'target_position is required for move actions'
        });
      }

      const { col, row } = target_position;

      if (!isValidPosition(col, row)) {
        return sendError(
          res,
          'INVALID_MOVEMENT',
          'Invalid target position',
          422,
          { target_position }
        );
      }

      // Check if already moved this turn
      if (actor.has_moved_this_turn) {
        return sendError(
          res,
          'ALREADY_MOVED',
          'This Pokemon has already moved this turn',
          422
        );
      }

      // Calculate distance
      const currentPos = actor.position;
      if (!currentPos) {
        return sendError(
          res,
          'NO_POSITION',
          'Pokemon does not have a current position',
          422
        );
      }

      const distance = getManhattanDistance(currentPos, { col, row });
      const maxDistance = 6;

      if (distance > maxDistance) {
        return sendError(
          res,
          'OUT_OF_RANGE',
          'Target position is out of movement range',
          422,
          { max_distance: maxDistance, actual_distance: distance }
        );
      }

      // Check if position is occupied
      const isOccupied = allCombatants.some(c =>
        c.position &&
        c.position.col === col &&
        c.position.row === row &&
        c.current_hp > 0
      );

      if (isOccupied) {
        return sendError(
          res,
          'INVALID_MOVEMENT',
          'Cannot move to this position',
          422,
          { reason: 'Position is occupied', target_position }
        );
      }

      // Update actor position
      const actorOwner = actor.owner === 'player' ? 'player' : 'opponent';
      const actorList = updatedState.combatants?.[actorOwner] ||
                       (actorOwner === 'player' ? updatedState.player_pokemon : updatedState.opponent_pokemon);
      const actorIndex = actorList.findIndex(c => c.combatant_id === actor_id);
      if (actorIndex !== -1) {
        actorList[actorIndex] = {
          ...actorList[actorIndex],
          position: { col, row },
          has_moved_this_turn: true
        };
      }

      actionResult = {
        action_type: 'move',
        actor: {
          combatant_id: actor.combatant_id,
          name: actor.name
        },
        movement: {
          from: { ...currentPos, notation: toGridNotation(currentPos.col, currentPos.row) },
          to: { col, row, notation: toGridNotation(col, row) },
          distance
        }
      };

    } else if (action_type === 'item') {
      // Item usage - placeholder for future implementation
      return sendError(
        res,
        'NOT_IMPLEMENTED',
        'Item usage is not yet implemented',
        501
      );
    }

    // Check for battle end conditions
    const playerPokemon = updatedState.combatants?.player || updatedState.player_pokemon || [];
    const opponentPokemon = updatedState.combatants?.opponent || updatedState.opponent_pokemon || [];

    const allPlayerFainted = playerPokemon.every(p => p.current_hp <= 0);
    const allOpponentFainted = opponentPokemon.every(p => p.current_hp <= 0);

    let battleContinues = true;
    let outcome = 'ongoing';
    let rewards = null;

    if (allOpponentFainted) {
      battleContinues = false;
      outcome = 'victory';
      // Calculate rewards
      const opponentForRewards = opponentPokemon[0];
      if (opponentForRewards) {
        rewards = calculateBattleRewards(
          { level: opponentForRewards.level, sr: opponentForRewards.sr || 0.5 },
          false,
          playerPokemon.filter(p => p.current_hp > 0).map(p => p.combatant_id)
        );
      }
    } else if (allPlayerFainted) {
      battleContinues = false;
      outcome = 'defeat';
    }

    // Advance turn
    let nextTurnIndex = currentTurnIndex;
    let nextTurn = null;

    if (battleContinues) {
      // Find next non-fainted combatant
      const allActive = allCombatants.filter(c => c.current_hp > 0);
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

      updatedState.current_turn_index = nextTurnIndex;
    }

    // Build response
    const response = {
      ...actionResult,
      updated_state: {
        combatants: updatedState.combatants || {
          player: updatedState.player_pokemon,
          opponent: updatedState.opponent_pokemon
        },
        current_turn_index: nextTurnIndex,
        round_number: updatedState.round_number || 1,
        initiative_order: initiativeOrder
      },
      battle_continues: battleContinues,
      outcome,
      next_turn: nextTurn
    };

    if (rewards) {
      response.rewards = {
        xp_awarded: rewards.xp_awarded,
        currency_awarded: rewards.currency_awarded
      };
    }

    return sendSuccess(res, response);

  } catch (error) {
    console.error('Battle Action API error:', error);
    return sendInternalError(res, 'An error occurred while processing the battle action');
  }
}
