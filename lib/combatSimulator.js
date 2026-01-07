/**
 * Combat Simulator
 * Shared simulation logic for test harness (UI and CLI)
 *
 * Feature: 021-combat-test-harness
 */

import { v4 as uuidv4 } from 'uuid';
import { createSeededRandom } from './seededRandom.js';
import { createLogger } from './combatLogger.js';
import { getPokemonById, getMovesForPokemonAtLevel, getMoveById } from './pokemonData.js';
import { calculateOpponentHP } from './opponentGenerator.js';
import { initializePP } from './ppTracker.js';
import {
  getProficiencyBonus,
  getAttributeModifier,
  getBestPowerModifier,
  hasSTAB,
  isSaveMove,
  parseSaveType,
  calculateSaveDC,
  getAttributeKey
} from './combatUtils.js';
import {
  getManhattanDistance,
  toGridNotation,
  getValidMoveTargets,
  feetToCells
} from './gridUtils.js';
import { getEffectiveness } from './typeEffectiveness.js';
import { parseDamageDice, parseCriticalRange, isCriticalRoll } from './diceParser.js';
import {
  parseStatusTrigger,
  applyStatusEffect,
  processEndOfTurnStatus,
  processStartOfTurnStatus,
  hasBurnedDamagePenalty,
  applyBurnedDamagePenalty,
  getFlinchedEffects,
  setStatusApplierProficiency
} from './statusEffects.js';
import { hasBattleArmorAbility } from './pokemonData.js';

/**
 * Create a new combat simulation instance
 *
 * @param {Object} config - Simulation configuration
 * @param {Object} config.pokemon1 - First Pokemon config { id, level?, moves? }
 * @param {Object} config.pokemon2 - Second Pokemon config { id, level?, moves? }
 * @param {number} config.seed - Optional RNG seed
 * @param {number} config.maxTurns - Optional max turns (default 100)
 * @returns {Object} Simulation instance
 */
export function createSimulation(config) {
  const { pokemon1, pokemon2, seed = null, maxTurns = 100 } = config;

  // Create seeded RNG
  const rng = createSeededRandom(seed);

  // Build combatants
  const combatant1 = buildTestCombatant(pokemon1.id, pokemon1.level || 5, pokemon1.moves, 'player');
  const combatant2 = buildTestCombatant(pokemon2.id, pokemon2.level || 5, pokemon2.moves, 'opponent');

  // Feature 023: Initialize positions for grid display
  // Default positions: Player at D2 (col 3, row 1), Opponent at G9 (col 6, row 8)
  combatant1.position = pokemon1.position || { col: 3, row: 1 };
  combatant2.position = pokemon2.position || { col: 6, row: 8 };

  return {
    id: uuidv4(),
    config: {
      pokemon1: { id: pokemon1.id, level: pokemon1.level || 5, moves: pokemon1.moves },
      pokemon2: { id: pokemon2.id, level: pokemon2.level || 5, moves: pokemon2.moves },
      seed: rng.seed,
      maxTurns
    },
    combatant1,
    combatant2,
    state: 'ready',
    currentTurn: 0,
    log: [],
    seed: rng.seed,
    rng,
    // Track stats for summary
    stats: {
      combatant1: { damageDealt: 0, attacksMade: 0, attacksHit: 0, criticalHits: 0 },
      combatant2: { damageDealt: 0, attacksMade: 0, attacksHit: 0, criticalHits: 0 }
    },
    startTime: null
  };
}

/**
 * Build a test combatant from Pokemon ID and level
 *
 * @param {string} pokemonId - Pokemon ID from Source
 * @param {number} level - Pokemon level (1-20)
 * @param {string[]} specificMoves - Optional specific move IDs
 * @param {string} owner - 'player' or 'opponent'
 * @returns {Object} Test combatant
 */
function buildTestCombatant(pokemonId, level, specificMoves = null, owner = 'player') {
  const sourcePokemon = getPokemonById(pokemonId);
  if (!sourcePokemon) {
    throw new Error(`Pokemon not found: ${pokemonId}`);
  }

  if (level < 1 || level > 20) {
    throw new Error(`Level must be 1-20, got: ${level}`);
  }

  // Get available moves
  const availableMoves = getMovesForPokemonAtLevel(pokemonId, level);
  let knownMoveObjects;

  if (specificMoves && specificMoves.length > 0) {
    knownMoveObjects = specificMoves
      .map(moveId => getMoveById(moveId))
      .filter(Boolean)
      .slice(0, 4);
  } else {
    knownMoveObjects = availableMoves.slice(0, 4);
  }

  const knownMoveIds = knownMoveObjects.map(m => m.id);

  // Get walking speed from Source data or calculate from DEX
  // Default: 30ft (6 cells), modified by DEX
  const dexMod = Math.floor(((sourcePokemon.attributes?.dex || 10) - 10) / 2);
  const baseSpeed = sourcePokemon.walking_speed || 6; // 6 cells = 30ft
  const walkingSpeed = Math.max(4, Math.min(10, baseSpeed + Math.floor(dexMod / 2)));

  // Calculate HP based on level using hit dice and CON modifier
  const calculatedHP = calculateOpponentHP(sourcePokemon, level);

  return {
    combatant_id: uuidv4(),
    pokemon_id: pokemonId,
    number: sourcePokemon.number,
    owner,
    name: sourcePokemon.name,
    level,
    type: sourcePokemon.type || [],
    attributes: sourcePokemon.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ac: sourcePokemon.ac || 10,
    max_hp: calculatedHP,
    current_hp: calculatedHP,
    move_pp: initializePP(knownMoveIds),
    known_moves: knownMoveObjects,
    known_move_ids: knownMoveIds,
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    is_fainted: false,
    // Movement properties
    walking_speed: walkingSpeed,
    movement_remaining: walkingSpeed,
    has_moved_this_turn: false,

    // Feature 024: Action economy tracking (T004)
    has_action: true,
    has_bonus_action: true,
    has_reaction: true,

    // Feature 024: Two-turn move state (T005)
    charging_move: null,           // { moveId, startedRound, executesRound, targetId? }
    is_invulnerable: false,
    invulnerable_until: null,      // Move ID that grants invulnerability
    is_recharging: false,
    recharge_until_round: 0,

    // Feature 024: Conditional damage tracking (T006)
    took_damage_this_round: false,
    damage_taken_since_last_turn: 0,
    last_move_used: null,

    // Feature 024: Control effect tracking (T007)
    is_grappling: null,            // combatant_id of grappled target
    grappled_by: null,             // combatant_id of grappler
    cannot_flee: false,
    flee_prevented_until_round: 0,

    // Feature 024: Stat modification tracking (T008)
    stat_modifiers: [],            // Array of { source, stat, amount, expiresRound, stackCount }
    ac_modifiers: [],              // Array of { source, amount, expiresRound, stackable, currentStack }
    speed_modifiers: []            // Array of { source, type, amount, expiresRound }
  };
}

/**
 * Execute a single combat turn
 *
 * @param {Object} simulation - Active simulation instance
 * @returns {Object} Turn result
 */
