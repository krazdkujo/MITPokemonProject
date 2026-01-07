/**
 * Battle Engine
 * Core combat logic for Pokemon 5e battle system
 *
 * Feature: 006-battle-api
 */

import { v4 as uuidv4 } from 'uuid';
import { rollD20, rollDice, isCriticalHit, isCriticalMiss } from './diceRoller.js';
import { parseDamageDice, parseCriticalRange, isCriticalRoll } from './diceParser.js';
import { getEffectiveness } from './typeEffectiveness.js';
import {
  getProficiencyBonus,
  getAttributeModifier,
  getBestPowerModifier,
  hasSTAB,
  calculateAttackBonus,
  calculateDamageBonus,
  parseSaveType,
  calculateSaveDC,
  isSaveMove,
  getAttributeKey
} from './combatUtils.js';
import { getMoveById, getPokemonById, hasBattleArmorAbility, getMovesForPokemonAtLevel } from './pokemonData.js';
import { initializePP } from './ppTracker.js';
import {
  parseStatusTrigger,
  applyStatusEffect,
  processEndOfTurnStatus,
  processStartOfTurnStatus,
  hasBurnedDamagePenalty,
  applyBurnedDamagePenalty,
  getFlinchedEffects,
  attemptBreakFrozen,
  processConfusedBehavior,
  removeStatus,
  setStatusApplierProficiency,
  StatusType
} from './statusEffects.js';
import { parseMoveEffects, parseAutoHit } from './moveEffectParser.js';

/**
 * Calculate attack roll for a Pokemon using a move
 * Attack Roll = d20 + Move Power Mod + Proficiency Bonus
 * T024: Checks for Flinched disadvantage on d20 rolls
 *
 * @param {Object} attacker - Attacking Pokemon with attributes and level
 * @param {Object} move - Move being used with power attribute
 * @param {number} critThreshold - Minimum natural roll for critical hit (default: parsed from move or 20)
 * @param {Object} options - Additional options
 * @param {boolean} options.hasAdvantage - Whether attacker has advantage
 * @param {boolean} options.hasDisadvantage - Whether attacker has disadvantage
 * @returns {{ natural_roll: number, modifier: number, total: number, isCrit: boolean, isMiss: boolean, crit_threshold: number, hadAdvantage: boolean, hadDisadvantage: boolean, rolls: number[] }}
 */
export function calculateAttackRoll(attacker, move, critThreshold = null, options = {}) {
  let hasAdvantage = options.hasAdvantage || false;
  let hasDisadvantage = options.hasDisadvantage || false;

  // T024: Check for Flinched disadvantage
  const flinchedEffects = getFlinchedEffects(attacker);
  if (flinchedEffects.hasDisadvantage) {
    hasDisadvantage = true;
  }

  // Roll dice (advantage/disadvantage handled)
  let natural_roll;
  const rolls = [];

  if (hasAdvantage && !hasDisadvantage) {
    // Advantage: roll twice, take higher
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    natural_roll = Math.max(roll1, roll2);
  } else if (hasDisadvantage && !hasAdvantage) {
    // Disadvantage: roll twice, take lower
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    natural_roll = Math.min(roll1, roll2);
  } else {
    // Normal roll (or advantage + disadvantage cancel out)
    natural_roll = rollD20();
    rolls.push(natural_roll);
  }

  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  const profBonus = getProficiencyBonus(attacker.level);
  const modifier = powerMod + profBonus;

  // Determine crit threshold: use provided, or parse from move, or default to 20
  const effectiveCritThreshold = critThreshold || parseCriticalRange(move.description) || 20;

  return {
    natural_roll,
    modifier,
    total: natural_roll + modifier,
    isCrit: isCriticalRoll(natural_roll, effectiveCritThreshold),
    isMiss: isCriticalMiss(natural_roll),
    crit_threshold: effectiveCritThreshold,
    hadAdvantage: hasAdvantage && !hasDisadvantage,
    hadDisadvantage: hasDisadvantage && !hasAdvantage,
    rolls
  };
}

/**
 * Calculate damage for an attack
 * Damage = Dice Roll + Power Mod + STAB + Type Effectiveness
 * T023: Applies Burned damage penalty (roll twice, take lower) before attack resolution
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon with types and abilities
 * @param {Object} move - Move being used
 * @param {Object} attackRoll - Result from calculateAttackRoll
 * @returns {{ baseDamage: number, totalDamage: number, effectiveness: Object, stabApplied: boolean, diceExpression: string, is_critical: boolean, crit_negated: boolean, burned_penalty: Object|null }}
 */
