/**
 * Combat AI
 * Tactical decision-making for opponent Pokemon in grid-based combat
 *
 * Feature: 018-combat-enhancements
 */

import { getEffectiveness } from './typeEffectiveness.js';
import { parseRange, isInRange } from './moveRanges.js';

/**
 * AI scoring weights for tactical decision-making
 * Higher values = more preferred actions
 */
export const AI_WEIGHTS = {
  // Type matchups
  TYPE_ADVANTAGE_2X: 50,
  TYPE_ADVANTAGE_4X: 100,
  TYPE_DISADVANTAGE_HALF: -30,
  TYPE_DISADVANTAGE_QUARTER: -60,

  // Move properties
  MOVE_POWER_PER_10: 1,
  STATUS_ON_HEALTHY: 20,
  STATUS_ON_STATUSED: -50,
  LOW_PP_WARNING: -10,

  // Target selection
  TARGET_LOW_HP: 15,

  // Range considerations
  IN_RANGE: 100,
  OUT_OF_RANGE: -1000
};

/**
 * Calculate type effectiveness multiplier between move and target
 *
 * @param {string} moveType - Move's type
 * @param {string[]} targetTypes - Target's types
 * @returns {number} Effectiveness multiplier (0.25, 0.5, 1, 2, or 4)
 */
export function calculateTypeEffectiveness(moveType, targetTypes) {
  if (!moveType || !targetTypes || targetTypes.length === 0) {
    return 1;
  }

  const effectiveness = getEffectiveness(moveType, targetTypes);
  return effectiveness?.multiplier || 1;
}

/**
 * Score a move option against a specific target
 *
 * @param {Object} move - Move object with type, power, pp, range
 * @param {Object} actor - AI combatant using the move
 * @param {Object} target - Target combatant
 * @param {Object} battleState - Current battle state
 * @returns {{ score: number, reasoning: string[] }}
 */
export function scoreMoveOption(move, actor, target, battleState) {
  const reasoning = [];
  let score = 0;

  if (!move || !actor || !target) {
    return { score: -Infinity, reasoning: ['Invalid move/actor/target'] };
  }

  // Check PP availability
  const currentPp = actor.move_pp?.[move.id] ?? move.pp ?? 0;
  if (currentPp <= 0) {
    reasoning.push('No PP remaining');
    return { score: -Infinity, reasoning };
  }

  // Low PP warning
  if (currentPp <= 2) {
    score += AI_WEIGHTS.LOW_PP_WARNING;
    reasoning.push(`Low PP (${currentPp}) - conserving`);
  }

  // Range check
  const rangeData = parseRange(move.range);
  const inRange = isInRange(actor.position, target.position, rangeData.cells);

  if (!inRange) {
    score += AI_WEIGHTS.OUT_OF_RANGE;
    reasoning.push(`Out of range (need ${rangeData.cells}, too far)`);
  } else {
    score += AI_WEIGHTS.IN_RANGE;
    reasoning.push('Target in range');
  }

  // Type effectiveness
  const effectiveness = calculateTypeEffectiveness(move.type, target.type);
  if (effectiveness >= 4) {
    score += AI_WEIGHTS.TYPE_ADVANTAGE_4X;
    reasoning.push('Super effective (4x)');
  } else if (effectiveness >= 2) {
    score += AI_WEIGHTS.TYPE_ADVANTAGE_2X;
    reasoning.push('Super effective (2x)');
  } else if (effectiveness <= 0.25) {
    score += AI_WEIGHTS.TYPE_DISADVANTAGE_QUARTER;
    reasoning.push('Not very effective (0.25x)');
  } else if (effectiveness <= 0.5) {
    score += AI_WEIGHTS.TYPE_DISADVANTAGE_HALF;
    reasoning.push('Not very effective (0.5x)');
  }

  // Target HP consideration
  const hpPercent = (target.current_hp / target.max_hp) * 100;
  if (hpPercent <= 25) {
    score += AI_WEIGHTS.TARGET_LOW_HP;
    reasoning.push('Target at low HP - finish it');
  }

  // Status move consideration
  const isStatusMove = move.power === 'none';
  if (isStatusMove) {
    const hasStatus = target.status_effects && target.status_effects.length > 0;
    if (hasStatus) {
      score += AI_WEIGHTS.STATUS_ON_STATUSED;
      reasoning.push('Target already has status - avoid stacking');
    } else {
      score += AI_WEIGHTS.STATUS_ON_HEALTHY;
      reasoning.push('Status move on healthy target');
    }
  }

  return { score, reasoning };
}

/**
 * Find the best target among available enemies
 *
 * @param {Object} actor - AI combatant
 * @param {Object[]} targets - Array of potential targets
 * @param {Object} battleState - Current battle state
 * @returns {{ target: Object|null, reasoning: string[] }}
 */
export function findBestTarget(actor, targets, battleState) {
  if (!targets || targets.length === 0) {
    return { target: null, reasoning: ['No targets available'] };
  }

  // Filter out fainted targets
  const validTargets = targets.filter(t => t.current_hp > 0 && !t.is_fainted);
  if (validTargets.length === 0) {
    return { target: null, reasoning: ['All targets fainted'] };
  }

  // For now, prefer lowest HP target that is in range of any move
  let bestTarget = null;
  let lowestHp = Infinity;
  const reasoning = [];

  for (const target of validTargets) {
    if (target.current_hp < lowestHp) {
      lowestHp = target.current_hp;
      bestTarget = target;
    }
  }

  if (bestTarget) {
    reasoning.push(`Selected ${bestTarget.name} (lowest HP: ${lowestHp})`);
  }

  return { target: bestTarget, reasoning };
}