export function runNextTurn(simulation) {
  if (simulation.state === 'completed') {
    return { battleEnded: true, winner: determineWinner(simulation) };
  }

  if (!simulation.startTime) {
    simulation.startTime = Date.now();
  }

  simulation.state = 'running';
  simulation.currentTurn++;

  // Feature 023, T040: Reset movement at the start of each round
  resetMovement(simulation);

  const turnNumber = simulation.currentTurn;
  const logger = createLogger({ colorize: false, verbose: true });
  const turnLog = [];

  // Determine turn order (simple alternating: combatant1, then combatant2)
  const actors = [
    { combatant: simulation.combatant1, target: simulation.combatant2, isPlayer: true, statsKey: 'combatant1' },
    { combatant: simulation.combatant2, target: simulation.combatant1, isPlayer: false, statsKey: 'combatant2' }
  ];

  turnLog.push({
    type: 'turn_start',
    turnNumber,
    formatted: logger.logTurnStart(turnNumber)
  });

  for (const { combatant, target, isPlayer, statsKey } of actors) {
    // Skip if fainted
    if (combatant.current_hp <= 0 || target.current_hp <= 0) continue;

    // T026: Process start of turn status with roll logging
    const startStatus = processStartOfTurnStatus(combatant);

    // Log status checks with roll details
    if (startStatus.rolls && startStatus.rolls.length > 0) {
      for (const rollInfo of startStatus.rolls) {
        turnLog.push({
          type: 'status_check',
          actor: combatant.name,
          details: rollInfo,
          formatted: logger.logStatusCheck(
            combatant.name,
            rollInfo.checkType,
            rollInfo.roll,
            rollInfo.threshold,
            rollInfo.passed,
            {
              diceExpr: rollInfo.diceExpr,
              modifier: rollInfo.modifier,
              result: rollInfo.result
            }
          )
        });
      }
    }

    if (startStatus.skipTurn) {
      // Find the roll that caused the skip
      const skipRoll = startStatus.rolls?.find(r => !r.passed);
      turnLog.push({
        type: 'turn_skip',
        actor: combatant.name,
        details: { skipped: true, reason: startStatus.reason, roll: skipRoll },
        formatted: logger.logSkippedTurnWithRoll(
          combatant.name,
          startStatus.reason,
          skipRoll ? { roll: skipRoll.roll, diceExpr: skipRoll.diceExpr } : null
        )
      });
      continue;
    }

    // AI selects a move
    const move = selectMove(combatant, simulation.rng);
    if (!move) {
      // Use Struggle if no moves available
      const struggleResult = executeStruggle(combatant, target, simulation.rng, logger);
      turnLog.push(struggleResult.logEntry);
      simulation.stats[statsKey].attacksMade++;
      if (struggleResult.hit) {
        simulation.stats[statsKey].attacksHit++;
        simulation.stats[statsKey].damageDealt += struggleResult.damage;
      }
      continue;
    }

    // AI movement: Move toward target if out of range
    const occupiedPositions = [
      simulation.combatant1.position,
      simulation.combatant2.position
    ].filter(Boolean);

    const movementLog = executeAIMovement(combatant, target, move, occupiedPositions, logger);
    if (movementLog) {
      turnLog.push(movementLog);
    }

    // Execute the attack
    const actionResult = executeAttack(combatant, target, move, simulation.rng, turnNumber);

    // Handle self-target moves (buffs) differently
    if (actionResult.is_self_target) {
      // Consume PP
      if (combatant.move_pp[move.id] !== undefined) {
        combatant.move_pp[move.id] = Math.max(0, combatant.move_pp[move.id] - 1);
      }

      // Build self-target log entry
      const effectsList = actionResult.effects_applied.join(', ');
      const buffDetails = actionResult.buffs.map(b => `  └─ ${b.description}`).join('\n');
      const fullLog = `▶ ${combatant.name.toUpperCase()} uses ${move.name.toUpperCase()}!\n  ├─ Self-targeting buff\n${buffDetails || '  └─ Effect applied'}`;

      turnLog.push({
        type: 'self_buff',
        turnNumber,
        actor: combatant.name,
        target: combatant.name,
        details: actionResult,
        formatted: fullLog
      });

      // No KO check needed for self-buffs, continue to next actor
      continue;
    }

    // Update stats (for non-self-target moves)
    simulation.stats[statsKey].attacksMade++;
    if (actionResult.hit) {
      simulation.stats[statsKey].attacksHit++;
      if (actionResult.damage) {
        simulation.stats[statsKey].damageDealt += actionResult.damage.final_damage || 0;
      }
      if (actionResult.is_critical) {
        simulation.stats[statsKey].criticalHits++;
      }
    }

    // Consume PP
    if (combatant.move_pp[move.id] !== undefined) {
      combatant.move_pp[move.id] = Math.max(0, combatant.move_pp[move.id] - 1);
    }

    // Apply damage
    if (actionResult.hit && actionResult.damage) {
      target.current_hp = Math.max(0, target.current_hp - actionResult.damage.final_damage);
    }

    // Build log entry (includes move description text)
    const attackLog = logger.logAttack(combatant.name, move.name, target.name, actionResult.attack_roll, isPlayer, move.description);
    let fullLog = attackLog;

    // Add range information to log
    if (combatant.position && target.position) {
      const distance = getManhattanDistance(combatant.position, target.position);
      const moveRange = getMoveRange(move);
      const distanceFeet = distance * 5;
      const rangeFeet = moveRange * 5;
      const inRange = distance <= moveRange;
      fullLog += `\n  ├─ Range: ${distanceFeet}ft / ${rangeFeet}ft ${inRange ? '(in range)' : '(OUT OF RANGE)'}`;
    }

    if (actionResult.is_save_move) {
      fullLog += '\n' + logger.logSaveMove(actionResult.save, target.name);
    } else if (actionResult.attack_roll) {
      fullLog += '\n' + logger.logHitCheck(
        actionResult.attack_roll.total,
        target.ac,
        actionResult.hit,
        actionResult.is_critical
      );
    }

    if (actionResult.hit && actionResult.damage) {
      // For multi-hit moves, show initial damage separately
      if (actionResult.damage.multi_hit) {
        const mh = actionResult.damage.multi_hit;
        fullLog += `\n  ├─ Hit 1: ${actionResult.damage.initial_damage} damage`;

        // Log each additional hit
        for (const hit of mh.hits) {
          if (hit.continued) {
            fullLog += `\n  ├─ Hit ${hit.hitNumber}: d4=${hit.continueRoll} (continue!) → ${hit.diceExpr}=${hit.baseDamage} → ${hit.finalDamage} damage`;
          } else {
            fullLog += `\n  ├─ Hit ${hit.hitNumber}: d4=${hit.continueRoll} (stopped)`;
          }
        }
        fullLog += `\n  ├─ Total: ${mh.totalHits} hits for ${actionResult.damage.final_damage} damage`;
        fullLog += `\n  └─ ${target.name.toUpperCase()} HP: ${actionResult.target_hp_before} → ${actionResult.target_hp_after}`;
      } else {
        fullLog += '\n' + logger.logDamage(
          actionResult.damage,
          actionResult.target_hp_before,
          actionResult.target_hp_after,
          target.name
        );
      }
    } else if (!actionResult.hit) {
      fullLog += '\n' + logger.logMiss(combatant.name, move.name, target.name, actionResult.attack_roll);
    }

    // T015: Status effect with enhanced logging
    if (actionResult.status_applied) {
      if (!actionResult.status_applied.blocked) {
        // Status was applied
        fullLog += '\n' + logger.logStatusApplied(
          target.name,
          actionResult.status_applied.type,
          move.name,
          actionResult.status_applied.trigger
        );
      } else {
        // Status was blocked
        fullLog += '\n' + logger.logStatusBlocked(
          target.name,
          actionResult.status_applied.type,
          actionResult.status_applied.reason,
          actionResult.status_applied.trigger
        );
      }
    }

    // Log debuff effects (Growl, Leer, Sand Attack, etc.)
    if (actionResult.debuff_applied) {
      const debuff = actionResult.debuff_applied;
      fullLog += `\n  └─ ${debuff.description} (${debuff.total}/${debuff.type === 'attack_penalty' ? debuff.maxStack : '+' + debuff.maxStack} max)`;
    }

    // T035: Log healing effect
    if (actionResult.healing_effect) {
      const h = actionResult.healing_effect;
      fullLog += '\n' + logger.logHealing(
        combatant.name,
        move.name,
        h.type,
        h.amount,
        {
          hpBefore: h.hpBefore,
          hpAfter: h.hpAfter,
          damageDealt: h.damageDealt,
          percentage: h.percentage,
          diceExpr: h.diceExpr
        }
      );
    }

    // T035: Log recoil effect
    if (actionResult.recoil_effect) {
      const r = actionResult.recoil_effect;
      fullLog += '\n' + logger.logRecoil(
        combatant.name,
        move.name,
        r.amount,
        {
          hpBefore: r.hpBefore,
          hpAfter: r.hpAfter,
          damageDealt: r.damageDealt,
          percentage: r.percentage
        }
      );
    }

    // T035: Log AC change effect
    if (actionResult.ac_effect) {
      const ac = actionResult.ac_effect;
      fullLog += '\n' + logger.logACChange(
        ac.targetName,
        move.name,
        ac.amount,
        ac.direction,
        {
          newAC: ac.newAC,
          stackCount: ac.stackCount,
          maxStack: ac.maxStack
        }
      );
    }

    // T039: Log burned penalty if present
    if (actionResult.damage?.burned_penalty) {
      const bp = actionResult.damage.burned_penalty;
      fullLog += '\n' + logger.logBurnedPenalty(
        combatant.name,
        bp.roll1,
        bp.roll2,
        bp.result,
        bp.diceExpr || actionResult.damage.dice_expression
      );
    }

    // T044: Log flinch effect if attacker had disadvantage
    if (actionResult.attack_roll?.had_disadvantage && combatant.status_effects?.some(s => s.status_type === 'FLINCHED')) {
      fullLog += '\n' + logger.logFlinchedEffect(
        combatant.name,
        'attack_disadvantage',
        {
          rolls: actionResult.attack_roll.rolls,
          used: actionResult.attack_roll.natural
        }
      );
    }

    turnLog.push({
      type: 'attack',
      turnNumber,
      actor: combatant.name,
      target: target.name,
      details: actionResult,
      formatted: fullLog
    });

    // Check for KO
    if (target.current_hp <= 0) {
      target.is_fainted = true;
      break;
    }
  }

  // T020: Process end of turn status effects with enhanced logging
  for (const { combatant, statsKey } of actors) {
    if (combatant.current_hp <= 0) continue;

    const endStatus = processEndOfTurnStatus(combatant);
    for (const damage of endStatus.damages || []) {
      // Check if this damage caused fainting
      const fainted = damage.hpAfter <= 0 || damage.fainted;

      if (fainted) {
        // T018: Log faint from status damage
        turnLog.push({
          type: 'status_damage',
          actor: combatant.name,
          details: { ...damage, fainted: true },
          formatted: logger.logStatusFaint(
            combatant.name,
            damage.statusType,
            damage.damage,
            damage.hpBefore
          )
        });
        combatant.is_fainted = true;
      } else {
        turnLog.push({
          type: 'status_damage',
          actor: combatant.name,
          details: damage,
          formatted: logger.logStatusDamage(
            combatant.name,
            damage.statusType,
            damage.damage,
            damage.hpBefore,
            damage.hpAfter
          )
        });
      }
    }

    // T020: Log status changes (status removed, etc.)
    for (const change of endStatus.statusChanges || []) {
      if (change.change === 'removed') {
        turnLog.push({
          type: 'status_removed',
          actor: combatant.name,
          details: change,
          formatted: `  ${combatant.name.toUpperCase()} is no longer ${change.status_type}!`
        });
      }
    }
  }

  // Turn end summary
  turnLog.push({
    type: 'turn_end',
    turnNumber,
    formatted: logger.logTurnEnd(simulation.combatant1, simulation.combatant2)
  });

  // Add to simulation log
  simulation.log.push(...turnLog);

  // Check for battle end
  const battleEnded = checkBattleEnd(simulation);

  return {
    turnNumber,
    log: turnLog,
    battleEnded,
    winner: battleEnded ? determineWinner(simulation) : null,
    combatant1: simulation.combatant1,
    combatant2: simulation.combatant2
  };
}

