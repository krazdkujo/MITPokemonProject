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
    max_hp: sourcePokemon.hp || 20,
    current_hp: sourcePokemon.hp || 20,
    move_pp: initializePP(knownMoveIds),
    known_moves: knownMoveObjects,
    known_move_ids: knownMoveIds,
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    is_fainted: false
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

    // Process start of turn status
    const startStatus = processStartOfTurnStatus(combatant);
    if (startStatus.skipTurn) {
      turnLog.push({
        type: 'status',
        actor: combatant.name,
        details: { skipped: true, reason: startStatus.reason },
        formatted: logger.logSkippedTurn(combatant.name, startStatus.reason)
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

    // Execute the attack
    const actionResult = executeAttack(combatant, target, move, simulation.rng, turnNumber);

    // Update stats
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

    // Build log entry
    const attackLog = logger.logAttack(combatant.name, move.name, target.name, actionResult.attack_roll, isPlayer);
    let fullLog = attackLog;

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
      fullLog += '\n' + logger.logDamage(
        actionResult.damage,
        actionResult.target_hp_before,
        actionResult.target_hp_after,
        target.name
      );
    } else if (!actionResult.hit) {
      fullLog += '\n' + logger.logMiss(combatant.name, move.name, target.name, actionResult.attack_roll);
    }

    // Status effect
    if (actionResult.status_applied) {
      fullLog += '\n' + logger.logStatus(
        target.name,
        actionResult.status_applied.type,
        !actionResult.status_applied.blocked,
        actionResult.status_applied.reason
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

  // Process end of turn status effects
  for (const { combatant, statsKey } of actors) {
    if (combatant.current_hp <= 0) continue;

    const endStatus = processEndOfTurnStatus(combatant);
    for (const damage of endStatus.damages || []) {
      turnLog.push({
        type: 'status_damage',
        actor: combatant.name,
        details: damage,
        formatted: logger.logStatusDamage(
          combatant.name,
          damage.status_type,
          damage.damage,
          damage.hp_before,
          damage.hp_after
        )
      });
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
  const hpBefore = defender.current_hp;

  if (hit) {
    damage = calculateDamageWithRng(attacker, defender, move, attackRoll, rng);

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
    status_applied: null,
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

export default {
  createSimulation,
  runNextTurn,
  runToCompletion,
  formatLogEntry,
  formatBattleSummary
};