export function calculateDamage(attacker, defender, move, attackRoll) {
  // Get damage dice for the attacker's level
  const diceExpression = parseDamageDice(move.description, move.higherLevels, attacker.level);

  if (!diceExpression) {
    // Non-damaging move
    return {
      baseDamage: 0,
      totalDamage: 0,
      effectiveness: { multiplier: 1, effectiveness: 'normal' },
      stabApplied: false,
      diceExpression: null,
      is_critical: false,
      crit_negated: false,
      burned_penalty: null
    };
  }

  // T023: Check for Burned damage penalty - roll twice, take lower
  let baseDamage;
  let burnedPenalty = null;

  if (hasBurnedDamagePenalty(attacker)) {
    burnedPenalty = applyBurnedDamagePenalty(diceExpression, rollDice);
    baseDamage = burnedPenalty.result;
  } else {
    baseDamage = rollDice(diceExpression);
  }

  // Check for Battle Armor / Shell Armor (negates critical bonus)
  const defenderAbilities = defender.abilities || [];
  const hasBattleArmor = hasBattleArmorAbility(defenderAbilities);
  let critNegated = false;

  // Double damage on critical hit (unless defender has Battle Armor)
  if (attackRoll.isCrit && !hasBattleArmor) {
    baseDamage *= 2;
  } else if (attackRoll.isCrit && hasBattleArmor) {
    critNegated = true;
  }

  // Add power modifier
  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  let totalDamage = baseDamage + powerMod;

  // Check for STAB
  const stabApplied = hasSTAB(move.type, attacker.type);
  if (stabApplied) {
    totalDamage += getProficiencyBonus(attacker.level);
  }

  // Apply type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.type);
  totalDamage = Math.floor(totalDamage * effectiveness.multiplier);

  // Ensure minimum damage of 0
  totalDamage = Math.max(0, totalDamage);

  return {
    baseDamage,
    totalDamage,
    effectiveness,
    stabApplied,
    diceExpression,
    is_critical: attackRoll.isCrit && !critNegated,
    crit_negated: critNegated,
    burned_penalty: burnedPenalty
  };
}

/**
 * T028: Process a saving throw move
 * Calculates save DC, has defender roll save, applies full or half damage
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon
 * @param {Object} move - Move being used
 * @param {Object} options - Additional options
 * @param {boolean} options.defenderHasAdvantage - Whether defender has advantage on save
 * @param {boolean} options.defenderHasDisadvantage - Whether defender has disadvantage on save
 * @returns {Object} Save move result
 */
export function processSaveMove(attacker, defender, move, options = {}) {
  const saveType = parseSaveType(move.description);
  if (!saveType) {
    throw new Error(`Move ${move.id} does not have a save type`);
  }

  const dc = calculateSaveDC(attacker, move);
  const attrKey = getAttributeKey(saveType);
  const saveMod = getAttributeModifier(defender.attributes?.[attrKey] || 10);

  // Check if attacker is flinched - targets get advantage on saves
  const flinchedEffects = getFlinchedEffects(attacker);
  let hasAdvantage = options.defenderHasAdvantage || flinchedEffects.targetsGetAdvantage;
  let hasDisadvantage = options.defenderHasDisadvantage || false;

  // Roll save
  let saveRoll;
  const rolls = [];

  if (hasAdvantage && !hasDisadvantage) {
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    saveRoll = Math.max(roll1, roll2);
  } else if (hasDisadvantage && !hasAdvantage) {
    const roll1 = rollD20();
    const roll2 = rollD20();
    rolls.push(roll1, roll2);
    saveRoll = Math.min(roll1, roll2);
  } else {
    saveRoll = rollD20();
    rolls.push(saveRoll);
  }

  const saveTotal = saveRoll + saveMod;
  const saved = saveTotal >= dc;

  // Calculate base damage
  const diceExpression = parseDamageDice(move.description, move.higherLevels, attacker.level);

  if (!diceExpression) {
    // Non-damaging save move (status effect only)
    return {
      saveType,
      dc,
      saveRoll,
      saveMod,
      saveTotal,
      saved,
      rolls,
      hadAdvantage: hasAdvantage && !hasDisadvantage,
      hadDisadvantage: hasDisadvantage && !hasAdvantage,
      damage: 0,
      fullDamage: 0,
      halfDamage: 0,
      is_save_move: true
    };
  }

  // Apply burned damage penalty if applicable
  let baseDamage;
  let burnedPenalty = null;

  if (hasBurnedDamagePenalty(attacker)) {
    burnedPenalty = applyBurnedDamagePenalty(diceExpression, rollDice);
    baseDamage = burnedPenalty.result;
  } else {
    baseDamage = rollDice(diceExpression);
  }

  // Add power modifier
  const powerMod = getBestPowerModifier(move.power, attacker.attributes);
  let fullDamage = baseDamage + powerMod;

  // Check for STAB
  const stabApplied = hasSTAB(move.type, attacker.type);
  if (stabApplied) {
    fullDamage += getProficiencyBonus(attacker.level);
  }

  // Apply type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.type);
  fullDamage = Math.floor(fullDamage * effectiveness.multiplier);

  // Ensure minimum damage of 0
  fullDamage = Math.max(0, fullDamage);

  // Half damage on successful save
  const halfDamage = Math.floor(fullDamage / 2);
  const finalDamage = saved ? halfDamage : fullDamage;

  return {
    saveType,
    dc,
    saveRoll,
    saveMod,
    saveTotal,
    saved,
    rolls,
    hadAdvantage: hasAdvantage && !hasDisadvantage,
    hadDisadvantage: hasDisadvantage && !hasAdvantage,
    damage: finalDamage,
    fullDamage,
    halfDamage,
    diceExpression,
    baseDamage,
    powerMod,
    stabApplied,
    effectiveness,
    burnedPenalty,
    is_save_move: true
  };
}

