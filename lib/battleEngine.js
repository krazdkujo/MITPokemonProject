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
  calculateDamageBonus
} from './combatUtils.js';
import { getMoveById, getPokemonById, hasBattleArmorAbility, getMovesForPokemonAtLevel } from './pokemonData.js';
import { initializePP } from './ppTracker.js';
import {
  parseStatusTrigger,
  applyStatusEffect,
  processEndOfTurnStatus,
  processStartOfTurnStatus
} from './statusEffects.js';

/**
 * Calculate attack roll for a Pokemon using a move
 * Attack Roll = d20 + Move Power Mod + Proficiency Bonus
 *
 * @param {Object} attacker - Attacking Pokemon with attributes and level
 * @param {Object} move - Move being used with power attribute
 * @param {number} critThreshold - Minimum natural roll for critical hit (default: parsed from move or 20)
 * @returns {{ natural_roll: number, modifier: number, total: number, isCrit: boolean, isMiss: boolean, crit_threshold: number }}
 */
export function calculateAttackRoll(attacker, move, critThreshold = null) {
  const natural_roll = rollD20();
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
    crit_threshold: effectiveCritThreshold
  };
}

/**
 * Calculate damage for an attack
 * Damage = Dice Roll + Power Mod + STAB + Type Effectiveness
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon with types and abilities
 * @param {Object} move - Move being used
 * @param {Object} attackRoll - Result from calculateAttackRoll
 * @returns {{ baseDamage: number, totalDamage: number, effectiveness: Object, stabApplied: boolean, diceExpression: string, is_critical: boolean, crit_negated: boolean }}
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
      crit_negated: false
    };
  }

  // Roll the damage dice
  let baseDamage = rollDice(diceExpression);

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
    crit_negated: critNegated
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
  const knownMoveIds = dbRecord.selected_moves || availableMoves.slice(0, 4).map(m => m.id);

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
    known_moves: knownMoveIds,
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    initiative_roll: null,
    has_acted_this_round: false,
    is_fainted: false,
    sr: sourcePokemon.sr || 0.5
  };
}

/**
 * Build an opponent combatant from Source data (wild encounter or generated)
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
  const knownMoveIds = availableMoves.slice(0, 4).map(m => m.id);

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
    known_moves: knownMoveIds,
    moves: availableMoves.slice(0, 4), // Full move objects for opponent AI
    abilities: sourcePokemon.abilities || [],
    status_effects: [],
    initiative_roll: null,
    has_acted_this_round: false,
    is_fainted: false,
    sr: sourcePokemon.sr || 0.5
  };
}

/**
 * Process a single attack action
 *
 * @param {Object} attacker - Attacking Pokemon
 * @param {Object} defender - Defending Pokemon
 * @param {Object} move - Move to use
 * @param {number} roundNumber - Current round number (for status tracking)
 * @returns {Object} Action result object
 */
function executeAttack(attacker, defender, move, roundNumber = 1) {
  const attackRoll = calculateAttackRoll(attacker, move);

  // Check if attack hits (roll + modifier >= defender AC)
  // Critical hit always hits, critical miss always misses
  let hit = false;
  if (attackRoll.isMiss) {
    hit = false;
  } else if (attackRoll.isCrit) {
    hit = true;
  } else {
    hit = attackRoll.total >= defender.ac;
  }

  let damage = 0;
  let damageResult = null;
  let statusApplied = null;

  if (hit) {
    damageResult = calculateDamage(attacker, defender, move, attackRoll);
    damage = damageResult.totalDamage;

    // T027: Check for status effect application
    const statusTrigger = parseStatusTrigger(move.description, attackRoll.natural_roll);
    if (statusTrigger.statusType) {
      const statusResult = applyStatusEffect(
        defender,
        statusTrigger.statusType,
        roundNumber,
        attacker.combatant_id
      );
      if (statusResult.applied) {
        statusApplied = {
          type: statusTrigger.statusType,
          target: defender.name
        };
      } else {
        statusApplied = {
          type: statusTrigger.statusType,
          blocked: true,
          reason: statusResult.statusChange.reason
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
    attack_roll: {
      natural_roll: attackRoll.natural_roll,
      modifier: attackRoll.modifier,
      total: attackRoll.total,
      crit_threshold: attackRoll.crit_threshold
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
      final_damage: damage
    } : null,
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
 * Add Struggle self-damage when Pokemon has no PP
 * Struggle deals 1d4 recoil damage to the user
 *
 * @param {Object} pokemon - Pokemon using Struggle
 * @returns {number} Recoil damage dealt
 */
export function applyStruggleRecoil(pokemon) {
  const recoilDamage = rollDice('1d4');
  pokemon.current_hp = Math.max(0, pokemon.current_hp - recoilDamage);
  return recoilDamage;
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