/**
 * Run simulation to completion
 *
 * @param {Object} simulation - Active simulation instance
 * @param {function} onTurn - Optional callback after each turn
 * @returns {Object} Final simulation result
 */
export function runToCompletion(simulation, onTurn = null) {
  if (!simulation.startTime) {
    simulation.startTime = Date.now();
  }

  while (!checkBattleEnd(simulation)) {
    const turnResult = runNextTurn(simulation);
    if (onTurn) {
      onTurn(turnResult);
    }
    if (turnResult.battleEnded) break;
  }

  simulation.state = 'completed';
  const endTime = Date.now();

  return {
    winner: determineWinner(simulation),
    totalTurns: simulation.currentTurn,
    seedUsed: simulation.seed,
    combatant1Summary: {
      name: simulation.combatant1.name,
      finalHp: simulation.combatant1.current_hp,
      maxHp: simulation.combatant1.max_hp,
      totalDamageDealt: simulation.stats.combatant1.damageDealt,
      totalDamageReceived: simulation.stats.combatant2.damageDealt,
      attacksMade: simulation.stats.combatant1.attacksMade,
      attacksHit: simulation.stats.combatant1.attacksHit,
      criticalHits: simulation.stats.combatant1.criticalHits
    },
    combatant2Summary: {
      name: simulation.combatant2.name,
      finalHp: simulation.combatant2.current_hp,
      maxHp: simulation.combatant2.max_hp,
      totalDamageDealt: simulation.stats.combatant2.damageDealt,
      totalDamageReceived: simulation.stats.combatant1.damageDealt,
      attacksMade: simulation.stats.combatant2.attacksMade,
      attacksHit: simulation.stats.combatant2.attacksHit,
      criticalHits: simulation.stats.combatant2.criticalHits
    },
    log: simulation.log,
    durationMs: endTime - simulation.startTime,
    seed: simulation.seed
  };
}

/**
 * Parse move range from move data
 * @param {Object} move - Move object
 * @returns {number} Range in cells (1 = melee, higher for ranged)
 */
function getMoveRange(move) {
  if (!move.range) return 1; // Default melee
  const rangeStr = String(move.range).toLowerCase();
  if (rangeStr === 'melee' || rangeStr === '5') return 1;
  const rangeFeet = parseInt(rangeStr) || 30;
  return feetToCells(rangeFeet);
}

/**
 * Execute AI movement toward target if needed
 * @param {Object} combatant - Combatant to move
 * @param {Object} target - Target to move toward
 * @param {Object} move - Selected move (for range check)
 * @param {Array} occupiedPositions - Currently occupied positions
 * @param {Object} logger - Combat logger
 * @returns {Object|null} Movement log entry or null if no movement
 */