/**
 * Build a Combatant object from player_pokemon record + Source data
 * @param {Object} dbRecord - Database record with pokemon_id, level, current_hp, etc.
 * @param {string} owner - 'player', 'opponent', or 'wild'
 * @returns {Object} Combatant object ready for combat
 */
export function buildCombatant(dbRecord, owner = 'player') {
  const sourcePokemon = getPokemonById(dbRecord.pokemon_id);
  if (!sourcePokemon) {
    throw new Error(`Pokemon not found in Source: ${dbRecord.pokemon_id}`);
  }

  // Get available moves for this Pokemon at its level
  const availableMoves = getMovesForPokemonAtLevel(dbRecord.pokemon_id, dbRecord.level);

  // Determine which moves the Pokemon knows
  let knownMoveObjects;
  if (dbRecord.selected_moves && dbRecord.selected_moves.length > 0) {
    // Player has selected specific moves - resolve IDs to full move objects
    knownMoveObjects = dbRecord.selected_moves
      .map(moveId => getMoveById(moveId))
      .filter(Boolean)
      .slice(0, 4);
  } else {
    // Use first 4 available moves
    knownMoveObjects = availableMoves.slice(0, 4);
  }

  const knownMoveIds = knownMoveObjects.map(m => m.id);

  // Get walking speed in cells (1 cell = 5 feet)
  const walkingSpeed = sourcePokemon.speed?.find(s => s.type === 'walking')?.value || 30;
  const movementCells = Math.floor(walkingSpeed / 5);

  return {
    combatant_id: dbRecord.id || uuidv4(),
    pokemon_id: dbRecord.pokemon_id,
    number: sourcePokemon.number,
    owner,
    name: sourcePokemon.name,
    level: dbRecord.level,
    type: sourcePokemon.type || [],
    attributes: sourcePokemon.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ac: sourcePokemon.ac || 10,
    max_hp: dbRecord.max_hp || sourcePokemon.hp || 20,
    current_hp: dbRecord.current_hp || dbRecord.max_hp || sourcePokemon.hp || 20,
    move_pp: dbRecord.move_pp || initializePP(knownMoveIds),
    known_moves: knownMoveObjects, // Full move objects for UI display
    known_move_ids: knownMoveIds,  // IDs for API calls
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    initiative_roll: null,
    has_acted_this_round: false,
    is_fainted: false,
    // Feature 018: Movement tracking - use actual walking speed
    walking_speed: movementCells,
    movement_remaining: movementCells,
    has_moved_this_turn: false,
    sr: sourcePokemon.sr || 0.5
  };
}

/**
 * Build an opponent combatant from Source data (wild encounter or generated)
 * Feature: 018-combat-enhancements - Fixed to return full move objects in known_moves
 *
 * @param {string} pokemonId - Pokemon ID from Source
 * @param {number} level - Opponent level
 * @returns {Object} Combatant object for opponent
 */