/**
 * Calculate optimal movement destination to get in range of targets
 *
 * @param {Object} actor - AI combatant
 * @param {Object[]} targets - Array of potential targets
 * @param {Object} grid - Battle grid
 * @returns {{ destination: {col: number, row: number}|null, reasoning: string[] }}
 */
export function calculateOptimalMovement(actor, targets, grid) {
  if (!actor || !actor.position) {
    return { destination: null, reasoning: ['Actor has no position'] };
  }

  const validTargets = (targets || []).filter(t => t.current_hp > 0 && !t.is_fainted);
  if (validTargets.length === 0) {
    return { destination: null, reasoning: ['No valid targets to move toward'] };
  }

  const movementRemaining = actor.movement_remaining ?? 6;
  if (movementRemaining <= 0) {
    return { destination: null, reasoning: ['No movement remaining'] };
  }

  // Find closest target
  let closestTarget = null;
  let closestDistance = Infinity;

  for (const target of validTargets) {
    if (!target.position) continue;
    const distance = Math.abs(target.position.col - actor.position.col) +
                     Math.abs(target.position.row - actor.position.row);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTarget = target;
    }
  }

  if (!closestTarget) {
    return { destination: null, reasoning: ['No targets with valid positions'] };
  }

  // Already adjacent? No need to move
  if (closestDistance <= 1) {
    return { destination: null, reasoning: ['Already in melee range'] };
  }

  // Calculate direction to move
  const actorPos = actor.position;
  const targetPos = closestTarget.position;
  const reasoning = [`Moving toward ${closestTarget.name}`];

  // Simple pathfinding: move in the direction of the target
  let newCol = actorPos.col;
  let newRow = actorPos.row;
  let cellsMoved = 0;

  // Move horizontally first, then vertically
  while (cellsMoved < movementRemaining && (newCol !== targetPos.col || newRow !== targetPos.row)) {
    if (newCol < targetPos.col) {
      newCol++;
      cellsMoved++;
    } else if (newCol > targetPos.col) {
      newCol--;
      cellsMoved++;
    } else if (newRow < targetPos.row) {
      newRow++;
      cellsMoved++;
    } else if (newRow > targetPos.row) {
      newRow--;
      cellsMoved++;
    }

    // Don't move onto target's cell
    if (newCol === targetPos.col && newRow === targetPos.row) {
      // Step back one
      if (newRow !== actorPos.row) {
        newRow = newRow > actorPos.row ? newRow - 1 : newRow + 1;
      } else {
        newCol = newCol > actorPos.col ? newCol - 1 : newCol + 1;
      }
      break;
    }
  }

  // Check if we actually moved
  if (newCol === actorPos.col && newRow === actorPos.row) {
    return { destination: null, reasoning: ['Cannot find valid movement path'] };
  }

  reasoning.push(`Moving ${cellsMoved} cells to (${newCol}, ${newRow})`);

  return {
    destination: { col: newCol, row: newRow },
    reasoning
  };
}

/**
 * Execute a complete AI turn
 * Decides whether to move, attack, or pass based on tactical analysis
 *
 * @param {Object} combatant - AI-controlled combatant
 * @param {Object} battleState - Current battle state
 * @returns {{ action_type: string, move_id: string|null, target_id: string|null, destination: {col: number, row: number}|null, score: number, reasoning: string[] }}
 */
export function executeAITurn(combatant, battleState) {
  const reasoning = [];
  const result = {
    action_type: 'pass',
    move_id: null,
    target_id: null,
    destination: null,
    score: 0,
    reasoning
  };

  if (!combatant || !battleState) {
    reasoning.push('Invalid combatant or battle state');
    return result;
  }

  // Get available moves (with PP)
  const moves = combatant.known_moves || [];
  const availableMoves = moves.filter(m => {
    const pp = combatant.move_pp?.[m.id] ?? m.pp ?? 0;
    return pp > 0;
  });

  if (availableMoves.length === 0) {
    reasoning.push('No moves with PP available - must use Struggle');
    result.action_type = 'attack';
    result.move_id = 'struggle';
    return result;
  }

  // Get valid targets
  const playerCombatants = battleState.combatants?.player || [];
  const validTargets = playerCombatants.filter(t => t.current_hp > 0 && !t.is_fainted);

  if (validTargets.length === 0) {
    reasoning.push('No valid targets - passing turn');
    return result;
  }

  // Score all move+target combinations
  let bestScore = -Infinity;
  let bestMove = null;
  let bestTarget = null;
  let bestMoveReasoning = [];

  for (const move of availableMoves) {
    for (const target of validTargets) {
      const { score, reasoning: moveReasoning } = scoreMoveOption(move, combatant, target, battleState);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        bestTarget = target;
        bestMoveReasoning = moveReasoning;
      }
    }
  }

  // Check if best option is out of range - consider movement
  if (bestMove && bestTarget && bestScore < 0) {
    // Score is negative, likely out of range
    const movementResult = calculateOptimalMovement(combatant, validTargets, battleState.grid);

    if (movementResult.destination) {
      result.action_type = 'move';
      result.destination = movementResult.destination;
      result.reasoning.push(...movementResult.reasoning);
      result.reasoning.push('Moving to get in range before attacking');
      return result;
    }
  }

  // Execute best attack option
  if (bestMove && bestTarget) {
    result.action_type = 'attack';
    result.move_id = bestMove.id;
    result.target_id = bestTarget.combatant_id;
    result.score = bestScore;
    result.reasoning.push(`Selected ${bestMove.name} against ${bestTarget.name}`);
    result.reasoning.push(...bestMoveReasoning);
    return result;
  }

  reasoning.push('Could not find valid action - passing turn');
  return result;
}