function executeAIMovement(combatant, target, move, occupiedPositions, logger) {
  // Skip if already moved this turn
  if (combatant.has_moved_this_turn) return null;

  // Skip if no positions
  if (!combatant.position || !target.position) return null;

  // Check current distance to target
  const currentDistance = getManhattanDistance(combatant.position, target.position);
  const moveRange = getMoveRange(move);

  // If already in range, no need to move
  if (currentDistance <= moveRange) return null;

  // Get movement remaining
  const walkingSpeed = combatant.walking_speed || 6;
  const movementRemaining = combatant.movement_remaining !== undefined
    ? combatant.movement_remaining
    : walkingSpeed;

  if (movementRemaining <= 0) return null;

  // Find valid move targets
  const validTargets = getValidMoveTargets(combatant.position, movementRemaining, occupiedPositions);

  if (validTargets.length === 0) return null;

  // Find the cell that gets us closest to target
  let bestTarget = null;
  let bestDistance = currentDistance;

  for (const cell of validTargets) {
    const distToTarget = getManhattanDistance(cell, target.position);
    if (distToTarget < bestDistance) {
      bestDistance = distToTarget;
      bestTarget = cell;
    }
  }

  // Only move if it gets us closer
  if (!bestTarget || bestDistance >= currentDistance) return null;

  // Execute the movement
  const fromNotation = toGridNotation(combatant.position.col, combatant.position.row);
  const toNotation = toGridNotation(bestTarget.col, bestTarget.row);
  const distanceMoved = getManhattanDistance(combatant.position, bestTarget);

  // Update combatant position
  const oldPosition = { ...combatant.position };
  combatant.position = { col: bestTarget.col, row: bestTarget.row };
  combatant.movement_remaining = movementRemaining - distanceMoved;
  combatant.has_moved_this_turn = true;

  // Generate log entry
  const logEntry = {
    type: 'movement',
    actor: combatant.name,
    target: null,
    details: {
      from_position: { ...oldPosition, notation: fromNotation },
      to_position: { col: bestTarget.col, row: bestTarget.row, notation: toNotation },
      distance_moved: distanceMoved,
      movement_remaining: combatant.movement_remaining,
      reason: 'approaching target'
    },
    formatted: `  ${combatant.name.toUpperCase()} moves ${fromNotation} → ${toNotation} (${distanceMoved * 5}ft, ${combatant.movement_remaining * 5}ft remaining)`
  };

  return logEntry;
}

/**
 * Select a move for the combatant (AI: random from available)
 *
 * @param {Object} combatant - Combatant selecting move
 * @param {Object} rng - Seeded RNG instance
 * @returns {Object|null} Selected move or null if none available
 */
function selectMove(combatant, rng) {
  const availableMoves = combatant.known_moves.filter(m => {
    const pp = combatant.move_pp[m.id];
    return pp === undefined || pp > 0;
  });

  if (availableMoves.length === 0) {
    return null; // Will use Struggle
  }

  const index = Math.floor(rng.random() * availableMoves.length);
  return availableMoves[index];
}

/**
 * Check if a move targets self (buff/utility move)
 * @param {Object} move - Move object
 * @returns {boolean} True if move targets self
 */
function isSelfTargetMove(move) {
  if (!move.range) return false;
  const range = String(move.range).toLowerCase();
  return range === 'self' || range.startsWith('self ') || range.startsWith('self(');
}

/**
 * Execute a self-targeting move (buff/utility)
 *
 * @param {Object} user - Combatant using the move
 * @param {Object} move - Move being used
 * @param {Object} rng - Seeded RNG
 * @param {number} roundNumber - Current round
 * @returns {Object} Move result
 */
function executeSelfTargetMove(user, move, rng, roundNumber) {
  const result = {
    move_id: move.id,
    move_name: move.name,
    is_self_target: true,
    hit: true, // Self-target moves always succeed
    effects_applied: [],
    buffs: []
  };

  const descLower = (move.description || '').toLowerCase();
  const moveName = move.name.toLowerCase();

  // HARDEN: Reduce incoming damage by 1d4+MOVE (scales with level)
  if (moveName === 'harden' || descLower.includes('reduce any damage dealt to you')) {
    // Parse damage reduction dice from description or higherLevels
    let reductionDice = '1d4';
    if (move.higherLevels) {
      const higherLower = move.higherLevels.toLowerCase();
      if (user.level >= 17 && higherLower.includes('1d12')) reductionDice = '1d12';
      else if (user.level >= 10 && higherLower.includes('1d10')) reductionDice = '1d10';
      else if (user.level >= 5 && higherLower.includes('1d8')) reductionDice = '1d8';
    }

    // Get CON modifier for MOVE bonus
    const conMod = getAttributeModifier(user.attributes?.con || 10);

    // Apply damage reduction buff
    if (!user.combat_buffs) user.combat_buffs = {};
    user.combat_buffs.damage_reduction = {
      dice: reductionDice,
      modifier: conMod,
      expires_at_round: roundNumber + 1,
      source: move.name
    };

    result.buffs.push({
      type: 'damage_reduction',
      dice: reductionDice,
      modifier: conMod,
      description: `Reduces incoming damage by ${reductionDice}+${conMod}`
    });
    result.effects_applied.push(`damage reduction (${reductionDice}+${conMod})`);
  }

  // DEFENSE CURL: +4 AC and resistance to normal until next turn
  if (moveName === 'defense curl' || descLower.includes('+4 to your ac') || descLower.includes('+ 4 to your ac')) {
    if (!user.combat_buffs) user.combat_buffs = {};

    // AC buff
    user.combat_buffs.ac_bonus = {
      amount: 4,
      expires_at_round: roundNumber + 1,
      source: move.name
    };

    // Normal resistance
    user.combat_buffs.type_resistance = {
      type: 'normal',
      expires_at_round: roundNumber + 1,
      source: move.name
    };

    result.buffs.push({
      type: 'ac_bonus',
      amount: 4,
      description: '+4 AC until next turn'
    });
    result.buffs.push({
      type: 'type_resistance',
      resistType: 'normal',
      description: 'Resistance to Normal attacks'
    });
    result.effects_applied.push('+4 AC', 'Normal resistance');
  }

  // WATER SPORT: Fire resistance for self and allies
  if (moveName === 'water sport' || descLower.includes('resistance to fire-type')) {
    if (!user.combat_buffs) user.combat_buffs = {};
    user.combat_buffs.type_resistance = {
      type: 'fire',
      expires_at_round: roundNumber + 10, // 1 minute = ~10 rounds
      source: move.name
    };

    result.buffs.push({
      type: 'type_resistance',
      resistType: 'fire',
      description: 'Resistance to Fire attacks'
    });
    result.effects_applied.push('Fire resistance');
  }

  // MUD SPORT: Electric resistance for self and allies
  if (moveName === 'mud sport' || descLower.includes('resistance to electric-type')) {
    if (!user.combat_buffs) user.combat_buffs = {};
    user.combat_buffs.type_resistance = {
      type: 'electric',
      expires_at_round: roundNumber + 10, // 1 minute = ~10 rounds
      source: move.name
    };

    result.buffs.push({
      type: 'type_resistance',
      resistType: 'electric',
      description: 'Resistance to Electric attacks'
    });
    result.effects_applied.push('Electric resistance');
  }

  // WITHDRAW: Similar to Defense Curl - AC bonus
  if (moveName === 'withdraw' || (descLower.includes('withdraw') && descLower.includes('ac'))) {
    if (!user.combat_buffs) user.combat_buffs = {};
    user.combat_buffs.ac_bonus = {
      amount: 4,
      expires_at_round: roundNumber + 1,
      source: move.name
    };

    result.buffs.push({
      type: 'ac_bonus',
      amount: 4,
      description: '+4 AC until next turn'
    });
    result.effects_applied.push('+4 AC');
  }

  // Generic self-buff: If no specific effect detected, just note the move was used
  if (result.effects_applied.length === 0) {
    result.effects_applied.push('self-buff applied');
  }

  return result;
}