export function buildOpponentCombatant(pokemonId, level) {
  const sourcePokemon = getPokemonById(pokemonId);
  if (!sourcePokemon) {
    throw new Error(`Pokemon not found in Source: ${pokemonId}`);
  }

  // Get available moves for this Pokemon at its level
  const availableMoves = getMovesForPokemonAtLevel(pokemonId, level);
  const knownMoveObjects = availableMoves.slice(0, 4); // Full move objects
  const knownMoveIds = knownMoveObjects.map(m => m.id);

  // Get walking speed in cells (1 cell = 5 feet)
  const walkingSpeed = sourcePokemon.speed?.find(s => s.type === 'walking')?.value || 30;
  const movementCells = Math.floor(walkingSpeed / 5);

  return {
    combatant_id: uuidv4(),
    pokemon_id: pokemonId,
    number: sourcePokemon.number,
    owner: 'opponent',
    name: sourcePokemon.name,
    level,
    type: sourcePokemon.type || [],
    attributes: sourcePokemon.attributes || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ac: sourcePokemon.ac || 10,
    max_hp: sourcePokemon.hp || 20,
    current_hp: sourcePokemon.hp || 20,
    move_pp: initializePP(knownMoveIds),
    known_moves: knownMoveObjects, // Full move objects (matching buildCombatant structure)
    known_move_ids: knownMoveIds,  // IDs for quick lookup
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    initiative_roll: null,
    has_acted_this_round: false,
    is_fainted: false,
    // Feature 018: Movement tracking - use actual walking speed
    walking_speed: movementCells,
    movement_remaining: movementCells,
    has_moved_this_turn: false,
    sr: sourcePokemon.sr || 0.5
  };
}

/**
 * Process a single attack action
 * T027: Detects save moves and routes to save logic instead of attack roll
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon
 * @param {Object} move - Move to use
 * @param {number} roundNumber - Current round number (for status tracking)
 * @returns {Object} Action result object
 */
