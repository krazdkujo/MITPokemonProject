/**
 * AI Turn API Endpoint
 *
 * POST /api/battle/ai-turn - Execute AI turn for opponent Pokemon
 *
 * Feature: 018-combat-enhancements (T054)
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
import { executeAITurn } from '../../../lib/combatAI';

// AI turn timeout in milliseconds (T056)
const AI_TURN_TIMEOUT = 2000;

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
    const { battle_id, battle_state, combatant_id } = req.body;

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

    if (!combatant_id) {
      return sendValidationError(res, 'Missing required field', {
        combatant_id: 'combatant_id is required'
      });
    }

    // Find the AI combatant
    const opponentCombatants = battle_state.combatants?.opponent || [];
    const combatant = opponentCombatants.find(c => c.combatant_id === combatant_id);

    if (!combatant) {
      return sendValidationError(res, 'Invalid combatant', {
        combatant_id: 'Combatant not found in opponent team'
      });
    }

    if (combatant.current_hp <= 0 || combatant.is_fainted) {
      return sendError(
        res,
        'POKEMON_FAINTED',
        'This Pokemon has fainted and cannot act',
        422
      );
    }

    // Execute AI turn with timeout (T056)
    const aiDecision = await Promise.race([
      Promise.resolve(executeAITurn(combatant, battle_state)),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI decision timeout')), AI_TURN_TIMEOUT)
      )
    ]);

    // Validate AI decision
    if (!aiDecision.action_type || aiDecision.action_type === 'pass') {
      // T057: AI cannot reach any target - return pass action
      return sendSuccess(res, {
        action_type: 'pass',
        reasoning: aiDecision.reasoning || ['AI decided to pass turn'],
        decision_time_ms: AI_TURN_TIMEOUT
      });
    }

    // Return the AI's decision
    const response = {
      action_type: aiDecision.action_type,
      actor_id: combatant_id,
      reasoning: aiDecision.reasoning,
      score: aiDecision.score
    };

    if (aiDecision.action_type === 'attack') {
      response.move_id = aiDecision.move_id;
      response.target_id = aiDecision.target_id;
    } else if (aiDecision.action_type === 'move') {
      response.target_position = aiDecision.destination;
    }

    return sendSuccess(res, response);

  } catch (error) {
    if (error.message === 'AI decision timeout') {
      // T056: Handle timeout - return pass action
      return sendSuccess(res, {
        action_type: 'pass',
        reasoning: ['AI decision timed out - passing turn'],
        decision_time_ms: AI_TURN_TIMEOUT
      });
    }

    console.error('AI Turn API error:', error);
    return sendInternalError(res, 'An error occurred while processing AI turn');
  }
}