/**
 * Execute an attack
 *
 * @param {Object} attacker - Attacking combatant
 * @param {Object} defender - Defending combatant
 * @param {Object} move - Move being used
 * @param {Object} rng - Seeded RNG
 * @param {number} roundNumber - Current round
 * @returns {Object} Attack result
 */
function executeAttack(attacker, defender, move, rng, roundNumber) {
  // Check if self-targeting move (buff/utility)
  if (isSelfTargetMove(move)) {
    return executeSelfTargetMove(attacker, move, rng, roundNumber);
  }

  // Check if save move
  if (isSaveMove(move)) {
    return executeSaveAttack(attacker, defender, move, rng, roundNumber);
  }

  // Calculate attack roll
  const attackRoll = calculateAttackRollWithRng(attacker, move, rng);

  // Check hit
  let hit = false;
  if (attackRoll.isMiss) {
    hit = false;
  } else if (attackRoll.isCrit) {
    hit = true;
  } else {
    hit = attackRoll.total >= defender.ac;
  }

  let damage = null;
  let statusApplied = null;
  let multiHitResult = null;
  const hpBefore = defender.current_hp;

  if (hit) {
    damage = calculateDamageWithRng(attacker, defender, move, attackRoll, rng);

    // Check for multi-hit move (Fury Swipes, Double Slap, etc.)
    const multiHitConfig = getMultiHitConfig(move);
    if (multiHitConfig && damage) {
      multiHitResult = executeMultiHit(multiHitConfig, attacker, defender, move, rng);
      // Add multi-hit damage to total
      damage.multi_hit = multiHitResult;
      damage.initial_damage = damage.final_damage;
      damage.final_damage = damage.final_damage + multiHitResult.totalAdditionalDamage;
    }

    // Check for status effect
    const statusTrigger = parseStatusTrigger(move.description, attackRoll.natural_roll);
    if (statusTrigger.statusType) {
      const statusResult = applyStatusEffect(
        defender,
        statusTrigger.statusType,
        roundNumber,
        attacker.combatant_id
      );
      if (statusResult.applied) {
        setStatusApplierProficiency(defender, statusTrigger.statusType, getProficiencyBonus(attacker.level));
        statusApplied = { type: statusTrigger.statusType, target: defender.name };
      } else {
        statusApplied = { type: statusTrigger.statusType, blocked: true, reason: statusResult.statusChange?.reason };
      }
    }
  }

  const hpAfter = hit && damage ? Math.max(0, hpBefore - damage.final_damage) : hpBefore;

  return {
    move_id: move.id,
    move_name: move.name,
    is_save_move: false,
    attack_roll: {
      natural: attackRoll.natural_roll,
      modifier: attackRoll.modifier,
      total: attackRoll.total,
      crit_threshold: attackRoll.crit_threshold,
      is_crit: attackRoll.isCrit,
      is_miss: attackRoll.isMiss,
      rolls: attackRoll.rolls,
      had_advantage: attackRoll.hadAdvantage,
      had_disadvantage: attackRoll.hadDisadvantage
    },
    target_ac: defender.ac,
    hit,
    is_critical: attackRoll.isCrit && hit,
    damage,
    status_applied: statusApplied,
    target_hp_before: hpBefore,
    target_hp_after: hpAfter,
    target_fainted: hpAfter <= 0
  };
}

/**
 * Apply debuff effects from moves like Growl, Leer, Sand Attack, etc.
 * @param {Object} target - Target combatant
 * @param {Object} move - Move being used
 * @param {number} roundNumber - Current round
 * @returns {Object|null} Debuff info or null
 */
function applyDebuffFromMove(target, move, roundNumber) {
  const descLower = (move.description || '').toLowerCase();
  const moveName = move.name.toLowerCase();

  if (!target.combat_buffs) target.combat_buffs = {};

  // Attack penalty debuffs: Growl, Sand Attack
  // Pattern: "adds -1 to any attack" or "-1 to all of their attack rolls"
  if (descLower.includes('-1 to any attack') || descLower.includes('-1 to all of their attack')) {
    const currentPenalty = target.combat_buffs.attack_penalty?.amount || 0;
    const maxStack = descLower.includes('maximum of -5') ? 5 : 5;
    const newPenalty = Math.min(currentPenalty + 1, maxStack);

    target.combat_buffs.attack_penalty = {
      amount: newPenalty,
      expires_at_round: roundNumber + 10, // 1 minute
      source: move.name
    };

    return {
      type: 'attack_penalty',
      amount: -1,
      total: -newPenalty,
      maxStack: -maxStack,
      target: target.name,
      description: `${target.name} has -${newPenalty} to attack rolls`
    };
  }

  // Defense debuffs: Leer, Tail Whip, Screech
  // Pattern: "allies add +1 to any attack they target it with"
  if (descLower.includes('+1 to any attack') && descLower.includes('target')) {
    const currentBonus = target.combat_buffs.defense_penalty?.amount || 0;
    const maxStack = descLower.includes('maximum of +3') ? 3 : 5;
    const newBonus = Math.min(currentBonus + 1, maxStack);

    target.combat_buffs.defense_penalty = {
      amount: newBonus,
      expires_at_round: roundNumber + 10, // 1 minute
      source: move.name
    };

    return {
      type: 'defense_penalty',
      amount: 1,
      total: newBonus,
      maxStack: maxStack,
      target: target.name,
      description: `Attacks against ${target.name} have +${newBonus} to hit`
    };
  }

  return null;
}

/**
 * Check if a move is a multi-hit move (Fury Swipes, Double Slap, etc.)
 * Multi-hit moves: Roll d4 after hit, on 3-4 hit again, max 4 additional hits
 *
 * @param {Object} move - Move object
 * @returns {Object|null} Multi-hit config or null
 */
function getMultiHitConfig(move) {
  const desc = (move.description || '').toLowerCase();

  // Pattern: "roll a d4. On a result of 3 or 4, you may immediately hit again"
  // Used by: Fury Swipes, Fury Attack, Double Slap, Comet Punch, Bullet Seed,
  //          Pin Missile, Icicle Spear, Rock Blast, Tail Slap, Arm Thrust
  if (desc.includes('roll a d4') && desc.includes('3 or 4') && desc.includes('hit again')) {
    // Extract the additional damage dice (usually 1d4)
    // Pattern: "additional 1d4 normal damage" or "additional 1d6 ice damage"
    let additionalDice = '1d4';
    const additionalMatch = desc.match(/additional\s+(1d\d+)/i);
    if (additionalMatch) {
      additionalDice = additionalMatch[1];
    }

    // Check for max hits (usually 4 additional = 5 total)
    let maxAdditional = 4;
    const maxMatch = desc.match(/maximum of (\w+) additional hits/i);
    if (maxMatch) {
      const numWord = maxMatch[1].toLowerCase();
      const wordToNum = { one: 1, two: 2, three: 3, four: 4, five: 5 };
      maxAdditional = wordToNum[numWord] || 4;
    }

    return {
      type: 'continuation', // Roll d4, on 3-4 continue
      additionalDice,
      maxAdditionalHits: maxAdditional,
      continueOn: [3, 4]
    };
  }

  // Pattern: "Barrage" style - roll 1d4 to determine number of hits
  // (Different mechanic - not continuation based)
  if (desc.includes('roll 1d4') && desc.includes('number of hits')) {
    return {
      type: 'fixed_roll',
      hitCountDice: '1d4',
      additionalDice: '1d4'
    };
  }

  return null;
}