function executeAttack(attacker, defender, move, roundNumber = 1) {
  // T027: Check if this is a saving throw move
  if (isSaveMove(move)) {
    return executeSaveAttack(attacker, defender, move, roundNumber);
  }

  // Feature 024 T015: Check for auto-hit moves (Aerial Ace, Swift, Aura Sphere, etc.)
  const isAutoHit = parseAutoHit(move.description);
  let attackRoll;
  let hit = false;

  if (isAutoHit) {
    // Auto-hit moves bypass the attack roll entirely
    // We still create an attack_roll object for logging purposes
    attackRoll = {
      natural_roll: 20, // Treated as max roll for display
      modifier: 0,
      total: 20,
      isCrit: false, // Auto-hit doesn't automatically crit
      isMiss: false,
      crit_threshold: 20,
      hadAdvantage: false,
      hadDisadvantage: false,
      rolls: [20],
      isAutoHit: true
    };
    hit = true;
  } else {
    attackRoll = calculateAttackRoll(attacker, move);

    // Check if attack hits (roll + modifier >= defender AC)
    // Critical hit always hits, critical miss always misses
    if (attackRoll.isMiss) {
      hit = false;
    } else if (attackRoll.isCrit) {
      hit = true;
    } else {
      hit = attackRoll.total >= defender.ac;
    }
  }

  let damage = 0;
  let damageResult = null;
  let statusApplied = null;
  // T031-T034: Move extra effects
  let healingEffect = null;
  let recoilEffect = null;
  let acEffect = null;

  if (hit) {
    damageResult = calculateDamage(attacker, defender, move, attackRoll);
    damage = damageResult.totalDamage;

    // T031: Parse move for extra effects
    const moveEffects = parseMoveEffects(move);

    // T032: Apply healing effect (drain moves)
    if (moveEffects.healing && damage > 0) {
      const healing = moveEffects.healing;
      let healAmount = 0;

      if (healing.type === 'drain' && healing.percentage) {
        healAmount = Math.floor(damage * (healing.percentage / 100));
      } else if (healing.type === 'fixed' && healing.amount) {
        healAmount = healing.amount;
      } else if (healing.type === 'dice' && healing.diceExpr) {
        healAmount = rollDice(healing.diceExpr);
        if (healing.addMoveMod) {
          healAmount += getBestPowerModifier(move.power, attacker.attributes);
        }
      }

      if (healAmount > 0) {
        const attackerHpBefore = attacker.current_hp;
        attacker.current_hp = Math.min(attacker.max_hp, attacker.current_hp + healAmount);
        healingEffect = {
          type: healing.type,
          amount: healAmount,
          hpBefore: attackerHpBefore,
          hpAfter: attacker.current_hp,
          damageDealt: damage,
          percentage: healing.percentage,
          diceExpr: healing.diceExpr
        };
      }
    }

    // T033: Apply recoil effect
    if (moveEffects.recoil && damage > 0) {
      const recoil = moveEffects.recoil;
      const recoilAmount = Math.floor(damage * (recoil.percentage / 100));

      if (recoilAmount > 0) {
        const attackerHpBefore = attacker.current_hp;
        attacker.current_hp = Math.max(0, attacker.current_hp - recoilAmount);
        recoilEffect = {
          amount: recoilAmount,
          hpBefore: attackerHpBefore,
          hpAfter: attacker.current_hp,
          damageDealt: damage,
          percentage: recoil.percentage
        };
      }
    }

    // T034: Apply AC effect
    if (moveEffects.acEffect) {
      const ac = moveEffects.acEffect;
      const targetPokemon = ac.target === 'self' ? attacker : defender;
      const previousAC = targetPokemon.ac;

      if (ac.direction === 'increase') {
        targetPokemon.ac = (targetPokemon.ac || 10) + ac.amount;
      } else {
        targetPokemon.ac = Math.max(0, (targetPokemon.ac || 10) - ac.amount);
      }

      acEffect = {
        target: ac.target,
        targetName: targetPokemon.name,
        direction: ac.direction,
        amount: ac.amount,
        newAC: targetPokemon.ac,
        previousAC,
        stackable: ac.stackable,
        maxStack: ac.maxStack
      };
    }

    // Check for status effect application
    const statusTrigger = parseStatusTrigger(move.description, attackRoll.natural_roll);
    if (statusTrigger.statusType) {
      // Store applier proficiency for Frozen DC calculation
      const applierProf = getProficiencyBonus(attacker.level);

      const statusResult = applyStatusEffect(
        defender,
        statusTrigger.statusType,
        roundNumber,
        attacker.combatant_id
      );
      if (statusResult.applied) {
        // Set applier proficiency for Frozen DC
        setStatusApplierProficiency(defender, statusTrigger.statusType, applierProf);
        statusApplied = {
          type: statusTrigger.statusType,
          target: defender.name,
          // T013: Include trigger details for logging
          trigger: {
            type: statusTrigger.triggerType || 'on_hit',
            roll: statusTrigger.threshold ? attackRoll.natural_roll : null,
            threshold: statusTrigger.threshold
          }
        };
      } else {
        statusApplied = {
          type: statusTrigger.statusType,
          blocked: true,
          reason: statusResult.statusChange.reason,
          // T013: Include trigger details even for blocked status
          trigger: {
            type: statusTrigger.triggerType || 'on_hit',
            roll: statusTrigger.threshold ? attackRoll.natural_roll : null,
            threshold: statusTrigger.threshold
          }
        };
      }
    }
  }

  const hpBefore = defender.current_hp;
  const hpAfter = Math.max(0, hpBefore - damage);

  return {
    pokemon_name: attacker.name,
    move_id: move.id,
    move_name: move.name,
    is_save_move: false,
    attack_roll: {
      natural_roll: attackRoll.natural_roll,
      modifier: attackRoll.modifier,
      total: attackRoll.total,
      crit_threshold: attackRoll.crit_threshold,
      rolls: attackRoll.rolls,
      had_advantage: attackRoll.hadAdvantage,
      had_disadvantage: attackRoll.hadDisadvantage,
      is_auto_hit: attackRoll.isAutoHit || false
    },
    target_ac: defender.ac,
    hit,
    damage: damageResult ? {
      dice_expression: damageResult.diceExpression,
      base_dice_total: damageResult.baseDamage,
      power_modifier: getBestPowerModifier(move.power, attacker.attributes),
      stab_bonus: damageResult.stabApplied ? getProficiencyBonus(attacker.level) : 0,
      type_multiplier: damageResult.effectiveness?.multiplier || 1,
      type_effectiveness: damageResult.effectiveness?.effectiveness || 'normal',
      is_critical: damageResult.is_critical,
      crit_negated: damageResult.crit_negated,
      burned_penalty: damageResult.burned_penalty,
      final_damage: damage
    } : null,
    status_applied: statusApplied,
    // T031-T034: Move extra effects
    healing_effect: healingEffect,
    recoil_effect: recoilEffect,
    ac_effect: acEffect,
    pp_consumed: 1,
    target_hp_before: hpBefore,
    target_hp_after: hpAfter,
    target_fainted: hpAfter <= 0,
    attacker_fainted: attacker.current_hp <= 0
  };
}

/**
 * Execute a saving throw attack
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon
 * @param {Object} move - Move being used
 * @param {number} roundNumber - Current round number
 * @returns {Object} Action result
 */