/**
 * Execute multi-hit damage for continuation-style moves
 * Called after the initial hit connects
 *
 * @param {Object} config - Multi-hit config from getMultiHitConfig
 * @param {Object} attacker - Attacking combatant
 * @param {Object} defender - Defending combatant
 * @param {Object} move - Move being used
 * @param {Object} rng - Seeded RNG
 * @returns {Object} Multi-hit results { hits: [...], totalDamage, hitCount }
 */
function executeMultiHit(config, attacker, defender, move, rng) {
  const hits = [];
  let totalAdditionalDamage = 0;
  let additionalHitCount = 0;

  if (config.type === 'continuation') {
    // Roll d4 after each hit, on 3-4 continue
    for (let i = 0; i < config.maxAdditionalHits; i++) {
      const continueRoll = rng.rollDice('1d4');
      if (config.continueOn.includes(continueRoll)) {
        // Hit again! Roll additional damage (no MOVE bonus)
        const additionalDamage = rng.rollDice(config.additionalDice);

        // Apply type effectiveness
        const effectiveness = getEffectiveness(move.type, defender.type);
        const finalDamage = Math.max(0, Math.floor(additionalDamage * effectiveness.multiplier));

        hits.push({
          hitNumber: i + 2, // +2 because hit 1 was the initial attack
          continueRoll,
          continued: true,
          baseDamage: additionalDamage,
          finalDamage,
          diceExpr: config.additionalDice
        });
        totalAdditionalDamage += finalDamage;
        additionalHitCount++;
      } else {
        // Failed to continue
        hits.push({
          hitNumber: i + 2,
          continueRoll,
          continued: false
        });
        break;
      }
    }
  } else if (config.type === 'fixed_roll') {
    // Barrage style: roll to determine number of hits
    const numHits = rng.rollDice(config.hitCountDice);
    for (let i = 0; i < numHits - 1; i++) { // -1 because first hit already done
      const additionalDamage = rng.rollDice(config.additionalDice);
      const effectiveness = getEffectiveness(move.type, defender.type);
      const finalDamage = Math.max(0, Math.floor(additionalDamage * effectiveness.multiplier));

      hits.push({
        hitNumber: i + 2,
        baseDamage: additionalDamage,
        finalDamage,
        diceExpr: config.additionalDice
      });
      totalAdditionalDamage += finalDamage;
      additionalHitCount++;
    }
  }

  return {
    hits,
    totalAdditionalDamage,
    additionalHitCount,
    totalHits: additionalHitCount + 1 // +1 for initial hit
  };
}

/**
 * Execute a saving throw attack
 */
function executeSaveAttack(attacker, defender, move, rng, roundNumber) {
  const saveType = parseSaveType(move.description);
  const dc = calculateSaveDC(attacker, move);
  const attrKey = getAttributeKey(saveType);
  const saveMod = getAttributeModifier(defender.attributes?.[attrKey] || 10);

  // Roll save
  const saveRoll = rng.rollD20();
  const saveTotal = saveRoll + saveMod;
  const saved = saveTotal >= dc;

  // Calculate damage
  const diceExpression = parseDamageDice(move.description, move.higherLevels, attacker.level);
  let damage = null;
  const hpBefore = defender.current_hp;

  if (diceExpression) {
    const baseDamage = rng.rollDice(diceExpression);
    const powerMod = getBestPowerModifier(move.power, attacker.attributes);
    let fullDamage = baseDamage + powerMod;

    if (hasSTAB(move.type, attacker.type)) {
      fullDamage += getProficiencyBonus(attacker.level);
    }

    const effectiveness = getEffectiveness(move.type, defender.type);
    fullDamage = Math.floor(fullDamage * effectiveness.multiplier);
    fullDamage = Math.max(0, fullDamage);

    const halfDamage = Math.floor(fullDamage / 2);
    const finalDamage = saved ? halfDamage : fullDamage;

    damage = {
      dice_expression: diceExpression,
      base_dice_total: baseDamage,
      power_modifier: powerMod,
      stab_bonus: hasSTAB(move.type, attacker.type) ? getProficiencyBonus(attacker.level) : 0,
      type_multiplier: effectiveness.multiplier,
      type_effectiveness: effectiveness.effectiveness,
      full_damage: fullDamage,
      half_damage: halfDamage,
      final_damage: finalDamage
    };
  }

  // Apply status effect if save failed (for moves like DISABLE, TAUNT)
  let statusApplied = null;
  let debuffApplied = null;

  if (!saved) {
    const saveResult = { saved, total: saveTotal, dc };
    const statusTrigger = parseStatusTrigger(move.description, null, saveResult);
    if (statusTrigger.statusType) {
      const statusResult = applyStatusEffect(
        defender,
        statusTrigger.statusType,
        roundNumber,
        attacker.combatant_id
      );
      if (statusResult.applied) {
        setStatusApplierProficiency(defender, statusTrigger.statusType, getProficiencyBonus(attacker.level));
        statusApplied = {
          type: statusTrigger.statusType,
          target: defender.name,
          trigger: 'save_fail'
        };
      } else {
        statusApplied = {
          type: statusTrigger.statusType,
          blocked: true,
          reason: statusResult.statusChange?.reason,
          trigger: 'save_fail'
        };
      }
    }

    // Check for debuff effects (Growl, Leer, Sand Attack, Tail Whip, Screech)
    debuffApplied = applyDebuffFromMove(defender, move, roundNumber);
  }

  const hpAfter = damage ? Math.max(0, hpBefore - damage.final_damage) : hpBefore;

  return {
    move_id: move.id,
    move_name: move.name,
    is_save_move: true,
    save: {
      saveType,
      dc,
      saveRoll,
      saveMod,
      saveTotal,
      saved
    },
    hit: true, // Save moves always "hit"
    damage,
    status_applied: statusApplied,
    debuff_applied: debuffApplied,
    target_hp_before: hpBefore,
    target_hp_after: hpAfter,
    target_fainted: hpAfter <= 0
  };
}

/**
 * Calculate attack roll using seeded RNG
 */
function calculateAttackRollWithRng(attacker, move, rng) {
  let hasAdvantage = false;
  let hasDisadvantage = false;

  const flinchedEffects = getFlinchedEffects(attacker);
  if (flinchedEffects.hasDisadvantage) {
    hasDisadvantage = true;
  }

  let natural_roll;
  const rolls = [];

  if (hasAdvantage && !hasDisadvantage) {
    const roll1 = rng.rollD20();
    const roll2 = rng.rollD20();
    rolls.push(roll1, roll2);
    natural_roll = Math.max(roll1, roll2);
  } else if (hasDisadvantage && !hasAdvantage) {
    const roll1 = rng.rollD20();
    const roll2 = rng.rollD20();
    rolls.push(roll1, roll2);
    natural_roll = Math.min(roll1, roll2);
  } else {
    natural_roll = rng.rollD20();
    rolls.push(natural_roll);
  }

  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  const profBonus = getProficiencyBonus(attacker.level);
  const modifier = powerMod + profBonus;

  const effectiveCritThreshold = parseCriticalRange(move.description) || 20;

  return {
    natural_roll,
    modifier,
    total: natural_roll + modifier,
    isCrit: isCriticalRoll(natural_roll, effectiveCritThreshold),
    isMiss: natural_roll === 1,
    crit_threshold: effectiveCritThreshold,
    hadAdvantage: hasAdvantage && !hasDisadvantage,
    hadDisadvantage: hasDisadvantage && !hasAdvantage,
    rolls
  };
}