function executeSaveAttack(attacker, defender, move, roundNumber = 1) {
  const saveResult = processSaveMove(attacker, defender, move);
  const damage = saveResult.damage;

  // Check for status effect application on failed save
  let statusApplied = null;
  // T014: Pass save result to check for "fail by 5+" patterns
  const saveInfo = {
    saved: saveResult.saved,
    total: saveResult.saveTotal,
    dc: saveResult.dc
  };
  const statusTrigger = parseStatusTrigger(move.description, 20, saveInfo);

  if (statusTrigger.statusType) {
    const applierProf = getProficiencyBonus(attacker.level);
    const statusResult = applyStatusEffect(
      defender,
      statusTrigger.statusType,
      roundNumber,
      attacker.combatant_id
    );
    if (statusResult.applied) {
      setStatusApplierProficiency(defender, statusTrigger.statusType, applierProf);
      statusApplied = {
        type: statusTrigger.statusType,
        target: defender.name,
        // T014: Include trigger details for save moves
        trigger: {
          type: statusTrigger.triggerType || 'save',
          saveType: saveResult.saveType,
          dc: saveResult.dc,
          saveTotal: saveResult.saveTotal,
          failBy: statusTrigger.failBy,
          failedByMargin: statusTrigger.failedByMargin
        }
      };
    } else {
      statusApplied = {
        type: statusTrigger.statusType,
        blocked: true,
        reason: statusResult.statusChange?.reason || 'save_succeeded',
        // T014: Include trigger details even for blocked status
        trigger: {
          type: statusTrigger.triggerType || 'save',
          saveType: saveResult.saveType,
          dc: saveResult.dc,
          saveTotal: saveResult.saveTotal,
          failBy: statusTrigger.failBy,
          failedByMargin: statusTrigger.failedByMargin
        }
      };
    }
  } else if (!saveResult.saved) {
    // Check for simple "on fail" status (not "fail by X")
    const simpleStatusTrigger = parseStatusTrigger(move.description, 20);
    if (simpleStatusTrigger.statusType && simpleStatusTrigger.onSave) {
      const applierProf = getProficiencyBonus(attacker.level);
      const statusResult = applyStatusEffect(
        defender,
        simpleStatusTrigger.statusType,
        roundNumber,
        attacker.combatant_id
      );
      if (statusResult.applied) {
        setStatusApplierProficiency(defender, simpleStatusTrigger.statusType, applierProf);
        statusApplied = {
          type: simpleStatusTrigger.statusType,
          target: defender.name,
          trigger: {
            type: 'save',
            saveType: saveResult.saveType,
            dc: saveResult.dc,
            saveTotal: saveResult.saveTotal
          }
        };
      } else {
        statusApplied = {
          type: simpleStatusTrigger.statusType,
          blocked: true,
          reason: statusResult.statusChange?.reason,
          trigger: {
            type: 'save',
            saveType: saveResult.saveType,
            dc: saveResult.dc,
            saveTotal: saveResult.saveTotal
          }
        };
      }
    }
  }

  const hpBefore = defender.current_hp;
  const hpAfter = Math.max(0, hpBefore - damage);

  return {
    pokemon_name: attacker.name,
    move_id: move.id,
    move_name: move.name,
    is_save_move: true,
    save: {
      type: saveResult.saveType,
      dc: saveResult.dc,
      roll: saveResult.saveRoll,
      modifier: saveResult.saveMod,
      total: saveResult.saveTotal,
      saved: saveResult.saved,
      rolls: saveResult.rolls,
      had_advantage: saveResult.hadAdvantage,
      had_disadvantage: saveResult.hadDisadvantage
    },
    hit: true, // Save moves always "hit", but damage may be halved
    damage: {
      dice_expression: saveResult.diceExpression,
      base_dice_total: saveResult.baseDamage,
      power_modifier: saveResult.powerMod,
      stab_bonus: saveResult.stabApplied ? getProficiencyBonus(attacker.level) : 0,
      type_multiplier: saveResult.effectiveness?.multiplier || 1,
      type_effectiveness: saveResult.effectiveness?.effectiveness || 'normal',
      full_damage: saveResult.fullDamage,
      half_damage: saveResult.halfDamage,
      saved: saveResult.saved,
      burned_penalty: saveResult.burnedPenalty,
      final_damage: damage
    },
    status_applied: statusApplied,
    pp_consumed: 1,
    target_hp_before: hpBefore,
    target_hp_after: hpAfter,
    target_fainted: hpAfter <= 0
  };
}

/**
 * Process the player's turn in battle
 *
 * @param {Object} playerPokemon - Player's Pokemon with full data
 * @param {Object} opponentPokemon - Opponent Pokemon
 * @param {string} moveId - ID of move to use
 * @returns {Object} Action result and updated opponent HP
 */
export function processPlayerTurn(playerPokemon, opponentPokemon, moveId) {
  const move = getMoveById(moveId);
  if (!move) {
    throw new Error(`Move not found: ${moveId}`);
  }

  const action = executeAttack(playerPokemon, opponentPokemon, move);

  // Update opponent HP
  opponentPokemon.current_hp = action.target_hp_after;

  return action;
}

/**
 * Process the opponent's turn in battle
 * Selects a random move from available moves and attacks
 *
 * @param {Object} opponentPokemon - Opponent Pokemon with moves array
 * @param {Object} playerPokemon - Player's Pokemon
 * @returns {Object} Action result and updated player HP
 */
export function processOpponentTurn(opponentPokemon, playerPokemon) {
  // Select a random move from opponent's available moves
  const availableMoves = opponentPokemon.moves || [];
  if (availableMoves.length === 0) {
    throw new Error('Opponent has no available moves');
  }

  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  const selectedMove = availableMoves[randomIndex];

  const action = executeAttack(opponentPokemon, playerPokemon, selectedMove);

  // Update player HP
  playerPokemon.current_hp = action.target_hp_after;

  return action;
}

/**
 * Process a complete battle turn (player action + opponent action)
 *
 * @param {Object} playerPokemon - Player's Pokemon with full data
 * @param {Object} opponent - Opponent Pokemon
 * @param {string} moveId - ID of move player wants to use
 * @param {number} turnNumber - Current turn number
 * @returns {Object} Turn result with both actions and battle status
 */
export function processBattleTurn(playerPokemon, opponent, moveId, turnNumber = 1) {
  const turn = {
    turn_number: turnNumber,
    player_action: null,
    opponent_action: null,
    end_of_turn: {
      status_damage: [],
      status_changes: []
    }
  };

  // T029: Process start of turn status effects for player
  const playerStartStatus = processStartOfTurnStatus(playerPokemon);
  let playerSkipsTurn = playerStartStatus.skipTurn;

  // Player attacks (unless incapacitated)
  if (!playerSkipsTurn) {
    turn.player_action = processPlayerTurn(playerPokemon, opponent, moveId);
  } else {
    turn.player_action = {
      skipped: true,
      reason: playerStartStatus.reason,
      pokemon_name: playerPokemon.name
    };
  }

  // Check if opponent is knocked out
  if (opponent.current_hp <= 0) {
    return {
      turn,
      outcome: 'victory',
      battle_continues: false
    };
  }

  // T029: Process start of turn status effects for opponent
  const opponentStartStatus = processStartOfTurnStatus(opponent);
  let opponentSkipsTurn = opponentStartStatus.skipTurn;

  // Opponent attacks back (unless incapacitated)
  if (!opponentSkipsTurn) {
    turn.opponent_action = processOpponentTurn(opponent, playerPokemon);
  } else {
    turn.opponent_action = {
      skipped: true,
      reason: opponentStartStatus.reason,
      pokemon_name: opponent.name
    };
  }

  // Check if player is knocked out
  if (playerPokemon.current_hp <= 0) {
    return {
      turn,
      outcome: 'defeat',
      battle_continues: false
    };
  }

  // T028: Process end of turn status effects
  const playerEndStatus = processEndOfTurnStatus(playerPokemon);
  const opponentEndStatus = processEndOfTurnStatus(opponent);

  // Collect end-of-turn damage
  turn.end_of_turn.status_damage = [
    ...playerEndStatus.damages,
    ...opponentEndStatus.damages
  ];

  // Collect status changes
  turn.end_of_turn.status_changes = [
    ...playerEndStatus.statusChanges,
    ...opponentEndStatus.statusChanges
  ];

  // Check for KO from status damage
  if (playerPokemon.current_hp <= 0) {
    return {
      turn,
      outcome: 'defeat',
      battle_continues: false
    };
  }

  if (opponent.current_hp <= 0) {
    return {
      turn,
      outcome: 'victory',
      battle_continues: false
    };
  }

  // Battle continues
  return {
    turn,
    outcome: 'ongoing',
    battle_continues: true
  };
}

/**
 * T022: Struggle recoil has been REMOVED per Pokemon 5e rules
 * Pokemon 5e: Struggle does NOT deal recoil damage to the user
 *
 * This function is deprecated and will return 0.
 * @deprecated Per Pokemon 5e rules, Struggle has no recoil
 * @param {Object} pokemon - Pokemon using Struggle
 * @returns {number} Always returns 0 (no recoil in 5e)
 */
export function applyStruggleRecoil(pokemon) {
  // T022: Per Pokemon 5e rules, Struggle does NOT have recoil damage
  // This function is kept for backwards compatibility but returns 0
  return 0;
}