/**
 * Calculate damage using seeded RNG
 */
function calculateDamageWithRng(attacker, defender, move, attackRoll, rng) {
  const diceExpression = parseDamageDice(move.description, move.higherLevels, attacker.level);

  if (!diceExpression) {
    return null;
  }

  const diceResult = rng.rollDiceDetailed(diceExpression);
  let baseDamage = diceResult.total;

  // Check for Battle Armor
  const hasBattleArmor = hasBattleArmorAbility(defender.abilities || []);
  let critNegated = false;

  if (attackRoll.isCrit && !hasBattleArmor) {
    baseDamage *= 2;
  } else if (attackRoll.isCrit && hasBattleArmor) {
    critNegated = true;
  }

  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  let totalDamage = baseDamage + powerMod;

  const stabApplied = hasSTAB(move.type, attacker.type);
  if (stabApplied) {
    totalDamage += getProficiencyBonus(attacker.level);
  }

  const effectiveness = getEffectiveness(move.type, defender.type);
  totalDamage = Math.floor(totalDamage * effectiveness.multiplier);
  totalDamage = Math.max(0, totalDamage);

  return {
    dice_expression: diceExpression,
    dice_rolls: diceResult.rolls,
    base_dice_total: baseDamage,
    power_modifier: powerMod,
    stab_bonus: stabApplied ? getProficiencyBonus(attacker.level) : 0,
    type_multiplier: effectiveness.multiplier,
    type_effectiveness: `${move.type} vs ${defender.type.join('/')}`,
    is_critical: attackRoll.isCrit && !critNegated,
    crit_negated: critNegated,
    final_damage: totalDamage
  };
}

/**
 * Execute Struggle (when no PP left)
 */
function executeStruggle(attacker, defender, rng, logger) {
  const attackRoll = rng.rollD20();
  const modifier = getProficiencyBonus(attacker.level);
  const total = attackRoll + modifier;
  const hit = total >= defender.ac;

  let damage = 0;
  const hpBefore = defender.current_hp;

  if (hit) {
    damage = rng.rollDice('1d4') + Math.floor(attacker.level / 4);
    defender.current_hp = Math.max(0, defender.current_hp - damage);
  }

  const hpAfter = defender.current_hp;

  return {
    hit,
    damage,
    logEntry: {
      type: 'attack',
      actor: attacker.name,
      target: defender.name,
      details: { move_name: 'Struggle', hit, damage: { final_damage: damage } },
      formatted: `  ${attacker.name.toUpperCase()} uses STRUGGLE!\n  Attack: d20(${attackRoll}) + ${modifier} = ${total} vs AC ${defender.ac} → ${hit ? 'HIT' : 'MISS'}\n  ${hit ? `Damage: ${damage} → ${defender.name.toUpperCase()} HP: ${hpBefore}→${hpAfter}` : 'No damage'}`
    }
  };
}

/**
 * Check if battle has ended
 */
function checkBattleEnd(simulation) {
  if (simulation.combatant1.current_hp <= 0) return true;
  if (simulation.combatant2.current_hp <= 0) return true;
  if (simulation.currentTurn >= simulation.config.maxTurns) return true;
  return false;
}

/**
 * Determine winner
 */
function determineWinner(simulation) {
  if (simulation.combatant1.current_hp <= 0 && simulation.combatant2.current_hp <= 0) {
    return 'draw';
  }
  if (simulation.combatant1.current_hp <= 0) {
    return 'opponent';
  }
  if (simulation.combatant2.current_hp <= 0) {
    return 'player';
  }
  if (simulation.currentTurn >= simulation.config.maxTurns) {
    return 'draw';
  }
  return null;
}

/**
 * Format a log entry for display
 *
 * @param {Object} entry - Log entry
 * @returns {string} Formatted string
 */
export function formatLogEntry(entry) {
  return entry.formatted || JSON.stringify(entry.details);
}

/**
 * Format battle summary
 *
 * @param {Object} result - Simulation result
 * @returns {string} Formatted summary
 */
export function formatBattleSummary(result) {
  const logger = createLogger({ colorize: false });
  return logger.logBattleEnd(
    result.winner === 'player' ? result.combatant1Summary.name :
      result.winner === 'opponent' ? result.combatant2Summary.name : 'draw',
    result.totalTurns,
    {
      durationMs: result.durationMs,
      seed: result.seedUsed,
      combatant1Summary: result.combatant1Summary,
      combatant2Summary: result.combatant2Summary
    }
  );
}

/**
 * Feature 023: Execute movement for a combatant
 * Task: T014, T019, T037, T041
 *
 * @param {Object} simulation - Active simulation instance
 * @param {string} combatant_id - ID of combatant to move
 * @param {Object} targetPosition - { col, row } destination
 * @param {Array} occupiedPositions - List of occupied {col, row} positions
 * @returns {Object} Movement result with log entry
 */
export function executeMovement(simulation, combatant_id, targetPosition, occupiedPositions = []) {
  // Find the combatant
  const combatant = simulation.combatant1.combatant_id === combatant_id
    ? simulation.combatant1
    : simulation.combatant2.combatant_id === combatant_id
      ? simulation.combatant2
      : null;

  if (!combatant) {
    return { success: false, error: 'Combatant not found' };
  }

  // Check if already moved
  if (combatant.has_moved_this_turn) {
    return { success: false, error: 'Already moved this turn' };
  }

  // Get current position
  const fromPosition = combatant.position;
  if (!fromPosition) {
    return { success: false, error: 'Combatant has no position' };
  }

  // Calculate distance
  const distance = getManhattanDistance(fromPosition, targetPosition);

  // Get walking speed (default 6 cells = 30ft)
  const walkingSpeed = combatant.walking_speed || 6;
  const movementRemaining = combatant.movement_remaining !== undefined
    ? combatant.movement_remaining
    : walkingSpeed;

  // Validate movement
  if (distance > movementRemaining) {
    return {
      success: false,
      error: `Target too far (${distance} cells, only ${movementRemaining} remaining)`
    };
  }

  // Check if target is occupied
  const isOccupied = occupiedPositions.some(
    p => p.col === targetPosition.col && p.row === targetPosition.row
  );
  if (isOccupied) {
    return { success: false, error: 'Target cell is occupied' };
  }

  // Execute movement
  const fromNotation = toGridNotation(fromPosition.col, fromPosition.row);
  const toNotation = toGridNotation(targetPosition.col, targetPosition.row);

  // Update combatant state (T019)
  combatant.position = { col: targetPosition.col, row: targetPosition.row };
  combatant.movement_remaining = movementRemaining - distance;
  combatant.has_moved_this_turn = true;

  // Generate log entry (T037)
  const logEntry = {
    type: 'movement',
    turnNumber: simulation.currentTurn,
    timestamp: Date.now(),
    actor: combatant.name,
    target: null,
    details: {
      from_position: { ...fromPosition, notation: fromNotation },
      to_position: { ...targetPosition, notation: toNotation },
      distance_moved: distance,
      movement_before: movementRemaining,
      movement_after: combatant.movement_remaining
    },
    formatted: `▶ ${combatant.name.toUpperCase()} moves ${fromNotation} → ${toNotation}\n  ├─ Distance: ${distance} cells (${distance * 5} ft)\n  └─ Movement remaining: ${combatant.movement_remaining}/${walkingSpeed} cells`
  };

  return {
    success: true,
    logEntry,
    combatant,
    distance,
    fromPosition,
    toPosition: targetPosition
  };
}