/**
 * Create a new battle instance
 *
 * @param {Object} playerPokemon - Player's Pokemon
 * @param {Object} opponent - Opponent Pokemon
 * @returns {Object} Battle instance with ID and initial state
 */
export function createBattle(playerPokemon, opponent) {
  return {
    battle_id: uuidv4(),
    player_pokemon: playerPokemon,
    opponent: opponent,
    turns: [],
    outcome: 'ongoing',
    started_at: new Date().toISOString()
  };
}

/**
 * T035: Recall a Pokemon from battle
 * Uses the trainer's action (does not provoke Attack of Opportunity)
 *
 * @param {Object} combatant - Combatant being recalled
 * @returns {{ success: boolean, statusChanges: Object[] }}
 */
export function recallPokemon(combatant) {
  const statusChanges = [];

  // Clear volatile status effects when recalled
  if (combatant.status_effects) {
    const volatileStatuses = combatant.status_effects.filter(e =>
      e.is_volatile ||
      ['CONFUSED', 'FLINCHED'].includes(e.status_type)
    );

    for (const status of volatileStatuses) {
      const change = removeStatus(combatant, status.status_type, 'recalled');
      if (change) {
        statusChanges.push(change);
      }
    }
  }

  // Break concentration when recalled
  if (combatant.concentrating_on) {
    statusChanges.push({
      combatant_id: combatant.combatant_id,
      change: 'concentration_broken',
      move_id: combatant.concentrating_on,
      reason: 'recalled'
    });
    combatant.concentrating_on = null;
  }

  return {
    success: true,
    action_cost: 'action',
    provokes_aoo: false,
    statusChanges
  };
}

/**
 * T036: Send out a Pokemon into battle
 * Uses trainer's bonus action, Pokemon cannot act this turn
 *
 * @param {Object} combatant - Combatant being sent out
 * @param {{ col: number, row: number }} position - Grid position to deploy to
 * @returns {Object} Send out result
 */
export function sendOutPokemon(combatant, position) {
  // Set initial state for new Pokemon
  combatant.position = position;
  combatant.can_act = false; // Cannot act on turn it's sent out
  combatant.has_moved_this_turn = true; // Already placed
  combatant.movement_remaining = 0; // No movement on entry

  return {
    success: true,
    action_cost: 'bonus_action',
    combatant_id: combatant.combatant_id,
    position,
    can_act_this_turn: false
  };
}

/**
 * T037: Check if leaving a position triggers Attack of Opportunity
 * AoO is triggered when leaving melee range without Disengage
 *
 * @param {Object} combatant - Combatant leaving position
 * @param {{ col: number, row: number }} fromPosition - Current position
 * @param {Array<Object>} opponents - All opponent combatants
 * @param {boolean} isDisengaging - Whether Disengage action was taken
 * @returns {{ triggersAoO: boolean, threatList: Object[] }}
 */
export function checkAoOTrigger(combatant, fromPosition, opponents, isDisengaging = false) {
  if (isDisengaging) {
    return { triggersAoO: false, threatList: [] };
  }

  const threatList = [];

  for (const opponent of opponents) {
    if (!opponent.position || opponent.current_hp <= 0 || !opponent.has_reaction) {
      continue;
    }

    // Check if opponent is in melee range (adjacent = 1 cell)
    const distance = Math.abs(opponent.position.col - fromPosition.col) +
                     Math.abs(opponent.position.row - fromPosition.row);

    // Standard melee range is 1 cell (5 feet)
    if (distance === 1) {
      threatList.push({
        combatant_id: opponent.combatant_id,
        name: opponent.name,
        position: opponent.position
      });
    }
  }

  return {
    triggersAoO: threatList.length > 0,
    threatList
  };
}

/**
 * T038: Execute an Attack of Opportunity
 * Uses reaction, must be a melee move with PP available
 *
 * @param {Object} attacker - Combatant making the AoO
 * @param {Object} target - Target of the AoO
 * @param {Object} move - Melee move to use
 * @param {number} roundNumber - Current round number
 * @returns {Object} AoO result
 */
export function executeAoO(attacker, target, move, roundNumber = 1) {
  // Check if attacker has reaction available
  if (!attacker.has_reaction) {
    return {
      success: false,
      reason: 'no_reaction_available'
    };
  }

  // Execute the attack
  const attackResult = executeAttack(attacker, target, move, roundNumber);

  // Consume reaction
  attacker.has_reaction = false;

  return {
    success: true,
    action_type: 'reaction',
    attack_result: attackResult
  };
}