/**
 * Feature 023: Reset movement for all combatants at round start
 * Task: T039
 *
 * @param {Object} simulation - Active simulation instance
 */
export function resetMovement(simulation) {
  const resetCombatant = (combatant) => {
    const walkingSpeed = combatant.walking_speed || 6;
    combatant.movement_remaining = walkingSpeed;
    combatant.has_moved_this_turn = false;
  };

  if (simulation.combatant1) resetCombatant(simulation.combatant1);
  if (simulation.combatant2) resetCombatant(simulation.combatant2);
}

/**
 * Feature 024: Process turn start hooks for state management
 * Task: T010
 *
 * Called at the beginning of a combatant's turn to:
 * - Reset action economy (action, bonus action, reaction)
 * - Track damage taken since last turn
 * - Process charging moves that execute this turn
 * - Handle recharge state (Hyper Beam pattern)
 *
 * @param {Object} combatant - Combatant starting their turn
 * @param {number} roundNumber - Current round number
 * @returns {Object} Turn start results { skipTurn, reason, logs }
 */
export function processTurnStart(combatant, roundNumber) {
  const logs = [];

  // Reset action economy at turn start
  combatant.has_action = true;
  combatant.has_bonus_action = true;
  // Note: reaction refreshes at start of YOUR turn, not when used

  // Track damage taken since last turn (accumulate from this round)
  combatant.damage_taken_since_last_turn = combatant.took_damage_this_round
    ? combatant.damage_taken_since_last_turn
    : 0;
  combatant.took_damage_this_round = false;

  // Check if recharging (Hyper Beam pattern - skip turn after use)
  if (combatant.is_recharging && combatant.recharge_until_round > roundNumber) {
    logs.push({
      type: 'recharge_skip',
      message: `${combatant.name} is recharging and cannot act this turn`
    });
    return { skipTurn: true, reason: 'recharging', logs };
  }

  // Clear recharge if expired
  if (combatant.is_recharging && combatant.recharge_until_round <= roundNumber) {
    combatant.is_recharging = false;
    combatant.recharge_until_round = 0;
  }

  // Check if charging move executes this turn
  if (combatant.charging_move && combatant.charging_move.executesRound === roundNumber) {
    logs.push({
      type: 'charge_ready',
      moveId: combatant.charging_move.moveId,
      message: `${combatant.name}'s charging move is ready to execute!`
    });
    // Note: The actual execution is handled by the move execution logic
  }

  // Clear invulnerability if charge is complete
  if (combatant.is_invulnerable && combatant.charging_move?.executesRound === roundNumber) {
    combatant.is_invulnerable = false;
    combatant.invulnerable_until = null;
  }

  return { skipTurn: false, reason: null, logs };
}

/**
 * Feature 024: Process turn end hooks for state management
 * Task: T010
 *
 * Called at the end of a combatant's turn to:
 * - Expire stat/AC/speed modifiers
 * - Decrement effect durations
 * - Track last move used
 *
 * @param {Object} combatant - Combatant ending their turn
 * @param {number} roundNumber - Current round number
 * @returns {Object} Turn end results { expiredModifiers, logs }
 */
export function processTurnEnd(combatant, roundNumber) {
  const logs = [];
  const expiredModifiers = [];

  // Expire stat modifiers
  if (combatant.stat_modifiers && combatant.stat_modifiers.length > 0) {
    const active = [];
    for (const mod of combatant.stat_modifiers) {
      if (mod.expiresRound !== null && mod.expiresRound <= roundNumber) {
        expiredModifiers.push({ type: 'stat', ...mod });
        logs.push({
          type: 'modifier_expired',
          message: `${combatant.name}'s ${mod.stat} modifier from ${mod.source} has expired`
        });
      } else {
        active.push(mod);
      }
    }
    combatant.stat_modifiers = active;
  }

  // Expire AC modifiers
  if (combatant.ac_modifiers && combatant.ac_modifiers.length > 0) {
    const active = [];
    for (const mod of combatant.ac_modifiers) {
      if (mod.expiresRound !== null && mod.expiresRound <= roundNumber) {
        expiredModifiers.push({ type: 'ac', ...mod });
        logs.push({
          type: 'modifier_expired',
          message: `${combatant.name}'s AC modifier from ${mod.source} has expired`
        });
      } else {
        active.push(mod);
      }
    }
    combatant.ac_modifiers = active;
  }

  // Expire speed modifiers
  if (combatant.speed_modifiers && combatant.speed_modifiers.length > 0) {
    const active = [];
    for (const mod of combatant.speed_modifiers) {
      if (mod.expiresRound !== null && mod.expiresRound <= roundNumber) {
        expiredModifiers.push({ type: 'speed', ...mod });
        logs.push({
          type: 'modifier_expired',
          message: `${combatant.name}'s speed modifier from ${mod.source} has expired`
        });
      } else {
        active.push(mod);
      }
    }
    combatant.speed_modifiers = active;
  }

  // Check flee prevention expiry
  if (combatant.cannot_flee && combatant.flee_prevented_until_round <= roundNumber) {
    combatant.cannot_flee = false;
    combatant.flee_prevented_until_round = 0;
    logs.push({
      type: 'flee_restored',
      message: `${combatant.name} can now flee again`
    });
  }

  return { expiredModifiers, logs };
}

/**
 * Feature 024: Track damage taken by a combatant
 * Task: T010 (helper for conditional damage tracking)
 *
 * Called when a combatant takes damage to update tracking fields
 *
 * @param {Object} combatant - Combatant taking damage
 * @param {number} damageAmount - Amount of damage taken
 */
export function trackDamageTaken(combatant, damageAmount) {
  combatant.took_damage_this_round = true;
  combatant.damage_taken_since_last_turn = (combatant.damage_taken_since_last_turn || 0) + damageAmount;
}

/**
 * Feature 023: Get valid movement targets for a combatant
 * Task: T041 (verbose logging)
 *
 * @param {Object} combatant - Combatant to get targets for
 * @param {Array} occupiedPositions - List of occupied {col, row} positions
 * @returns {Object} { targets, walkingSpeed, movementRemaining }
 */
export function getMovementTargets(combatant, occupiedPositions = []) {
  const walkingSpeed = combatant.walking_speed || 6;
  const movementRemaining = combatant.movement_remaining !== undefined
    ? combatant.movement_remaining
    : walkingSpeed;

  if (!combatant.position || combatant.has_moved_this_turn) {
    return { targets: [], walkingSpeed, movementRemaining: 0 };
  }

  const targets = getValidMoveTargets(combatant.position, movementRemaining, occupiedPositions);

  return {
    targets,
    walkingSpeed,
    movementRemaining
  };
}

export default {
  createSimulation,
  runNextTurn,
  runToCompletion,
  formatLogEntry,
  formatBattleSummary,
  executeMovement,
  resetMovement,
  getMovementTargets,
  processTurnStart,
  processTurnEnd,
  trackDamageTaken
};
